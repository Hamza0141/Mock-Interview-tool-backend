const express = require("express");
const router = express.Router();
const initiateInterview = require("../controllers/initiateInterview.controller");
const { verifyToken } = require("../middlewares/auth");
router.post(
  "/api/user/startInterview",
  verifyToken ,initiateInterview.startInterview
);
module.exports = router;
