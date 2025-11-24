const db = require('./connection');

/**
 * Simple connection test
 */
async function simpleTest() {
    console.log('='.repeat(60));
    console.log('SIMPLE ORACLE DATABASE CONNECTION TEST');
    console.log('='.repeat(60));
    console.log();

    console.log('Configuration:');
    console.log(`  Host: ${process.env.ORACLE_HOST}`);
    console.log(`  Port: ${process.env.ORACLE_PORT}`);
    console.log(`  Service: ${process.env.ORACLE_SERVICE_NAME}`);
    console.log(`  User: ${process.env.ORACLE_USER}`);
    console.log(`  Schema: ${process.env.ORACLE_SCHEMA}`);
    console.log();

    let connection;
    try {
        console.log('Attempting to connect...');
        console.log('(This may take up to 60 seconds)');
        console.log();

        connection = await db.getConnection();

        console.log('✓ Connection established!');
        console.log();

        // Try a simple query
        console.log('Testing with a simple query...');
        const result = await connection.execute('SELECT 1 AS TEST FROM DUAL');
        console.log('✓ Query successful!');
        console.log('  Result:', result.rows);
        console.log();

        console.log('='.repeat(60));
        console.log('SUCCESS: Database is accessible!');
        console.log('='.repeat(60));

    } catch (err) {
        console.error();
        console.error('='.repeat(60));
        console.error('ERROR: Connection failed');
        console.error('='.repeat(60));
        console.error();
        console.error('Error Code:', err.code || 'N/A');
        console.error('Error Message:', err.message);
        console.error();

        if (err.code === 'NJS-500' || err.message.includes('ETIMEDOUT')) {
            console.error('DIAGNOSIS: Connection timeout');
            console.error();
            console.error('Possible causes:');
            console.error('  1. Network firewall blocking connection');
            console.error('  2. Database server is down or unreachable');
            console.error('  3. VPN required but not connected');
            console.error('  4. Incorrect host/port configuration');
            console.error();
            console.error('Suggestions:');
            console.error('  - Check if you need to be on VPN');
            console.error('  - Verify firewall settings');
            console.error('  - Ping the database host: ping ' + process.env.ORACLE_HOST);
            console.error('  - Check if port 1521 is open');
        }

        process.exit(1);
    } finally {
        if (connection) {
            try {
                await connection.close();
                console.log('Connection closed.');
            } catch (err) {
                console.error('Error closing connection:', err.message);
            }
        }
    }
}

// Run the test
simpleTest()
    .then(() => {
        console.log();
        process.exit(0);
    })
    .catch((err) => {
        console.error('Unexpected error:', err);
        process.exit(1);
    });
