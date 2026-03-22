const mongoose = require("mongoose");
const joi = require("joi");

const TodoSchema = new mongoose.Schema({
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Accounts",
    required: true,
    index: true,
  },
  listId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lists",
    required: true,
  },
  task: { type: String, required: true },
  is_deleted: { type: Boolean, default: false },
  deleted_at: { type: Date, default: null },
});

const ValidateTodoCreation = (input) => {
  const validTodoSchema = joi
    .object({
      task: joi.string().min(8).max(128).alphanum().required(),
    })
    .strict();
  const validation = validTodoSchema.validate(input, { abortEarly: false });

  return {
    error: validation.error || null,
    todo: validation.value,
  };
};
const ValidateTodoUpdate = (input) => {
  const validTodoSchema = joi
    .object({
      task: joi.string().min(8).max(128).alphanum(),
    })
    .strict();
  const validation = validTodoSchema.validate(input, { abortEarly: false });

  return {
    error: validation.error || null,
    todo: validation.value,
  };
};

const Todos = mongoose.model("Todos", TodoSchema);

module.exports = {
  Todos,
  ValidateTodoCreation,
  ValidateTodoUpdate,
};
