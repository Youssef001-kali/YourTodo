const nodeMailer = require("nodemailer");
const { RecoveryCode } = require("../../Database/Models/Users.js");
const recoveryCode = require("../others/recoveryCode.js");
const bcrypt = require("bcrypt");

//make a transporter
const transporter = nodeMailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendPassCodeEmail = async (reciever) => {
  const RC = recoveryCode();

  try {
    const hashedRC = await bcrypt.hash(RC, 13);
    //store the randomely generated recovery code in the database (hashed)
    await RecoveryCode.findOneAndUpdate(
      { email: reciever.email },
      {
        code: hashedRC,
        createdAt: Date.now(),
      },
      { upsert: true, new: true },
    );

    //send the recovery email
    const info = await transporter.sendMail({
      from: `YourTodo <${process.env.EMAIL}>`,
      to: reciever.email,
      subject: "Password Recovery Code",
      text: `
                Hi ${reciever.username},

                We received a request to reset your YourTodo account password.
                Here is your one-time recovery code:

                 Code: ${RC}

                This code will expire in 2 minutes.

                If you didn't request this, please ignore this email or contact support.

                Stay safe,
                Youssef from YourTodo.
            `,
    });

    console.log(
      `Password recovery email was successfully sent to ${reciever.username}.\nEmail id: ${info.messageId}.`,
    );

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.log(
      `Error while sending a recovery email to the user.\nError: ${error}`,
    );
    return {
      success: false,
      messageId: null,
      error: error,
    };
  }
};

module.exports = sendPassCodeEmail;
