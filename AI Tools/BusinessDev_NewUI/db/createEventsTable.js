/**
 * Create EVENTS table in the database
 */
require('dotenv').config();
const db = require('./connection');
const fs = require('fs');
const path = require('path');

async function createEventsTable() {
    console.log('🚀 Starting EVENTS table creation...\n');

    try {
        // Check if table already exists
        console.log('Checking if EVENTS table already exists...');
        const tableExists = await db.tableExists('EVENTS');
        
        if (tableExists) {
            console.log('⚠️  EVENTS table already exists!');
            const readline = require('readline');
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            
            return new Promise((resolve) => {
                rl.question('Do you want to drop and recreate it? (yes/no): ', async (answer) => {
                    rl.close();
                    
                    if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
                        console.log('\n🗑️  Dropping existing EVENTS table...');
                        await db.executeQuery(`DROP TABLE "${process.env.ORACLE_SCHEMA}"."EVENTS" CASCADE CONSTRAINTS`);
                        console.log('✅ Table dropped successfully\n');
                        await createTable();
                    } else {
                        console.log('❌ Operation cancelled. Existing table preserved.');
                    }
                    resolve();
                });
            });
        } else {
            await createTable();
        }
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

async function createTable() {
    try {
        console.log('📝 Creating EVENTS table...\n');

        // Create table
        const createTableSQL = `
            CREATE TABLE "${process.env.ORACLE_SCHEMA}"."EVENTS" (
                EVENT_ID NUMBER(22) GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                TITLE VARCHAR2(800) NOT NULL,
                DESCRIPTION VARCHAR2(2400),
                START_DATE DATE NOT NULL,
                END_DATE DATE NOT NULL,
                LOCATION VARCHAR2(400),
                COLOR VARCHAR2(20) DEFAULT '#3B82F6',
                ALL_DAY VARCHAR2(1) DEFAULT 'N' CHECK (ALL_DAY IN ('Y', 'N')),
                CREATED_DATE DATE DEFAULT SYSDATE,
                MODIFIED_DATE DATE DEFAULT SYSDATE
            )
        `;
        await db.executeQuery(createTableSQL);
        console.log('✅ Table created successfully');

        // Add comments
        console.log('📝 Adding table comments...');
        await db.executeQuery(`COMMENT ON TABLE "${process.env.ORACLE_SCHEMA}"."EVENTS" IS 'Calendar events for Business Development tracking'`);
        await db.executeQuery(`COMMENT ON COLUMN "${process.env.ORACLE_SCHEMA}"."EVENTS".EVENT_ID IS 'Unique event identifier (auto-generated)'`);
        await db.executeQuery(`COMMENT ON COLUMN "${process.env.ORACLE_SCHEMA}"."EVENTS".TITLE IS 'Event title/name'`);
        await db.executeQuery(`COMMENT ON COLUMN "${process.env.ORACLE_SCHEMA}"."EVENTS".DESCRIPTION IS 'Event description or notes'`);
        await db.executeQuery(`COMMENT ON COLUMN "${process.env.ORACLE_SCHEMA}"."EVENTS".START_DATE IS 'Event start date/time'`);
        await db.executeQuery(`COMMENT ON COLUMN "${process.env.ORACLE_SCHEMA}"."EVENTS".END_DATE IS 'Event end date/time'`);
        await db.executeQuery(`COMMENT ON COLUMN "${process.env.ORACLE_SCHEMA}"."EVENTS".LOCATION IS 'Event location'`);
        await db.executeQuery(`COMMENT ON COLUMN "${process.env.ORACLE_SCHEMA}"."EVENTS".COLOR IS 'Event color code for calendar display'`);
        await db.executeQuery(`COMMENT ON COLUMN "${process.env.ORACLE_SCHEMA}"."EVENTS".ALL_DAY IS 'Y if all-day event, N otherwise'`);
        await db.executeQuery(`COMMENT ON COLUMN "${process.env.ORACLE_SCHEMA}"."EVENTS".CREATED_DATE IS 'Date record was created'`);
        await db.executeQuery(`COMMENT ON COLUMN "${process.env.ORACLE_SCHEMA}"."EVENTS".MODIFIED_DATE IS 'Date record was last modified'`);
        console.log('✅ Comments added');

        // Create indexes
        console.log('📝 Creating indexes...');
        await db.executeQuery(`CREATE INDEX IDX_EVENTS_START_DATE ON "${process.env.ORACLE_SCHEMA}"."EVENTS"(START_DATE)`);
        await db.executeQuery(`CREATE INDEX IDX_EVENTS_END_DATE ON "${process.env.ORACLE_SCHEMA}"."EVENTS"(END_DATE)`);
        console.log('✅ Indexes created');

        // Create trigger
        console.log('📝 Creating trigger for auto-update of MODIFIED_DATE...');
        const triggerSQL = `
            CREATE OR REPLACE TRIGGER "${process.env.ORACLE_SCHEMA}"."TRG_EVENTS_MODIFIED"
            BEFORE UPDATE ON "${process.env.ORACLE_SCHEMA}"."EVENTS"
            FOR EACH ROW
            BEGIN
                :NEW.MODIFIED_DATE := SYSDATE;
            END;
        `;
        await db.executeQuery(triggerSQL);
        console.log('✅ Trigger created');

        // Verify table structure
        console.log('\n📊 Verifying table structure...');
        const structure = await db.getTableStructure('EVENTS');
        console.log(`✅ EVENTS table created with ${structure.length} columns:\n`);
        structure.forEach(col => {
            const nullable = col.NULLABLE === 'Y' ? 'NULLABLE' : 'NOT NULL';
            console.log(`   - ${col.COLUMN_NAME}: ${col.DATA_TYPE}${col.DATA_LENGTH ? `(${col.DATA_LENGTH})` : ''} ${nullable}`);
        });

        // Insert sample event
        console.log('\n📝 Inserting sample event...');
        const sampleSQL = `
            INSERT INTO "${process.env.ORACLE_SCHEMA}"."EVENTS" 
            (TITLE, DESCRIPTION, START_DATE, END_DATE, LOCATION, COLOR, ALL_DAY)
            VALUES 
            ('Welcome to Calendar', 'This is a sample event to get you started', SYSDATE, SYSDATE + 1, 'Office', '#10B981', 'N')
        `;
        await db.executeQuery(sampleSQL);
        console.log('✅ Sample event inserted');

        console.log('\n✅ EVENTS table creation completed successfully!');
        console.log('🎉 Your calendar is now ready to use!\n');

    } catch (err) {
        console.error('❌ Error creating table:', err.message);
        throw err;
    }
}

// Run the script
createEventsTable()
    .then(() => {
        console.log('Done!');
        process.exit(0);
    })
    .catch((err) => {
        console.error('Failed:', err);
        process.exit(1);
    });

