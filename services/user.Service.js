// Import the query function from the db.config.js file
const conn = require("../config/db.config");
// Import the jsonwebtoken module
const jwt = require("jsonwebtoken");
// Import the secret key from the environment variables
const jwtSecret = process.env.JWT_SECRET;
// import notification
const notificationService = require("./notification.service");

const {otpManager} = require("../utils/otpManager")
//Mailer
const mailService= require("../middlewares/authMailgun")
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const {verifyOtpRecord}= require("../utils/verificationService")


async function myInfo(profile_id) {
  const [rows] = await conn.query(
    `SELECT 
       profile_id,
       first_name,
       last_name,
       user_email,
       profession,
       profile_url,
       credit_balance,
       free_trial,
       created_at,
       updated_at
     FROM users 
     WHERE profile_id = ? 
     LIMIT 1`,
    [profile_id]
  );

  return rows.length > 0 ? rows[0] : null;
}
async function verifyEmail(req, res) {
  try {
    const { user_email, otp } = req.body;

    if (!user_email || !otp) {
      return res
        .status(400)
        .json({ success: false, message: "Email and code are required." });
    }

    // ✅ Check OTP result
    const { ok, message } = await verifyOtpRecord({ user_email, otp });

    if (!ok) {
      // ❌ OTP invalid / expired / no user_auth row
      return res.status(400).json({
        success: false,
        message: message || "Invalid or expired code.",
      });
    }
    //  Update user table
    await conn.query(
      "UPDATE user_auth SET is_verified = TRUE WHERE user_email = ?",
      [user_email]
    );

    //  Fetch user info to include in token
    const [userData] = await conn.query(
      `SELECT u.profile_id,
              u.first_name,
              u.last_name,
              u.user_email,
              a.is_verified,
              a.is_active
       FROM users u
       JOIN user_auth a ON u.profile_id = a.profile_id
       WHERE u.user_email = ?`,
      [user_email]
    );

    if (!userData.length) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const user = userData[0];

    //  Sign JWT now that user is verified
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
      httpOnly: true,
      secure: false, // true in prod with HTTPS
      sameSite: "Lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Email verified successfully.",
      data: { user: payload },
    });
  } catch (error) {
    console.error("Error verifying email:", error.message);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Server error during verification.",
    });
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
    
    //create notification
    await notificationService.createNotification({
      profile_id: profile_id,
      type: "system",
      title: "Welcome to Prepare With AI 🎉",
      body: "Your account has been created. Start your first mock interview or speech practice when you’re ready.",
      entity_type: "user",
      entity_id: profile_id,
    });
await mailService.sendWelcomeEmail({
  email: user.user_email,
  firstName,
});

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

async function getTransactionStatusByPaymentIntentId(
  paymentIntentId,
  profileId
) {
  const [rows] = await conn.query(
    `SELECT status
     FROM credit_transactions
     WHERE stripe_payment_intent_id = ?
       AND profile_id = ?
     ORDER BY id DESC
     LIMIT 1`,
    [paymentIntentId, profileId]
  );

  if (!rows.length) return null;
  return rows[0].status; // 'pending' | 'completed' | 'failed'
}



module.exports = {
  myInfo,
  getUserById,
  checkIfUserExists,
  getUserByEmail,
  createUser,
  verifyEmail,
  updateUserPassword,
  getCreditSummary,
  updateUser,
  getTransactionStatusByPaymentIntentId
};