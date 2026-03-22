const crypto = require("crypto");

module.exports = function recoveryCode() {
  const code = crypto.randomInt(100000, 1000000);
  return code.toString();
};
