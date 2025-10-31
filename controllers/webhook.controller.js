const express = require("express");
const bodyParser = require("body-parser");
const Stripe = require("stripe");
const conn = require("../config/db.config");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

const router = express.Router();

//  Must use raw body for Stripe webhook
router.post(
  "/stripe-webhook",
  bodyParser.raw({ type: "application/json" }),
  async (req, res) => {
    let event;

    try {
      const sig = req.headers["stripe-signature"];
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error("⚠️ Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const { id: transaction_id, metadata } = session;
      const { profile_id, bought_credit } = metadata;

      try {
        // Update purchase record
        await conn.query(
          "UPDATE purchases SET status = 'completed' WHERE transaction_id = ?",
          [transaction_id]
        );

        // Add credits to user
        await conn.query(
          "UPDATE users SET credit_balance = credit_balance + ? WHERE profile_id = ?",
          [bought_credit, profile_id]
        );

        console.log(`✅ Payment confirmed for user ${profile_id}`);
      } catch (error) {
        console.error("❌ Error updating DB after webhook:", error);
      }
    }

    res.json({ received: true });
  }
);

module.exports = router;
