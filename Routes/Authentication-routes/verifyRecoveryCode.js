const router = require("express").Router();
const {
  verifyRecoveryCode,
} = require("../../Controllers/Authentication-controller/authentication.js");

router.post("/", verifyRecoveryCode);

module.exports = router;
