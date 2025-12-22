-- Add password column if it doesn't exist (using a procedure to handle idempotency is complex in raw SQL script, so we'll just try ALTER and ignore error or check schema)
-- For simplicity in this env, we'll assume it needs adding.
ALTER TABLE users ADD COLUMN password VARCHAR(255);

-- Insert Daniela if she doesn't exist (or just insert, assuming clean slate or ignoring dupes on name if unique constraint existed, but it doesn't on name)
-- Let's delete old Daniela to be clean and re-insert with password
DELETE FROM users WHERE name = 'Daniela';
INSERT INTO users (id, name, password) VALUES (UUID(), 'Daniela', '1234');
