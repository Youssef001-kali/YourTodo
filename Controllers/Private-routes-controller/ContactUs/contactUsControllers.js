const { Users } = require("../../../Database/Models/Users.js");
const sendContactEmail = require("../../../Helpers/email/sendContactEmail.js");
const handleServerErrors = require("../../../Helpers/others/handleServerError.js");
const joi = require("joi");

const contactSchema = joi.object({
  subject: joi.string().trim().max(26).required().messages({
    "string.base": "Subject must be a string",
    "string.empty": "Subject is required",
    "string.max": "Subject must be at most 26 characters",
  }),
  message: joi.string().trim().max(255).required().messages({
    "string.base": "Message must be a string",
    "string.empty": "Message is required",
    "string.max": "Message must be at most 255 characters",
  }),
});

const validateUserEmail = (input) => {
  const validation = contactSchema.validate(input, { abortEarly: false });
  return {
    error: validation.error || null,
    value: validation.value,
  };
};

const sendEmail = async (req, res) => {
  try {
    const userId = req.userId;
    const { error, value } = validateUserEmail(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details.map((d) => d.message),
      });
    }

    const user = await Users.findOne({ _id: userId, is_deleted: false });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Not found, user was not found — they might be deleted",
      });
    }

    if (!user.is_verified) {
      return res.status(403).json({
        success: false,
        message: "Forbidden, user email is not verified",
      });
    }

    const emailResponse = await sendContactEmail(
      user.email,
      value.subject,
      value.message,
    );
    if (emailResponse.error) {
      return res.status(400).json({
        success: false,
        message:
          "Bad request, email was not sent. Try resending or verify the subject and message.",
      });
    }

    res.status(200).json({
      success: true,
      message:
        "Email was sent successfully. YourTodo team will contact you as soon as possible.",
    });
  } catch (error) {
    handleServerErrors(res, error);
  }
};

module.exports = sendEmail;
