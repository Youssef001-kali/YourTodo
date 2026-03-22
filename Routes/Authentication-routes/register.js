const router = require("express").Router();
const {
  registerUser,
} = require("../../Controllers/Authentication-controller/authentication.js");

router.post("/", registerUser);

module.exports = router;
