const creditService = require("../services/credit.service");

async function transferCreditBalance(req, res) {
  try {

      const {profile_id} = req.user
      const senderEmail = req.user.user_email;
    const { receiver_email, amount } = req.body;
    const senderFirstName = req.user.first_name; 
    
    console.log(profile_id, receiver_email, amount);
    // Basic validation
        if (receiver_email == senderEmail) {
          return res.status(400).json({
            success: false,
            message: "you can't transfer for your self",
          });
        } 

    if (!profile_id || !receiver_email || !amount) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields (profile_id, receiver_email, amount)",
      });
    }

    const result = await creditService.transferCredit(
      senderFirstName,
      profile_id,
      receiver_email,
      senderEmail,
      parseFloat(amount)
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json({
      success: true,
      message: "Credit transferred successfully",
      data: result.data,
    });
  } catch (error) {
    console.error("Transfer Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
}
async function transferRefundBalance(req, res) {
  try {
    const { receiver_email, amount, description } = req.body;

    // Basic validation
    if (!receiver_email || !amount) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields (amount, receiver_email )",
      });
    }

    const result = await creditService.refundCredit(
      receiver_email,
      parseFloat(amount),
      description
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json({
      success: true,
      message: "Credit transferred successfully",
      data: result.data,
    });
  } catch (error) {
    console.error("Transfer Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
}

async function getCreditPacks(req, res) {
  try {
    const packs = await creditService.getAllCreditPacks();
    // 👇 Always return the same shape
    res.json({ success: true, data: packs });
  } catch (err) {
    console.error("getCreditPacks error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch packs" });
  }
}
// POST /api/credit-packs
async function createCreditPack(req, res) {
  try {
    const { id, name, credits, price_cents } = req.body;

    if (!name || !credits || !price_cents) {
      return res.status(400).json({
        success: false,
        message: "name, credits, and price_cents are required",
      });
    }

    const pack = await creditService.createCreditPack({
      id,
      name,
      credits,
      price_cents,
    });

    res.status(201).json({ success: true, data: pack });
  } catch (err) {
    console.error("createCreditPack error:", err);
    res.status(500).json({ success: false, message: "Failed to create pack" });
  }
}

// PUT /api/credit-packs/:id
async function updateCreditPack(req, res) {
  try {
    const { id } = req.params;
    const { name, credits, price_cents } = req.body;

    if (!name || !credits || !price_cents) {
      return res.status(400).json({
        success: false,
        message: "name, credits, and price_cents are required",
      });
    }

    const updated = await creditService.updateCreditPack(id, {
      name,
      credits,
      price_cents,
    });

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Pack not found" });
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error("updateCreditPack error:", err);
    res.status(500).json({ success: false, message: "Failed to update pack" });
  }
}

// DELETE /api/credit-packs/:id
async function deleteCreditPack(req, res) {
  try {
    const { id } = req.params;
    const deleted = await creditService.deleteCreditPack(id);

    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Pack not found" });
    }

    res.json({ success: true, message: "Pack deleted" });
  } catch (err) {
    console.error("deleteCreditPack error:", err);
    res.status(500).json({ success: false, message: "Failed to delete pack" });
  }
}

// GET /api/credits/summary/:profileId
async function getCreditSummary(req, res) {
  try {
    const { profileId } = req.params;

    if (!profileId) {
      return res
        .status(400)
        .json({ success: false, message: "profileId is required" });
    }

    const summary = await creditService.getCreditSummary(profileId);
    res.json({ success: true, data: summary });
  } catch (err) {
    console.error("getCreditSummary error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch credit summary",
    });
  }
}


module.exports = {
  transferCreditBalance,
  transferRefundBalance,
  getCreditPacks,
  createCreditPack,
  updateCreditPack,
  deleteCreditPack,
  getCreditSummary,
};
