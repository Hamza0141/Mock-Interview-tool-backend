const conn = require("../config/db.config");
const stripe = require("../config/stripe");
const userService = require("./user.Service");

async function getCreditPackById(packId) {
  const [rows] = await conn.query(
    "SELECT * FROM credit_packs WHERE id = ? LIMIT 1",
    [packId]
  );
  return rows[0] || null;
}

async function ensureStripeCustomer(user) {
  if (user.stripe_customer_id) {
    return user.stripe_customer_id;
  }

  const customer = await stripe.customers.create({
    email: user.user_email,
    name: `${user.first_name || ""} ${user.last_name || ""}`.trim(),
    metadata: { profile_id: user.profile_id },
  });

  await conn.query(
    "UPDATE users SET stripe_customer_id = ? WHERE profile_id = ?",
    [customer.id, user.profile_id]
  );

  return customer.id;
}

// Creates a payment intent for a credit pack and records a pending transaction.

async function createCreditPurchaseIntent({ profileId, packId }) {
  const user = await userService.getUserById(profileId);
  if (!user) throw new Error("User not found");

  const pack = await getCreditPackById(packId);
  if (!pack) throw new Error("Credit pack not found");

  const amountCents = pack.price_cents;
  if (!amountCents || amountCents < 50) {
    throw new Error(
      `Invalid pack price_cents=${amountCents}. Must be at least 50.`
    );
  }

  const customerId = await ensureStripeCustomer(user);
  const currency = "usd";
  const description = `${pack.name} - ${pack.credits} credits`;

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency,
    customer: customerId,
    description,
    metadata: {
      profile_id: user.profile_id,
      pack_id: String(pack.id),
      credits_to_add: String(pack.credits),
      type: "credit_purchase",
    },
    automatic_payment_methods: { enabled: true },
  });

  const amountDecimal = (amountCents / 100).toFixed(2);

  await conn.query(
    `INSERT INTO credit_transactions 
      ( stripe_payment_intent_id, profile_id, amount, bought_credit, currency, status)
     VALUES ( ?, ?, ?, ?, ?, 'pending')`,
    [
      paymentIntent.id,
      user.profile_id,
      amountDecimal,
      pack.credits,
      currency.toUpperCase(),
    ]
  );

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  };
}
module.exports = {
  createCreditPurchaseIntent,
};
