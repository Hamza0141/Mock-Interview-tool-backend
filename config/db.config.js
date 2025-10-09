const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  password: process.env.DB_PASS,
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
});

// const pool = mysql.createPool(process.env.DATABASE_URL);


module.exports = pool;
