const express = require("express");
// Call the router method from express to create the router
const router = express.Router();
// Import the login controller
const userAccount = require("../controllers/user.controller");
const userVerify = require("../services/user.Service");
// Create a route to handle the login request on post

router.get("/api/verify-email", userVerify.verifyEmail);
router.post("/api/user/create", userAccount.createUser);
router.get("/api/user/getuserbyId", userAccount.getIUserByUserId);
router.post("/api/user/passwordchange", userAccount.changePassword);
router.post("/api/user/buycredit", userAccount.buyCredit);

module.exports = router;