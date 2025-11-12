const reportService = require("../services/report.service");

async function getUserPerformanceReport(req, res) {
  try {
    const { profile_id } = req.params;

    if (!profile_id)
      return res
        .status(400)
        .json({ success: false, message: "Missing profile_id" });

    const reportData = await reportService.getUserReport(profile_id);

    res.json({
      success: true,
      data: reportData,
    });
  } catch (err) {
    console.error("❌ Error generating report:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

module.exports = {
  getUserPerformanceReport,
};
