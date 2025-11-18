const conn = require("../config/db.config");
const getUserByEmail = require("../services/user.Service");
const bcrypt = require("bcrypt");
const {otpManager} = require("../utils/otpManager");
const { verifyOtpRecord } = require("../utils/verificationService")
// import notification
const notificationService = require("./notification.service");

async function logIn(userData) {
  try {
  
    const user = await getUserByEmail.getUserByEmail(userData.user_email);
    // Handle user not found
    if (!user) {
      return {
        status: "fail",
        message: "User does not exist",
      };
    }

    // Check if user verified
    if (user.is_verified === 0) {
      return {
        status: "fail",
        message: "pleas verify your account",
      };
    }
    // Check if user account is active
    if (user.is_active === 0) {
      return {
        status: "fail",
        message: "pleas contact admin to activate your account",
      };
    }

    // Compare password
    const passwordMatch = await bcrypt.compare(
      userData.user_password,
      user.password_hash
    );



    // Check if password is correct
    if (!passwordMatch) {
      return {
        status: "fail",
        message: "Incorrect password",
      };
    }

    // Success
    return {
      status: "success",
      data: user,
    };
  } catch (error) {
    console.error("Login error:", error);
    return {
      status: "fail",
      message: "Internal server error",
    };
  }
}

async function requestPasswordReset(email) {
  try {
    // Check if user exists
    const [rows] = await conn.query(
      "SELECT profile_id FROM users WHERE user_email = ?",
      [email]
    );
    if (rows.length === 0) {
      return { status: "fail", message: "Email not found" };
    }
const note = "Password Reset Code "
    // Send OTP
     await otpManager(email, note);

    return {
      status: "success",
      message: "A one-time password (OTP) has been sent to your email.",
    };
  } catch (error) {
    console.error("Error in requestPasswordReset:", error);
    return { status: "fail", message: "Internal server error" };
  }
}

async function resetPasswordWithOTP(user_email, otp_code, newPassword) {
  try {
    console.log("🔐 resetPasswordWithOTP for:", user_email);

    // 1️⃣ Verify OTP
    const { ok, message } = await verifyOtpRecord({
      user_email,
      otp: otp_code,
    });

    if (!ok) {
      console.warn("OTP verification failed:", message);
      return {
        status: "fail",
        message: message || "Invalid or expired code",
      };
    }

    // 2️⃣ Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 3️⃣ Update password in user_auth table
    const [updateResult] = await conn.query(
      "UPDATE user_auth SET password_hash = ?, is_verified = TRUE WHERE user_email = ?",
      [hashedPassword, user_email]
    );

    if (updateResult.affectedRows === 0) {
      return {
        status: "fail",
        message: "No user found for this email",
      };
    }

    // 4️⃣ Fetch user to send notification
    const user = await getUserByEmail.getUserByEmail(user_email);
    if (user?.profile_id) {
      await notificationService.createNotification({
        profile_id: user.profile_id,
        type: "system", 
        title: "Password Reset",
        body: `You have successfully reset your password.`,
        entity_type: "Password changed",
        entity_id: user_email,
      });
    }

    return {
      status: "success",
      message: "Password has been reset successfully",
    };
  } catch (error) {
    console.error("❌ Error in resetPasswordWithOTP:", error);
    return { status: "fail", message: "Internal server error" };
  }
}

module.exports = { logIn, requestPasswordReset, resetPasswordWithOTP };
