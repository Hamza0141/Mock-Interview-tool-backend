// Import the query function from the db.config.js file
const conn = require("../config/db.config");
const { sendOTPEmail } = require("../middlewares/authMailgun");

async function otpManager(email, note ) {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpQuery = `
      INSERT INTO verifications (user_email, otp_code, expires_at)
      VALUES (?,?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))
    `;
  await conn.query(otpQuery, [email, otp]);

  //  Send OTP email
  await sendOTPEmail(email, otp, note);
}

module.exports = {
  otpManager,
};
