// routes/notification.routes.js
const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/auth");
const notificationController = require("../controllers/notification.controller");

// GET /api/user/notifications
router.get(
  "/api/user/notifications",
  verifyToken,
  notificationController.getMyNotifications
);

// PATCH /api/user/notifications/:notificationId/read
router.patch(
  "/api/user/notifications/:notificationId/read",
  verifyToken,
  notificationController.markOneRead
);

// PATCH /api/user/notifications/read-all
router.patch(
  "/api/user/notifications/read-all",
  verifyToken,
  notificationController.markAllRead
);

module.exports = router;
