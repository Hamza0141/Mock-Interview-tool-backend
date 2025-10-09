const userService = require("../services/auth.Service"); 

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
    console.error("❌ Controller error:", err);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
}

module.exports = {
  createUser,
};
