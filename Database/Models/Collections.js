const mongoose = require("mongoose");
const joi = require("joi");

const collectionSchema = new mongoose.Schema({
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Accounts",
    required: true,
    index: true,
  },
  name: { type: String, required: true },
  icon: { type: String, required: true },
  created_at: { type: Date, default: null },
  is_deleted: { type: Boolean, default: false },
  deleted_at: { type: Date, default: null },
});

const ValidateCollectionCreation = (input) => {
  const validCollectionSchema = joi
    .object({
      name: joi.string().min(3).max(18).alphanum().required(),
      icon: joi.string(),
    })
    .strict();
  const validation = validCollectionSchema.validate(input, {
    abortEarly: false,
  });

  return {
    error: validation.error || null,
    collection: validation.value,
  };
};

const ValidateCollectionUpdate = (input) => {
  const validCollectionSchema = joi
    .object({
      name: joi.string().min(3).max(18).alphanum(),
      icon: joi.string().optional(),
    })
    .strict();
  const validation = validCollectionSchema.validate(input, {
    abortEarly: false,
  });

  return {
    error: validation.error || null,
    collection: validation.value,
  };
};

const Collections = mongoose.model("Collections", collectionSchema);

module.exports = {
  Collections,
  ValidateCollectionCreation,
  ValidateCollectionUpdate,
};
