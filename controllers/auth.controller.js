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
     console.log(user.message);
    if (user.status === "fail") {
      res.status(403).json({
        status: user.status,
        message: user.message,
      });
      return
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
    console.log(token);
    const sendBack = {
      user_token: token,
    };
    return res.status(200).json({
      status: "success",
      message: "user logged in successfully",
      data: sendBack,
    });
  } catch (error) {
    console.log(error);
  }
}
async function sendResetOTP(req, res) {
  const { user_email } = req.body;
  const response = await authService.requestPasswordReset(user_email);
  return res.status(response.status === "success" ? 200 : 400).json(response);
}

// 2️⃣ Reset password with OTP
async function resetPassword(req, res) {
  const { user_email, otp_code, new_password } = req.body;
  const response = await authService.resetPasswordWithOTP(user_email, otp_code, new_password);
  return res.status(response.status === "success" ? 200 : 400).json(response);
}



module.exports = {
  logIn,
  sendResetOTP,
  resetPassword,
};
