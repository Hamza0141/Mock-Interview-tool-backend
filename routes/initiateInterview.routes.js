const express = require("express");
const router = express.Router();
const initiateInterview = require("../controllers/initiateInterview.controller");
router.post("/api/user/startInterview", initiateInterview.startInterview);
module.exports = router;
