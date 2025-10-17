const express = require("express");

const  FormData = require ("form-data"); // form-data v4.0.1
const Mailgun = require("mailgun.js"); // mailgun.js v11.1.0
// Import the dotenv module and call the config method to load the environment variables
require("dotenv").config();
// Import the sanitizer module
const sanitize = require("sanitize");
// Import the CORS module
const cors = require("cors");
// Set up the CORS options to allow requests from our front-end

const pool = require("./config/db.config");
const { createTables } = require("./services/dbSetup");


const corsOptions = {
  origin: process.env.FRONTEND_URL,
  optionsSuccessStatus: 200,
};

const router = require("./routes/index")

// Create the webserver 
const app = express();
// Add the CORS middleware
app.use(cors(corsOptions));

// Add the express.json middleware to the application
app.use(express.json());


// Add the sanitizer to the express middleware 
app.use(sanitize.middleware);

const port = process.env.PORT;

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
  console.log(`Server running on port: ${port}`);
});
// Export the webserver for use in the application
module.exports = app;