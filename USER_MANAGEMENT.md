# User Management Guide

This guide explains how to manage users for the MSMM AI Tools authentication system.

## Current Default User

- **Username**: `admin`
- **Password**: `Scott123$`

## Methods to Add Users

### Method 1: Python Script (Recommended)

The `add_user.py` script provides an easy way to manage users.

#### Interactive Mode

Run the script without arguments for an interactive menu:

```bash
python3 add_user.py
```

This will show you options to:
1. Add a new user
2. List all users
3. Delete a user
4. Exit

#### Command Line Mode

**Add a user:**
```bash
python3 add_user.py john MyPassword123
```

**List all users:**
```bash
python3 add_user.py list
```

**Delete a user:**
```bash
python3 add_user.py delete john
```

### Method 2: SQL Script

If you prefer SQL, you can use the provided SQL template.

#### Step 1: Calculate Password Hash

```bash
python3 -c "import hashlib; print(hashlib.sha256('YourPassword123'.encode()).hexdigest())"
```

This will output the hash, for example:
```
4fe0a87016b0046c2eeb8644ecda3586fcc8ca7a9017505ae76d8a314a1e758b
```

#### Step 2: Run SQL

Edit `add_users.sql` or run directly:

```sql
INSERT INTO "MSMM DASHBOARD".MSMMAI_USERS (USERNAME, PASSWORD_HASH)
VALUES ('newuser', '4fe0a87016b0046c2eeb8644ecda3586fcc8ca7a9017505ae76d8a314a1e758b');

COMMIT;
```

#### Step 3: Verify

```sql
SELECT USERNAME, CREATED_AT, LAST_LOGIN
FROM "MSMM DASHBOARD".MSMMAI_USERS;
```

### Method 3: Quick Command Line

Add a user with a single command:

```bash
python3 -c "
import oracledb, hashlib, os
from dotenv import load_dotenv

load_dotenv()

# User credentials to add
USERNAME = 'newuser'
PASSWORD = 'SecurePass123'

# Connect to database
dsn = oracledb.makedsn(
    os.getenv('ORACLE_HOST'),
    os.getenv('ORACLE_PORT'),
    service_name=os.getenv('ORACLE_SERVICE_NAME')
)
conn = oracledb.connect(
    user=os.getenv('ORACLE_USER'),
    password=os.getenv('ORACLE_PASSWORD'),
    dsn=dsn,
    mode=oracledb.SYSDBA
)

# Add user
cursor = conn.cursor()
password_hash = hashlib.sha256(PASSWORD.encode()).hexdigest()
cursor.execute(
    'INSERT INTO \"MSMM DASHBOARD\".MSMMAI_USERS (USERNAME, PASSWORD_HASH) VALUES (:u, :p)',
    u=USERNAME, p=password_hash
)
conn.commit()
print(f'User {USERNAME} added successfully!')
cursor.close()
conn.close()
"
```

## Password Requirements

For security, passwords should:
- Be at least 8 characters long
- Include a mix of uppercase, lowercase, numbers, and special characters
- Not be common words or phrases

Example strong passwords:
- `Secure123$`
- `Welcome2024!`
- `Manager#Pass`

## Managing Users

### View All Users

```bash
python3 add_user.py list
```

### Delete a User

```bash
python3 add_user.py delete username
```

Or via SQL:
```sql
DELETE FROM "MSMM DASHBOARD".MSMMAI_USERS WHERE USERNAME = 'username';
COMMIT;
```

**Note**: Deleting a user will also delete their active sessions.

## Troubleshooting

### Permission Issues

Make sure your Oracle user (typically SYS) has permission to insert into the MSMM DASHBOARD schema.

### User Already Exists

If you get a "unique constraint" error, the username already exists. Choose a different username or delete the existing user first.

### Connection Issues

Verify your `.env` file has the correct Oracle connection details:
```
ORACLE_HOST=msmm-dashboard.maxapex.net
ORACLE_PORT=1521
ORACLE_SERVICE_NAME=XEPDB1
ORACLE_USER=SYS
ORACLE_PASSWORD=your_password
ORACLE_SCHEMA=MSMM DASHBOARD
```

## Security Notes

1. **Never commit passwords to git** - Always add users via scripts or database directly
2. **Use strong passwords** - Enforce password complexity requirements
3. **Limit admin access** - Only give admin credentials to trusted users
4. **Regular audits** - Periodically review the user list and remove inactive accounts
5. **Session management** - Sessions expire after 24 hours of inactivity

## Examples

### Add Multiple Users

```bash
# Add team members
python3 add_user.py rajesh Secure123$
python3 add_user.py sarah Welcome2024!
python3 add_user.py manager Admin#Pass

# Verify they were added
python3 add_user.py list
```

### Bulk Add via SQL

Create a file `bulk_users.sql`:

```sql
-- Calculate hashes first with:
-- python3 -c "import hashlib; print(hashlib.sha256('Password1'.encode()).hexdigest())"

INSERT INTO "MSMM DASHBOARD".MSMMAI_USERS (USERNAME, PASSWORD_HASH) VALUES ('user1', 'hash1');
INSERT INTO "MSMM DASHBOARD".MSMMAI_USERS (USERNAME, PASSWORD_HASH) VALUES ('user2', 'hash2');
INSERT INTO "MSMM DASHBOARD".MSMMAI_USERS (USERNAME, PASSWORD_HASH) VALUES ('user3', 'hash3');

COMMIT;
```

Then run it against your Oracle database.
