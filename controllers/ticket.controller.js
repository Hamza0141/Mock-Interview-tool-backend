// controllers/ticket.controller.js
const ticketService = require("../services/ticket.service");

function getSenderFromReq(req) {

  if (req.admin) {
    // from admin JWT
    return {
      sender_type: "admin",
      profile_id: req.admin.profile_id, // from your admin token
      is_admin: true,
    };
  }

  if (req.user) {
    return {
      sender_type: req.user.is_admin ? "admin" : "user",
      profile_id: req.user.profile_id,
      is_admin: !!req.user.is_admin,
    };
  }

  return null;
}
async function createTicket(req, res) {
  try {
    const sender = getSenderFromReq(req);
    if (!sender || !sender.profile_id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });

    }

    const { subject, message, priority } = req.body;

    if (!subject || !message) {
      return res
        .status(400)
        .json({ success: false, message: "Subject and message are required" });
    }

    const ticket = await ticketService.createTicket({
      profile_id: sender.profile_id,
      subject,
      message,
      priority,
      sender_type: sender.sender_type,
    });

    return res.json({
      success: true,
      message: "Ticket created successfully",
      data: ticket,
    });
  } catch (err) {
    console.error("createTicket error:", err.message);
    res
      .status(err.status || 500)
      .json({ success: false, message: err.message || "Server error" });
  }
}

// GET /api/user/tickets
async function getTickets(req, res) {
  try {
    const sender = getSenderFromReq(req);
    if (!sender) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const tickets = await ticketService.getTicketsForUser({
      profile_id: sender.profile_id,
      is_admin: sender.is_admin,
    });

    return res.json({ success: true, data: tickets });
  } catch (err) {
    console.error("getTickets error:", err.message);
    res
      .status(err.status || 500)
      .json({ success: false, message: err.message || "Server error" });
  }
}

// GET /api/user/tickets/:ticketId
async function getTicketById(req, res) {
  try {
    const { ticketId } = req.params;
    const sender = getSenderFromReq(req);

    if (!sender) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const ticket = await ticketService.getTicketById({
      ticket_id: ticketId,
      profile_id: sender.profile_id,
      is_admin: sender.is_admin,
    });

    if (!ticket) {
      return res
        .status(404)
        .json({ success: false, message: "Ticket not found" });
    }

    return res.json({ success: true, data: ticket });
  } catch (err) {
    console.error("getTicketById error:", err.message);
    res
      .status(err.status || 500)
      .json({ success: false, message: err.message || "Server error" });
  }
}

// POST /api/user/tickets/:ticketId/messages
async function addMessage(req, res) {
  try {
    const { ticketId } = req.params;
    const { message } = req.body;

    const sender = getSenderFromReq(req);
    if (!sender || !sender.profile_id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!message || !message.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Message is required" });
    }

    await ticketService.addMessageToTicket({
      ticket_id: ticketId,
      profile_id: sender.profile_id,
      sender_type: sender.sender_type, // "user" or "admin"
      message,
    });

    return res.json({
      success: true,
      message: "Message added successfully",
    });
  } catch (err) {
    console.error("addMessage error:", err.message);
    res
      .status(err.status || 500)
      .json({ success: false, message: err.message || "Server error" });
  }
}

// PATCH /api/user/tickets/:ticketId/status
async function updateStatus(req, res) {
  try {
    const { ticketId } = req.params;
    const { status } = req.body;

    // If this endpoint is under /api/admin, we know adminAuth ran
    if (!req.admin || req.admin.access_type !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Admin only action" });
    }

    const result = await ticketService.updateTicketStatus({
      ticket_id: ticketId,
      newStatus: status,
    });

    return res.json({
      success: true,
      message: "Ticket status updated",
      data: result,
    });
  } catch (err) {
    console.error("updateStatus error:", err.message);
    res
      .status(err.status || 500)
      .json({ success: false, message: err.message || "Server error" });
  }
}
module.exports = {
  createTicket,
  getTickets,
  getTicketById,
  addMessage,
  updateStatus,
};
