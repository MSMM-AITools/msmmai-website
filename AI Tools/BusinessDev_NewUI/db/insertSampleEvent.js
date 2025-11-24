/**
 * Insert a sample event for testing
 */
require('dotenv').config();
const db = require('./connection');

async function insertSampleEvent() {
    console.log('Inserting sample event...\n');

    try {
        const startDate = new Date();
        const endDate = new Date(startDate.getTime() + (2 * 60 * 60 * 1000)); // 2 hours later

        const sql = `
            INSERT INTO "${process.env.ORACLE_SCHEMA}"."EVENTS" 
            (TITLE, DESCRIPTION, START_DATE, END_DATE, LOCATION, COLOR, ALL_DAY)
            VALUES 
            (:title, :description, :startDate, :endDate, :location, :color, :allDay)
        `;

        const binds = {
            title: 'Welcome to Your Calendar',
            description: 'This is a sample event to demonstrate the calendar functionality. You can create, edit, and delete events.',
            startDate: startDate,
            endDate: endDate,
            location: 'MSMM Office',
            color: '#10B981',
            allDay: 'N'
        };

        await db.executeQuery(sql, binds);
        console.log('✅ Sample event inserted successfully!');

        // Verify
        const verifySQL = `SELECT * FROM "${process.env.ORACLE_SCHEMA}"."EVENTS" ORDER BY CREATED_DATE DESC`;
        const result = await db.executeQuery(verifySQL);
        
        console.log(`\n📊 Total events in database: ${result.rows.length}`);
        if (result.rows.length > 0) {
            const event = result.rows[0];
            console.log('\nMost recent event:');
            console.log(`  ID: ${event.EVENT_ID}`);
            console.log(`  Title: ${event.TITLE}`);
            console.log(`  Start: ${event.START_DATE}`);
            console.log(`  End: ${event.END_DATE}`);
            console.log(`  Location: ${event.LOCATION}`);
            console.log(`  Color: ${event.COLOR}`);
        }

    } catch (err) {
        console.error('❌ Error:', err.message);
        throw err;
    }
}

insertSampleEvent()
    .then(() => {
        console.log('\n✅ Done!');
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });

