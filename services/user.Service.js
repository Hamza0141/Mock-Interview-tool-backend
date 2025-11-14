// Import the query function from the db.config.js file
const conn = require("../config/db.config");
// Import the bcrypt module
// Import the jsonwebtoken module
const jwt = require("jsonwebtoken");
// Import the secret key from the environment variables
const jwtSecret = process.env.JWT_SECRET;

const {otpManager} = require("../utils/otpManager")
const bcrypt = require("bcrypt");
const crypto = require("crypto");


async function verifyEmail(req, res) {
  console.log(req.body)
  try {
    const { user_email, otp } = req.body;

    // 1️⃣ Find OTP
    const [rows] = await conn.query(
      "SELECT * FROM verifications WHERE user_email = ? AND otp_code = ?",
      [user_email, otp]
    );

    if (!rows.length)
      return res.status(400).json({ success: false, message: "Invalid code" });

    const record = rows[0];

    if (record.verified)
      return res
        .status(400)
        .json({ success: false, message: "Already verified" });

    if (new Date(record.expires_at) < new Date() || record.is_used)
      return res.status(400).json({ success: false, message: "Code expired" });

    // 2️⃣ Update verification table
    await conn.query(
      "UPDATE verifications SET verified = TRUE, is_used = TRUE WHERE id = ?",
      [record.id]
    );

    // 3️⃣ Update user table
    await conn.query(
      "UPDATE user_auth SET is_verified = TRUE WHERE user_email = ?",
      [user_email]
    );

    // 4️⃣ Fetch user info to include in token
    const [userData] = await conn.query(
      "SELECT u.profile_id, u.first_name, u.last_name, u.user_email, a.is_verified, a.is_active FROM users u JOIN user_auth a ON u.profile_id = a.profile_id WHERE u.user_email = ?",
      [user_email]
    );

    if (!userData.length)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const user = userData[0];

    // 5️⃣ Sign JWT now that user is verified
    const payload = {
      profile_id: user.profile_id,
      user_email: user.user_email,
      first_name: user.first_name,
      last_name: user.last_name,
      credit_balance: 0,
      is_active: user.is_active,
      is_verified: user.is_verified,
    };

    const token = jwt.sign(payload, jwtSecret, { expiresIn: "24h" });

  
    //  Send token securely as cookie
    res.cookie("auth_token", token, {
      httpOnly: true, // prevents JS access
      secure: false, // set to true in production (requires HTTPS)
      sameSite: "Lax", // or "Strict" for even tighter CSRF protection
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    return res.status(200).json({
      success: true,
      message: "Email verified successfully.",
      data: { user: payload },
    });
  } catch (error) {
    console.error("Error verifying email:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Server error during verification." });
  }
}


async function checkIfUserExists(email) {
  const query = "SELECT * FROM users WHERE user_email = ?";
  const [rows] = await conn.query(query, [email]);
  return rows.length > 0;
}
async function getUserById(user_id) {
  const query = `
    SELECT 
      u.*, 
      ua.is_active, 
      ua.is_verified
    FROM users u
    JOIN user_auth ua ON u.profile_id = ua.profile_id
    WHERE u.profile_id = ?
  `;
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
    u.first_name,
    u.last_name
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

async function updateUser(updateData, profile_id) {
  try {
    const fields = [];
    const values = [];

    // Build the update query dynamically (excluding email)
    if (updateData.first_name) {
      fields.push("first_name = ?");
      values.push(updateData.first_name);
    }
    if (updateData.last_name) {
      fields.push("last_name = ?");
      values.push(updateData.last_name);
    }
    if (updateData.profession) {
      fields.push("profession = ?");
      values.push(updateData.profession);
    }
    if (updateData.profile_url) {
      fields.push("profile_url = ?");
      values.push(updateData.profile_url);
    }

    if (fields.length === 0) return null;

    values.push(profile_id);

    const sql = `UPDATE users SET ${fields.join(", ")} WHERE profile_id = ?`;
    const [result] = await conn.query(sql, values);

    if (result.affectedRows === 0) return null;

    // Fetch updated user
    const [rows] = await conn.query(
      `SELECT profile_id, user_email, first_name, last_name, profession, profile_url, credit_balance, free_trial, created_at, updated_at 
       FROM users WHERE profile_id = ?`,
      [profile_id]
    );

    return rows[0] || null;
  } catch (error) {
    console.error("❌ Service error (updateUser):", error.message);
    throw error;
  }
}


// async function buyUserCredit(profile_id, amount, bought_credit, email) {

//   try {
//     //generate purchases_record character 
//     const purchases_record = crypto.randomBytes(8).toString("hex");

//     const userQuery = `
//       INSERT INTO purchases (purchases_record, user_email, first_name, last_name)
//       VALUES (?, ?, ?, ?)
//     `;
//     const [userResult] = await conn.query(userQuery, [
//       profile_id,
//       user.user_email,
//       firstName,
//       lastName,
//     ]);

//     if (userResult.affectedRows !== 1) {
//       throw new Error("Failed to insert user into users table");
//     }

//     // Insert password
//     const passwordQuery = `
//       INSERT INTO user_auth (profile_id,user_email, password_hash)
//       VALUES (?,?, ?)
//     `;
//     await conn.query(passwordQuery, [
//       profile_id,
//       user.user_email,
//       hashedPassword,
//     ]);

//     const note = "Verify Your Email";
//     //   Send OTP email
//     await otpManager(user.user_email, note);

//     createdUser = {
//       profile_id,
//       message: "User created successfully. OTP sent to email for verification.",
//     };
//   } catch (err) {
//     console.error(" Error creating user:", err.message);
//     createdUser = null;
//   }

//   return createdUser;
// }

// async function getUserByProfileId(profileId) {
//   const [rows] = await conn.query(
//     "SELECT * FROM users WHERE profile_id = ? LIMIT 1",
//     [profileId]
//   );
//   return rows[0] || null;
// }

async function getCreditSummary(profileId) {
  const user = await getUserById(profileId);
  if (!user) throw new Error("User not found");

  // Get available credit packs (you could add WHERE active = 1 later)
  const [packs] = await conn.query(
    "SELECT id, name, credits, price_cents FROM credit_packs ORDER BY price_cents ASC"
  );

  // Last few transactions
  const [transactions] = await conn.query(
    `SELECT id, stripe_payment_intent_id, amount, bought_credit, currency, status, created_at
     FROM credit_transactions
     WHERE profile_id = ?
     ORDER BY created_at DESC
     LIMIT 10`,
    [profileId]
  );

  return {
    profile_id: user.profile_id,
    user_email: user.user_email,
    credit_balance: user.credit_balance,
    free_trial: user.free_trial,
    credit_packs: packs,
    recent_transactions: transactions,
  };
}


module.exports = {
  getUserById,
  checkIfUserExists,
  getUserByEmail,
  createUser,
  verifyEmail,
  updateUserPassword,
  // buyUserCredit,
  getCreditSummary,
  updateUser,
};