const express = require("express");
// Call the router method from express to create the router
const router = express.Router();
// Import the login controller
const creditPackController = require("../controllers/credit.controller");
const { verifyToken } = require("../middlewares/auth");

router.post(
  "/api/user/transfer",
  verifyToken,
  creditPackController.transferCreditBalance
);
router.post(
  "/api/admin/refund",
  verifyToken,
  creditPackController.transferRefundBalance
);

router.get("/api/credit-packs", creditPackController.getCreditPacks);
router.post("/api/admin/credit-packs", creditPackController.createCreditPack);
router.put(
  "/api/admin/credit-packs/:id",
  creditPackController.updateCreditPack
);
router.delete(
  "/api/admin/credit-packs/:id",
  creditPackController.deleteCreditPack
);
router.get(
  "/api/user/credits/summary/:profileId",
  creditPackController.getCreditSummary
);

module.exports = router;