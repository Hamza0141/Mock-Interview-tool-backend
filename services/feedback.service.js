// services/feedback.service.js
const conn = require("../config/db.config");
const crypto = require("crypto");

function generateId(len = 12) {
  return crypto
    .randomBytes(Math.ceil(len / 2))
    .toString("hex")
    .slice(0, len);
}

async function createFeedback({ profile_id, q1, q2, q3, q4, comment }) {
  const feedback_id = generateId(12);

  const [result] = await conn.query(
    `
    INSERT INTO service_feedback (
      feedback_id,
      profile_id,
      q1_rating,
      q2_rating,
      q3_rating,
      q4_rating,
      comment
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [feedback_id, profile_id, q1, q2, q3, q4, comment || null]
  );

  return {
    feedback_id,
    profile_id,
    q1_rating: q1,
    q2_rating: q2,
    q3_rating: q3,
    q4_rating: q4,
    comment: comment || null,
    inserted_id: result.insertId,
  };
}

async function getFeedbackForUser(profile_id) {
  const [rows] = await conn.query(
    `
    SELECT
      feedback_id,
      profile_id,
      q1_rating,
      q2_rating,
      q3_rating,
      q4_rating,
      comment,
      created_at
    FROM service_feedback
    WHERE profile_id = ?
    ORDER BY created_at DESC
    `,
    [profile_id]
  );

  return rows;
}

// optional: for admin dashboard later
async function getAllFeedback() {
  const [rows] = await conn.query(
    `
    SELECT
      feedback_id,
      profile_id,
      q1_rating,
      q2_rating,
      q3_rating,
      q4_rating,
      comment,
      created_at
    FROM service_feedback
    ORDER BY created_at DESC
    `
  );
  return rows;
}

module.exports = {
  createFeedback,
  getFeedbackForUser,
  getAllFeedback,
};
