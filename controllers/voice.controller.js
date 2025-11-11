const voiceService = require("../services/voice.service");

 async function  transcribeVoice  (req, res) {
   try {
    console.log("voice reached here")
     const { question_id, session_id } = req.body;
     const audioFile = req.file;

     if (!audioFile) {
       return res
         .status(400)
         .json({ success: false, message: "No audio file provided." });
     }

     const transcript = await voiceService.handleTranscription({
       question_id,
       session_id,
       filePath: audioFile.path,
     });

     return res.json({ success: true, transcript });
   } catch (error) {
     console.error("🎤 Voice transcription failed:", error);
     res.status(500).json({ success: false, message: error.message });
   }
 };
module.exports = {
  transcribeVoice,
};