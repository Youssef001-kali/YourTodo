const router = require("express").Router();
const {
  sendRecoveryCode,
} = require("../../Controllers/Authentication-controller/authentication.js");

router.post("/", sendRecoveryCode);

module.exports = router;
