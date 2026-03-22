const {
  Users,
  RecoveryCode,
  ValidateUserRegistration,
  ValidateUserLogin,
} = require("../../Database/Models/Users.js");
const handleServerErrors = require("../../Helpers/others/handleServerError.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sendVerificationEmail = require("../../Helpers/email/sendVerificationEmail.js");
const sendPassCodeEmail = require("../../Helpers/email/sendPassCodeEmail.js");

//add a new user to the database
const registerUser = async (req, res) => {
  try {
    //getting and validating the user's credentials from the request
    const { error, user } = ValidateUserRegistration(req.body);
    if (error) {
      console.log("Validation error:", error);
      return res.status(400).json({
        success: false,
        message: "Bad request, wrong credentials",
        details: error.details,
      });
    }

    //checking of the user exists
    const userExists = await Users.findOne({
      $or: [{ email: user.email }, { username: user.username }],
      is_deleted: false,
    });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message:
          "Bad request, user with the given email or username already exists",
      });
    }

    //hashing the user's password before storing them to the database
    const hashedPassword = await bcrypt.hash(user.password, 13);
    const newUser = {
      username: user.username,
      email: user.email,
      password: hashedPassword,
    };

    //saving the user to in the database
    const addNewUser = new Users(newUser);
    await addNewUser.save();

    //sending a verification email to the user
    try {
      const verification = await sendVerificationEmail(addNewUser);
      if (!verification.success) {
        console.log("Email verification failed:", verification.error);
        return res.status(409).json({
          success: false,
          message: "Conflict, verification email was not sent",
          error: verification.error,
        });
      }
    } catch (emailError) {
      console.log("Email sending error:", emailError);
      return res.status(500).json({
        success: false,
        message: "Internal server error: Failed to send verification email",
        error: emailError.message,
      });
    }

    //make a safe user to send in a response
    const safeUser = {
      username: addNewUser.username,
      email: addNewUser.email,
      is_verified: addNewUser.is_verified,
    };

    //send a success response
    res.status(201).json({
      success: true,
      user: safeUser,
    });
  } catch (error) {
    handleServerErrors(res, error, "controllers/authentication.js(register)");
  }
};

//verify user's email
const verifyUserEmail = async (req, res) => {
  try {
    //getting the user's id and verification token from the params
    const { ID, VT } = req.params;

    //look for the user in the database
    const existingUser = await Users.findOne({ _id: ID, is_deleted: false });
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User was not found",
      });
    }

    //verify it the given token is valid
    try {
      jwt.verify(VT, process.env.VERIFICATION_TOKEN_SECRET_KEY);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Bad request, token failed to verify",
      });
    }

    //verify if the given verification token is the same as the stored one
    const isTokenValid = await bcrypt.compare(
      VT,
      existingUser.verification_token,
    );
    if (!isTokenValid) {
      return res.status(400).json({
        success: false,
        message: "Bad request, bad token",
      });
    }

    //update the user to point that their email is verified
    await Users.updateOne(
      { _id: existingUser._id },
      { $set: { is_verified: true } },
    );

    res.status(200).json({
      success: true,
      message: `User's email was successfully verified`,
    });
  } catch (error) {
    handleServerErrors(
      res,
      error,
      "controlers/authentication.js(verify user email)",
    );
  }
};

//log an existing user in and grant them auhtorization
const logUserIn = async (req, res) => {
  try {
    //get the user email and password from the request's body
    const { error, user } = ValidateUserLogin(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Bad request, wrong credentials",
      });
    }

    //checking if the user exists
    const existingUser = await Users.findOne({
      email: user.email,
      is_deleted: false,
    });
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User was Not Found",
      });
    }

    //check if the given password matches the stored password
    const isPasswordMatch = await bcrypt.compare(
      user.password,
      existingUser.password,
    );
    if (!isPasswordMatch) {
      return res.status(400).json({
        success: false,
        message: "Bad request, wrong password",
      });
    }

    //check if the user's email is verified
    if (!existingUser.is_verified) {
      return res.status(403).json({
        success: false,
        message: `Forbidden, user's email is not verified`,
      });
    }

    //asing a refresh and an access token for the user to be authorized
    const refreshToken = jwt.sign(
      { userId: existingUser._id },
      process.env.REFRESH_TOKEN_SECRET_KEY,
      { expiresIn: "1d" },
    );
    const accessToken = jwt.sign(
      { userId: existingUser._id },
      process.env.ACCESS_TOKEN_SECRET_KEY,
      { expiresIn: "15m" },
    );

    //storing the refresh token in an httpOnly cookie
    res.cookie("refresh-token", refreshToken, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "None",
      secure: true,
    });

    //sending the access token in a response to be handeled with in the front-end
    res.status(200).json({
      success: true,
      token: accessToken,
      user: {
        username: existingUser.username,
        email: existingUser.email,
      },
    });
  } catch (error) {
    handleServerErrors(res, error, "controlers/authentication.js(login)");
  }
};

//log an existing user out and remove their auhtorization temporarely
const logUserOut = async (req, res) => {
  try {
    //since the user can't log out unless they're logged in, we know for sure that the user exits, so no need to check the database for the given email
    //clear the user's cookies
    res.clearCookie("refresh-token", {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "None",
      secure: true,
    });

    res.status(200).json({
      success: true,
      message: "User was successfully logged out",
    });
  } catch (error) {
    handleServerErrors(res, error, "controlers/authentication.js(logout)");
  }
};

//send a recovery code for the user to recover their password in case they forget it
const sendRecoveryCode = async (req, res) => {
  try {
    //getting the user's email from the request's body
    const { email } = req.body;

    //check if the email exists && if it is verified
    const existingUser = await Users.findOne({ email, is_deleted: false });
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "Not found, this email was never stored in the database",
      });
    }
    if (!existingUser.is_verified) {
      return res.status(400).json({
        success: false,
        message: "Bad request, the entered email is not verified",
      });
    }

    //send the recovery code to the user's given email
    const sendEmail = await sendPassCodeEmail(existingUser);
    if (!sendEmail.success) {
      return res.status(400).json({
        success: false,
        message: sendEmail.error,
      });
    }

    res.status(200).json({
      success: true,
      message: "Recoery code was successfully sent via email",
    });
  } catch (error) {
    handleServerErrors(
      res,
      error,
      "controlers/authentication.js(send recovery code)",
    );
  }
};

//verify the recovery code sent via email and update the user's password
const verifyRecoveryCode = async (req, res) => {
  try {
    //getting the user's recovery code sent via email and their email
    const { email, code } = req.body;

    //verify if the stored recovery code is the same as the given one
    const existingRecoveryCode = await RecoveryCode.findOne({ email });
    if (!existingRecoveryCode) {
      return res.status(400).json({
        success: false,
        message:
          "Bad Request, the email entered is not the same as the email where the recoery code was sent",
      });
    }

    //check the code
    const isValid = await bcrypt.compare(code, existingRecoveryCode.code);
    if (!isValid) {
      return res.status(403).json({
        success: false,
        message:
          "Forbidden, recovery code entered is either expired or not correct",
      });
    }

    //mark that the user's recovery code was properly verified
    const updatedUser = await Users.updateOne(
      { email, is_deleted: false },
      { $set: { is_code_checked: true, code_checked_at: Date.now() } },
      { new: true },
    );

    //delete the recovery code from the database
    await RecoveryCode.deleteOne({ email });

    res.status(200).json({
      success: true,
      message: "Recovery code is valid",
    });
  } catch (error) {
    handleServerErrors(
      res,
      error,
      "controlers/authentication.js(verify recovery code)",
    );
  }
};

const updateUserPassword = async (req, res) => {
  try {
    //getting the user's email and new password from the request's body
    const { email, newPassword } = req.body;

    //hash the new password to be ready for storage
    const hashedNewPassword = await bcrypt.hash(newPassword, 13);

    //check if the code was checked
    const existingUser = await Users.findOne({ email, is_deleted: false });
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const expiryLimit = 10 * 60 * 1000;
    if (!existingUser.is_code_checked) {
      return res.status(403).json({
        success: false,
        message: "Forbidden, recovery code was not verified",
      });
    }

    //check if the code has been stored for more than 10 mins
    const isExpired =
      Date.now() - new Date(existingUser.code_checked_at).getTime() >
      expiryLimit;
    if (isExpired) {
      return res.status(403).json({
        success: false,
        message: "Recovery window expired. Please request a new code.",
      });
    }

    //update the user
    const user = await Users.updateOne(
      { email, is_deleted: false },
      {
        $set: { password: hashedNewPassword, is_code_checked: false },
        $unset: { code_checked_at: "" },
      },
    );

    res.status(200).json({
      success: true,
      message: `User's password was recovered successfully`,
      user,
    });
  } catch (error) {
    handleServerErrors(
      res,
      error,
      "controlers/authentication.js(update user password)",
    );
  }
};

const deleteUserAccount = async (req, res) => {
  try {
    //since the user has to be authaurized, we can get their name from the request
    const userId = req.userId;

    //look for the user in the database to check if they're not already deleted
    const user = await Users.findOne({ _id: userId, is_deleted: false });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found or already deleted",
      });
    }

    //soft deleting the user || user account
    await Users.updateOne(
      { _id: userId },
      {
        $set: { is_deleted: true, is_verified: false, deleted_at: new Date() },
      },
    );

    //clear any cookies related to the user
    res.clearCookie("refresh-token", {
      httpOnly: true,
      sameSite: "None",
      secure: true,
    });

    return res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    handleServerErrors(
      res,
      error,
      "controllers/authentication.js(delete user account)",
    );
  }
};

module.exports = {
  registerUser,
  verifyUserEmail,
  logUserIn,
  logUserOut,
  sendRecoveryCode,
  verifyRecoveryCode,
  updateUserPassword,
  deleteUserAccount,
};
