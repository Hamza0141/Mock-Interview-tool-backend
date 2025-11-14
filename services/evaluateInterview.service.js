
const openai = require("../config/openai");
const pool = require("../config/db.config");


async function insertUserResponses(session_id, asked_questions) {
  const sql = `
    INSERT INTO user_responses (session_id, question_id, user_response)
    VALUES (?, ?, ?)
  `;

  const results = [];
  const errors = [];

  for (const response of asked_questions) {
    try {
      const [insertResult] = await pool.query(sql, [
        session_id,
        response.question_id,
        response.user_response || null,
      ]);

      // Collect info for later use
      results.push({
        question_id: response.question_id,
        user_response: response.user_response,
        user_response_id: insertResult.insertId, // auto-increment id
      });
    } catch (err) {
      console.error(
        `❌ Error inserting response for question_id ${response.question_id}:`,
        err.message
      );

      errors.push({
        question_id: response.question_id,
        error: err.message,
      });
    }
  }

  return {
    success: errors.length === 0,
    inserted: results.length,
    responses: results, // 👈 your controller will use this array
    errors,
  };
}


async function evaluateWithAI(inputData) {
  console.log(inputData);
  try {
    const prompt = `
SYSTEM:
You are an expert interview assessor for technical roles. Always respond in strict JSON (no extra commentary, no markdown).
Validate the input and return results exactly following the JSON schema below.
If any input field is missing or invalid, return {"error":{"message":"<explanation>"}}.

USER:
Evaluate the provided interview session. Use the job context and user's responses to evaluate each asked question.
Produce evaluations per question and one Meta Evaluation (AI-generated summary) plus Behavioral Skill Tags.

Input JSON:
${JSON.stringify(inputData, null, 2)}


OUTPUT JSON SCHEMA:

  "evaluations": [
    {
      "question_id": integer,
      "scores": {
        "correctness": integer,
        "relevance": integer,
        "depth": integer,
        "clarity": integer
      },
      "overall_score": integer,
      "strengths": [string],
      "weaknesses": [string],
      "suggestions": string
    }
  ],
  "meta_evaluation": {
    "average_scores": {
      "correctness": number,
      "relevance": number,
      "depth": number,
      "clarity": number,
      "grammar": number,
      "overall": number
    },
    "summary": string
  },
  "behavioral_skill_tags": [string],
  "error": null
}

RULES:
1. Scores are 0–100 integers. Weighted overall = correctness(40%), depth(25%), clarity(15%), relevance(10%), grammar(10%).
2. Keep JSON valid and clean.
3. If unsure, return partial scores with explanation in suggestions.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5-nano",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const parsedResponse = JSON.parse(completion.choices[0].message.content);

    return parsedResponse;
  } catch (error) {
    console.error("AI Evaluation error:", error);
    return {
      error: { message: error.message || "Failed to generate evaluation" },
    };
  }
}

async function insertAiFeedback(
  session_id,
  question_id,
  user_response_id,
  aiFeedback,
  feedback_type = "text"
) {
  const conn = await pool.getConnection();
  try {
    if (!session_id || !aiFeedback) {
      throw new Error("Missing session_id or aiFeedback data");
    }

    const evaluations = aiFeedback.evaluations || [];
    const meta_evaluation = aiFeedback.meta_evaluation || null;
    const behavioral_skill_tags = aiFeedback.behavioral_skill_tags || null;

    await conn.beginTransaction();

    // ✅ Insert per-question feedbacks
    if (evaluations.length > 0) {
      for (const evalObj of evaluations) {
        const qId = evalObj.question_id || question_id || null;

        await conn.query(
          `
          INSERT INTO ai_question_feedback
          (session_id, question_id, user_response_id, evaluation, feedback_type)
          VALUES (?, ?, ?, CAST(? AS JSON), ?)
          `,
          [
            session_id,
            qId,
            user_response_id,
            JSON.stringify(evalObj),
            feedback_type,
          ]
        );
      }
    }

    // ✅ Update session meta once
    await conn.query(
      `
      UPDATE interview_sessions
      SET 
        meta_evaluation = CAST(? AS JSON),
        behavioral_skill_tags = CAST(? AS JSON),
        status = 'completed',
        ended_at = CURRENT_TIMESTAMP
      WHERE interview_id = ?
      `,
      [
        JSON.stringify(meta_evaluation),
        JSON.stringify(behavioral_skill_tags),
        session_id,
      ]
    );

    await conn.commit();

    return {
      success: true,
      message: "AI feedback inserted and session updated",
    };
  } catch (error) {
    await conn.rollback();
    console.error("❌ Error inserting AI feedback:", error.message);
    return { success: false, error: error.message };
  } finally {
    conn.release();
  }
}


module.exports = {
  insertUserResponses,
  evaluateWithAI,
  insertAiFeedback,
};
