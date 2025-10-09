// Import the express module
const express = require("express");
// Call the router method from express to create the router
const router = express.Router();
// Import the login controller
const createAccount = require("../controllers/auth.controller");
// Create a route to handle the login request on post
router.post("/api/user/create", createAccount.createUser);
// Export the router
module.exports = router;
