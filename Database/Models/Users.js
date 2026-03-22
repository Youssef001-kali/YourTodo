const mongoose = require("mongoose");
const joi = require("joi");

//making a user schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },
  is_verified: { type: Boolean, default: false },
  verification_token: { type: String, default: null },
  is_code_checked: { type: Boolean, default: false },
  code_checked_at: { type: Date, default: null },
  is_deleted: { type: Boolean, default: false },
  deleted_at: { type: Date, default: null },
});

//making a recovery code schema for password recovery, in case the users forgot their password
const recoveryCodeSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  code: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});
// making the code so that it expires after 120secs/2mins from sending it
recoveryCodeSchema.index({ createdAt: 1 }, { expireAfterSeconds: 120 });

//using joi to make sure that the elements from the user schema are well stored after their type, length etc
const ValidateUserRegistration = (input) => {
  const validUserSchema = joi
    .object({
      username: joi.string().min(3).max(18).alphanum().required(),
      email: joi.string().email().required(),
      password: joi.string().min(8).required(), //minimum 8 characters
    })
    .strict();
  const validation = validUserSchema.validate(input, { abortEarly: false });

  return {
    error: validation.error || null,
    user: validation.value,
  };
};

const ValidateUserLogin = (input) => {
  const validUserSchema = joi
    .object({
      email: joi.string().email().required(),
      password: joi.string().required(),
    })
    .strict();
  const validation = validUserSchema.validate(input, { abortEarly: false });

  return {
    error: validation.error || null,
    user: validation.value,
  };
};

//making a users and a recoery code models holding the newly created userSchema and recoveryCodeSchema
const Users = mongoose.model("Users", userSchema);
const RecoveryCode = mongoose.model("RecoveryCode", recoveryCodeSchema);

module.exports = {
  Users,
  RecoveryCode,
  ValidateUserRegistration,
  ValidateUserLogin,
};
