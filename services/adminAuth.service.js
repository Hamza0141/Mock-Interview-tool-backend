// services/adminAuth.service.js
const conn = require("../config/db.config");
const bcrypt = require("bcrypt");

async function findAdminByEmail(admin_email) {
  const [rows] = await conn.query(
    `SELECT *
     FROM admin
     WHERE admin_email = ?
     LIMIT 1`,
    [admin_email]
  );
  return rows[0] || null;
}

async function validateAdminLogin(admin_email, password) {
  const admin = await findAdminByEmail(admin_email);
  if (!admin) {
    const err = new Error("Admin Not Found");
    err.status = 401;
    throw err;
  }

  if (!admin.is_active) {
    const err = new Error("Admin account is disabled");
    err.status = 403;
    throw err;
  }

  const match = await bcrypt.compare(password, admin.password_hash);
  if (!match) {
    const err = new Error("Password Incorrect");
    err.status = 401;
    throw err;
  }

  return { admin };
}

//  function to create admins (you might seed the first manually)
async function createAdmin({
  profile_id,
  admin_email,
  password,
  first_name,
  last_name,
  access_type,
}) {
  const password_hash = await bcrypt.hash(password, 10);
  const [result] = await conn.query(
    `
    INSERT INTO admin (
      profile_id, admin_email, password_hash,
      first_name, last_name, access_type
    )
    VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      profile_id,
      admin_email,
      password_hash,
      first_name || null,
      last_name || null,
      access_type || "admin",
    ]
  );

  return { id: result.insertId, profile_id, admin_email, access_type };
}

module.exports = {
  validateAdminLogin,
  createAdmin,
};
