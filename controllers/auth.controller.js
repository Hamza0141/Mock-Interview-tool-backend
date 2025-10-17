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
      // console.log(user.message);
    }
    // If successful, send a response to the client
    const payload = {
      profile_id: user.data.profile_id,
      user_email: user.data.user_email,
      credit_balance: user.data.credit_balance,
      first_name: user.data.first_name,
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



module.exports = {
  logIn,
};
