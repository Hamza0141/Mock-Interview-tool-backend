const conn = require("../config/db.config");
const evaluateWithAI = require("./ai.service");

async function evaluateUserResponse() {
  evaluateWithAI.evaluateWithAI();
}

async function AddAIFeedback() {

}

module.exports = {
  evaluateUserResponse,
  AddAIFeedback,
};
