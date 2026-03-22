const router = require("express").Router();
const {
  logUserIn,
} = require("../../Controllers/Authentication-controller/authentication.js");

router.post("/", logUserIn);

module.exports = router;
