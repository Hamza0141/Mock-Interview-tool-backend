// controllers/feedback.controller.js
const feedbackService = require("../services/feedback.service");

function isValidRating(val) {
  const n = Number(val);
  return Number.isInteger(n) && n >= 1 && n <= 5;
}

async function createFeedback(req, res) {
  try {
    const profile_id = req.user?.profile_id;
    if (!profile_id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { q1_rating, q2_rating, q3_rating, q4_rating, comment } = req.body;

    if (
      !isValidRating(q1_rating) ||
      !isValidRating(q2_rating) ||
      !isValidRating(q3_rating) ||
      !isValidRating(q4_rating)
    ) {
      return res.status(400).json({
        success: false,
        message: "All 4 ratings are required and must be between 1 and 5.",
      });
    }

    const feedback = await feedbackService.createFeedback({
      profile_id,
      q1: Number(q1_rating),
      q2: Number(q2_rating),
      q3: Number(q3_rating),
      q4: Number(q4_rating),
      comment: comment?.trim() || null,
    });

    return res.json({
      success: true,
      message: "Thank you for your feedback!",
      data: feedback,
    });
  } catch (err) {
    console.error("createFeedback error:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to submit feedback.",
    });
  }
}

async function getMyFeedback(req, res) {
  try {
    const profile_id = req.user?.profile_id;
    if (!profile_id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const rows = await feedbackService.getFeedbackForUser(profile_id);

    return res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    console.error("getMyFeedback error:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to load feedback.",
    });
  }
}

module.exports = {
  createFeedback,
  getMyFeedback,
};
