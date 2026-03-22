const router = require("express").Router();
const sendEmail = require("../../Controllers/Private-routes-controller/ContactUs/contactUsControllers.js");

router.post("/", sendEmail);

module.exports = router;
