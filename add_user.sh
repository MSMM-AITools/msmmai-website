#!/bin/bash

# Add user to MSMM AI Tools authentication system
# Usage: ./add_user.sh --user username --password password

set -e

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --user)
            USERNAME="$2"
            shift 2
            ;;
        --password)
            PASSWORD="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: ./add_user.sh --user <username> --password <password>"
            exit 1
            ;;
    esac
done

# Validate inputs
if [ -z "$USERNAME" ] || [ -z "$PASSWORD" ]; then
    echo "Error: Both --user and --password are required"
    echo "Usage: ./add_user.sh --user <username> --password <password>"
    exit 1
fi

echo "Adding user: $USERNAME"

# Calculate password hash
PASSWORD_HASH=$(python3 -c "import hashlib; print(hashlib.sha256('$PASSWORD'.encode()).hexdigest())")

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "Error: .env file not found"
    exit 1
fi

# Add user to database
python3 << EOF
import oracledb
import sys

try:
    # Connect to database
    dsn = oracledb.makedsn('$ORACLE_HOST', '$ORACLE_PORT', service_name='$ORACLE_SERVICE_NAME')

    # Connect as SYSDBA if using SYS user
    if '$ORACLE_USER'.upper() == 'SYS':
        conn = oracledb.connect(
            user='$ORACLE_USER',
            password='$ORACLE_PASSWORD',
            dsn=dsn,
            mode=oracledb.SYSDBA
        )
    else:
        conn = oracledb.connect(
            user='$ORACLE_USER',
            password='$ORACLE_PASSWORD',
            dsn=dsn
        )

    cursor = conn.cursor()

    # Insert user
    cursor.execute(
        'INSERT INTO "$ORACLE_SCHEMA".MSMMAI_USERS (USERNAME, PASSWORD_HASH) VALUES (:username, :password_hash)',
        username='$USERNAME',
        password_hash='$PASSWORD_HASH'
    )

    conn.commit()
    cursor.close()
    conn.close()

    print("✓ User '$USERNAME' added successfully!")

except oracledb.IntegrityError as e:
    if 'unique constraint' in str(e).lower():
        print("✗ Error: User '$USERNAME' already exists!")
        sys.exit(1)
    else:
        print(f"✗ Database error: {e}")
        sys.exit(1)
except Exception as e:
    print(f"✗ Error: {e}")
    sys.exit(1)
EOF
