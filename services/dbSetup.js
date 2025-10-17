const pool = require("../config/db.config");

const users = `CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    profile_id CHAR(36) NOT NULL UNIQUE,
    user_email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    credit_balance INT DEFAULT '0',
    free_trial INT DEFAULT '1',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)`;
const user_auth = `CREATE TABLE IF NOT EXISTS user_auth (
    id INT AUTO_INCREMENT PRIMARY KEY,
    profile_id CHAR(36) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active INT DEFAULT '1',
    is_verified BOOLEAN DEFAULT FALSE,
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
    profile_id INT NOT NULL,
    job_title VARCHAR(255),
    job_description VARCHAR(500),
    difficulty ENUM('easy','medium','hard') DEFAULT 'medium',
    status ENUM('active','completed') DEFAULT 'active',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    FOREIGN KEY (profile_id) REFERENCES users(profile_id) ON DELETE CASCADE
)`;

const askedQuestions = `CREATE TABLE IF NOT EXISTS asked_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_role VARCHAR(100),
    question_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`;

const user_responses = `CREATE TABLE IF NOT EXISTS user_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    question_id INT NOT NULL,
    user_response TEXT,
    ai_feedback TEXT,  
    overall_score INT,
    confidence_rate INT,
    relevance_score INT,
    grammar_score INT,         
    recorded_audio_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES interview_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES asked_questions(id) ON DELETE CASCADE
)`;

const ai_responses = `CREATE TABLE IF NOT EXISTS ai_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    question_id INT NOT NULL,
    user_response_id INT ,
    ai_feedback TEXT,  
    confidence_rate INT,
    relevance_score INT,
    grammar_score INT,         
    overall_score INT,
    recorded_audio_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES interview_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES asked_questions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_response_id) REFERENCES user_responses(id) ON DELETE CASCADE
)`;


const verifications = `CREATE TABLE IF NOT EXISTS verifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  expires_at DATETIME NOT NULL,
  verified TINYINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`;


async function createTables() {
  const connection = await pool.getConnection();
  try {
    await connection.query(users);
    await connection.query(payments);
    await connection.query(interview_sessions);
    await connection.query(askedQuestions);
    await connection.query(user_responses);
    await connection.query(ai_responses);
    await connection.query(verifications);
    await connection.query(user_auth);
    console.log(" All tables checked/created successfully.");
  } catch (err) {
    console.error("Error creating tables:", err.message);
    throw err;
  } finally {
    connection.release();
  }
}
module.exports = { createTables };
