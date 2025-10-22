const express = require("express");
const router = express.Router();
const evaluateInterview = require("../controllers/evaluateInterview.controller");
router.post("/api/ai/evaluate", evaluateInterview.saveUserResponses);
module.exports = router;

