const openai = require("../config/openai");

async function generateInterviewQuestions(
  first_name,
  jobTitle,
  jobDescription,
  difficulty
) {
  try {
    const prompt = `
      You are an expert HR interviewer.
      Generate 9 thoughtful, realistic interview questions for a job seeker applying for the position of "${jobTitle}".
      
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

async function evaluateWithAI(inputData) {
  try {
    const prompt = `
SYSTEM:
You are an expert interview assessor for technical roles. Always respond in strict JSON (no extra commentary, no markdown).
Validate the input and return results exactly following the JSON schema below.
If any input field is missing or invalid, return {"error":{"message":"<explanation>"}}.

USER:
Evaluate the provided interview session. Use the job context and user's responses to evaluate each asked question.
Produce evaluations per question and one Meta Evaluation (AI-generated summary) plus Behavioral Skill Tags.

Input JSON:
${JSON.stringify(inputData, null, 2)}


OUTPUT JSON SCHEMA:

  "evaluations": [
    {
      "question_id": integer,
      "scores": {
        "correctness": integer,
        "relevance": integer,
        "depth": integer,
        "clarity": integer
      },
      "overall_score": integer,
      "strengths": [string],
      "weaknesses": [string],
      "suggestions": string
    }
  ],
  "meta_evaluation": {
    "average_scores": {
      "correctness": number,
      "relevance": number,
      "depth": number,
      "clarity": number,
      "grammar": number,
      "overall": number
    },
    "summary": string
  },
  "behavioral_skill_tags": [string],
  "error": null
}

RULES:
1. Scores are 0–100 integers. Weighted overall = correctness(40%), depth(25%), clarity(15%), relevance(10%), grammar(10%).
2. Keep JSON valid and clean.
3. If unsure, return partial scores with explanation in suggestions.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5-nano",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const parsedResponse = JSON.parse(completion.choices[0].message.content);

    return parsedResponse;
  } catch (error) {
    console.error("AI Evaluation error:", error);
    return {
      error: { message: error.message || "Failed to generate evaluation" },
    };
  }
}

async function evaluateSpeech(speechData) {
  try {
    const prompt = `
SYSTEM:
You are an expert public speaking coach and communication specialist.
Always respond in strict JSON.

USER:
Evaluate the following speech. Provide specific, constructive feedback on structure, clarity, tone, pacing, emotional impact, and persuasiveness.

Input:
${JSON.stringify(speechData, null, 2)}

OUTPUT JSON SCHEMA:
{
  "scores": {
    "structure": number,
    "clarity": number,
    "tone": number,
    "engagement": number,
    "persuasiveness": number,
    "grammar": number,
    "overall": number
  },
  "strengths": [string],
  "weaknesses": [string],
  "suggestions": string,
  "summary": string
}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5-nano",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    return JSON.parse(completion.choices[0].message.content);
  } catch (error) {
    console.error("AI Speech Evaluation error:", error);
    return { error: error.message };
  }
}


module.exports = { generateInterviewQuestions, evaluateWithAI, evaluateSpeech };


      // "asked_question": string,
      // "user_response": string,