require('dotenv').config();
const db = require('./connection');

async function checkEvents() {
    try {
        const sql = `SELECT EVENT_ID, TITLE, NOTES FROM "${process.env.ORACLE_SCHEMA}"."EVENTS"`;
        const result = await db.executeQuery(sql);
        
        console.log(`Found ${result.rows.length} events:\n`);
        result.rows.forEach(event => {
            console.log(`ID: ${event.EVENT_ID}`);
            console.log(`Title: ${event.TITLE}`);
            console.log(`Has Notes: ${event.NOTES ? 'Yes' : 'No'}`);
            if (event.NOTES) {
                console.log(`Notes Preview: ${event.NOTES.substring(0, 100)}...`);
            }
            console.log('---');
        });
    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkEvents().then(() => process.exit(0));

