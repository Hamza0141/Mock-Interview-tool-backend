// controllers/adminAuth.controller.js
const adminAuthService = require("../services/adminAuth.service");
const jwt = require("jsonwebtoken");

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET;


async function adminLogin(req, res) {
  try {
    const { admin_email, password } = req.body;
    if (!admin_email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
    }

    const { admin } = await adminAuthService.validateAdminLogin(
      admin_email,
      password
    );

    const payload = {
      profile_id: admin.profile_id,
      admin_email: admin.admin_email,
      first_name: admin.first_name,
      last_name: admin.last_name,
      access_type: admin.access_type,
    };

    // Build JWT payload
    const token = jwt.sign(payload, ADMIN_JWT_SECRET, {
      expiresIn: "24h",
    });

    res.cookie("admin_token", token, {
      httpOnly: true, // prevents JS access
      secure: false, // set to true in production (requires HTTPS)
      sameSite: "Lax", //  "Strict" for
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });


    return res.json({
      success: true,
      message: "Admin login successful",
      token,
      data: { admin: payload },
    });

  } catch (err) {
    console.error("adminLogin error:", err.message);
    res
      .status(err.status || 500)
      .json({ success: false, message: err.message || "Server error" });
  }
}

module.exports = {
  adminLogin,
};
