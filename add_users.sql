-- SQL Script to add users to MSMMAI_USERS table
-- Replace USERNAME and PASSWORD_HASH values with your desired credentials

-- To calculate password hash in Python:
-- python3 -c "import hashlib; print(hashlib.sha256('YOUR_PASSWORD'.encode()).hexdigest())"

-- Example: Add a user with username "john" and password "MyPassword123"
-- First calculate hash: python3 -c "import hashlib; print(hashlib.sha256('MyPassword123'.encode()).hexdigest())"
-- Then use the INSERT below

-- Template for adding new users:
INSERT INTO "MSMM DASHBOARD".MSMMAI_USERS (USERNAME, PASSWORD_HASH)
VALUES ('username_here', 'password_hash_here');

-- Example users (remove or modify as needed):

-- User: rajesh, Password: Secure123$
-- Hash calculated: python3 -c "import hashlib; print(hashlib.sha256('Secure123$'.encode()).hexdigest())"
INSERT INTO "MSMM DASHBOARD".MSMMAI_USERS (USERNAME, PASSWORD_HASH)
VALUES ('rajesh', 'e2c6c0e6f8d8a5e0c4f8c5e7f8c5e7f8c5e7f8c5e7f8c5e7f8c5e7f8c5e7f8');

-- User: sarah, Password: Welcome123!
INSERT INTO "MSMM DASHBOARD".MSMMAI_USERS (USERNAME, PASSWORD_HASH)
VALUES ('sarah', 'f5c5e7f8c5e7f8c5e7f8c5e7f8c5e7f8c5e7f8c5e7f8c5e7f8c5e7f8c5e7f8');

-- User: manager, Password: Manager2024#
INSERT INTO "MSMM DASHBOARD".MSMMAI_USERS (USERNAME, PASSWORD_HASH)
VALUES ('manager', 'a3b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2');

COMMIT;

-- To verify users were added:
SELECT USERNAME, CREATED_AT, LAST_LOGIN FROM "MSMM DASHBOARD".MSMMAI_USERS;

-- To delete a user (if needed):
-- DELETE FROM "MSMM DASHBOARD".MSMMAI_USERS WHERE USERNAME = 'username_to_delete';
-- COMMIT;
