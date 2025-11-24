/**
 * Add NOTES column to EVENTS table
 */
require('dotenv').config();
const db = require('./connection');

async function addNotesColumn() {
    console.log('🚀 Adding NOTES column to EVENTS table...\n');

    try {
        // Check if column already exists
        console.log('Checking if NOTES column already exists...');
        const checkSQL = `
            SELECT COUNT(*) as COUNT
            FROM ALL_TAB_COLUMNS
            WHERE UPPER(TABLE_NAME) = 'EVENTS'
            AND UPPER(COLUMN_NAME) = 'NOTES'
            AND UPPER(OWNER) = UPPER(:owner)
        `;
        
        const result = await db.executeQuery(checkSQL, {
            owner: process.env.ORACLE_SCHEMA || process.env.ORACLE_USER
        });

        if (result.rows[0].COUNT > 0) {
            console.log('⚠️  NOTES column already exists!');
            console.log('✅ No changes needed.\n');
            return;
        }

        console.log('📝 Adding NOTES CLOB column...');
        
        // Add NOTES column as CLOB
        const addColumnSQL = `
            ALTER TABLE "${process.env.ORACLE_SCHEMA}"."EVENTS"
            ADD NOTES CLOB
        `;
        await db.executeQuery(addColumnSQL);
        console.log('✅ NOTES column added successfully');

        // Add comment for documentation
        console.log('📝 Adding column comment...');
        await db.executeQuery(`
            COMMENT ON COLUMN "${process.env.ORACLE_SCHEMA}"."EVENTS".NOTES 
            IS 'Meeting minutes, notes, and detailed information (CLOB for large text)'
        `);
        console.log('✅ Comment added');

        // Verify the change
        console.log('\n📊 Verifying table structure...');
        const structure = await db.getTableStructure('EVENTS');
        const notesColumn = structure.find(col => col.COLUMN_NAME === 'NOTES');
        
        if (notesColumn) {
            console.log('✅ NOTES column verified:');
            console.log(`   - Column Name: ${notesColumn.COLUMN_NAME}`);
            console.log(`   - Data Type: ${notesColumn.DATA_TYPE}`);
            console.log(`   - Nullable: ${notesColumn.NULLABLE}`);
        }

        console.log('\n✅ NOTES column added successfully!');
        console.log('🎉 You can now store meeting minutes and detailed notes!\n');

    } catch (err) {
        console.error('❌ Error:', err.message);
        throw err;
    }
}

addNotesColumn()
    .then(() => {
        console.log('Done!');
        process.exit(0);
    })
    .catch(err => {
        console.error('Failed:', err);
        process.exit(1);
    });

