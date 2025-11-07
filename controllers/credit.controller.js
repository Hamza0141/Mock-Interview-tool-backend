const creditService = require("../services/credit.service");

async function transferCreditBalance(req, res) {
  try {
    console.log(req.user.user_email);
     const sender_id = req.user.profile_id;
    const { receiver_email, amount } = req.body;
    
    console.log(sender_id, receiver_email, amount);
    // Basic validation
    if (!sender_id || !receiver_email || !amount) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields (sender_id, receiver_email, amount)",
      });
    }

    const result = await creditService.transferCredit(
      sender_id,
      receiver_email,
      parseFloat(amount)
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json({
      success: true,
      message: "Credit transferred successfully",
      data: result.data,
    });
  } catch (error) {
    console.error("Transfer Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
}
async function transferRefundBalance(req, res) {
  try {
    const { receiver_email, amount, description } = req.body;

    // Basic validation
    if (!receiver_email || !amount) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields (amount, receiver_email )",
      });
    }

    const result = await creditService.refundCredit(
      receiver_email,
      parseFloat(amount),
      description
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json({
      success: true,
      message: "Credit transferred successfully",
      data: result.data,
    });
  } catch (error) {
    console.error("Transfer Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
}

module.exports = { transferCreditBalance, transferRefundBalance };
