// middlewares/userOrAdminAuth.js
const jwt = require("jsonwebtoken");

const USER_JWT_SECRET = process.env.JWT_SECRET; // same you use in verifyToken
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET; // same as in adminAuth.middleware

async function userOrAdminAuth(req, res, next) {
  // 1) Try normal user token first (Authorization: Bearer xxx)
const token = req.cookies.auth_token;

  if (token) {
    try {
      const decodedUser = jwt.verify(token, USER_JWT_SECRET);
      // shape whatever you put into user JWT
      req.user = decodedUser;
      return next();
    } catch (e) {
      // token invalid → fall through and try admin token
      console.log("userOrAdminAuth: user token invalid, trying admin token");
    }
  }

  // 2) Try admin cookie token
  const adminToken = req.cookies?.admin_token;
  if (adminToken) {
    try {
      const decodedAdmin = jwt.verify(adminToken, ADMIN_JWT_SECRET);
      // decoded: { admin_profile_id, admin_email, access_type, iat, exp }
      req.admin = decodedAdmin;
      return next();
    } catch (e) {
      console.log("userOrAdminAuth: admin token invalid");
    }
  }

  // 3) Neither user nor admin authenticated
  return res
    .status(401)
    .json({ success: false, message: "Unauthorized: login required" });
}

function adminAuth(req, res, next) {
  const token = req.cookies.admin_token;
  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Admin token missing" });
  }

  try {
    const decoded = jwt.verify(token, ADMIN_JWT_SECRET);
    console.log(decoded);
    // decoded: { admin_profile_id, admin_email, access_type, iat, exp }
    req.admin = decoded; // { admin_profile_id, admin_email, access_type, ... }
    next();
  } catch (err) {
    console.error("adminAuth error:", err.message);
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired admin token" });
  }
}
function requireSuperAdmin(req, res, next) {
  if (!req.admin || req.admin.access_type !== "admin") {
    return res
      .status(403)
      .json({ success: false, message: "Admin access required" });
  }
  next();
}



module.exports = { userOrAdminAuth, adminAuth, requireSuperAdmin };
