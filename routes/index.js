const express = require("express");
const router = express.Router();

// Existing routes
const authRoutes = require("./auth.routes");
const userRoutes = require("./user.routes");
const interview = require("./initiateInterview.routes");
const evaluateInterview = require("./evaluateInterview.routes");
const credit = require("./credit.route");
const speech = require("./speech.route");
const aiRoutes = require("./ai.route");
const userNotes = require("./userNote.routes");
const questionsAndFeedbacks = require("./questionsAndFeedbacks.route");



const paymentRoutes = require("./payment.route");
const webhookRoutes = require("../controllers/webhook.controller");

// Mount all routes
router.use(authRoutes);
router.use(userRoutes);
router.use(interview);
router.use(evaluateInterview);
router.use(credit);
router.use(speech);
router.use(aiRoutes);
router.use(userNotes);
router.use(questionsAndFeedbacks);



// Mount payments under /api/payments
router.use("/api/payments", paymentRoutes);
// Mount Stripe webhook route (separate because it needs raw body)
router.use("/api/payments", webhookRoutes);

module.exports = router;
