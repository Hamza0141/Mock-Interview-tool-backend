// controllers/notification.controller.js
const notificationService = require("../services/notification.service");

async function getMyNotifications(req, res) {
  try {
    const profile_id = req.user?.profile_id;
    if (!profile_id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const notifications = await notificationService.getNotificationsForUser(
      profile_id,
      { limit: 30 }
    );

    res.json({ success: true, data: notifications });
  } catch (err) {
    console.error("getMyNotifications error:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to load notifications" });
  }
}

async function markOneRead(req, res) {
  try {
    const profile_id = req.user?.profile_id;
    const { notificationId } = req.params;

    if (!profile_id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const ok = await notificationService.markNotificationRead(
      profile_id,
      notificationId
    );

    if (!ok) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.json({ success: true, message: "Notification marked as read" });
  } catch (err) {
    console.error("markOneRead error:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to update notification" });
  }
}

async function markAllRead(req, res) {
  try {
    const profile_id = req.user?.profile_id;

    if (!profile_id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const count = await notificationService.markAllNotificationsRead(
      profile_id
    );

    res.json({
      success: true,
      message: `Marked ${count} notification(s) as read`,
    });
  } catch (err) {
    console.error("markAllRead error:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to update notifications" });
  }
}

module.exports = {
  getMyNotifications,
  markOneRead,
  markAllRead,
};
