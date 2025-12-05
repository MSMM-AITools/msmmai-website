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

# Export username and password for Python script
export ADD_USERNAME="$USERNAME"
export ADD_PASSWORD="$PASSWORD"

# Add user to database using python with dotenv
python3 << 'EOF'
import oracledb
import sys
import os
import hashlib
from dotenv import load_dotenv

try:
    # Load environment variables from .env file
    # Use current directory since we're running from the repo root
    env_path = os.path.join(os.getcwd(), '.env')
    if os.path.exists(env_path):
        load_dotenv(env_path)
    else:
        print("✗ Error: .env file not found")
        sys.exit(1)

    # Get Oracle connection details
    oracle_host = os.getenv('ORACLE_HOST')
    oracle_port = os.getenv('ORACLE_PORT')
    oracle_service = os.getenv('ORACLE_SERVICE_NAME')
    oracle_user = os.getenv('ORACLE_USER')
    oracle_password = os.getenv('ORACLE_PASSWORD')
    oracle_schema = os.getenv('ORACLE_SCHEMA', 'MSMM DASHBOARD')

    # Get username and password from environment
    username = os.getenv('ADD_USERNAME')
    password = os.getenv('ADD_PASSWORD')

    # Calculate password hash
    password_hash = hashlib.sha256(password.encode()).hexdigest()

    # Connect to database
    dsn = oracledb.makedsn(oracle_host, oracle_port, service_name=oracle_service)

    # Connect as SYSDBA if using SYS user
    if oracle_user.upper() == 'SYS':
        conn = oracledb.connect(
            user=oracle_user,
            password=oracle_password,
            dsn=dsn,
            mode=oracledb.SYSDBA
        )
    else:
        conn = oracledb.connect(
            user=oracle_user,
            password=oracle_password,
            dsn=dsn
        )

    cursor = conn.cursor()

    # Insert user - use f-string to properly handle schema name with spaces
    sql = f'INSERT INTO "{oracle_schema}".MSMMAI_USERS (USERNAME, PASSWORD_HASH) VALUES (:username, :password_hash)'
    cursor.execute(sql, username=username, password_hash=password_hash)

    conn.commit()
    cursor.close()
    conn.close()

    print(f"✓ User '{username}' added successfully!")

except oracledb.IntegrityError as e:
    if 'unique constraint' in str(e).lower():
        print(f"✗ Error: User '{username}' already exists!")
        sys.exit(1)
    else:
        print(f"✗ Database error: {e}")
        sys.exit(1)
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
EOF
