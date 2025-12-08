"""
Authentication middleware for Flask License Reminder Tool
Verifies session tokens from database-backed sessions
"""

import oracledb
import os
from datetime import datetime
from functools import wraps
from flask import request, jsonify, redirect, url_for
import logging

logger = logging.getLogger(__name__)

def get_db_connection():
    """Create and return a database connection"""
    try:
        dsn = oracledb.makedsn(
            os.getenv('ORACLE_HOST'),
            os.getenv('ORACLE_PORT'),
            service_name=os.getenv('ORACLE_SERVICE_NAME')
        )

        # When connecting as SYS, we need to specify SYSDBA mode
        if os.getenv('ORACLE_USER', '').upper() == 'SYS':
            connection = oracledb.connect(
                user=os.getenv('ORACLE_USER'),
                password=os.getenv('ORACLE_PASSWORD'),
                dsn=dsn,
                mode=oracledb.SYSDBA
            )
        else:
            connection = oracledb.connect(
                user=os.getenv('ORACLE_USER'),
                password=os.getenv('ORACLE_PASSWORD'),
                dsn=dsn
            )
        return connection
    except Exception as e:
        logger.error(f"Database connection error: {e}")
        raise

def verify_session(session_token):
    """Verify session token in database"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        schema = os.getenv('ORACLE_SCHEMA', 'MSMM DASHBOARD')
        sql = f'''
            SELECT USER_ID, USERNAME, EXPIRES_AT
            FROM "{schema}".USER_SESSIONS
            WHERE SESSION_ID = :token
        '''

        cursor.execute(sql, {'token': session_token})
        result = cursor.fetchone()

        if not result:
            cursor.close()
            conn.close()
            return None

        user_id, username, expires_at = result

        # Check if session has expired
        if datetime.now() > expires_at:
            # Session expired, delete it
            cursor.execute(
                f'DELETE FROM "{schema}".USER_SESSIONS WHERE SESSION_ID = :token',
                {'token': session_token}
            )
            conn.commit()
            cursor.close()
            conn.close()
            return None

        cursor.close()
        conn.close()

        return {
            'user_id': user_id,
            'username': username,
            'expires_at': expires_at
        }
    except Exception as e:
        logger.error(f"Session verification error: {e}")
        return None

def require_auth(f):
    """
    Decorator to require authentication for Flask routes
    Checks for valid session token in cookies
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Get session token from cookie
        session_token = request.cookies.get('session_token')

        if not session_token:
            # For API routes, return JSON error
            if request.path.startswith('/api'):
                return jsonify({
                    'success': False,
                    'authenticated': False,
                    'message': 'Authentication required'
                }), 401
            # For web routes, redirect to login
            return redirect('/login.html')

        # Verify session
        session = verify_session(session_token)

        if not session:
            # For API routes, return JSON error
            if request.path.startswith('/api'):
                return jsonify({
                    'success': False,
                    'authenticated': False,
                    'message': 'Invalid or expired session'
                }), 401
            # For web routes, redirect to login
            return redirect('/login.html')

        # Attach user info to request
        request.user = {
            'user_id': session['user_id'],
            'username': session['username']
        }

        logger.info(f"Authenticated user: {session['username']}")
        return f(*args, **kwargs)

    return decorated_function
