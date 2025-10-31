const Stripe = require("stripe");
const conn = require("../config/db.config");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Create Stripe checkout session and log pending purchase
 */
async function createCheckoutSession(profile_id, amount, bought_credit, email) {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: email,
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${bought_credit} Credits`,
              description: "Credit purchase for mock interview practice",
            },
            unit_amount: Math.round(amount * 100), // Stripe uses cents
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/payment-cancelled`,
      metadata: {
        profile_id,
        bought_credit,
      },
    });

    // Record as pending in DB
    await conn.query(
      `INSERT INTO purchases (purchases_record, transaction_id, profile_id, amount, bought_credit, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        "stripe_checkout",
        session.id,
        profile_id,
        amount,
        bought_credit,
        "pending",
      ]
    );

    return { success: true, url: session.url };
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return { success: false, message: error.message };
  }
}

module.exports = { createCheckoutSession };
