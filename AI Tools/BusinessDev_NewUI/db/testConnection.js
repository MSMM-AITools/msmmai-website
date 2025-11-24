const db = require('./connection');

/**
 * Test database connection and verify tables
 */
async function testDatabaseConnection() {
    console.log('='.repeat(60));
    console.log('ORACLE DATABASE CONNECTION TEST');
    console.log('='.repeat(60));
    console.log();

    try {
        // Test basic connection
        console.log('1. Testing database connection...');
        const connection = await db.getConnection();
        console.log('   ✓ Connection successful!');
        console.log();

        // Get database version
        const versionResult = await connection.execute('SELECT * FROM V$VERSION WHERE ROWNUM = 1');
        console.log('   Database Version:', versionResult.rows[0][0]);
        console.log();

        await connection.close();

        // Check ORGANIZATION table
        console.log('2. Checking ORGANIZATION table...');
        const orgExists = await db.tableExists('ORGANIZATION');

        if (orgExists) {
            console.log('   ✓ ORGANIZATION table exists!');

            // Get table structure
            const orgStructure = await db.getTableStructure('ORGANIZATION');
            console.log('   Columns:', orgStructure.length);
            console.log();
            console.log('   Table Structure:');
            orgStructure.forEach(col => {
                console.log(`   - ${col.COLUMN_NAME}: ${col.DATA_TYPE}(${col.DATA_LENGTH}) ${col.NULLABLE === 'N' ? 'NOT NULL' : 'NULLABLE'}`);
            });
            console.log();

            // Fetch sample data
            try {
                const orgData = await db.fetchTableData('ORGANIZATION', 5);
                console.log(`   Sample Data (first ${orgData.length} rows):`);
                console.log('   ', JSON.stringify(orgData, null, 2));
                console.log();
            } catch (err) {
                console.log('   ⚠ Could not fetch sample data:', err.message);
                console.log();
            }
        } else {
            console.log('   ✗ ORGANIZATION table does NOT exist!');
            console.log();
        }

        // Check PROPOSALS table
        console.log('3. Checking PROPOSALS table...');
        const proposalsExists = await db.tableExists('PROPOSALS');

        if (proposalsExists) {
            console.log('   ✓ PROPOSALS table exists!');

            // Get table structure
            const proposalsStructure = await db.getTableStructure('PROPOSALS');
            console.log('   Columns:', proposalsStructure.length);
            console.log();
            console.log('   Table Structure:');
            proposalsStructure.forEach(col => {
                console.log(`   - ${col.COLUMN_NAME}: ${col.DATA_TYPE}(${col.DATA_LENGTH}) ${col.NULLABLE === 'N' ? 'NOT NULL' : 'NULLABLE'}`);
            });
            console.log();

            // Fetch sample data
            try {
                const proposalsData = await db.fetchTableData('PROPOSALS', 5);
                console.log(`   Sample Data (first ${proposalsData.length} rows):`);
                console.log('   ', JSON.stringify(proposalsData, null, 2));
                console.log();
            } catch (err) {
                console.log('   ⚠ Could not fetch sample data:', err.message);
                console.log();
            }
        } else {
            console.log('   ✗ PROPOSALS table does NOT exist!');
            console.log();
        }

        // Summary
        console.log('='.repeat(60));
        console.log('SUMMARY');
        console.log('='.repeat(60));
        console.log(`Connection: ✓ SUCCESS`);
        console.log(`ORGANIZATION table: ${orgExists ? '✓ EXISTS' : '✗ MISSING'}`);
        console.log(`PROPOSALS table: ${proposalsExists ? '✓ EXISTS' : '✗ MISSING'}`);
        console.log('='.repeat(60));

        if (orgExists && proposalsExists) {
            console.log();
            console.log('✓ All required tables are present and accessible!');
        } else {
            console.log();
            console.log('⚠ Some required tables are missing!');
        }

    } catch (err) {
        console.error('✗ Error during testing:', err);
        console.error();
        console.error('Error details:', err.message);
        process.exit(1);
    }
}

// Run the test
testDatabaseConnection()
    .then(() => {
        console.log();
        console.log('Test completed successfully!');
        process.exit(0);
    })
    .catch((err) => {
        console.error('Test failed:', err);
        process.exit(1);
    });
