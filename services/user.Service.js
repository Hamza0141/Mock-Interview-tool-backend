// Import the query function from the db.config.js file
const conn = require("../config/db.config");
// Import the bcrypt module
const { sendOTPEmail } = require("../middlewares/authMailgun");
const bcrypt = require("bcrypt");
const crypto = require("crypto");


async function verifyEmail(req, res) {
  try {
    const { user_email, otp } = req.body;
    console.log(req.body);

    const [rows] = await conn.query(
      "SELECT * FROM verifications WHERE user_email = ? AND otp_code = ?",
      [user_email, otp]
    );

    if (!rows.length) return res.status(400).json({ message: "Invalid code" });

    const record = rows[0];
    if (record.verified)
      return res.status(400).json({ message: "Already verified" });

    if (new Date(record.expires_at) < new Date())
      return res.status(400).json({ message: "Code expired" });

    await conn.query("UPDATE verifications SET verified = TRUE WHERE id = ?", [
      record.id,
    ]);
    await conn.query(
      "UPDATE user_auth SET is_verified = TRUE WHERE user_email = ?",
      [user_email]
    );
    return res
      .status(200)
      .json({ success: true, message: "Email verified successfully." });
  } catch (error) {
    console.error(" Error verifying email:", error.message);
    return { success: false, message: error.message };
  }
}
//  Utility: Generate 6-digit OTP
async function otpManager(email) {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpQuery = `
      INSERT INTO verifications (user_email, otp_code, expires_at)
      VALUES (?,?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))
    `;
  await conn.query(otpQuery, [email, otp]);

  //  Send OTP email
  await sendOTPEmail(email, otp);
}

async function checkIfUserExists(email) {
  const query = "SELECT * FROM users WHERE user_email = ?";
  const [rows] = await conn.query(query, [email]);
  return rows.length > 0;
}

// A function to get employee by email
async function getUserByEmail(user_email) {
  try {
    const query = `
      SELECT 
        u.*, 
        a.password_hash, a.is_active,
        a.is_verified
      FROM users u
      JOIN user_auth a 
        ON u.profile_id = a.profile_id
      WHERE u.user_email = ?;
    `;

    const [rows] = await conn.query(query, [user_email]);

    // Return single user object or null
    return rows.length ? rows[0] : null;
  } catch (error) {
    console.error(" Error fetching user by email:", error.message);
    return null;
  }
}

async function createUser(user) {
  let createdUser = null;

  try {
    if (!user.user_email || !user.user_password) {
      throw new Error("Missing required fields: email and/or password");
    }

    const firstName = user.first_name || null;
    const lastName = user.last_name || null;
    const profile_id = crypto.randomBytes(10).toString("hex");

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(user.user_password, salt);

    // Insert into users table
    const userQuery = `
      INSERT INTO users (profile_id, user_email, first_name, last_name)
      VALUES (?, ?, ?, ?)
    `;
    const [userResult] = await conn.query(userQuery, [
      profile_id,
      user.user_email,
      firstName,
      lastName,
    ]);

    if (userResult.affectedRows !== 1) {
      throw new Error("Failed to insert user into users table");
    }

    // Insert password
    const passwordQuery = `
      INSERT INTO user_auth (profile_id,user_email, password_hash)
      VALUES (?,?, ?)
    `;
    await conn.query(passwordQuery, [
      profile_id,
      user.user_email,
      hashedPassword,
    ]);

    //   Send OTP email
    // await otpManager(user.user_email);

    createdUser = {
      profile_id,
      message: "User created successfully. OTP sent to email for verification.",
    };
  } catch (err) {
    console.error(" Error creating user:", err.message);
    createdUser = null;
  }

  return createdUser;
}


module.exports = {
  checkIfUserExists,
  getUserByEmail,
  createUser,
  verifyEmail,
};