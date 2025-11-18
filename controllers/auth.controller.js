const authService = require("../services/auth.Service");

// Import the jsonwebtoken module
const jwt = require("jsonwebtoken");
// Import the secret key from the environment variables
const jwtSecret = process.env.JWT_SECRET;


async function logIn(req, res, next) {
    console.log(req.body);
  try {
    const userData = req.body;
    // Call the logIn method from the login service
    const user = await authService.logIn(userData);
    // If the employee is not found
    if (user.status === "fail") {
      res.status(403).json({
        status: user.status,
        message: user.message,
      });
      return;
    }
    // If successful, send a response to the client
    const payload = {
      profile_id: user.data.profile_id,
      user_email: user.data.user_email,
      first_name: user.data.first_name,
      last_name: user.data.last_name,
      credit_balance: user.data.credit_balance,
      is_active: user.data.is_active,
      is_verified: user.data.is_verified,
    };
    const token = jwt.sign(payload, jwtSecret, {
      expiresIn: "24h",
    });
    // ✅ Send token securely as cookie
    res.cookie("auth_token", token, {
      httpOnly: true, // prevents JS access
      secure: false, // set to true in production (requires HTTPS)
      sameSite: "Lax", //  "Strict" for 
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    return res.status(200).json({
      success: true,
      message: "User logged in successfully",
      data: { user: payload },
    });
  } catch (error) {
    console.log(error);
  }
}


async function logoutUser(req, res) {
  try {
    // Clear the cookie that stores the JWT
    res.clearCookie("auth_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      path: "/", // must match the cookie path used during login
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    console.error("❌ Logout error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error while logging out.",
    });
  }
}



async function sendResetOTP(req, res) {
  const { user_email } = req.body;
  const response = await authService.requestPasswordReset(user_email);
  return res.status(response.status === "success" ? 200 : 400).json(response);
}

// 2️⃣ Reset password with OTP
async function resetPassword(req, res) {
  const { user_email, otp, new_password } = req.body;
  console.log(req.body);

  if (!user_email || !otp || !new_password) {
    return res.status(400).json({
      status: "fail",
      message: "Email, code, and new password are required",
    });
  }

  const response = await authService.resetPasswordWithOTP(
    user_email,
    otp,
    new_password
  );

  return res.status(response.status === "success" ? 200 : 400).json(response);
}




module.exports = {
  logIn,
  sendResetOTP,
  resetPassword,
  logoutUser,
};
