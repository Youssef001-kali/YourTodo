const nodeMailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const { Users } = require("../../Database/Models/Users.js");
const bcrypt = require("bcrypt");

//setting up transporters params
const transporter = nodeMailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendVerificationEmail = async (reciever) => {
  try {
    //log users email for debugging purpouses
    console.log(`Reciever's email: ${reciever.email}`);

    //asign a verification token to the user
    const verificationToken = jwt.sign(
      { username: reciever.username },
      process.env.VERIFICATION_TOKEN_SECRET_KEY,
      { expiresIn: "10m" },
    );

    const hashedVerificationToken = await bcrypt.hash(verificationToken, 13);

    //add the verification token to the database
    const updatedUser = await Users.updateOne(
      { _id: reciever._id },
      { $set: { verification_token: hashedVerificationToken } },
    );

    //setting up message information
    const verificationLink = `https://${process.env.HOST}:${process.env.EXTERNAL_PORT}/authentication/verify-email/${reciever._id}/${verificationToken}`;
    const info = await transporter.sendMail({
      from: `YourTodo <${process.env.EMAIL}>`,
      to: reciever.email,
      subject: "Email verification",
      text: `
                Hi ${reciever.username},

                Thank you for signing up for YourTodo! To complete your registration, please verify your email address by clicking the link below:

                ${verificationLink}

                If you didn't request this, you can safely ignore this message.

                Best regards,
                Youssef from YourTodo.

            `,
    });

    console.log(
      `Verification email was successfully sent to ${reciever.username}.\nEmail id: ${info.messageId}.`,
    );

    return {
      success: true,
      message_id: info.messageId,
    };
  } catch (error) {
    console.log(`Error in helpers/validateEmail.\nError: ${error}`);
    return {
      success: false,
      message_id: null,
      error: error,
    };
  }
};

module.exports = sendVerificationEmail;
