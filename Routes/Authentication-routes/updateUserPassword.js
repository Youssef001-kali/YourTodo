const router = require("express").Router();
const {
  updateUserPassword,
} = require("../../Controllers/Authentication-controller/authentication.js");

router.put("/", updateUserPassword);

module.exports = router;
