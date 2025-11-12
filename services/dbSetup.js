const pool = require("../config/db.config");


const users = `CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    profile_id CHAR(36) NOT NULL UNIQUE,
    user_email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    work VARCHAR(100),
    profile_url VARCHAR(300),
    credit_balance INT DEFAULT 0,
    free_trial INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)`;

const user_auth = `CREATE TABLE IF NOT EXISTS user_auth (
    id INT AUTO_INCREMENT PRIMARY KEY,
    profile_id CHAR(36) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active TINYINT DEFAULT 1,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (profile_id) REFERENCES users(profile_id) ON DELETE CASCADE
)`;

const purchases = `CREATE TABLE IF NOT EXISTS purchases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    purchases_record VARCHAR(255),
    transaction_id VARCHAR(255),
    profile_id CHAR(36) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    bought_credit INT,
    currency VARCHAR(10) DEFAULT 'USD',
    status ENUM('pending','completed','failed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (profile_id) REFERENCES users(profile_id) ON DELETE CASCADE
)`;

const interview_sessions = `CREATE TABLE IF NOT EXISTS interview_sessions (
    interview_id CHAR(36) NOT NULL PRIMARY KEY,
    user_profile_id CHAR(36) NOT NULL,
    job_title VARCHAR(255),
    job_description VARCHAR(500),
    difficulty ENUM('easy','medium','hard') DEFAULT 'medium',
    status ENUM('active','completed') DEFAULT 'active',
    meta_evaluation JSON NULL,
    behavioral_skill_tags JSON NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    FOREIGN KEY (user_profile_id) REFERENCES users(profile_id) ON DELETE CASCADE
)`;

const asked_questions = `CREATE TABLE IF NOT EXISTS asked_questions (
    id INT,
    user_profile_id CHAR(36),
    session_id CHAR(36),
    job_role VARCHAR(100),
    question_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (session_id, id),
    FOREIGN KEY (user_profile_id) REFERENCES users(profile_id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES interview_sessions(interview_id) ON DELETE CASCADE
)
`;

const user_responses = `CREATE TABLE IF NOT EXISTS user_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id CHAR(36) NOT NULL,
    question_id INT NOT NULL,
    user_response TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id)
        REFERENCES interview_sessions(interview_id)
        ON DELETE CASCADE
        )`;



const ai_question_feedback = `CREATE TABLE IF NOT EXISTS ai_question_feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id CHAR(36) NOT NULL,
    question_id INT,
    user_response_id INT,
    evaluation JSON,
    feedback_type ENUM('text', 'audio', 'video') DEFAULT 'text',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES interview_sessions(interview_id) ON DELETE CASCADE,
    FOREIGN KEY (session_id, question_id)
        REFERENCES asked_questions(session_id, id)
        ON DELETE CASCADE,
    FOREIGN KEY (user_response_id) REFERENCES user_responses(id) ON DELETE CASCADE
)`;

const transfers = `CREATE TABLE IF NOT EXISTS transfers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  transfer_id CHAR(12) NOT NULL UNIQUE,
  sender_id CHAR(36) NULL,
  receiver_email CHAR(36) NOT NULL,
  amount INT NOT NULL,
  transaction_type ENUM('transfer', 'refund') DEFAULT 'transfer',
  status ENUM('pending', 'completed', 'failed') DEFAULT 'completed',
  description VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(profile_id) ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY (receiver_email) REFERENCES users(user_email) ON DELETE CASCADE ON UPDATE CASCADE
)`;
const public_speeches = `CREATE TABLE IF NOT EXISTS public_speeches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  speech_id CHAR(12) NOT NULL UNIQUE,
  profile_id CHAR(36) NOT NULL,
  speech_title VARCHAR(255) NOT NULL,
  status ENUM('pending','completed') DEFAULT 'pending',
  speech_goal TEXT NOT NULL,
  speech_text LONGTEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (profile_id) REFERENCES users(profile_id) ON DELETE CASCADE
)`;

const user_notes = `CREATE TABLE IF NOT EXISTS user_notes (
  note_id INT AUTO_INCREMENT PRIMARY KEY,
  profile_id CHAR(36) NOT NULL,
  note_title VARCHAR(255) NOT NULL,
  note_label VARCHAR(255) NOT NULL,
  note_text LONGTEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (profile_id) REFERENCES users(profile_id) ON DELETE CASCADE
);`;

const speech_feedback = `CREATE TABLE IF NOT EXISTS speech_feedback (
  id INT AUTO_INCREMENT PRIMARY KEY,
  speech_id CHAR(12) NOT NULL,
  speech_title VARCHAR(255) NOT NULL,
  ai_feedback JSON NOT NULL,
  status ENUM('pending','completed') ,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (speech_id) REFERENCES public_speeches(speech_id) ON DELETE CASCADE
)`;

const verifications = `CREATE TABLE IF NOT EXISTS verifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    expires_at DATETIME NOT NULL,
    verified TINYINT DEFAULT 0,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`;



async function createTables() {
  const connection = await pool.getConnection();
  try {
    await connection.query(users);
    await connection.query(purchases);
    await connection.query(interview_sessions);
    await connection.query(asked_questions);
    await connection.query(user_responses);
    await connection.query(ai_question_feedback);
    await connection.query(transfers);
    await connection.query(public_speeches);
    await connection.query(user_notes);
    await connection.query(speech_feedback);
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
