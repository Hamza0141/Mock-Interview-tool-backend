const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/auth");
const feedbackController = require("../controllers/feedback.controller");


// Feedback
router.post(
  "/api/user/feedback",
  verifyToken,
  feedbackController.createFeedback
);

router.get("/api/user/feedback", verifyToken, feedbackController.getMyFeedback);

module.exports = router;
