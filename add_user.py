#!/usr/bin/env python3
"""
User Management Script for MSMM AI Tools Authentication
Add users to the MSMMAI_USERS table in Oracle database
"""

import oracledb
import hashlib
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Oracle connection configuration
ORACLE_HOST = os.getenv('ORACLE_HOST')
ORACLE_PORT = os.getenv('ORACLE_PORT')
ORACLE_SERVICE_NAME = os.getenv('ORACLE_SERVICE_NAME')
ORACLE_USER = os.getenv('ORACLE_USER')
ORACLE_PASSWORD = os.getenv('ORACLE_PASSWORD')
ORACLE_SCHEMA = os.getenv('ORACLE_SCHEMA', 'MSMM DASHBOARD')

def get_db_connection():
    """Create and return a database connection"""
    try:
        dsn = oracledb.makedsn(ORACLE_HOST, ORACLE_PORT, service_name=ORACLE_SERVICE_NAME)

        # When connecting as SYS, we need to specify SYSDBA mode
        if ORACLE_USER.upper() == 'SYS':
            connection = oracledb.connect(
                user=ORACLE_USER,
                password=ORACLE_PASSWORD,
                dsn=dsn,
                mode=oracledb.SYSDBA
            )
        else:
            connection = oracledb.connect(
                user=ORACLE_USER,
                password=ORACLE_PASSWORD,
                dsn=dsn
            )
        return connection
    except Exception as e:
        print(f"Database connection error: {e}")
        sys.exit(1)

def hash_password(password):
    """Hash password using SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()

def add_user(username, password):
    """Add a new user to the database"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        password_hash = hash_password(password)

        # Insert user
        cursor.execute(
            f'INSERT INTO "{ORACLE_SCHEMA}".MSMMAI_USERS (USERNAME, PASSWORD_HASH) VALUES (:username, :password_hash)',
            username=username,
            password_hash=password_hash
        )

        conn.commit()
        cursor.close()
        conn.close()

        print(f"✓ User '{username}' added successfully!")
        return True

    except oracledb.IntegrityError as e:
        if 'unique constraint' in str(e).lower():
            print(f"✗ Error: User '{username}' already exists!")
        else:
            print(f"✗ Database error: {e}")
        return False
    except Exception as e:
        print(f"✗ Error adding user: {e}")
        return False

def list_users():
    """List all users in the database"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            f'SELECT USERNAME, CREATED_AT, LAST_LOGIN FROM "{ORACLE_SCHEMA}".MSMMAI_USERS ORDER BY USERNAME'
        )

        users = cursor.fetchall()
        cursor.close()
        conn.close()

        if users:
            print("\nCurrent Users:")
            print("-" * 70)
            print(f"{'Username':<20} {'Created At':<25} {'Last Login':<25}")
            print("-" * 70)
            for user in users:
                username = user[0]
                created = user[1].strftime('%Y-%m-%d %H:%M:%S') if user[1] else 'N/A'
                last_login = user[2].strftime('%Y-%m-%d %H:%M:%S') if user[2] else 'Never'
                print(f"{username:<20} {created:<25} {last_login:<25}")
            print("-" * 70)
            print(f"Total users: {len(users)}\n")
        else:
            print("\nNo users found in the database.\n")

    except Exception as e:
        print(f"✗ Error listing users: {e}")

def delete_user(username):
    """Delete a user from the database"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Check if user exists
        cursor.execute(
            f'SELECT USERNAME FROM "{ORACLE_SCHEMA}".MSMMAI_USERS WHERE USERNAME = :username',
            username=username
        )

        if not cursor.fetchone():
            print(f"✗ User '{username}' not found!")
            cursor.close()
            conn.close()
            return False

        # Delete user's sessions first
        cursor.execute(
            f'DELETE FROM "{ORACLE_SCHEMA}".USER_SESSIONS WHERE USERNAME = :username',
            username=username
        )

        # Delete user
        cursor.execute(
            f'DELETE FROM "{ORACLE_SCHEMA}".MSMMAI_USERS WHERE USERNAME = :username',
            username=username
        )

        conn.commit()
        cursor.close()
        conn.close()

        print(f"✓ User '{username}' deleted successfully!")
        return True

    except Exception as e:
        print(f"✗ Error deleting user: {e}")
        return False

def interactive_mode():
    """Interactive mode for adding users"""
    print("\n" + "="*70)
    print("MSMM AI Tools - User Management")
    print("="*70)

    while True:
        print("\nOptions:")
        print("1. Add a new user")
        print("2. List all users")
        print("3. Delete a user")
        print("4. Exit")

        choice = input("\nEnter your choice (1-4): ").strip()

        if choice == '1':
            print("\n--- Add New User ---")
            username = input("Enter username: ").strip()

            if not username:
                print("✗ Username cannot be empty!")
                continue

            password = input("Enter password: ").strip()

            if not password:
                print("✗ Password cannot be empty!")
                continue

            if len(password) < 8:
                print("✗ Password should be at least 8 characters!")
                continue

            add_user(username, password)

        elif choice == '2':
            list_users()

        elif choice == '3':
            print("\n--- Delete User ---")
            username = input("Enter username to delete: ").strip()

            if not username:
                print("✗ Username cannot be empty!")
                continue

            if username.lower() == 'admin':
                confirm = input("⚠️  Are you sure you want to delete the admin user? (yes/no): ").strip().lower()
                if confirm != 'yes':
                    print("✗ Deletion cancelled.")
                    continue

            delete_user(username)

        elif choice == '4':
            print("\nGoodbye!")
            break

        else:
            print("✗ Invalid choice. Please enter 1-4.")

def main():
    """Main function"""
    if len(sys.argv) == 1:
        # Interactive mode
        interactive_mode()
    elif len(sys.argv) == 3:
        # Command line mode: python add_user.py username password
        username = sys.argv[1]
        password = sys.argv[2]
        add_user(username, password)
    elif len(sys.argv) == 2 and sys.argv[1] == 'list':
        # List users
        list_users()
    elif len(sys.argv) == 3 and sys.argv[1] == 'delete':
        # Delete user
        username = sys.argv[2]
        delete_user(username)
    else:
        print("Usage:")
        print("  Interactive mode:     python add_user.py")
        print("  Add user:             python add_user.py <username> <password>")
        print("  List users:           python add_user.py list")
        print("  Delete user:          python add_user.py delete <username>")
        sys.exit(1)

if __name__ == '__main__':
    main()
