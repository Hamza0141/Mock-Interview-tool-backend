
const userService = require("../services/user.Service");
const bcrypt = require("bcrypt");

async function createUser(req, res) {
  console.log(req.body);
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
    const { userid_id } = req.body;
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
async function changePassword(req, res) {
  try {
    const { userEmail, current_password, new_password, reEnterpassword } =
      req.body;
    // 1️⃣ Validate required fields
    if (!userEmail || !current_password || !new_password || !reEnterpassword) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    // 2️⃣ Check if new passwords match
    if (new_password !== reEnterpassword) {
      return res
        .status(400)
        .json({ success: false, message: "Passwords do not match" });
    }

    // 3️⃣ Get user by email
    const user = await userService.getUserByEmail(userEmail);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
console.log(user.password_hash);
    // 4️⃣ Compare current password
    const isMatch = await bcrypt.compare(current_password, user.password_hash);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Current password is incorrect" });
    }

    // 5️⃣ Hash and update new password
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

async function buyCredit(req, res) {
  try {
     const profile_id = req.user.profile_id;
    const { amount, bought_credit, email } = req.body;

    if (!profile_id || !amount || !bought_credit || !email) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }


    const user = await userService.getUserByEmail(userEmail);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    console.log(user.password_hash);
    // 4️⃣ Compare current password
    const isMatch = await bcrypt.compare(current_password, user.password_hash);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Current password is incorrect" });
    }

    // 5️⃣ Hash and update new password
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
module.exports = {
  createUser,
  getIUserByUserId,
  changePassword,
  buyCredit,
};
