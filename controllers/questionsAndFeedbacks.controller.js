// api/controllers/questionsAndFeedbacks.controller.js
const  getQuestionsById = require("../services/questionsAndFeedbacks.service.js");

 async function getQuestions(req, res) {
  try {
    const { interview_id } = req.params;

    if (!interview_id) {
      return res.status(400).json({
        success: false,
        message: "Interview session ID is required.",
      });
    }

    const result = await getQuestionsById.getQuestionsBySessionId(interview_id);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (err) {
    console.error("❌ Controller error:", err.message);
    res.status(500).json({
      success: false,
      message: "Server error fetching questions.",
    });
  }
}
 async function getAiFeedback(req, res) {
   try {
     const { interview_id } = req.params;

     if (!interview_id) {
       return res.status(400).json({
         success: false,
         message: "Interview session ID is required.",
       });
     }

     const result = await getQuestionsById.getFeedbackBySessionId(interview_id);

     if (!result.success) {
       return res.status(404).json(result);
     }

     res.json(result);
   } catch (err) {
     console.error("❌ Controller error:", err.message);
     res.status(500).json({
       success: false,
       message: "Server error fetching questions.",
     });
   }
 }
module.exports = {
  getQuestions,
  getAiFeedback,
};