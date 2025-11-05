const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");
const { verifyToken } = require("../middlewares/auth");
// POST /api/payments/create-checkout-session
router.post(
  "/api/payments/create-checkout-session",verifyToken,
  paymentController.createCheckoutSession
);

module.exports = router;
