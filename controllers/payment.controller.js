const PaymentService = require("../services/payment.service");

/**
 * Controller: Create checkout session
 */
async function createCheckoutSession(req, res) {
  try {
    const { profile_id, amount, bought_credit, email } = req.body;

    if (!profile_id || !amount || !bought_credit || !email) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const result = await PaymentService.createCheckoutSession(
      profile_id,
      amount,
      bought_credit,
      email
    );

    if (!result.success)
      return res.status(500).json({ success: false, message: result.message });

    res.status(200).json({
      success: true,
      message: "Stripe checkout session created",
      sessionUrl: result.url,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating payment session",
    });
  }
}

module.exports = { createCheckoutSession };
