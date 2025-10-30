const express = require("express");
// Call the router method from express to create the router
const router = express.Router();
// Import the login controller
const transferCredit = require("../controllers/credit.controller");

router.post("/api/user/transfer", transferCredit.transferCreditBalance);
router.post("/api/user/refund", transferCredit.transferRefundBalance);

module.exports = router;