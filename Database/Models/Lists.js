const mongoose = require("mongoose");
const joi = require("joi");

const listSchema = new mongoose.Schema({
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Accounts",
    required: true,
    index: true,
  },
  collectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Collections",
    required: true,
  },
  name: { type: String, required: true },
  description: { type: String, required: false, default: null },
  created_at: { type: Date, default: null },
  is_deleted: { type: Boolean, default: false },
  deleted_at: { type: Date, default: null },
});

const ValidateListCreation = (input) => {
  const validListSchema = joi
    .object({
      name: joi.string().min(3).max(18).alphanum().required(),
      description: joi.string().min(3).max(26),
    })
    .strict();
  const validation = validListSchema.validate(input, { abortEarly: false });

  return {
    error: validation.error || null,
    list: validation.value,
  };
};
const ValidateListUpdate = (input) => {
  const validListSchema = joi
    .object({
      name: joi.string().min(3).max(18).alphanum(),
      description: joi.string().min(3).max(26),
    })
    .strict();
  const validation = validListSchema.validate(input, { abortEarly: false });

  return {
    error: validation.error || null,
    list: validation.value,
  };
};

const Lists = mongoose.model("Lists", listSchema);

module.exports = {
  Lists,
  ValidateListCreation,
  ValidateListUpdate,
};
