const nodeMailer = require("nodemailer");

const sendContactEmail = async (sender, subject = "", message = "") => {
  try {
    //make a transporter
    const transporter = nodeMailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    //send the recovery email
    const info = await transporter.sendMail({
      from: sender.email,
      to: process.env.EMAIL,
      subject: subject,
      text: message,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    return {
      success: false,
      messageId: null,
      error: error,
    };
  }
};

module.exports = sendContactEmail;
