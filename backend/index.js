import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import { s_router } from "./routes/store_routes.js";
import { a_router } from "./routes/auth_routes.js";
import { admin_router } from "./routes/admin_routes.js";
import cart_router from "./routes/cart_routes.js";
import payment_router from "./routes/payment_routes.js";
import { paypal_webhook } from "./controllers/paypal_controllers.js";
import { logGoogleOAuthConfig } from "./controllers/google_auth_controllers.js";

// to create the __dirname property .***.***.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.join(__dirname, ".env"),
});

logGoogleOAuthConfig();

// starting and initialising the server .***.***.
const app = express();
const port = process.env.PORT || 5000;

// .***.***. SECURITY MIDDLEWARE .***.***. //
// Helmet for security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow assets to be loaded
  }),
);

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:3000"];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.indexOf(origin) !== -1 ||
        process.env.NODE_ENV === "development"
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to API routes
app.use("/api/", limiter);

// Stricter rate limit for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 attempts per 15 minutes
  message: "Too many authentication attempts, please try again later.",
});

app.use("/api/v1/login", authLimiter);
app.use("/api/v1/register", authLimiter);
app.use("/api/v1/admin/login", authLimiter);

app.post(
  "/api/paypal/webhook",
  express.raw({ type: "application/json" }),
  paypal_webhook,
);
app.post(
  "/api/v1/payment/webhook",
  express.raw({ type: "application/json" }),
  paypal_webhook,
);
app.use(express.json()); // for sending json and receiving .***.***.
app.use("/assets", express.static(path.join(__dirname, "assets"))); // to accept all folders and have access form assets .***.***.

// .***.***. APIS_MANAGER .***.***. //
app.use("/api/v1", s_router); // for the store .***.***.
app.use("/api/v1/", a_router); // for authantication .***.***.
app.use("/api/v1/admin", admin_router); // for admin .***.***.
app.use("/api/v1", cart_router); // for cart .***.***.
app.use("/api/v1/payment", payment_router); // for payment .***.***.

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || "Something went wrong!",
  });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

export default app;
