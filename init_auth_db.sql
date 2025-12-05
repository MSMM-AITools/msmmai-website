-- SQL script to initialize the MSMMAI_USERS table
-- This script creates the users table and inserts the default admin user

-- Create the MSMMAI_USERS table
CREATE TABLE "MSMM DASHBOARD".MSMMAI_USERS (
    USER_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    USERNAME VARCHAR2(50) UNIQUE NOT NULL,
    PASSWORD_HASH VARCHAR2(64) NOT NULL,
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    LAST_LOGIN TIMESTAMP
);

-- Insert default admin user
-- Username: admin
-- Password: Scott123$
-- Password hash is SHA256 of 'Scott123$': 4fe0a87016b0046c2eeb8644ecda3586fcc8ca7a9017505ae76d8a314a1e758b
INSERT INTO "MSMM DASHBOARD".MSMMAI_USERS (USERNAME, PASSWORD_HASH)
VALUES ('admin', '4fe0a87016b0046c2eeb8644ecda3586fcc8ca7a9017505ae76d8a314a1e758b');

COMMIT;

-- Verify the table was created and user was inserted
SELECT * FROM "MSMM DASHBOARD".MSMMAI_USERS;
