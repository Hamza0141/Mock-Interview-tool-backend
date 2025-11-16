const express = require("express");
const router = express.Router();

// Existing routes
const authRoutes = require("./auth.routes");
const userRoutes = require("./user.routes");
const interview = require("./initiateInterview.routes");
const evaluateInterview = require("./evaluateInterview.routes");
const credit = require("./credit.route");
const speech = require("./speech.route");
const userNotes = require("./userNote.routes");
const questionsAndFeedbacks = require("./questionsAndFeedbacks.route");
const voiceTranscription = require("./voice.route");
const report = require("./report.routes")
const ticket = require("./ticket.routes");
const adminRoutes = require("./admin.routes");
const notifications = require("./admin.routes");


// const paymentRoutes = require("./payment.route");
// const webhookRoutes = require("../controllers/webhook.controller");

// Mount all routes
router.use(authRoutes);
router.use(userRoutes);
router.use(interview);
router.use(evaluateInterview);
router.use(credit);
router.use(speech);
router.use(userNotes);
router.use(questionsAndFeedbacks);
router.use(voiceTranscription);
router.use(report);
router.use(ticket);
router.use(adminRoutes);
router.use(notifications);




// // Mount payments under /api/payments
// router.use("/api/payments", paymentRoutes);
// // Mount Stripe webhook route (separate because it needs raw body)
// router.use("/api/payments", webhookRoutes);

module.exports = router;
