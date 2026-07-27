-- ATIGMA catalogue database schema
-- Run this once against your MySQL database before deploying.

CREATE TABLE IF NOT EXISTS products (
  id           VARCHAR(20) PRIMARY KEY,
  name         VARCHAR(255) NOT NULL,
  price        DECIMAL(10,2) NOT NULL,
  description  TEXT,
  sold_out     TINYINT(1) NOT NULL DEFAULT 0,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Images are stored directly in MySQL as base64 data URLs.
-- Netlify Functions have no persistent disk, so this keeps the whole
-- backend in one place (the database) instead of needing a separate
-- file-storage service.
CREATE TABLE IF NOT EXISTS product_images (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  product_id   VARCHAR(20) NOT NULL,
  image_data   LONGTEXT NOT NULL,
  sort_order   INT NOT NULL DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Simple key/value table for everything else: contact details, social
-- links, the admin passcode, the active theme, and the founder photo.
CREATE TABLE IF NOT EXISTS site_settings (
  setting_key    VARCHAR(100) PRIMARY KEY,
  setting_value  LONGTEXT
);

-- Basic brute-force protection for the admin login.
CREATE TABLE IF NOT EXISTS login_attempts (
  ip_address    VARCHAR(45) PRIMARY KEY,
  attempts      INT NOT NULL DEFAULT 0,
  locked_until  DATETIME NULL
);

-- Seed sensible defaults. Change these after your first deploy.
-- Note: admin_passcode starts as plain text below, but the app hashes it
-- with bcrypt automatically the first time anyone logs in successfully —
-- you don't need to hash it yourself before importing this file.
INSERT INTO site_settings (setting_key, setting_value) VALUES
  ('contact_email',    'hello@atigma.com'),
  ('whatsapp_number',  '233000000000'),
  ('whatsapp_message', 'Hi! I have a question about a product in your catalogue.'),
  ('instagram_url',    ''),
  ('linkedin_url',     ''),
  ('facebook_url',     ''),
  ('tiktok_url',       ''),
  ('active_theme',     'classic'),
  ('founder_photo',    ''),
  ('admin_passcode',   'admin123')
ON DUPLICATE KEY UPDATE setting_key = setting_key;
