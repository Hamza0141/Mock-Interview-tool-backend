const Stripe = require("stripe");

const stripe = Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-01-27.acacia", // current version you have in Stripe
});

module.exports = stripe;
