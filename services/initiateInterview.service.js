const conn = require("../config/db.config");
const crypto = require("crypto");
const openai = require("../config/openai");

async function createInterview(
  profile_id,
  job_title,
  job_description,
  difficulty 
) {
  try {
    // 1️ Check if user exists and has available credits or free trial
    const [rows] = await conn.query(
      "SELECT credit_balance, free_trial FROM users WHERE profile_id = ?",
      [profile_id]
    );

    if (rows.length === 0) {
      throw new Error("User not found");
    }

    const user = rows[0];

    if (user.credit_balance <= 0 && user.free_trial <= 0) {
      throw new Error("No available credit or free trial");
    }

    //  Generate unique interview_id
    const interview_id = crypto.randomBytes(8).toString("hex");

    //  Create new interview session
    const [result] = await conn.query(
      `INSERT INTO interview_sessions 
        (interview_id, user_profile_id, job_title, job_description, difficulty)
        VALUES (?, ?, ?, ?, ?)`,
      [interview_id, profile_id, job_title, job_description, difficulty]
    );

    if (result.affectedRows !== 1) {
      throw new Error("Failed to create interview session");
    }

    //  If using free trial, mark it as used (optional)
    if (user.free_trial > 0) {
      await conn.query("UPDATE users SET free_trial = 0 WHERE profile_id = ?", [
        profile_id,
      ]);
    } else {
      // Or deduct credit if not using free trial
      await conn.query(
        "UPDATE users SET credit_balance = credit_balance - 1 WHERE profile_id = ?",
        [profile_id]
      );
    }

    //  Return success JSON
    return {
      success: true,
      message: "Interview session created successfully",
      interview_id,
    };
  } catch (err) {
    console.error("❌ Error creating interview session:", err.message);
    return {
      success: false,
      message: err.message,
    };
  }
}


async function generateInterviewQuestions(
  first_name,
  jobTitle,
  jobDescription,
  difficulty
) {
  try {
    const prompt = `
      You are an expert HR interviewer.
      Generate 10 thoughtful, realistic interview questions for a job seeker applying for the position of "${jobTitle}".
      
      Base the questions on this description: "${jobDescription}".
      with difficulty of: "${difficulty}".
      make the first question " ${first_name},Tell me about yourself" and the rest is half behavioral and half technical(if the job is applicable).
      Format the response in JSON like this:
      {
  "data": [
    {"id": 1, "question": "..."},
    {"id": 2, "question": "..."},
    ...
  ]
}
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-5-nano",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    return JSON.parse(content); // Return parsed JSON
  } catch (error) {
    console.error("Error generating interview questions:", error.message);
    throw new Error("Failed to generate interview questions");
  }
}

async function saveGeneratedQuestions(
  user_profile_id,
  session_id,
  job_role,
  questions
) {
  try {
    if (!questions || !Array.isArray(questions)) {
      throw new Error("Invalid question format");
    }

    const insertQuery = `
      INSERT INTO asked_questions (id, user_profile_id, session_id, job_role, question_text)
      VALUES (?, ?, ?, ?, ?)
    `;

    for (const q of questions) {
      await conn.query(insertQuery, [
        q.id,
        user_profile_id,
        session_id,
        job_role,
        q.question,
      ]);
    }

    console.log(
      ` ${questions.length} questions saved for session ${session_id}`
    );
    return { success: true, message: "Questions saved successfully" };
  } catch (error) {
    console.error(" Error saving generated questions:", error.message);
    return { success: false, message: error.message };
  }
}


module.exports = {
  createInterview,
  generateInterviewQuestions,
  saveGeneratedQuestions,
};

