// services/notification.service.js
const conn = require("../config/db.config");
const crypto = require("crypto");

function genNotificationId() {
  return crypto.randomBytes(8).toString("hex"); // 16 chars
}


async function createNotification(opts) {
  const {
    profile_id,
    type,
    title,
    body,
    entity_type = null,
    entity_id = null,
  } = opts;

  if (!profile_id || !type || !title || !body) {
    throw new Error("Missing required notification fields");
  }

  const notification_id = genNotificationId();

  const sql = `
    INSERT INTO notifications
      (notification_id, profile_id, type, title, body, entity_type, entity_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  await conn.query(sql, [
    notification_id,
    profile_id,
    type,
    title,
    body,
    entity_type,
    entity_id,
  ]);

  return { notification_id };
}

async function getNotificationsForUser(profile_id, { limit = 20 } = {}) {
  const [rows] = await conn.query(
    `
    SELECT
      notification_id,
      type,
      title,
      body,
      entity_type,
      entity_id,
      is_read,
      created_at
    FROM notifications
    WHERE profile_id = ?
    ORDER BY created_at DESC
    LIMIT ?
    `,
    [profile_id, limit]
  );
  return rows;
}

async function markNotificationRead(profile_id, notification_id) {
  const [result] = await conn.query(
    `
    UPDATE notifications
    SET is_read = 1
    WHERE profile_id = ? AND notification_id = ?
    `,
    [profile_id, notification_id]
  );
  return result.affectedRows > 0;
}

async function markAllNotificationsRead(profile_id) {
  const [result] = await conn.query(
    `
    UPDATE notifications
    SET is_read = 1
    WHERE profile_id = ? AND is_read = 0
    `,
    [profile_id]
  );
  return result.affectedRows;
}

module.exports = {
  createNotification,
  getNotificationsForUser,
  markNotificationRead,
  markAllNotificationsRead,
};
