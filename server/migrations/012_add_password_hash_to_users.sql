-- 012_add_password_hash_to_users.sql
-- Add password_hash column to users table for authentication

ALTER TABLE users
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Add index for email lookups (already unique, but explicit for clarity)
-- Already exists from 002_users.sql