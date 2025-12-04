// webhook/stripeWebhook.js
const express = require("express");
const stripe = require("../config/stripe");
const conn = require("../config/db.config");
const notificationService = require("../services/notification.service");
const mailService = require("../middlewares/authMailgun"); // make sure this exports sendCreditReceiptEmail

function attachStripeWebhook(app) {
  app.post(
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
        console.error(
          "⚠️  Webhook signature verification failed:",
          err.message
        );
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      try {
        // ✅ HANDLE SUCCESSFUL PAYMENTS (PI or charge)
        if (
          event.type === "payment_intent.succeeded" ||
          event.type === "charge.succeeded"
        ) {
          const obj = event.data.object;

          const paymentIntentId =
            event.type === "payment_intent.succeeded"
              ? obj.id
              : obj.payment_intent;

          const metadata = obj.metadata || {};
          const metaCredits = parseInt(metadata.credits_to_add || "0", 10);

          console.log(
            "💳 Successful payment for PaymentIntent:",
            paymentIntentId,
            "metaCredits:",
            metaCredits
          );

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

          // update user credits
          await conn.query(
            `UPDATE users
             SET credit_balance = credit_balance + ?
             WHERE profile_id = ?`,
            [credits, tx.profile_id]
          );

          // mark transaction completed
          await conn.query(
            `UPDATE credit_transactions
             SET status = 'completed'
             WHERE id = ?`,
            [tx.id]
          );

          // create in-app notification
          await notificationService.createNotification({
            profile_id: tx.profile_id,
            type: "credit",
            title: "Credit Purchase Completed",
            body: `You successfully purchased ${credits} credits. Transaction ID: ${paymentIntentId}.`,
            entity_type: "credit_transaction",
            entity_id: paymentIntentId,
          });

          //  NOW fetch user + updated balance
          const [[user]] = await conn.query(
            `SELECT first_name, user_email, credit_balance
             FROM users
             WHERE profile_id = ?
             LIMIT 1`,
            [tx.profile_id]
          );
    console.log(user);
        console.log(tx);
          if (!user) {
            console.warn(
              "User not found when trying to send receipt email",
              tx.profile_id
            );
          } else if (typeof mailService.sendCreditReceiptEmail === "function") {
            // format createdAt string
            const createdAt =
              tx.created_at instanceof Date
                ? tx.created_at.toISOString().slice(0, 19).replace("T", " ")
                : new Date().toISOString().slice(0, 19).replace("T", " ");
                
const amountNumeric = Number(tx.amount);

            await mailService.sendCreditReceiptEmail({
              email: user.user_email,
              firstName: user.first_name,
              credits,
              amount: amountNumeric,
              currency: tx.currency,
              transactionId: tx.id,
              paymentIntentId,
              balanceAfter: user.credit_balance,
              createdAt,
            });

            console.log("📧 Receipt email sent for tx", tx.id);
          } else {
            console.warn(
              "sendCreditReceiptEmail is not a function on mailService"
            );
          }

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

        res.json({ received: true });
      } catch (err) {
        console.error("💥 Webhook handler error:", err);
        res.status(500).send("Webhook handler error");
      }
    }
  );
}

module.exports = attachStripeWebhook;
