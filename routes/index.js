const express = require("express");
// Call the router method from express to create the router
const router = express.Router();


const authRouts= require("./auth.routes")
router.use(authRouts);

const userRouts= require("./user.routes")
router.use(userRouts);

const interview = require("./initiateInterview.routes");
router.use(interview);

const evaluateInterview = require("./evaluateInterview.routes");
router.use(evaluateInterview);

const credit = require("./credit.route");
router.use(credit);

const speech = require("./speech.route");
router.use(speech);


const aiRoutes= require("./ai.route")
router.use(aiRoutes);


module.exports = router; 