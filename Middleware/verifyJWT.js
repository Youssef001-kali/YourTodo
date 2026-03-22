const jwt = require("jsonwebtoken");

const verifyJWT = (req, res, next) => {
  //getting and cheking the headers for an authorization header holding the access token
  const authorizationHeader = req.headers.authorization;
  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    return res.status(400).json({
      success: false,
      message: "Bad request",
    });
  }

  //getting the token from the header
  const token = authorizationHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized, missing token",
    });
  }

  //check if the token is valid and go on to the next middleware function
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    req.userId = decoded.userId; //adding a userId to the request for later use
    next();
  });
};

module.exports = verifyJWT;
