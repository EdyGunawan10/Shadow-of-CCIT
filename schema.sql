CREATE DATABASE IF NOT EXISTS shadow_ccit CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE shadow_ccit;

CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(24) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS leaderboard (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    play_time DECIMAL(10,2) NOT NULL,
    enemies_eliminated INT UNSIGNED NOT NULL DEFAULT 0,
    hp_remaining TINYINT UNSIGNED NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_leaderboard_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_score_order (play_time, enemies_eliminated, hp_remaining)
) ENGINE=InnoDB;
