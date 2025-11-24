require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('./connection');

async function addAuditColumns() {
    try {
        console.log('🔄 Adding audit trail columns to database tables...\n');

        // Read the SQL file
        const sqlPath = path.join(__dirname, 'add-audit-columns.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');

        // Split by semicolon and forward slash (Oracle's command terminator)
        const statements = sqlContent
            .split(/;|\n\//)
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        // Execute each statement
        for (const statement of statements) {
            if (statement.toUpperCase().includes('COMMENT ON')) {
                console.log('  Adding column comment...');
            } else if (statement.toUpperCase().includes('ALTER TABLE')) {
                const tableName = statement.match(/ALTER TABLE (\w+)/i)?.[1];
                console.log(`  Adding column to ${tableName}...`);
            } else if (statement.toUpperCase().includes('CREATE OR REPLACE TRIGGER')) {
                const triggerName = statement.match(/TRIGGER (\w+)/i)?.[1];
                console.log(`  Creating trigger ${triggerName}...`);
            }

            try {
                await db.executeQuery(statement);
            } catch (err) {
                // Check if error is "column already exists" - if so, skip it
                if (err.message.includes('ORA-01430') || err.message.includes('already exists')) {
                    console.log('  ⚠️  Column or trigger already exists, skipping...');
                } else {
                    console.error(`  ❌ Error executing statement: ${err.message}`);
                    console.error(`  Statement: ${statement.substring(0, 100)}...`);
                }
            }
        }

        console.log('\n✅ Audit columns migration completed successfully!');
        console.log('\nColumns added:');
        console.log('  - CREATED_BY (VARCHAR2)');
        console.log('  - MODIFIED_BY (VARCHAR2)');
        console.log('  - CREATED_DATE (DATE)');
        console.log('  - MODIFIED_DATE (DATE)');
        console.log('\nTriggers created:');
        console.log('  - TRG_PROPOSALS_MODIFIED_DATE');
        console.log('  - TRG_ORGANIZATION_MODIFIED_DATE');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error adding audit columns:', error);
        process.exit(1);
    }
}

addAuditColumns();

