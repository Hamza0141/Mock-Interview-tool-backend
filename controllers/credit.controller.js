const creditService = require("../services/credit.service");

async function transferCreditBalance(req, res) {
  try {
    
    const { sender_id, receiver_id, amount } = req.body;
    
    console.log(sender_id, receiver_id, amount);
    // Basic validation
    if (!sender_id || !receiver_id || !amount) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields (sender_id, receiver_id, amount)",
      });
    }

    const result = await creditService.transferCredit(
      sender_id,
      receiver_id,
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
    const { receiver_id, amount, description } = req.body;

    console.log(receiver_id, amount, description);
    // Basic validation
    if (!receiver_id || !amount ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields (amount, receiver_id )",
      });
    }

    const result = await creditService.refundCredit(
  
      receiver_id,
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
