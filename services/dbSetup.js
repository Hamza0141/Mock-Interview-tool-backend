const pool = require("../config/db.config");

const users = `CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    profile_id CHAR(36) NOT NULL UNIQUE,
    user_email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    status INT DEFAULT '1',
    free_trial INT DEFAULT '1', 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)`;
const user_passwords = `CREATE TABLE IF NOT EXISTS user_passwords (
    id INT AUTO_INCREMENT PRIMARY KEY,
    profile_id CHAR(36) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active INT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (profile_id) REFERENCES users(profile_id) ON DELETE CASCADE
)`;

const payments = `CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    status ENUM('pending','completed','failed') DEFAULT 'pending',
    provider VARCHAR(50),
    transaction_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)`;

const interview_sessions = `CREATE TABLE IF NOT EXISTS interview_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255),
    job_description VARCHAR(500),
    status ENUM('active','completed') DEFAULT 'active',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)`;

const questions = `CREATE TABLE IF NOT EXISTS questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_role VARCHAR(100),
    difficulty ENUM('easy','medium','hard') DEFAULT 'medium',
    question_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`;

const responses = `CREATE TABLE IF NOT EXISTS responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    question_id INT NOT NULL,
    user_response TEXT,
    ai_feedback TEXT,  
    score INT,          
    recorded_audio_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES interview_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
)`;



async function createTables() {
  const connection = await pool.getConnection();
  try {
    await connection.query(users);
    await connection.query(payments);
    await connection.query(interview_sessions);
    await connection.query(questions);
    await connection.query(responses);
        await connection.query(user_passwords);
    console.log(" All tables checked/created successfully.");
  } catch (err) {
    console.error("Error creating tables:", err.message);
    throw err;
  } finally {
    connection.release();
  }
}
module.exports = { createTables };
