const express = require("express");
require("dotenv").config();
const sanitize = require("sanitize");
const cors = require("cors");
const cookieParser = require("cookie-parser"); 
const multer = require("multer");
const path = require("path");

const { createTables } = require("./services/dbSetup");
const router = require("./routes/index");

const app = express();
const port = process.env.PORT;

// 2-minute timeout for long-running requests (like AI eval)
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

// ✅ Don’t parse JSON before Stripe webhook (handled in controller)
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(sanitize.middleware);



app.post("/", async (req, res) => {
  try {
    await createTables();
    res.status(200).json({ message: "Tables checked/created successfully." });
  } catch (err) {
    res.status(500).json({ error: "Error creating tables." });
  }
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads"); // Save to /uploads
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname); // Add unique timestamp
  },
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const types = ["image/jpeg", "image/png", "image/jpg"];
    if (types.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG/PNG files are allowed"));
    }
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

// ✅ Mount main route index
app.use(router);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.listen(port, () => {
  console.log(`🚀 Server running on port: ${port}`);
});

module.exports = app;
