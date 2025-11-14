const express = require("express");
const stripe = require("../config/stripe");
const conn = require("../config/db.config");

const webhookApp = express();

// IMPORTANT: raw body ONLY for this route – no express.json() before this
webhookApp.post(
  "/api/stripe/webhook",
  express.raw({ type: "*/*" }),
  async (req, res) => {
    console.log("👉 Incoming Stripe webhook");

    const sig = req.headers["stripe-signature"];

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      console.log("✅ Webhook verified. Event type:", event.type);
    } catch (err) {
      console.error("⚠️  Webhook signature verification failed:", err.message);
      // Stripe will mark this delivery as "Failed"
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      // ✅ HANDLE SUCCESSFUL PAYMENTS (PI or charge)
      if (
        event.type === "payment_intent.succeeded" ||
        event.type === "charge.succeeded"
      ) {
        const obj = event.data.object;

        // Determine PaymentIntent ID based on event type
        const paymentIntentId =
          event.type === "payment_intent.succeeded"
            ? obj.id // PaymentIntent event
            : obj.payment_intent; // Charge event (obj is a Charge)

        // Metadata may be on the PI or the Charge; use what we have
        const metadata = obj.metadata || {};
        const metaCredits = parseInt(metadata.credits_to_add || "0", 10);

        console.log(
          "💳 Successful payment for PaymentIntent:",
          paymentIntentId,
          "metaCredits:",
          metaCredits
        );

        // Find the matching pending transaction
        const [rows] = await conn.query(
          `SELECT * FROM credit_transactions
           WHERE stripe_payment_intent_id = ? AND status = 'pending'
           LIMIT 1`,
          [paymentIntentId]
        );

        console.log("Found matching tx rows:", rows.length);

        if (rows.length === 0) {
          console.log(
            "No pending transaction found for PaymentIntent:",
            paymentIntentId
          );
          return res.json({ received: true });
        }

        const tx = rows[0];

        // Final credits to add: prefer metadata, fallback to DB value
        const credits = metaCredits || tx.bought_credit || 0;

        if (credits <= 0) {
          console.warn(
            "No credits to add for transaction ID",
            tx.id,
            "paymentIntent:",
            paymentIntentId
          );
          return res.json({ received: true });
        }

        console.log(
          `Updating user ${tx.profile_id}: +${credits} credits, marking tx ${tx.id} as completed`
        );

        // Update user balance
        await conn.query(
          `UPDATE users
           SET credit_balance = credit_balance + ?
           WHERE profile_id = ?`,
          [credits, tx.profile_id]
        );

        // Mark transaction completed
        await conn.query(
          `UPDATE credit_transactions
           SET status = 'completed'
           WHERE id = ?`,
          [tx.id]
        );

        console.log("✅ Credits updated successfully for", paymentIntentId);
      }

      // ❌ HANDLE FAILED PAYMENTS
      if (event.type === "payment_intent.payment_failed") {
        const obj = event.data.object;
        const paymentIntentId = obj.id;

        console.log("❌ payment_intent.payment_failed for", paymentIntentId);

        await conn.query(
          `UPDATE credit_transactions
           SET status = 'failed'
           WHERE stripe_payment_intent_id = ? AND status = 'pending'`,
          [paymentIntentId]
        );
      }

      // Always respond 2xx if we got here without throwing
      res.json({ received: true });
    } catch (err) {
      console.error("💥 Webhook handler error:", err);
      // Stripe will mark this as failed (500)
      res.status(500).send("Webhook handler error");
    }
  }
);

// Simple health check (safe to use json here)
webhookApp.get("/health", express.json(), (req, res) => {
  res.json({ status: "ok", service: "stripe-webhook" });
});

module.exports = webhookApp;
