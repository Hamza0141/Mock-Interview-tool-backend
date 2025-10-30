const conn = require("../config/db.config");
const crypto = require("crypto");

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

async function saveFeedback(speech_id, ai_feedback) {
  const connection = await conn.getConnection();
  try {
    await connection.query(
      "INSERT INTO speech_feedback (speech_id, ai_feedback) VALUES (?, ?)",
      [speech_id, JSON.stringify(ai_feedback)]
    );
  } catch (error) {
    console.error("Error saving feedback:", error);
  } finally {
    connection.release();
  }
}

module.exports = { submitSpeech, saveFeedback, validation };
