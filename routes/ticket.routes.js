// routes/user.routes.js
const express = require("express");
const router = express.Router();

const { userOrAdminAuth } = require("../middlewares/userOrAdminAuth");
const ticketController = require("../controllers/ticket.controller");

router.post(
  "/api/user/tickets",
  userOrAdminAuth,
  ticketController.createTicket
);

// USER or ADMIN can list their tickets (admin: see all or filtered in service)
router.get("/api/user/tickets", userOrAdminAuth, ticketController.getTickets);

// USER or ADMIN can see a specific ticket
router.get(
  "/api/user/tickets/:ticketId",
  userOrAdminAuth,
  ticketController.getTicketById
);

// Only USER can add message to ticket
router.post(
  "/api/user/tickets/:ticketId/messages",
  userOrAdminAuth,
  ticketController.addMessage
);

// ADMIN ONLY: update status (you can also move this to /api/admin router)
router.patch(
  "/api/admin/tickets/:ticketId/status",
  userOrAdminAuth,
  ticketController.updateStatus
);

module.exports = router;
