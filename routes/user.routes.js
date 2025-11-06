const express = require("express");
// Call the router method from express to create the router
const router = express.Router();
// Import the login controller
const userAccount = require("../controllers/user.controller");
const userVerify = require("../services/user.Service");
const  {verifyToken}  = require ( "../middlewares/auth");
// Create a route to handle the login request on post

router.post("/api/verify-email", userVerify.verifyEmail);
router.post("/api/user/create", userAccount.createUser);
router.get("/api/user/getuserbyId", verifyToken, userAccount.getIUserByUserId);
router.post("/api/user/passwordchange", verifyToken ,userAccount.changePassword);



module.exports = router;