const conn = require("../config/db.config");

async function insertUserResponses(session_id, asked_questions) {
  const sql = `
    INSERT INTO user_responses (session_id, question_id, user_response)
    VALUES (?, ?, ?)
  `;

  const results = [];
  const errors = [];

  for (const response of asked_questions) {
    try {
      const [insertResult] = await conn.query(sql, [
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

module.exports = { insertUserResponses };
