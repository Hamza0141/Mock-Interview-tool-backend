const express = require("express");
const router = express.Router();
const evaluateInterview = require("../controllers/evaluateInterview.controller");
const { verifyToken } = require("../middlewares/auth");
router.post(
  "/api/ai/evaluate",
  verifyToken ,evaluateInterview.evaluateAndAddFeedback
);
module.exports = router;

