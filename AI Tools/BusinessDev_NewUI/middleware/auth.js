/**
 * Authentication Middleware for BusinessDev API
 * Verifies session tokens from database-backed sessions
 */

const oracledb = require('oracledb');
require('dotenv').config();

/**
 * Get database connection
 */
async function getDbConnection() {
    const config = {
        user: process.env.ORACLE_USER,
        password: process.env.ORACLE_PASSWORD,
        connectString: `${process.env.ORACLE_HOST}:${process.env.ORACLE_PORT}/${process.env.ORACLE_SERVICE_NAME}`,
        privilege: process.env.ORACLE_USER.toUpperCase() === 'SYS' ? oracledb.SYSDBA : undefined
    };

    return await oracledb.getConnection(config);
}

/**
 * Verify session token in database
 */
async function verifySession(sessionToken) {
    let connection;
    try {
        connection = await getDbConnection();

        const schema = process.env.ORACLE_SCHEMA || 'MSMM DASHBOARD';
        const sql = `
            SELECT USER_ID, USERNAME, EXPIRES_AT
            FROM "${schema}".USER_SESSIONS
            WHERE SESSION_ID = :token`;

        const result = await connection.execute(sql, { token: sessionToken }, {
            outFormat: oracledb.OUT_FORMAT_OBJECT
        });

        if (result.rows.length === 0) {
            return null;
        }

        const session = result.rows[0];

        // Check if session has expired
        const expiresAt = new Date(session.EXPIRES_AT);
        const now = new Date();

        if (now > expiresAt) {
            // Session expired, delete it
            await connection.execute(
                `DELETE FROM "${schema}".USER_SESSIONS WHERE SESSION_ID = :token`,
                { token: sessionToken },
                { autoCommit: true }
            );
            return null;
        }

        return {
            userId: session.USER_ID,
            username: session.USERNAME,
            expiresAt: session.EXPIRES_AT
        };
    } catch (err) {
        console.error('[Auth Middleware] Database error:', err);
        return null;
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('[Auth Middleware] Error closing connection:', err);
            }
        }
    }
}

/**
 * Authentication middleware
 * Checks for valid session token in cookies
 */
async function requireAuth(req, res, next) {
    try {
        // Get session token from cookie
        const sessionToken = req.cookies?.session_token;

        if (!sessionToken) {
            console.log('[Auth Middleware] No session token found');
            return res.status(401).json({
                success: false,
                authenticated: false,
                message: 'Authentication required'
            });
        }

        // Verify session in database
        const session = await verifySession(sessionToken);

        if (!session) {
            console.log('[Auth Middleware] Invalid or expired session token');
            return res.status(401).json({
                success: false,
                authenticated: false,
                message: 'Invalid or expired session'
            });
        }

        // Attach user info to request
        req.user = {
            userId: session.userId,
            username: session.username
        };

        console.log(`[Auth Middleware] Authenticated user: ${session.username}`);
        next();
    } catch (err) {
        console.error('[Auth Middleware] Error:', err);
        return res.status(500).json({
            success: false,
            authenticated: false,
            message: 'Authentication error'
        });
    }
}

module.exports = { requireAuth, verifySession };
