// api/routes/questionsAndFeedbacks.route.js
const express = require("express");
const { verifyToken } = require("../middlewares/auth");

const getQuestions = require("../controllers/questionsAndFeedbacks.controller.js");

const router = express.Router();

//  GET: fetch questions for a specific interview session
router.get(
  "/api/user/interview/:interview_id/questions",
  verifyToken,getQuestions.getQuestions
);
router.get(
  "/api/user/interview/:interview_id/Ai_feedback",
  verifyToken,getQuestions.getAiFeedback
);

module.exports = router;
