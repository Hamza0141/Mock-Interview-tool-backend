const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");

// POST /api/payments/create-checkout-session
router.post(
  "/api/payments/create-checkout-session",
  paymentController.createCheckoutSession
);

module.exports = router;
