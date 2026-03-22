const router = require("express").Router();
const {
  deleteUserAccount,
} = require("../../Controllers/Authentication-controller/authentication.js");

router.delete("/", deleteUserAccount);

module.exports = router;
