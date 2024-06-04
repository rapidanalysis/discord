CREATE USER IF NOT EXISTS 'rapid_bot'@'localhost' IDENTIFIED BY 'password';
GRANT CREATE, INSERT, UPDATE, DELETE, SELECT on *.* TO 'rapid_bot'@'localhost' WITH GRANT OPTION;

CREATE DATABASE discord_bot;

USE discord_bot;

CREATE TABLE negative_feedback (
  id INT AUTO_INCREMENT PRIMARY KEY,
  summary TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  paragraph TEXT
);

CREATE TABLE user_profile (
  uid BIGINT PRIMARY KEY,
  percent DECIMAL(3,2),
  apikey TEXT,
  privacy TINYINT(1) DEFAULT 1,
  limitc INT DEFAULT 20
);
