const  insertUserResponses  = require("../services/userResponse.service");

async function saveUserResponses(req, res) {
  try {
    const { session_id, asked_questions } = req.body;
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

    const result = await insertUserResponses.insertUserResponses(
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
    res.status(201).json({
      success: true,
      message: "User responses inserted successfully",
      inserted_count: result.inserted,
    });
  } catch (error) {
    console.error("Error saving user responses:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
}


module.exports = { saveUserResponses };
