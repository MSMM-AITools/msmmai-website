"""
Authentication API for MSMM AI Tools
Handles login, logout, and session verification
"""

from flask import Flask, request, jsonify, make_response
import oracledb
import os
import hashlib
import secrets
from datetime import datetime, timedelta
from dotenv import load_dotenv
import sys

# Load environment variables
load_dotenv()

# Configure logging
print("[Auth] Initializing authentication API", file=sys.stderr)

app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'your-secret-key-change-this')

# Oracle connection configuration
ORACLE_HOST = os.getenv('ORACLE_HOST')
ORACLE_PORT = os.getenv('ORACLE_PORT')
ORACLE_SERVICE_NAME = os.getenv('ORACLE_SERVICE_NAME')
ORACLE_USER = os.getenv('ORACLE_USER')
ORACLE_PASSWORD = os.getenv('ORACLE_PASSWORD')
ORACLE_SCHEMA = os.getenv('ORACLE_SCHEMA', 'MSMM DASHBOARD')

# In-memory session store (for serverless)
# Note: In production, consider using database-backed sessions
sessions = {}

def get_db_connection():
    """Create and return a database connection"""
    try:
        dsn = oracledb.makedsn(ORACLE_HOST, ORACLE_PORT, service_name=ORACLE_SERVICE_NAME)
        connection = oracledb.connect(
            user=ORACLE_USER,
            password=ORACLE_PASSWORD,
            dsn=dsn
        )
        return connection
    except Exception as e:
        print(f"[Auth] Database connection error: {e}", file=sys.stderr)
        raise

def hash_password(password):
    """Hash password using SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()

def create_session_token():
    """Generate a secure session token"""
    return secrets.token_urlsafe(32)

def init_database():
    """Initialize the MSMMAI_USERS table and insert default admin user"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Create table if it doesn't exist
        create_table_sql = f"""
        BEGIN
            EXECUTE IMMEDIATE 'CREATE TABLE "{ORACLE_SCHEMA}".MSMMAI_USERS (
                USER_ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                USERNAME VARCHAR2(50) UNIQUE NOT NULL,
                PASSWORD_HASH VARCHAR2(64) NOT NULL,
                CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                LAST_LOGIN TIMESTAMP
            )';
        EXCEPTION
            WHEN OTHERS THEN
                IF SQLCODE = -955 THEN
                    NULL; -- Table already exists
                ELSE
                    RAISE;
                END IF;
        END;
        """
        cursor.execute(create_table_sql)

        # Insert default admin user (admin/Scott123$)
        admin_password_hash = hash_password('Scott123$')
        insert_user_sql = f"""
        BEGIN
            INSERT INTO "{ORACLE_SCHEMA}".MSMMAI_USERS (USERNAME, PASSWORD_HASH)
            VALUES (:username, :password_hash);
        EXCEPTION
            WHEN DUP_VAL_ON_INDEX THEN
                NULL; -- User already exists
        END;
        """
        cursor.execute(insert_user_sql, username='admin', password_hash=admin_password_hash)

        conn.commit()
        cursor.close()
        conn.close()
        print("[Auth] Database initialized successfully", file=sys.stderr)

    except Exception as e:
        print(f"[Auth] Database initialization error: {e}", file=sys.stderr)

# Initialize database on startup
try:
    init_database()
except Exception as e:
    print(f"[Auth] Failed to initialize database: {e}", file=sys.stderr)

@app.route('/api/auth', methods=['POST', 'GET', 'DELETE'])
def auth_handler():
    """Handle authentication requests"""

    if request.method == 'POST':
        # Login
        try:
            data = request.get_json()
            if not data:
                return jsonify({'success': False, 'message': 'Invalid request'}), 400

            username = data.get('username')
            password = data.get('password')

            if not username or not password:
                return jsonify({'success': False, 'message': 'Username and password required'}), 400

            # Verify credentials
            conn = get_db_connection()
            cursor = conn.cursor()

            password_hash = hash_password(password)
            cursor.execute(
                f'SELECT USER_ID, USERNAME FROM "{ORACLE_SCHEMA}".MSMMAI_USERS WHERE USERNAME = :username AND PASSWORD_HASH = :password_hash',
                username=username,
                password_hash=password_hash
            )

            user = cursor.fetchone()

            if user:
                # Update last login
                cursor.execute(
                    f'UPDATE "{ORACLE_SCHEMA}".MSMMAI_USERS SET LAST_LOGIN = CURRENT_TIMESTAMP WHERE USER_ID = :user_id',
                    user_id=user[0]
                )
                conn.commit()

                # Create session
                session_token = create_session_token()
                sessions[session_token] = {
                    'user_id': user[0],
                    'username': user[1],
                    'created_at': datetime.now(),
                    'expires_at': datetime.now() + timedelta(hours=24)
                }

                cursor.close()
                conn.close()

                # Set cookie
                response = make_response(jsonify({
                    'success': True,
                    'message': 'Login successful',
                    'username': user[1]
                }))
                response.set_cookie(
                    'session_token',
                    session_token,
                    max_age=86400,  # 24 hours
                    httponly=True,
                    samesite='Lax',
                    secure=True
                )

                print(f"[Auth] Login successful for user: {user[1]}", file=sys.stderr)
                return response, 200
            else:
                cursor.close()
                conn.close()
                print(f"[Auth] Login failed for user: {username}", file=sys.stderr)
                return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

        except Exception as e:
            print(f"[Auth] Login error: {e}", file=sys.stderr)
            import traceback
            traceback.print_exc(file=sys.stderr)
            return jsonify({'success': False, 'message': 'Server error'}), 500

    elif request.method == 'GET':
        # Verify session
        try:
            session_token = request.cookies.get('session_token')

            if not session_token or session_token not in sessions:
                return jsonify({'authenticated': False}), 401

            session = sessions[session_token]

            # Check if session expired
            if datetime.now() > session['expires_at']:
                del sessions[session_token]
                return jsonify({'authenticated': False}), 401

            return jsonify({
                'authenticated': True,
                'username': session['username']
            }), 200

        except Exception as e:
            print(f"[Auth] Session verification error: {e}", file=sys.stderr)
            return jsonify({'authenticated': False}), 401

    elif request.method == 'DELETE':
        # Logout
        try:
            session_token = request.cookies.get('session_token')

            if session_token and session_token in sessions:
                username = sessions[session_token]['username']
                del sessions[session_token]
                print(f"[Auth] Logout successful for user: {username}", file=sys.stderr)

            response = make_response(jsonify({
                'success': True,
                'message': 'Logout successful'
            }))
            response.set_cookie('session_token', '', max_age=0)

            return response, 200

        except Exception as e:
            print(f"[Auth] Logout error: {e}", file=sys.stderr)
            return jsonify({'success': False, 'message': 'Server error'}), 500

    return jsonify({'success': False, 'message': 'Method not allowed'}), 405

@app.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'service': 'auth'}), 200

# For local testing
if __name__ == '__main__':
    app.run(debug=True, port=5001)
