const express = require("express");
// Call the router method from express to create the router
const router = express.Router();


const authRouts= require("./auth.routes")
router.use(authRouts);





module.exports = router; 