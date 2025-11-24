require('dotenv').config();
const oracledb = require('oracledb');

// Configure oracledb to fetch CLOBs as strings automatically
oracledb.fetchAsString = [ oracledb.CLOB ];

// Configure Oracle connection (Thin Mode - no Oracle Client required)
const dbConfig = {
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: `${process.env.ORACLE_HOST}:${process.env.ORACLE_PORT}/${process.env.ORACLE_SERVICE_NAME}`,
    // Add SYSDBA privilege when connecting as SYS
    privilege: process.env.ORACLE_USER.toUpperCase() === 'SYS' ? oracledb.SYSDBA : undefined,
    // Connection timeout settings (in milliseconds)
    connectTimeout: 60000, // 60 seconds
    callTimeout: 60000     // 60 seconds for each database call
};

// Pool configuration for better connection management
const poolConfig = {
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: `${process.env.ORACLE_HOST}:${process.env.ORACLE_PORT}/${process.env.ORACLE_SERVICE_NAME}`,
    privilege: process.env.ORACLE_USER.toUpperCase() === 'SYS' ? oracledb.SYSDBA : undefined,
    poolMin: 1,
    poolMax: 10,
    poolIncrement: 1,
    connectTimeout: 60000,
    callTimeout: 60000,
    poolTimeout: 60
};

let pool = null;

/**
 * Initialize connection pool
 */
async function initializePool() {
    if (!pool) {
        try {
            pool = await oracledb.createPool(poolConfig);
            console.log('Connection pool created successfully');
        } catch (err) {
            console.error('Error creating connection pool:', err);
            throw err;
        }
    }
    return pool;
}

/**
 * Close connection pool
 */
async function closePool() {
    if (pool) {
        try {
            await pool.close(10);
            pool = null;
            console.log('Connection pool closed successfully');
        } catch (err) {
            console.error('Error closing connection pool:', err);
            throw err;
        }
    }
}

/**
 * Get a database connection (with retry logic)
 */
async function getConnection(retries = 3) {
    let lastError;

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            console.log(`Attempting to connect to Oracle Database (attempt ${attempt}/${retries})...`);
            const connection = await oracledb.getConnection(dbConfig);
            console.log('Successfully connected to Oracle Database');
            return connection;
        } catch (err) {
            lastError = err;
            console.error(`Connection attempt ${attempt} failed:`, err.message);

            if (attempt < retries) {
                const delay = attempt * 2000; // Progressive delay: 2s, 4s, 6s
                console.log(`Waiting ${delay/1000} seconds before retry...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    console.error('All connection attempts failed');
    throw lastError;
}

/**
 * Get a connection from the pool
 */
async function getPoolConnection() {
    try {
        if (!pool) {
            await initializePool();
        }
        const connection = await pool.getConnection();
        console.log('Successfully got connection from pool');
        return connection;
    } catch (err) {
        console.error('Error getting connection from pool:', err);
        throw err;
    }
}

/**
 * Execute a query and return results
 */
async function executeQuery(sql, binds = [], options = {}) {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(sql, binds, {
            outFormat: oracledb.OUT_FORMAT_OBJECT,
            autoCommit: true, // Auto-commit transactions
            ...options
        });
        return result;
    } catch (err) {
        console.error('Error executing query:', err);
        throw err;
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error closing connection:', err);
            }
        }
    }
}

/**
 * Check if a table exists in the database
 */
async function tableExists(tableName) {
    const sql = `
        SELECT COUNT(*) as COUNT
        FROM ALL_TABLES
        WHERE UPPER(TABLE_NAME) = UPPER(:tableName)
        AND UPPER(OWNER) = UPPER(:owner)
    `;

    try {
        const result = await executeQuery(sql, {
            tableName: tableName,
            owner: process.env.ORACLE_SCHEMA || process.env.ORACLE_USER
        });

        return result.rows[0].COUNT > 0;
    } catch (err) {
        console.error(`Error checking if table ${tableName} exists:`, err);
        return false;
    }
}

/**
 * Get table structure
 */
async function getTableStructure(tableName) {
    const sql = `
        SELECT COLUMN_NAME, DATA_TYPE, DATA_LENGTH, NULLABLE
        FROM ALL_TAB_COLUMNS
        WHERE UPPER(TABLE_NAME) = UPPER(:tableName)
        AND UPPER(OWNER) = UPPER(:owner)
        ORDER BY COLUMN_ID
    `;

    try {
        const result = await executeQuery(sql, {
            tableName: tableName,
            owner: process.env.ORACLE_SCHEMA || process.env.ORACLE_USER
        });

        return result.rows;
    } catch (err) {
        console.error(`Error getting table structure for ${tableName}:`, err);
        throw err;
    }
}

/**
 * Fetch data from a table
 */
async function fetchTableData(tableName, limit = 10) {
    const schema = process.env.ORACLE_SCHEMA || process.env.ORACLE_USER;
    const sql = `SELECT * FROM "${schema}"."${tableName}" WHERE ROWNUM <= :limit`;

    try {
        const result = await executeQuery(sql, { limit });
        return result.rows;
    } catch (err) {
        console.error(`Error fetching data from ${tableName}:`, err);
        throw err;
    }
}

module.exports = {
    getConnection,
    getPoolConnection,
    initializePool,
    closePool,
    executeQuery,
    tableExists,
    getTableStructure,
    fetchTableData,
    oracledb
};
