const express = require("express");
const http = require("http");
const { join } = require("path");
const helmet = require("helmet");
const cors = require("cors");
const connectToDB = require("../Database/Connection/connectToDB.js");
const cookieParser = require("cookie-parser");
const crypto = require("crypto");
const { doubleCsrf } = require("csrf-csrf");
const PORT = process.env.PORT;

if (!process.env.CSRF_SECRET) {
  console.error(
    "CRITICAL ERROR: CSRF_SECRET is not defined in environment variables.",
  );
  process.exit(1);
}

const verifyJWT = require("../Middleware/verifyJWT.js");
const {
  authenticationRoutesLimiter,
  privatePagesLimiter,
  emailSendingLimiter,
} = require("../Middleware/rateLimiting.js");

const app = express();
connectToDB();

app.set("trust proxy", 1);
//Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
//CORS configuration
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://localhost:3000",
      "https://localhost:3001",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "csrf-token"],
  }),
);

// Body parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Cookie parser
app.use(cookieParser());

const { invalidCsrfTokenError, generateToken, doubleCsrfProtection } =
  doubleCsrf({
    getSecret: () => process.env.CSRF_SECRET,
    cookieName: "x-csrf-token",
    cookieOptions: {
      httpOnly: true, // Secure, prevents XSS attacks from reading it
      sameSite: "none",
      secure: true, // Must be true for sameSite: 'none'
    },
    size: 64,
    ignoredMethods: ["GET", "HEAD", "OPTIONS"],
    getTokenFromRequest: (req) =>
      req.headers["x-csrf-token"] || req.headers["csrf-token"],
  });

// CSRF token route
app.get("/csrf-token", (req, res) => {
  const token = generateToken(res, req);
  res.json({
    success: true,
    message: "CSRF token generated successfully",
    csrfToken: token,
  });
});

// Applied CSRF protection to all routes below
app.use(doubleCsrfProtection);

//authentication routes
app.use(
  "/authentication/register",
  authenticationRoutesLimiter,
  require("../Routes/Authentication-routes/register.js"),
);
app.use(
  "/authentication/log-in",
  authenticationRoutesLimiter,
  require("../Routes/Authentication-routes/logIn.js"),
);
app.use(
  "/authentication/log-out",
  authenticationRoutesLimiter,
  require("../Routes/Authentication-routes/logOut.js"),
);
app.use(
  "/authentication/verify-email",
  authenticationRoutesLimiter,
  require("../Routes/Authentication-routes/verifyUserEmail.js"),
);
app.use(
  "/authentication/send-recovery-code",
  authenticationRoutesLimiter,
  require("../Routes/Authentication-routes/sendRecoveryCode.js"),
);
app.use(
  "/authentication/verify-recovery-code",
  authenticationRoutesLimiter,
  require("../Routes/Authentication-routes/verifyRecoveryCode.js"),
);
app.use(
  "/authentication/update-password",
  authenticationRoutesLimiter,
  require("../Routes/Authentication-routes/updateUserPassword.js"),
);
app.use(
  "/authentication/delete-account",
  authenticationRoutesLimiter,
  verifyJWT,
  require("../Routes/Authentication-routes/deleteUserAccount.js"),
);

//private routes
app.use(
  "/accounts",
  verifyJWT,
  privatePagesLimiter,
  require("../Routes/Private-routes/accounts.js"),
);
app.use(
  "/collections",
  verifyJWT,
  privatePagesLimiter,
  require("../Routes/Private-routes/collections.js"),
);
app.use(
  "/lists",
  verifyJWT,
  privatePagesLimiter,
  require("../Routes/Private-routes/lists.js"),
);
app.use(
  "/todos",
  verifyJWT,
  privatePagesLimiter,
  require("../Routes/Private-routes/todos.js"),
);
app.use(
  "/contact-us",
  verifyJWT,
  emailSendingLimiter,
  require("../Routes/Private-routes/contactUs.js"),
);

//recovery routes
app.use(
  "/recovery",
  verifyJWT,
  privatePagesLimiter,
  require("../Routes/Private-routes/recovery-routes/recovery.js"),
);

// CSRF error handler
app.use((err, req, res, next) => {
  if (err === invalidCsrfTokenError) {
    return res.status(403).json({
      success: false,
      message: "CSRF token validation failed",
      error: "Invalid or missing CSRF token",
    });
  }
  next(err);
});

http.createServer(app).listen(PORT, () => {
  console.log(`Internal HTTP server running on port ${PORT}`);
});
