const conn = require("../config/db.config");
const crypto = require("crypto");

async function createInterview(
  profile_id,
  job_title,
  job_description,
  difficulty 
) {
  try {
    // 1️ Check if user exists and has available credits or free trial
    const [rows] = await conn.query(
      "SELECT credit_balance, free_trial FROM users WHERE profile_id = ?",
      [profile_id]
    );

    if (rows.length === 0) {
      throw new Error("User not found");
    }

    const user = rows[0];

    if (user.credit_balance <= 0 && user.free_trial <= 0) {
      throw new Error("No available credit or free trial");
    }

    //  Generate unique interview_id
    const interview_id = crypto.randomBytes(8).toString("hex");

    //  Create new interview session
    const [result] = await conn.query(
      `INSERT INTO interview_sessions 
        (interview_id, user_profile_id, job_title, job_description, difficulty)
        VALUES (?, ?, ?, ?, ?)`,
      [interview_id, profile_id, job_title, job_description, difficulty]
    );

    if (result.affectedRows !== 1) {
      throw new Error("Failed to create interview session");
    }

    //  If using free trial, mark it as used (optional)
    if (user.free_trial > 0) {
      await conn.query("UPDATE users SET free_trial = 0 WHERE profile_id = ?", [
        profile_id,
      ]);
    } else {
      // Or deduct credit if not using free trial
      await conn.query(
        "UPDATE users SET credit_balance = credit_balance - 1 WHERE profile_id = ?",
        [profile_id]
      );
    }

    //  Return success JSON
    return {
      success: true,
      message: "Interview session created successfully",
      interview_id,
    };
  } catch (err) {
    console.error("❌ Error creating interview session:", err.message);
    return {
      success: false,
      message: err.message,
    };
  }
}

module.exports = {
  createInterview,
};
