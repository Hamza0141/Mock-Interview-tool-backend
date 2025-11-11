const fs = require("fs");
const openai = require("../config/openai");

async function handleTranscription({ question_id, session_id, filePath }) {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error("Audio file not found for transcription.");
    }

    // Whisper transcription call
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "whisper-1",
      response_format: "json",
    });

    const text = transcription.text?.trim() || "";
    console.log(`🎧 Transcribed Q${question_id} / S${session_id}:`, text);

    fs.unlink(filePath, (err) => {
      if (err) console.warn("⚠️ Failed to delete temp file:", err.message);
    });

    return text;
  } catch (err) {
    console.error("❌ Error in handleTranscription:", err);
    throw new Error("Transcription failed: " + err.message);
  }
}

module.exports = { handleTranscription };
