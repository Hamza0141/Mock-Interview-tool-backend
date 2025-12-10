const express = require("express");
const router = express.Router();
const evaluateInterview = require("../controllers/evaluateInterview.controller");
const { verifyToken } = require("../middlewares/auth");

// router.post(
//   "/api/ai/evaluate",
//   verifyToken ,evaluateInterview.evaluateAndAddFeedback
// );
// NEW: async pattern – start evaluation (quick response)
router.post(
  "/api/ai/evaluate/start",
  verifyToken,
  evaluateInterview.startEvaluation
);

// NEW: poll evaluation status for a given session
router.get(
  "/api/ai/evaluation-status/:sessionId",
  verifyToken,
  evaluateInterview.getEvaluationStatus
);
module.exports = router;

