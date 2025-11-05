const conn = require("../config/db.config");
const getUserByEmail = require("../services/user.Service");
const bcrypt = require("bcrypt");
const {otpManager} = require("../utils/otpManager");

async function logIn(userData) {
  try {
  
    const user = await getUserByEmail.getUserByEmail(userData.user_email);
    console.log("Fetched user:", user);
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
const note = "OneTime Password"
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

async function resetPasswordWithOTP(email, otpCode, newPassword) {
  try {
    // Check if OTP exists and is valid
    const [rows] = await conn.query(
      "SELECT * FROM verifications WHERE user_email = ? AND otp_code = ? AND expires_at > NOW() ORDER BY id DESC LIMIT 1",
      [email, otpCode]
    );

    if (rows.length === 0 || rows[0].is_used) {
      return { status: "fail", message: "Invalid or expired OTP" };
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in user_auth table
    await conn.query(
      "UPDATE user_auth SET password_hash = ? WHERE user_email = ?",
      [hashedPassword, email]
    );
      await conn.query(
          "UPDATE user_auth SET is_verified = TRUE WHERE user_email = ?",
          [email]
        );
    await conn.query(
      "UPDATE verifications SET verified = TRUE, is_used = TRUE WHERE id = ?",
      [rows[0].id]
    );


    return {
      status: "success",
      message: "Password has been reset successfully",
    };
  } catch (error) {
    console.error("Error in resetPasswordWithOTP:", error);
    return { status: "fail", message: "Internal server error" };
  }
}

module.exports = { logIn, requestPasswordReset, resetPasswordWithOTP };
