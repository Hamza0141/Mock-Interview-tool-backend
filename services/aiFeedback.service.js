const pool = require("../config/db.config");

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

module.exports = { insertAiFeedback };
