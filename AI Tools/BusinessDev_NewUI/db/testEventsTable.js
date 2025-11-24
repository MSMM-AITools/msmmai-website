/**
 * Test EVENTS table
 */
require('dotenv').config();
const db = require('./connection');

async function testEventsTable() {
    console.log('Testing EVENTS table...\n');

    try {
        // Check if table exists
        const exists = await db.tableExists('EVENTS');
        console.log(`Table exists: ${exists}`);

        if (!exists) {
            console.log('❌ EVENTS table does not exist!');
            return;
        }

        // Get table structure
        const structure = await db.getTableStructure('EVENTS');
        console.log(`\nTable has ${structure.length} columns`);

        // Fetch all events
        const sql = `SELECT * FROM "${process.env.ORACLE_SCHEMA}"."EVENTS" ORDER BY START_DATE DESC`;
        const result = await db.executeQuery(sql);
        
        console.log(`\nFound ${result.rows.length} events:`);
        if (result.rows.length > 0) {
            result.rows.forEach((event, index) => {
                console.log(`\nEvent ${index + 1}:`);
                console.log(`  ID: ${event.EVENT_ID}`);
                console.log(`  Title: ${event.TITLE}`);
                console.log(`  Start: ${event.START_DATE}`);
                console.log(`  End: ${event.END_DATE}`);
                console.log(`  Location: ${event.LOCATION || 'N/A'}`);
                console.log(`  Color: ${event.COLOR}`);
                console.log(`  All Day: ${event.ALL_DAY}`);
            });
        } else {
            console.log('No events found in the table.');
        }

        console.log('\n✅ Test completed successfully!');
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

testEventsTable()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });

