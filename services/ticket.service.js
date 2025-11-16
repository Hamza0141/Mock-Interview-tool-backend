// services/ticket.service.js
const conn = require("../config/db.config");
const crypto = require("crypto");
// import notification
const notificationService = require("./notification.service");
// simple 8-char id generator

function generateTicketId() {
  const ticket_id = crypto.randomBytes(8).toString("hex");
  console.log(ticket_id);
  return ticket_id;
}

async function createTicket({
  profile_id,
  subject,
  message,
  priority = "medium",
  sender_type,
}) {
  const ticket_id = generateTicketId();

  const connection = await conn.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query(
      `INSERT INTO support_tickets (ticket_id, profile_id, subject, priority)
       VALUES (?, ?, ?, ?)`,
      [ticket_id, profile_id, subject, priority]
    );

    await connection.query(
      `INSERT INTO support_ticket_messages (ticket_id, sender_type, sender_user_profile_id, message)
       VALUES (?, ?, ?, ?)`,
      [ticket_id, sender_type, profile_id, message]
    );

    await connection.commit();

    return { ticket_id, subject, priority, status: "open" };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

// user tickets (or all for admin)
async function getTicketsForUser({ profile_id, is_admin = false }) {
  let sql = `
    SELECT
      t.ticket_id,
      t.subject,
      t.status,
      t.priority,
      t.created_at,
      t.updated_at
    FROM support_tickets t
  `;
  const params = [];

  if (!is_admin) {
    sql += ` WHERE t.profile_id = ?`;
    params.push(profile_id);
  }

  sql += ` ORDER BY t.created_at DESC`;

  const [rows] = await conn.query(sql, params);
  return rows;
}

async function getTicketById({ ticket_id, profile_id, is_admin = false }) {
  // 1) fetch ticket
  const [tickets] = await conn.query(
    `
    SELECT
      t.ticket_id,
      t.subject,
      t.status,
      t.priority,
      t.profile_id,
      t.created_at,
      t.updated_at
    FROM support_tickets t
    WHERE t.ticket_id = ?
    LIMIT 1
    `,
    [ticket_id]
  );

  if (!tickets.length) return null;
  const ticket = tickets[0];

  // if not admin, ensure owner
  if (!is_admin && ticket.profile_id !== profile_id) {
    const err = new Error("Not authorized to view this ticket");
    err.status = 403;
    throw err;
  }

  // 2) fetch messages
  const [messages] = await conn.query(
    `
    SELECT
      m.id,
      m.sender_type,
      m.sender_user_profile_id,
      m.sender_admin_profile_id,
      m.message,
      m.created_at
    FROM support_ticket_messages m
    WHERE m.ticket_id = ?
    ORDER BY m.created_at ASC
    `,
    [ticket_id]
  );

  return {
    ticket_id: ticket.ticket_id,
    subject: ticket.subject,
    status: ticket.status,
    priority: ticket.priority,
    profile_id: ticket.profile_id,
    created_at: ticket.created_at,
    updated_at: ticket.updated_at,
    messages,
  };
}

async function addMessageToTicket({
  ticket_id,
  profile_id,
  sender_type,
  message,
}) {
if (sender_type === "user") {
  await conn.query(
    `
    INSERT INTO support_ticket_messages (ticket_id, sender_type, sender_user_profile_id, message)
    VALUES (?, ?, ?, ?)
    `,
    [ticket_id, sender_type, profile_id, message]
  );
} else if (sender_type === "admin") {
  await conn.query(
    `
    INSERT INTO support_ticket_messages (ticket_id, sender_type, sender_admin_profile_id, message)
    VALUES (?, ?, ?, ?)
    `,
    [ticket_id, sender_type, profile_id, message]
  );
}
  

  return { success: true };
}

async function updateTicketStatus({ ticket_id, newStatus }) {
  const allowed = ["open", "in_progress", "resolved", "closed"];
  if (!allowed.includes(newStatus)) {
    const err = new Error("Invalid status value");
    err.status = 400;
    throw err;
  }

  const [result] = await conn.query(
    `
    UPDATE support_tickets
    SET status = ?
    WHERE ticket_id = ?
    `,
    [newStatus, ticket_id]
  );
console.log(result);
  if (result.affectedRows === 0) {
    const err = new Error("Ticket not found");
    err.status = 404;
    throw err;
  }

      // await notificationService.createNotification({
      //   profile_id: profile_id,
      //   type: "account",
      //   title: "Welcome to SelfMock 🎉",
      //   body: "Your account has been created. Start your first mock interview or speech practice when you’re ready.",
      //   entity_type: "user",
      //   entity_id: ticket_id,
      // });
  

  return { success: true, status: newStatus };
}

module.exports = {
  createTicket,
  getTicketsForUser,
  getTicketById,
  addMessageToTicket,
  updateTicketStatus,
};
