const express = require("express");
const multer = require("multer");
const voiceController = require("../controllers/voice.controller");

const router = express.Router();
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "voiceUploads/"),
  filename: (req, file, cb) => {
    // Preserve original extension or default to .webm
    const ext = file.originalname.split(".").pop() || "webm";
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    cb(null, name);
  },
});


const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = [
      "audio/webm",
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/mp4",
      "audio/ogg",
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Unsupported audio format"));
  },
});

router.post(
  "/api/voice/transcribe",
  upload.single("audio"),
  voiceController.transcribeVoice
);
module.exports = router;
