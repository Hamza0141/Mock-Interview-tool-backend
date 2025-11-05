const express = require("express");
require("dotenv").config();
const sanitize = require("sanitize");
const cors = require("cors");
const cookieParser = require("cookie-parser"); ;

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

// ✅ Mount main route index
app.use(router);

app.post("/", async (req, res) => {
  try {
    await createTables();
    res.status(200).json({ message: "Tables checked/created successfully." });
  } catch (err) {
    res.status(500).json({ error: "Error creating tables." });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running on port: ${port}`);
});

module.exports = app;
