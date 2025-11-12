const conn = require("../config/db.config");
const crypto = require("crypto");
const openai = require("../config/openai");

async function validation(profile_id) {
  try {
    const [rows] = await conn.query(
      "SELECT credit_balance, free_trial FROM users WHERE profile_id = ?",
      [profile_id]
    );

    if (rows.length === 0) {
      return { success: false, message: "User not found" };
    }

    const user = rows[0];

    if (user.credit_balance <= 0 && user.free_trial <= 0) {
      return { success: false, message: "No available credit or free trial" };
    }

    // Deduct credit or mark free trial as used
    if (user.free_trial > 0) {
      await conn.query("UPDATE users SET free_trial = 0 WHERE profile_id = ?", [
        profile_id,
      ]);
      return { success: true, message: "Free trial used" };
    } else {
      await conn.query(
        "UPDATE users SET credit_balance = credit_balance - 1 WHERE profile_id = ?",
        [profile_id]
      );
      return { success: true, message: "1 credit deducted" };
    }
  } catch (error) {
    console.error("Error in validation:", error);
    return { success: false, message: "Validation failed" };
  }
}

async function submitSpeech(
  profile_id,
  speech_title,
  speech_goal,
  speech_text
) {
  const connection = await conn.getConnection();
  await connection.beginTransaction();

  try {
    
    const speech_id = crypto.randomBytes(6).toString("hex");

    await connection.query(
      "INSERT INTO public_speeches (speech_id, profile_id, speech_title, speech_goal, speech_text) VALUES (?, ?, ?, ?, ?)",
      [speech_id, profile_id, speech_title, speech_goal, speech_text]
    );

    await connection.commit();
    return { success: true, speech_id };
  } catch (error) {
    await connection.rollback();
    console.error("Error submitting speech:", error);
    return { success: false, message: error.message };
  } finally {
    connection.release();
  }
}

async function evaluateSpeech(speechData) {
  try {
    const prompt = `
SYSTEM:
You are an expert public speaking coach and communication specialist.
Always respond in strict JSON.

USER:
Evaluate the following speech. Provide specific, constructive feedback on structure, clarity, tone, pacing, emotional impact, and persuasiveness.

Input:
${JSON.stringify(speechData, null, 2)}

OUTPUT JSON SCHEMA:
{
  "scores": {
    "structure": number,
    "clarity": number,
    "tone": number,
    "engagement": number,
    "persuasiveness": number,
    "grammar": number,
    "overall": number
  },
  "strengths": [string],
  "weaknesses": [string],
  "suggestions": string,
  "summary": string
}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5-nano",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    return JSON.parse(completion.choices[0].message.content);
  } catch (error) {
    console.error("AI Speech Evaluation error:", error);
    return { error: error.message };
  }
}



async function saveFeedback(speech_id, speech_title, ai_feedback) {
  const connection = await conn.getConnection();
  try {
    await connection.query(
      "INSERT INTO speech_feedback (speech_id, speech_title, ai_feedback, status) VALUES (?, ?, ?, 'completed')",
      [speech_id, speech_title, JSON.stringify(ai_feedback)]
    );

    await connection.query(
      "UPDATE public_speeches SET status = 'completed' WHERE speech_id = ?",
      [speech_id]
    );
  } catch (error) {
    console.error("Error saving feedback:", error);
  } finally {
    connection.release();
  }
}
async function getSpeechWithFeedback(speech_id) {
  const query = `
    SELECT 
      ps.speech_id,
      ps.profile_id,
      ps.speech_title,
      ps.speech_goal,
      ps.speech_text,
      ps.status AS speech_status,
      ps.created_at AS speech_created_at,
      sf.ai_feedback,
      sf.status AS feedback_status,
      sf.created_at AS feedback_created_at
    FROM public_speeches ps
    LEFT JOIN speech_feedback sf
      ON ps.speech_id = sf.speech_id
    WHERE ps.speech_id = ?
    ORDER BY ps.created_at DESC
  `;

  try {
    const [rows] = await conn.execute(query, [speech_id]);

    // If no speech found
    if (rows.length === 0) {
      return null;
    }

    // Normalize JSON output (parse ai_feedback if not null)
    const result = rows[0];
    if (result.ai_feedback && typeof result.ai_feedback === "string") {
      result.ai_feedback = JSON.parse(result.ai_feedback);
    }

    return result;
  } catch (error) {
    console.error("Error fetching speech with feedback:", error);
    throw error;
  }
}




module.exports = {
  submitSpeech,
  saveFeedback,
  validation,
  evaluateSpeech,
  getSpeechWithFeedback,
};
