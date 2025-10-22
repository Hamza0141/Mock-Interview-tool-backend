
const conn = require("../config/db.config");

async function saveGeneratedQuestions(
  user_profile_id,
  session_id,
  job_role,
  questions
) {
  try {
    if (!questions || !Array.isArray(questions)) {
      throw new Error("Invalid question format");
    }

    const insertQuery = `
      INSERT INTO asked_questions (id, user_profile_id, session_id, job_role, question_text)
      VALUES (?, ?, ?, ?, ?)
    `;

    for (const q of questions) {
      await conn.query(insertQuery, [
        q.id,
        user_profile_id,
        session_id,
        job_role,
        q.question,
      ]);
    }

    console.log(
      ` ${questions.length} questions saved for session ${session_id}`
    );
    return { success: true, message: "Questions saved successfully" };
  } catch (error) {
    console.error(" Error saving generated questions:", error.message);
    return { success: false, message: error.message };
  }
}

module.exports = { saveGeneratedQuestions };
