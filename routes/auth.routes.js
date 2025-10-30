// Import the express module
const express = require("express");
// Call the router method from express to create the router
const router = express.Router();
// Import the login controller
const manageAccount = require("../controllers/auth.controller");
router.post("/api/user/login", manageAccount.logIn);
router.post("/api/user/sendresetotp", manageAccount.sendResetOTP);
router.post("/api/user/reset-password", manageAccount.resetPassword);
// Export the router
module.exports = router;