
const getUserByEmail= require("../services/user.Service")
const bcrypt = require("bcrypt");



async function logIn(userData) {
  try {
    let returnData = {}; // Object to be returned
    const user = await getUserByEmail.getUserByEmail(userData.user_email);
    console.log(user);
    if (user.length === 0) {
      returnData = {
        status: "fail",
        message: "user does not exist",
      };
      return returnData;
    }
    const passwordMatch = await bcrypt.compare(
      userData.user_password,
      user.password_hash
    );
    if (user.is_active !== 1) {
      returnData = {
        status: "fail",
        message: "Your account is not active please contact admin",
      };
      return returnData;
    } else if (!passwordMatch) {
      returnData = {
        status: "fail",
        message: "Incorrect password",
      };
      return returnData;
    }
   
    returnData = {
      status: "success",
      data: user,
    };
    return returnData;
  } catch (error) {
    console.log(error);
  }
}

module.exports = {

  logIn,
};
