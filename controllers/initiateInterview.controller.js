const createInterview = require("../services/initiateInterview.service");
const prepareQuestions = require("../services/ai.service");
const questions = require("./questions.json");
const { saveGeneratedQuestions } = require("../services/userQuestions.service");

async function startInterview(req, res) {
  try {
    //  Create interview session
     const profile_id = req.user.profile_id;
    const { first_name, job_title, job_description, difficulty } =
      req.body;

    const result = await createInterview.createInterview(
    
      profile_id,
      job_title,
      job_description,
      difficulty
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    const session_id = result.interview_id;

    //  Generate AI-based interview questions
    const questions = await prepareQuestions.generateInterviewQuestions(
         first_name,
          job_title,
          job_description,
          difficulty
        );

        //  Save questions into DB
        await saveGeneratedQuestions(
          profile_id,
          session_id,
          job_title,
          questions.data
        );

    res.status(200).json({
      success: true,
      interview_id: session_id,
      questions: questions.data,
    });
  } catch (error) {
    console.error("startInterview error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
}

module.exports = { startInterview };
