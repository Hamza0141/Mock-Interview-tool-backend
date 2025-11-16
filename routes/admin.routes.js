// routes/admin.routes.js
const express = require("express");
const router = express.Router();
const { adminLogin } = require("../controllers/adminAuth.controller");
const {
  adminAuth,
  requireSuperAdmin,
} = require("../middlewares/userOrAdminAuth");
adminAuth;


router.post("/api/admin/auth/login", adminLogin);

// GET /api/admin/me
router.get("/api/admin/me", adminAuth, (req, res) => {
  console.log(req.admin);
  res.json({
    success: true,
    admin: req.admin,
  });
});



module.exports = router;
