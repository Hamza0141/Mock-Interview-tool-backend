const conn = require("../config/db.config");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

// ✅ Check if a user already exists by email
async function checkIfUserExists(email) {
  const query = "SELECT * FROM users WHERE user_email = ?";
  const [rows] = await conn.query(query, [email]);
  return rows.length > 0;
}

//  Create a new user with password
async function createUser(user) {
  let createdUser = null;

  try {
    // 1. Validate required fields before doing anything
    if (!user.user_email || !user.user_password) {
      throw new Error("Missing required fields: email and/or password");
    }

    // Optional fields: can be empty without breaking SQL
    const firstName = user.first_name || null;
    const lastName = user.last_name || null;

    //   Generate profile_id
    const profile_id = crypto.randomBytes(10).toString("hex");

    //   Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(user.user_password, salt);

    //  Insert user into `users` table
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
    //  Insert password into `user_passwords` table
    const passwordQuery = `
      INSERT INTO user_passwords (profile_id, password_hash)
      VALUES (?, ?)
    `;
    await conn.query(passwordQuery, [profile_id, hashedPassword]);

    //  Return created user
    createdUser = { profile_id };
  } catch (err) {
    console.error(" Error creating user:", err.message);
    // We don't crash — just return null so controller can handle it
    createdUser = null;
  }

  return createdUser;
}
module.exports = {
  checkIfUserExists,
  createUser,
};
