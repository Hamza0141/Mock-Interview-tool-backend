const SpeechService = require("../services/speech.service");
// const ai_feedback = require("./speechReturn.json");

async function handleSpeechSubmission(req, res) {
  try {
    const profile_id = req.user.profile_id;
    const { speech_title, speech_goal, speech_text } = req.body;

    if (!profile_id || !speech_title || !speech_goal || !speech_text)
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });

    // Validate before processing
    const validationResult = await SpeechService.validation(profile_id);
    if (!validationResult.success) {
      return res.status(400).json(validationResult);
    }
    // 1️⃣ Save speech
    const { success, speech_id, message } = await SpeechService.submitSpeech(
      profile_id,
      speech_title,
      speech_goal,
      speech_text
    );

    if (!success) return res.status(500).json({ success: false, message });
    const speechData = req.body;
    // 2️⃣ Evaluate speech via AI
    const ai_feedback = await SpeechService.evaluateSpeech({
      speechData,
    });

    // 3️⃣ Save AI feedback
    await SpeechService.saveFeedback(speech_id, speech_title, ai_feedback);

    res.status(201).json({
      success: true,
      message: "Speech evaluated successfully",
      data: { speech_id, ai_feedback },
    });
  } catch (error) {
    console.error("Error handling speech submission:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

async function getSpeechFeedById(req, res) {
 try {
    const { speech_id } = req.params;


    const data = await SpeechService.getSpeechWithFeedback(speech_id);
    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Speech not found",
      });
    }

    return res.json({ success: true, data });
  } catch (err) {
    console.error("❌ Speech evaluation error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

module.exports = { handleSpeechSubmission, getSpeechFeedById };
