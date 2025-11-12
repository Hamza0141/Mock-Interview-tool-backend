const express = require("express");
const router = express.Router();
const reportController = require("../controllers/report.controller");

// Unified report API (used by profile page & report page)
router.get(
  "/api/user/:profile_id/report",
  reportController.getUserPerformanceReport
);

module.exports = router;
