
const userService = require("../services/user.Service");
const paymentService = require("../services/payment.service")
const bcrypt = require("bcrypt");
const {otpManager} = require("../utils/otpManager");
const { verifyOtpRecord } = require("../utils/verificationService");



async function getMe(req, res) {
  try {
    const { profile_id } = req.user || {};

    if (!profile_id) {
      return res.status(401).json({
        success: false,
        message: "Invalid token payload",
      });
    }

    const user = await userService.myInfo(profile_id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      data: user,
    });
  } catch (err) {
    console.error("getMe error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch current user",
    });
  }
}


async function createUser(req, res) {

  try {
    const { user_email } = req.body;

    // Check if email already exists
    const userExists = await userService.checkIfUserExists(user_email);
    if (userExists) {
      return res.status(400).json({
        error: "This email address is already associated with another account!",
      });
    }

    // Create new user
    const user = await userService.createUser(req.body);

    if (user) {
      return res.status(201).json({
        status: true,
        profile_id: user.profile_id,
        message: "User created successfully",
      });
    } else {
      return res.status(400).json({
        error: "Failed to create user",
      });
    }
  } catch (err) {
    console.error("Controller error:", err);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
}

async function getIUserByUserId(req, res) {
  try{
    // const { userid_id } = req.body;
    const userid_id= req.user.profile_id
    const userData = await userService.getUserById(userid_id);
    
    console.log(userData);
    if(!userData){
      return res.status(400).json({
        error: "account doesn't exist!",
      });
    }else{
      return res.status(201).json({
        userData,
      });
    }

  }
  catch(err){
console.log(err)
  }
}
async function getUserWithEmail(req, res) {
  try {
console.log(req.body);
    const user_email = req.body.user_email;
    const userData = await userService.getUserByEmail(user_email);

    if (!userData) {
      return res.status(400).json({
        error: "account doesn't exist!",
      });
    } 
    
    const userinfo = {
      profile_id: userData.profile_id,
      first_name: userData.first_name,
      last_name: userData.last_name,
      user_email: userData.user_email,
    };
    
      return res.status(201).json({
        userinfo,
      });
    
  } catch (err) {
    console.log(err);
  }
}
async function changePassword(req, res) {
  try {
    console.log(req.body);
    const { userEmail, current_password, new_password, reEnterpassword } =
      req.body;
    //  Validate required fields
    if (!userEmail || !current_password || !new_password || !reEnterpassword) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    //  Check if new passwords match
    if (new_password !== reEnterpassword) {
      return res
        .status(400)
        .json({ success: false, message: "Passwords do not match" });
    }

    //  Get user by email
    const user = await userService.getUserByEmail(userEmail);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
console.log(user.password_hash);
    //  Compare current password
    const isMatch = await bcrypt.compare(current_password, user.password_hash);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Current password is incorrect" });
    }

    //  Hash and update new password
    const hashedPassword = await bcrypt.hash(new_password, 10);
    const result = await userService.updateUserPassword(
      userEmail,
      hashedPassword
    );

    if (!result.success) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to update password" });
    }

    res
      .status(200)
      .json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}
async function updateUserInfo(req, res) {
  try {
         const profile_id = req.user.profile_id;
    const { first_name, last_name, profession, profile_url } = req.body;

    if (!profile_id) {
      return res.status(400).json({
        success: false,
        message: "Missing profile_id",
      });
    }

    // Pass only fields that are allowed to update
    const updateData = { first_name, last_name, profession, profile_url };

    const updatedUser = await userService.updateUser(updateData, profile_id);

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found or no changes made",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("❌ Error in updateUserInfo:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error while updating user info",
    });
  }
}
async function sendUserOtp(req, res) {
  try {
    const { user_email } = req.body;
    const note = "Verify Your Email";
    if (!user_email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }
    const result = await otpManager(user_email, note);
    return res.status(200).json({
      success: true,
      message: "Verification code sent to your email.",
    });
  } catch (error) {
    console.error("❌ Error sending OTP:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error while sending OTP.",
    });
  }
}

async function verifyOtp(req, res) {
  try {
    const { user_email, otp } = req.body;

    if (!user_email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and code are required.",
      });
    }

    const result = await verifyOtpRecord({ user_email, otp });

    if (!result.ok) {
      return res.status(400).json({
        success: false,
        message: result.message || "Invalid or expired code.",
      });
    }

    // At this point verification row is updated (verified + is_used = true)
    return res.status(200).json({
      success: true,
      message: "Code verified successfully.",
      data: { verification: result.record },
    });
  } catch (error) {
    console.error("❌ Error verifying OTP:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error while verifying code.",
    });
  }
}


async function getCreditSummary (req, res)  {
  try {
    const profileId = req.user?.profile_id || req.query.profile_id;

    if (!profileId) {
      return res
        .status(400)
        .json({ success: false, message: "profile_id is required" });
    }

    const summary = await userService.getCreditSummary(profileId);

    return res.json({ success: true, data: summary });
  } catch (err) {
    console.error("getCreditSummary error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

async function createCreditPaymentIntent  (req, res) {
  try {

    const profileId = req.user?.profile_id || req.body.profile_id;
    const { pack_id } = req.body;
    if (!profileId || !pack_id) {
      return res.status(400).json({
        success: false,
        message: "profile_id and pack_id are required",
      });
    }

    const result = await paymentService.createCreditPurchaseIntent({
      profileId,
      packId: pack_id,
    });
    
    console.log(result);
    return res.json({
      success: true,
      clientSecret: result.clientSecret,
      paymentIntentId: result.paymentIntentId,
    });
  } catch (err) {
    console.error("createCreditPaymentIntent error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};


async function getCreditTransactionStatus(req, res) {
  try {
    const profileId = req.user?.profile_id || req.query.profile_id;
    const { payment_intent_id } = req.params;

    if (!profileId || !payment_intent_id) {
      return res.status(400).json({
        success: false,
        message: "profile_id and payment_intent_id are required",
      });
    }

    const status = await userService.getTransactionStatusByPaymentIntentId(
      payment_intent_id,
      profileId
    );

    if (!status) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    return res.json({
      success: true,
      status, // 'pending' | 'completed' | 'failed'
    });
  } catch (err) {
    console.error("getCreditTransactionStatus error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error checking transaction" });
  }
}


module.exports = {
  getMe,
  createUser,
  getIUserByUserId,
  changePassword,
  updateUserInfo,
  getUserWithEmail,
  getCreditSummary,
  sendUserOtp,
  verifyOtp,
  createCreditPaymentIntent,
  getCreditTransactionStatus,
};
