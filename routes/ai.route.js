const express = require("express");
const router = express.Router();
const aiController = require("../controllers/ai.controller");

// POST /api/ai/generate
// router.post("/api/ai/generate", aiController.generateQuestions);
router.post("/api/ai/evaluate", aiController.evaluateResponses);

module.exports = router;
