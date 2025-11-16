
const evaluator = require("../services/evaluateInterview.service");
// const aiFeedback = require("./answer.json");

async function evaluateAndAddFeedback(req, res) {
  try {
    const profile_id = req.user.profile_id
    const { first_name, session_id, asked_questions } = req.body;
      const inputData = req.body;
    console.log("evaluation");
    console.log(req.body);
    if (
      !session_id ||
      !Array.isArray(asked_questions) ||
      asked_questions.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing or invalid session_id / responses data",
      });
    }

    // 1️⃣ Insert user responses first
    const result = await evaluator.insertUserResponses(
      session_id,
      asked_questions
    );

    if (!result.success) {
      return res.status(207).json({
        success: false,
        message: "Some responses failed to insert",
        data: result,
      });
    }

    // 2️⃣ Evaluate all questions together
    const aiFeedback = await evaluator.evaluateWithAI({
      inputData,
    });
//  const aiFeedback = await answer
   console.log(aiFeedback);

    // 3️⃣ Insert the entire AI feedback JSON in DB
const insertResult = await evaluator.insertAiFeedback(
  profile_id,
  session_id,
  aiFeedback.question_id,
  aiFeedback.user_response_id,
  aiFeedback,
  "text"
);

    if (!insertResult.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to insert AI feedback into database",
        error: insertResult.error,
      });
    }

    // 4️⃣ Respond with the clean JSON you want
    res.status(201).json({
      success: true,
      message: "AI feedback evaluated and stored successfully",
      feedback_count: aiFeedback.evaluations?.length || 0,
      ...aiFeedback, // Spread out the entire AI feedback object
    });
  } catch (error) {
    console.error("Error during evaluation:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
}


module.exports = { evaluateAndAddFeedback };

