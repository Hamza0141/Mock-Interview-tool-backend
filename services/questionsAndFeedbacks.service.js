// api/services/questionsAndFeedbacks.service.js
const conn = require("../config/db.config");

 async function getQuestionsBySessionId(interview_id) {
   try {
     const [rows] = await conn.query(
       `SELECT id, question_text, created_at
       FROM asked_questions
       WHERE session_id = ?
       ORDER BY id ASC`,
       [interview_id]
     );

     if (!rows.length) {
       return {
         success: false,
         message: "No questions found for this interview session.",
         data: [],
       };
     }

     return {
       success: true,
       message: "Questions retrieved successfully.",
       data: rows,
     };
   } catch (err) {
     console.error("❌ Error fetching questions:", err.message);
     return {
       success: false,
       message: "Database error while fetching questions.",
       data: [],
     };
   }
 }

async function getFeedbackBySessionId(interview_id) {
  try {
    const [rows] = await conn.query(
      `SELECT 
         s.interview_id,
         s.user_profile_id,
         s.job_title,
         s.job_description,
         s.difficulty,
         s.status,
         s.meta_evaluation,
         s.behavioral_skill_tags,
         s.started_at,
         s.ended_at,
         JSON_ARRAYAGG(
           JSON_OBJECT(
             'question_id', f.question_id,
             'feedback_id', f.id,
             'evaluation', f.evaluation,
             'created_at', f.created_at
           )
         ) AS ai_feedbacks
       FROM interview_sessions AS s
       LEFT JOIN (
         SELECT * FROM ai_question_feedback ORDER BY question_id ASC
       ) AS f
         ON s.interview_id = f.session_id
       WHERE s.interview_id = ?
       GROUP BY s.interview_id`,
      [interview_id]
    );

    if (!rows.length) {
      return {
        success: false,
        message: "No AI feedback found for this interview session.",
        data: [],
      };
    }

    const row = rows[0];

    // ✅ Safely parse only ai_feedbacks array
    let feedbacks = [];
    try {
      const parsed =
        typeof row.ai_feedbacks === "string"
          ? JSON.parse(row.ai_feedbacks)
          : row.ai_feedbacks;

      feedbacks = (parsed || []).map((fb) => ({
        question_id: fb.question_id,
        feedback_id: fb.feedback_id,
        // ✅ evaluation is already an object (no parse)
        evaluation: fb.evaluation,
        created_at: fb.created_at,
      }));
    } catch (err) {
      console.warn("⚠️ Failed to parse ai_feedbacks JSON:", err.message);
    }

    return {
      success: true,
      message: "Feedback retrieved successfully.",
      data: {
        interview_id: row.interview_id,
        user_profile_id: row.user_profile_id,
        job_title: row.job_title,
        job_description: row.job_description,
        difficulty: row.difficulty,
        status: row.status,
        meta_evaluation:
          typeof row.meta_evaluation === "string"
            ? JSON.parse(row.meta_evaluation || "{}")
            : row.meta_evaluation,
        behavioral_skill_tags:
          typeof row.behavioral_skill_tags === "string"
            ? JSON.parse(row.behavioral_skill_tags || "[]")
            : row.behavioral_skill_tags,
        started_at: row.started_at,
        ended_at: row.ended_at,
        ai_feedbacks: feedbacks,
      },
    };
  } catch (err) {
    console.error("❌ Error fetching AI feedback:", err.message);
    return {
      success: false,
      message: "Database error while fetching AI feedback.",
      data: [],
    };
  }
}





module.exports = { getQuestionsBySessionId, getFeedbackBySessionId };