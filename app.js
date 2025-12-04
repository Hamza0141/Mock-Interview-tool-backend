// app.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const sanitize = require("sanitize");
const multer = require("multer");
const path = require("path");

const { createTables } = require("./services/dbSetup");
const router = require("./routes/index");
const attachStripeWebhook = require("./webhook/stripeWebhook"); // 

const app = express();
const port = process.env.PORT || 5000;

// 2-minute timeout
app.use((req, res, next) => {
  req.setTimeout(120000);
  res.setTimeout(120000);
  next();
});

const corsOptions = {
  origin: process.env.FRONTEND_URL,
  optionsSuccessStatus: 200,
  credentials: true,
};

app.use(cors(corsOptions));

/**
 Stripe webhook BEFORE express.json()

 */
attachStripeWebhook(app);

// Now normal parsers + middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(sanitize.middleware);

// DB setup route
app.post("/", async (req, res) => {
  try {
    await createTables();
    res.status(200).json({ message: "Tables checked/created successfully." });
  } catch (err) {
    console.error("Error creating tables:", err);
    res.status(500).json({ error: "Error creating tables." });
  }
});

// File upload config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const types = ["image/jpeg", "image/png", "image/jpg"];
    if (types.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPEG/PNG files are allowed"));
  },
});

app.post("/api/upload", upload.single("image"), (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const imageUrl = `/uploads/${file.filename}`;
  res.status(200).json({ imageName: file.filename, url: imageUrl });
});

// Main routes
app.use(router);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.listen(port, () => {
  console.log(`🚀 Server running on port: ${port}`);
});

module.exports = app;
