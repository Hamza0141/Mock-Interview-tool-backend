const express = require("express");
const router = express.Router();
const SpeechController = require("../controllers/speech.controller");
const { verifyToken } = require("../middlewares/auth");


router.post(
  "/api/user/speech",
  verifyToken ,SpeechController.handleSpeechSubmission
);

module.exports = router;
