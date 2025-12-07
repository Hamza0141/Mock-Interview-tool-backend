const pool = require("../config/db.config");


const users = `CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    profile_id CHAR(36) NOT NULL UNIQUE,
    user_email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    stripe_customer_id VARCHAR(255) NULL,
    profession VARCHAR(100),
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

const credit_transactions = `CREATE TABLE IF NOT EXISTS credit_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    stripe_payment_intent_id  VARCHAR(255),
    profile_id CHAR(36) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    bought_credit INT,
    currency VARCHAR(10) DEFAULT 'USD',
    status ENUM('pending','completed','failed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (profile_id) REFERENCES users(profile_id) ON DELETE CASCADE
)`;
const credit_packs = `CREATE TABLE IF NOT EXISTS credit_packs (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(50),
  credits INT NOT NULL,
  price_cents INT NOT NULL
)`;

const interview_sessions = `CREATE TABLE IF NOT EXISTS interview_sessions (
    interview_id CHAR(36) NOT NULL PRIMARY KEY,
    user_profile_id CHAR(36) NOT NULL,
    job_title VARCHAR(255),
    job_description LONGTEXT,
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
const support_tickets = `CREATE TABLE IF NOT EXISTS support_tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id CHAR(36) NOT NULL UNIQUE,
  profile_id CHAR(36) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  status ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
  priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (profile_id) REFERENCES users(profile_id) ON DELETE CASCADE
)`;

const admin = `CREATE TABLE IF NOT EXISTS admin (
  id INT AUTO_INCREMENT PRIMARY KEY,
  profile_id CHAR(36) NOT NULL UNIQUE,
  admin_email VARCHAR(255) NOT NULL UNIQUE,
  access_type  ENUM('admin', 'support') DEFAULT 'admin',
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  password_hash VARCHAR(255) NOT NULL,
  profession VARCHAR(100),
  profile_url VARCHAR(300),
  stripe_customer_id VARCHAR(255) NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);`;


const ticket_messages = `CREATE TABLE IF NOT EXISTS support_ticket_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id  CHAR(36) NOT NULL,
  sender_type ENUM('user', 'admin') NOT NULL,
  sender_user_profile_id CHAR(36) NULL,
  sender_admin_profile_id CHAR(36) NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES support_tickets(ticket_id) ON DELETE CASCADE,
  FOREIGN KEY (sender_user_profile_id) REFERENCES users(profile_id) ON DELETE SET NULL,
  FOREIGN KEY (sender_admin_profile_id) REFERENCES admin(profile_id) ON DELETE SET NULL
);`;


const notifications = `CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  notification_id CHAR(16) NOT NULL UNIQUE,
  profile_id CHAR(36) NOT NULL, -- recipient (user)
  type ENUM(
    'account',
    'credit',
    'interview',
    'speech',
    'transfer',
    'ticket',
    'system'
  ) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  entity_type VARCHAR(50) NULL,   
  entity_id   VARCHAR(64) NULL,   
  is_read TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (profile_id) REFERENCES users(profile_id) ON DELETE CASCADE
)`;

const service_feedback = `CREATE TABLE IF NOT EXISTS service_feedback (
  id INT AUTO_INCREMENT PRIMARY KEY,
  feedback_id CHAR(12) NOT NULL UNIQUE,
  profile_id CHAR(36) NOT NULL,
  q1_rating TINYINT NOT NULL, 
  q2_rating TINYINT NOT NULL,
  q3_rating TINYINT NOT NULL,
  q4_rating TINYINT NOT NULL,
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (profile_id) REFERENCES users(profile_id) ON DELETE CASCADE
)`;

const verifications = `CREATE TABLE IF NOT EXISTS verifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    expires_at DATETIME NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`;



async function createTables() {
  const connection = await pool.getConnection();
  try {
    await connection.query(users);
    await connection.query(credit_transactions);
    await connection.query(credit_packs);
    await connection.query(interview_sessions);
    await connection.query(asked_questions);
    await connection.query(user_responses);
    await connection.query(ai_question_feedback);
    await connection.query(transfers);
    await connection.query(public_speeches);
    await connection.query(user_notes);
    await connection.query(speech_feedback);
    await connection.query(verifications);
    await connection.query(support_tickets);
    await connection.query(admin);
    await connection.query(ticket_messages);
    await connection.query(notifications);
    await connection.query(service_feedback);
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
