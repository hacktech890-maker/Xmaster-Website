const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();

// Trust proxy for deployment platforms like Render
app.set("trust proxy", 1);

// ============================================
// CORS CONFIGURATION - VERY IMPORTANT!
// ============================================
const allowedOrigins = [
  "https://xmaster.guru",
  "https://www.xmaster.guru",
  "https://xmaster-cj1.pages.dev",
  "http://localhost:3000",
  "http://localhost:3001",
];

// Add any origins from environment variable
if (process.env.FRONTEND_URL) {
  const envOrigins = process.env.FRONTEND_URL.split(",").map((url) => url.trim());

  envOrigins.forEach((origin) => {
    if (!allowedOrigins.includes(origin)) {
      allowedOrigins.push(origin);
    }
  });
}

console.log("✅ Allowed Origins:", allowedOrigins);

// ============================================
// CORS Middleware
// ============================================
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) {
        return callback(null, true);
      }

      // Check if origin is allowed
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Block unauthorized origins
      console.log("⚠️ CORS blocked origin:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
    maxAge: 86400, // 24 hours
  })
);

// Handle preflight requests for all routes
app.options(
  "*",
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// ============================================
// MIDDLEWARE
// ============================================
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ============================================
// RATE LIMITING
// ============================================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

// ============================================
// MONGODB CONNECTION
// ============================================
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// ============================================
// IMPORT ROUTES
// ============================================
const adminRoutes = require("./routes/adminRoutes");
const videoRoutes = require("./routes/videoRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const adRoutes = require("./routes/adRoutes");
const searchRoutes = require("./routes/searchRoutes");
const publicRoutes = require("./routes/publicRoutes");

// ============================================
// USE ROUTES
// ============================================
app.use("/api/admin", adminRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/ads", adRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/public", publicRoutes);

// ============================================
// HEALTH CHECK ROUTES
// ============================================
app.get("/", (req, res) => {
  res.json({
    message: "XMASTER API is running!",
    status: "healthy",
    timestamp: new Date().toISOString(),
    cors: "enabled",
    allowedOrigins: allowedOrigins,
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    cors: "enabled",
  });
});

// ============================================
// 404 HANDLER
// ============================================
app.use((req, res) => {
  res.status(404).json({ error: "Route not found", path: req.path });
});

// ============================================
// ERROR HANDLER
// ============================================
app.use((err, req, res, next) => {
  console.error("❌ Error:", err);

  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
  });
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🌐 CORS enabled for: ${allowedOrigins.join(", ")}`);
});
