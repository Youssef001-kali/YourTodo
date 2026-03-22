const rateLimit = require("express-rate-limit");

const authenticationRoutesLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: {
    success: false,
    message: "Too many requests, try again after 15-mins",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const privatePagesLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  message: {
    success: false,
    message: "Too many requests, slow down",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const emailSendingLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 3,
  message: {
    success: false,
    message: "Too many requests, slow down",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  authenticationRoutesLimiter,
  privatePagesLimiter,
  emailSendingLimiter,
};
