// Import the query function from the db.config.js file
const conn = require("../config/db.config");
// Import the bcrypt module

const {otpManager} = require("../utils/otpManager")
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


    if (new Date(record.expires_at) < new Date() || record.used)
      return res.status(400).json({ message: "Code expired" });

await conn.query(
  "UPDATE verifications SET verified = TRUE, is_used = TRUE WHERE id = ?",
  [record.id]
);
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

async function checkIfUserExists(email) {
  const query = "SELECT * FROM users WHERE user_email = ?";
  const [rows] = await conn.query(query, [email]);
  return rows.length > 0;
}
async function getUserById(user_id) {
  const query = "SELECT * FROM users WHERE profile_id = ?";
  const [rows] = await conn.query(query, [user_id]);
  return rows.length > 0 ? rows[0] : null;
}
// A function to get employee by email
async function getUserByEmail(user_email) {
  try {
    const query = `
  SELECT 
    u.profile_id,
    u.user_email,
    a.password_hash,
    a.is_active,
    a.is_verified,
    u.credit_balance,
    u.first_name
  FROM users u
  LEFT JOIN user_auth a ON u.profile_id = a.profile_id
  WHERE u.user_email = ?
`;

    const [rows] = await conn.query(query, [user_email]);
console.log(rows);
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

const note = "Verify Your Email";
    //   Send OTP email
    await otpManager(user.user_email, note);

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
// async function getUserByEmail(userEmail) {
//   const [rows] = await conn.query("SELECT * FROM users WHERE user_email = ?", [
//     userEmail,
//   ]);
//   return rows.length ? rows[0] : null;
// }

async function updateUserPassword(userEmail, hashedPassword) {
  try {
    const [result] = await conn.query(
      "UPDATE user_auth SET password_hash = ?, updated_at = NOW() WHERE user_email = ?",
      [hashedPassword, userEmail]
    );
    if (result.affectedRows === 0) return { success: false };
    return { success: true };
  } catch (err) {
    console.error("Error updating password:", err);
    return { success: false, error: err };
  }
}




module.exports = {
  getUserById,
  checkIfUserExists,
  getUserByEmail,
  createUser,
  verifyEmail,
  updateUserPassword,

};