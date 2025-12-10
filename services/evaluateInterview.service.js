const openai = require("../config/openai");
const pool = require("../config/db.config");
const notificationService = require("./notification.service");

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

      results.push({
        question_id: response.question_id,
        user_response: response.user_response,
        user_response_id: insertResult.insertId,
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
    responses: results,
    errors,
  };
}

async function evaluateWithAI(inputData) {
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
{
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
  profile_id,
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

    // per-question feedbacks
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

    // update meta once
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

    await notificationService.createNotification({
      profile_id: profile_id,
      type: "interview",
      title: "Interview Result Ready",
      body: `Your interview "${session_id}" has AI feedback available now.`,
      entity_type: "user",
      entity_id: session_id,
    });

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

/**
 * Fetch evaluation + per-question feedback from DB
 * used by GET /api/ai/evaluation-status/:sessionId
 */
async function getEvaluationBySession(session_id, profile_id) {
  const [sessionRows] = await pool.query(
    `
    SELECT 
      interview_id,
      job_title,
      difficulty,
      meta_evaluation,
      behavioral_skill_tags
    FROM interview_sessions
    WHERE interview_id = ? AND user_profile_id = ?
    LIMIT 1
  `,
    [session_id, profile_id]
  );

  if (!sessionRows.length) {
    return { found: false };
  }

  const session = sessionRows[0];

  // If meta_evaluation is null, evaluation not finished yet
  if (!session.meta_evaluation) {
    return { found: true, complete: false };
  }

  // 🔹 Safely normalize JSON columns that might already be objects
  let meta_evaluation = null;
  if (session.meta_evaluation != null) {
    if (typeof session.meta_evaluation === "string") {
      try {
        meta_evaluation = JSON.parse(session.meta_evaluation);
      } catch {
        meta_evaluation = session.meta_evaluation;
      }
    } else {
      meta_evaluation = session.meta_evaluation;
    }
  }

  let behavioral_skill_tags = [];
  if (session.behavioral_skill_tags != null) {
    if (typeof session.behavioral_skill_tags === "string") {
      try {
        behavioral_skill_tags = JSON.parse(session.behavioral_skill_tags);
      } catch {
        behavioral_skill_tags = session.behavioral_skill_tags;
      }
    } else {
      behavioral_skill_tags = session.behavioral_skill_tags;
    }
  }

  // 🔹 Fetch per-question feedback
  const [rows] = await pool.query(
    `
    SELECT
      aq.id AS question_id,
      aq.question_text,
      ur.user_response,
      af.evaluation
    FROM asked_questions aq
    LEFT JOIN user_responses ur
      ON ur.session_id = aq.session_id AND ur.question_id = aq.id
    LEFT JOIN ai_question_feedback af
      ON af.session_id = aq.session_id AND af.question_id = aq.id
    WHERE aq.session_id = ?
    ORDER BY aq.id ASC
  `,
    [session_id]
  );

  const ai_feedbacks = rows.map((r) => {
    let evalData = null;

    if (r.evaluation != null) {
      if (typeof r.evaluation === "string") {
        try {
          evalData = JSON.parse(r.evaluation);
        } catch {
          evalData = r.evaluation; // fallback, at least return something
        }
      } else {
        // already JSON / object from MySQL driver
        evalData = r.evaluation;
      }
    }

    return {
      question_id: r.question_id,
      question_text: r.question_text,
      user_response: r.user_response,
      evaluation: evalData,
    };
  });

  return {
    found: true,
    complete: true,
    data: {
      job_title: session.job_title,
      difficulty: session.difficulty,
      meta_evaluation,
      behavioral_skill_tags,
      ai_feedbacks,
    },
  };
}

module.exports = {
  insertUserResponses,
  evaluateWithAI,
  insertAiFeedback,
  getEvaluationBySession,
};
