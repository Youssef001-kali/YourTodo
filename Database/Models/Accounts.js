const mongoose = require("mongoose");
const joi = require("joi");

const accountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true,
    index: true,
  },
  username: { type: String, required: true },
  bio: { type: String, required: false },
  pfp: { type: String, required: false, default: null }, //will add a default profile picture later on
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: null },
  is_deleted: { type: Boolean, default: false },
  deleted_at: { type: Date, default: null },
});

const ValidateAccountCreation = (input) => {
  const validAccountSchema = joi
    .object({
      username: joi
        .string()
        .min(3)
        .max(18)
        .required()
        .pattern(/^[a-zA-Z0-9_]+$/)
        .messages({
          "string.pattern.base":
            "Username can only contain letters, numbers, and underscores",
        }),
      bio: joi.string().max(26).allow("").optional(),
      pfp: joi.string().uri().allow("").optional(),
    })
    .strict();
  const validation = validAccountSchema.validate(input, { abortEarly: false });

  return {
    error: validation.error || null,
    account: validation.value,
  };
};
const ValidateAccountUpdate = (input) => {
  const validAccountSchema = joi
    .object({
      username: joi
        .string()
        .min(3)
        .max(18)
        .pattern(/^[a-zA-Z0-9_]+$/)
        .messages({
          "string.pattern.base":
            "Username can only contain letters, numbers, and underscores",
        }),
      bio: joi.string().max(26).allow("").optional(),
      pfp: joi.string().uri().allow("").optional(),
    })
    .strict();
  const validation = validAccountSchema.validate(input, { abortEarly: false });

  return {
    error: validation.error || null,
    account: validation.value,
  };
};

const Accounts = mongoose.model("Accounts", accountSchema);

module.exports = {
  Accounts,
  ValidateAccountCreation,
  ValidateAccountUpdate,
};
