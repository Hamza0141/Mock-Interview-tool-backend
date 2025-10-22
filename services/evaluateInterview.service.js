const conn = require("../config/db.config");
const evaluateWithAI = require("./ai.service");

async function evaluateAndAddFeedback(req, res) {
  evaluateWithAI.evaluateWithAI();
}

module.exports = {
  evaluateAndAddFeedback,
};
