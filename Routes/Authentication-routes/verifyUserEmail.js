const router = require("express").Router();
const {
  verifyUserEmail,
} = require("../../Controllers/Authentication-controller/authentication.js");

router.get("/:ID/:VT", verifyUserEmail);

module.exports = router;
