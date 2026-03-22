const router = require("express").Router();
const {
  logUserOut,
} = require("../../Controllers/Authentication-controller/authentication.js");

router.post("/", logUserOut);

module.exports = router;
