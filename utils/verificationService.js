// services/verification.service.js
const conn = require("../config/db.config");

async function verifyOtpRecord({ user_email, otp }) {
  // 1) Find OTP record
  const [rows] = await conn.query(
    "SELECT * FROM verifications WHERE user_email = ? AND otp_code = ?",
    [user_email, otp]
  );

  if (!rows.length) {
    return { ok: false, message: "Invalid code" };
  }
  const record = rows[0];
    console.log("record");
  console.log(record);
  if (new Date(record.expires_at) < new Date() || record.is_used) {
    return { ok: false, message: "Code expired" };
  }

  // 2) Mark this OTP as used/verified
  await conn.query(
    "UPDATE verifications SET is_used = TRUE WHERE id = ?",
    [record.id]
  );

  // 3) Update user_auth based on EMAIL, not verification.id
  const [userAuthResult] = await conn.query(
    "UPDATE user_auth SET is_verified = TRUE WHERE user_email = ?",
    [user_email]
  );

  // Optional safety check
  if (userAuthResult.affectedRows === 0) {
    // no matching user_auth row for this email
    return {
      ok: false,
      message: "No user_auth record found for this email",
    };
  }

  return { ok: true, record };
}


module.exports = {
  verifyOtpRecord,
};
