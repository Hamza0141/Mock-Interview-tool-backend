const express = require("express");
// Call the router method from express to create the router
const router = express.Router();
// Import the login controller
const transferCredit = require("../controllers/credit.controller");
const { verifyToken } = require("../middlewares/auth");

router.post(
  "/api/user/transfer",
  verifyToken,transferCredit.transferCreditBalance
);
router.post("/api/user/refund",verifyToken, transferCredit.transferRefundBalance);

module.exports = router;