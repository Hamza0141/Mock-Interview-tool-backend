
const evaluator = require("../services/evaluateInterview.service");
// const aiFeedback = require("./answer.json");

// async function evaluateAndAddFeedback(req, res) {
//   try {
//     const profile_id = req.user.profile_id
//     const { first_name, session_id, asked_questions } = req.body;
//       const inputData = req.body;
//     console.log("evaluation");
//     console.log(req.body);
//     if (
//       !session_id ||
//       !Array.isArray(asked_questions) ||
//       asked_questions.length === 0
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Missing or invalid session_id / responses data",
//       });
//     }

//     // 1️⃣ Insert user responses first
//     const result = await evaluator.insertUserResponses(
//       session_id,
//       asked_questions
//     );

//     if (!result.success) {
//       return res.status(207).json({
//         success: false,
//         message: "Some responses failed to insert",
//         data: result,
//       });
//     }

//     // 2️⃣ Evaluate all questions together
//     const aiFeedback = await evaluator.evaluateWithAI({
//       inputData,
//     });
// //  const aiFeedback = await answer
//    console.log(aiFeedback);

//     // 3️⃣ Insert the entire AI feedback JSON in DB
// const insertResult = await evaluator.insertAiFeedback(
//   profile_id,
//   session_id,
//   aiFeedback.question_id,
//   aiFeedback.user_response_id,
//   aiFeedback,
//   "text"
// );

//     if (!insertResult.success) {
//       return res.status(500).json({
//         success: false,
//         message: "Failed to insert AI feedback into database",
//         error: insertResult.error,
//       });
//     }

//     // 4️⃣ Respond with the clean JSON you want
//     res.status(201).json({
//       success: true,
//       message: "AI feedback evaluated and stored successfully",
//       feedback_count: aiFeedback.evaluations?.length || 0,
//       ...aiFeedback, // Spread out the entire AI feedback object
//     });
//   } catch (error) {
//     console.error("Error during evaluation:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//       error: error.message,
//     });
//   }
// }

async function startEvaluation(req, res) {
  try {
    const profile_id = req.user.profile_id;
    const { first_name, session_id, asked_questions } = req.body;
    const inputData = req.body;

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

    // 1️⃣ insert user responses
    const result = await evaluator.insertUserResponses(
      session_id,
      asked_questions
    );

    if (!result.inserted) {
      return res.status(400).json({
        success: false,
        message: "Failed to store any responses",
        data: result,
      });
    }

    // 2️⃣ fire-and-forget AI evaluation in background
    setImmediate(async () => {
      try {
        const aiFeedback = await evaluator.evaluateWithAI(inputData);
        if (aiFeedback.error) {
          console.error(
            "AI evaluation error for session",
            session_id,
            aiFeedback.error
          );
          return;
        }

        const insertResult = await evaluator.insertAiFeedback(
          profile_id,
          session_id,
          null,
          null,
          aiFeedback,
          "text"
        );

        if (!insertResult.success) {
          console.error("❌ Failed to insert AI feedback:", insertResult.error);
        }
      } catch (err) {
        console.error("❌ Background evaluation failed:", err);
      }
    });

    // 3️⃣ quick response to client
    return res.json({
      success: true,
      status: "pending",
      message: "Evaluation started. You will be notified when it's ready.",
    });
  } catch (error) {
    console.error("Error starting evaluation:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error while starting evaluation",
      error: error.message,
    });
  }
}

/**
 * NEW: poll current evaluation status
 * GET /api/ai/evaluation-status/:sessionId
 */
async function getEvaluationStatus(req, res) {
  try {
    const profile_id = req.user.profile_id;
    const { sessionId } = req.params;

    const result = await evaluator.getEvaluationBySession(
      sessionId,
      profile_id
    );

    if (!result.found) {
      return res.status(404).json({
        success: false,
        status: "not_found",
        message: "Session not found",
      });
    }

    if (!result.complete) {
      return res.json({
        success: true,
        status: "pending",
      });
    }

    return res.json({
      success: true,
      status: "complete",
      data: result.data,
    });
  } catch (error) {
    console.error("getEvaluationStatus error:", error);
    return res.status(500).json({
      success: false,
      status: "error",
      message: "Failed to fetch evaluation status",
      error: error.message,
    });
  }
}

module.exports = {
  // evaluateAndAddFeedback,
  startEvaluation,
  getEvaluationStatus,
};





