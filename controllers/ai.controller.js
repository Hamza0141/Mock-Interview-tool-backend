const aiService = require("../services/ai.service");
// const questions = require("./questions.json");
const answer = require("./answer.json")

async function evaluateResponses(req, res) {
  try {
    const inputData = req.body;

    if (!inputData || !inputData.asked_questions) {
      return res.status(400).json({
        success: false,
        message: "Invalid input: missing asked_questions or session data.",
      });
    }

    // const result = await aiService.evaluateWithAI(inputData);
        const result = await answer;

    if (result.error) {
      return res.status(500).json({
        success: false,
        message: result.error.message,
      });
    }

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Evaluation error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
}

module.exports = { evaluateResponses };
