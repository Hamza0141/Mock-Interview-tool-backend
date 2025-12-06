const express = require("express");
// Call the router method from express to create the router
const router = express.Router();
// Import the login controller
const userController = require("../controllers/user.controller");
const userVerify = require("../services/user.Service");
const  {verifyToken}  = require ( "../middlewares/auth");
// Create a route to handle the login request on post
router.get("/api/user/me", verifyToken, userController.getMe);
router.post("/api/user/verify-email", userVerify.verifyEmail);
router.post("/api/user/sendOTP", userController.sendUserOtp);
router.post("/api/user/verify-otp", userController.verifyOtp);
router.post("/api/user/create", userController.createUser);
router.get(
  "/api/user/getuserbyId",
  verifyToken,
  userController.getIUserByUserId
);
router.post(
  "/api/user/getUserByEmail",
  verifyToken,
  userController.getUserWithEmail
);
router.post(
  "/api/user/passwordchange",
  verifyToken,
  userController.changePassword
);
router.put("/api/user/update", verifyToken, userController.updateUserInfo);

router.get("/api/user/credits", verifyToken, userController.getCreditSummary);
router.post(
  "/api/user/credits/payment-intent",
  verifyToken,
  userController.createCreditPaymentIntent
);
router.get(
  "/api/user/credits/transaction-status/:payment_intent_id",
  verifyToken, 
  userController.getCreditTransactionStatus
);



module.exports = router;