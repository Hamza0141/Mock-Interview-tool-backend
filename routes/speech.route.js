const express = require("express");
const router = express.Router();
const SpeechController = require("../controllers/speech.controller");

router.post("/api/user/speech", SpeechController.handleSpeechSubmission);

module.exports = router;
