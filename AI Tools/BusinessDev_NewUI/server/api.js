require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const db = require('../db/connection');
const { requireAuth } = require('../middleware/auth');

const app = express();
const PORT = process.env.PORT || 3001;

/**
 * Convert object keys to lowercase
 */
function toLowerCaseKeys(obj) {
    if (Array.isArray(obj)) {
        return obj.map(item => toLowerCaseKeys(item));
    } else if (obj !== null && typeof obj === 'object') {
        return Object.keys(obj).reduce((acc, key) => {
            acc[key.toLowerCase()] = obj[key];
            return acc;
        }, {});
    }
    return obj;
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser());

// Serve static files from assets directory
app.use('/assets', express.static('assets'));

// Apply authentication middleware to all /api routes
app.use('/api', requireAuth);

/**
 * Get proposals with filters
 * Query params: category, archive, limit, offset
 */
app.get('/api/proposals', async (req, res) => {
    try {
        // Support both lowercase and uppercase parameter names
        const category = req.query.category || req.query.CATEGORY;
        const archive = req.query.archive || req.query.ARCHIVE;
        const stage = req.query.stage || req.query.STAGE;
        const stageIn = req.query.stage_in || req.query.STAGE_IN;
        const status = req.query.status || req.query.STATUS;
        const clientName = req.query.client_name || req.query.CLIENT_NAME;
        const prime = req.query.prime || req.query.PRIME;
        const subLike = req.query.sub_like || req.query.SUB_LIKE;

        let sql = `
            SELECT
                P.*,
                O.ORG_FULL_NAME AS CLIENT_NAME,
                O.ORG_TYPE AS ORG_TYPE
            FROM "${process.env.ORACLE_SCHEMA}"."PROPOSALS" P
            LEFT JOIN "${process.env.ORACLE_SCHEMA}"."ORGANIZATION" O ON P.ORG_ID = O.ORG_ID
            WHERE 1=1`;
        const binds = {};

        if (category) {
            sql += ` AND P.CATEGORY = :category`;
            binds.category = category;
        }

        if (archive !== undefined) {
            sql += ` AND P.ARCHIVE = :archive`;
            binds.archive = archive;
        }

        if (stage) {
            sql += ` AND P.STAGE = :stage`;
            binds.stage = stage;
        }

        if (stageIn) {
            // Handle array of stage values (for STAGE IN clause)
            // Express will automatically parse multiple parameters with the same name as an array
            const stageArray = Array.isArray(stageIn) ? stageIn : [stageIn];
            const stagePlaceholders = stageArray.map((_, i) => `:stageIn${i}`).join(', ');
            sql += ` AND P.STAGE IN (${stagePlaceholders})`;
            stageArray.forEach((value, i) => {
                binds[`stageIn${i}`] = value;
            });
        }

        if (status) {
            sql += ` AND P.STATUS = :status`;
            binds.status = status;
        }

        if (clientName) {
            sql += ` AND O.ORG_FULL_NAME = :clientName`;
            binds.clientName = clientName;
        }

        if (prime) {
            sql += ` AND P.PRIME = :prime`;
            binds.prime = prime;
        }

        if (subLike) {
            sql += ` AND P.SUB LIKE :subLike`;
            binds.subLike = `%${subLike}%`;
        }

        sql += ` ORDER BY O.ORG_TYPE, P.TITLE`;

        const result = await db.executeQuery(sql, binds);

        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    } catch (err) {
        console.error('Error fetching proposals:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/**
 * Get table columns
 */
app.get('/api/proposals/columns', async (req, res) => {
    try {
        const structure = await db.getTableStructure('PROPOSALS');

        const columns = structure.map(col => ({
            name: col.COLUMN_NAME,
            type: col.DATA_TYPE,
            nullable: col.NULLABLE === 'Y',
            length: col.DATA_LENGTH
        }));

        // Add virtual columns
        columns.unshift({
            name: 'ACTION',
            type: 'VIRTUAL',
            nullable: false,
            length: 0
        });

        columns.push({
            name: 'CLIENT_NAME',
            type: 'VARCHAR2',
            nullable: true,
            length: 4000
        });

        columns.push({
            name: 'ORG_TYPE',
            type: 'VARCHAR2',
            nullable: true,
            length: 200
        });

        res.json({
            success: true,
            data: columns
        });
    } catch (err) {
        console.error('Error fetching columns:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/**
 * Get counts for dashboard cards
 */
app.get('/api/proposals/counts', async (req, res) => {
    try {
        const counts = {};

        // Get all proposals and count in JavaScript
        const allProposalsQuery = `SELECT CATEGORY, ARCHIVE, STAGE, STATUS, PRIME, SUB FROM "${process.env.ORACLE_SCHEMA}"."PROPOSALS"`;
        const allProposalsResult = await db.executeQuery(allProposalsQuery);

        const rows = allProposalsResult.rows;

        // Count Future Pursuits
        counts.futurePursuits = rows.filter(row => row.CATEGORY === 'Pursuits' && row.ARCHIVE === 'N').length;

        // Count Archived Pursuits
        counts.archivedPursuits = rows.filter(row => row.CATEGORY === 'Pursuits' && row.ARCHIVE === 'Y').length;

        // Count Active Proposals
        counts.activeProposals = rows.filter(row => row.CATEGORY === 'Proposal Submitted' && row.ARCHIVE === 'N').length;

        // Count Archived Proposals
        counts.archivedProposals = rows.filter(row => row.CATEGORY === 'Proposal Submitted' && row.ARCHIVE === 'Y').length;

        // Count Multi-use Contracts
        counts.activePrimeMultiuse = rows.filter(row => row.CATEGORY === 'Proposal Submitted' && row.ARCHIVE === 'N' && row.STAGE === 'Multi-Use Contract' && row.PRIME === 'MSMM').length;
        counts.activeSubMultiuse = rows.filter(row => row.CATEGORY === 'Proposal Submitted' && row.ARCHIVE === 'N' && row.STAGE === 'Multi-Use Contract' && row.SUB && row.SUB.includes('MSMM')).length;
        counts.archivedPrimeMultiuse = rows.filter(row => row.CATEGORY === 'Proposal Submitted' && row.ARCHIVE === 'Y' && row.STAGE === 'Multi-Use Contract' && row.PRIME === 'MSMM').length;
        counts.archivedSubMultiuse = rows.filter(row => row.CATEGORY === 'Proposal Submitted' && row.ARCHIVE === 'Y' && row.STAGE === 'Multi-Use Contract' && row.SUB && row.SUB.includes('MSMM')).length;

        // Count AE Selected List
        counts.activeAESelected = rows.filter(row => row.CATEGORY === 'Proposal Submitted' && row.ARCHIVE === 'N' && row.STAGE === 'AE Selected List').length;
        counts.archivedAESelected = rows.filter(row => row.CATEGORY === 'Proposal Submitted' && row.ARCHIVE === 'Y' && row.STAGE === 'AE Selected List').length;

        // Count Single Use Contracts
        counts.activeSingleUse = rows.filter(row => row.CATEGORY === 'Proposal Submitted' && row.ARCHIVE === 'N' && row.STAGE === 'Single Use Contract (Project)').length;
        counts.archivedSingleUse = rows.filter(row => row.CATEGORY === 'Proposal Submitted' && row.ARCHIVE === 'Y' && row.STAGE === 'Single Use Contract (Project)').length;

        // Count Fee Proposals
        counts.activeFeeProposals = rows.filter(row => row.CATEGORY === 'Fee Proposal' && row.ARCHIVE === 'N').length;
        counts.archivedFeeProposals = rows.filter(row => row.CATEGORY === 'Fee Proposal' && row.ARCHIVE === 'Y').length;

        // Count Project Avenue
        counts.projectAvenue = rows.filter(row => 
            row.CATEGORY === 'Proposal Submitted' && 
            row.ARCHIVE === 'N' && 
            row.STATUS === 'Awarded' && 
            (row.STAGE === 'AE Selected List' || row.STAGE === 'Multi-Use Contract' || row.STAGE === 'Single Use Contract (Project)')
        ).length;

        res.json({
            success: true,
            data: counts
        });
    } catch (err) {
        console.error('Error fetching counts:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/**
 * Get organizations
 */
app.get('/api/organizations', async (req, res) => {
    try {
        const sql = `SELECT * FROM "${process.env.ORACLE_SCHEMA}"."ORGANIZATION" ORDER BY ORG_ID`;
        const result = await db.executeQuery(sql);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (err) {
        console.error('Error fetching organizations:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/**
 * Get Project Avenue organizations with counts
 */
app.get('/api/project-avenue/organizations', async (req, res) => {
    try {
        const sql = `
            SELECT 
                O.ORG_FULL_NAME,
                O.ORG_FULL_NAME || ' (' || COUNT(O.ORG_FULL_NAME) || ')' AS OLABEL,
                COUNT(O.ORG_FULL_NAME) AS COUNT
            FROM "${process.env.ORACLE_SCHEMA}"."PROPOSALS" P
            LEFT JOIN "${process.env.ORACLE_SCHEMA}"."ORGANIZATION" O ON O.ORG_ID = P.ORG_ID
            WHERE P.CATEGORY = 'Proposal Submitted' 
                AND P.ARCHIVE = 'N' 
                AND P.STATUS = 'Awarded'
                AND (P.STAGE = 'AE Selected List' OR P.STAGE = 'Multi-Use Contract' OR P.STAGE = 'Single Use Contract (Project)')
            GROUP BY O.ORG_FULL_NAME
            ORDER BY O.ORG_FULL_NAME`;
        
        const result = await db.executeQuery(sql);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (err) {
        console.error('Error fetching Project Avenue organizations:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/**
 * Get single organization by ID
 */
app.get('/api/organizations/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const sql = `SELECT * FROM "${process.env.ORACLE_SCHEMA}"."ORGANIZATION" WHERE ORG_ID = :id`;
        const result = await db.executeQuery(sql, { id });

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Organization not found'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (err) {
        console.error('Error fetching organization:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/**
 * Create new organization
 */
app.post('/api/organizations', async (req, res) => {
    try {
        const { ORG_FULL_NAME, ORG_ABBREVIATION, ORG_TYPE, ORG_INACTIVE_DATE } = req.body;

        // Validate required fields
        if (!ORG_FULL_NAME) {
            return res.status(400).json({
                success: false,
                error: 'ORG_FULL_NAME is required'
            });
        }

        // Get next ORG_ID
        const maxIdSql = `SELECT NVL(MAX(ORG_ID), 0) + 1 AS NEXT_ID FROM "${process.env.ORACLE_SCHEMA}"."ORGANIZATION"`;
        const maxIdResult = await db.executeQuery(maxIdSql);
        const nextId = maxIdResult.rows[0].NEXT_ID || maxIdResult.rows[0].next_id;

        // Insert new organization
        const insertSql = `
            INSERT INTO "${process.env.ORACLE_SCHEMA}"."ORGANIZATION"
            (ORG_ID, ORG_FULL_NAME, ORG_ABBREVIATION, ORG_TYPE, ORG_INACTIVE_DATE)
            VALUES (:ORG_ID, :ORG_FULL_NAME, :ORG_ABBREVIATION, :ORG_TYPE, :ORG_INACTIVE_DATE)`;

        await db.executeQuery(insertSql, {
            ORG_ID: nextId,
            ORG_FULL_NAME,
            ORG_ABBREVIATION: ORG_ABBREVIATION || null,
            ORG_TYPE: ORG_TYPE || null,
            ORG_INACTIVE_DATE: ORG_INACTIVE_DATE || null
        });

        res.json({
            success: true,
            message: 'Organization created successfully',
            data: { ORG_ID: nextId }
        });
    } catch (err) {
        console.error('Error creating organization:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/**
 * Update organization
 */
app.put('/api/organizations/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { ORG_FULL_NAME, ORG_ABBREVIATION, ORG_TYPE, ORG_INACTIVE_DATE } = req.body;

        // Build update query
        const updateSql = `
            UPDATE "${process.env.ORACLE_SCHEMA}"."ORGANIZATION"
            SET ORG_FULL_NAME = :ORG_FULL_NAME,
                ORG_ABBREVIATION = :ORG_ABBREVIATION,
                ORG_TYPE = :ORG_TYPE,
                ORG_INACTIVE_DATE = :ORG_INACTIVE_DATE
            WHERE ORG_ID = :ORG_ID`;

        await db.executeQuery(updateSql, {
            ORG_ID: id,
            ORG_FULL_NAME,
            ORG_ABBREVIATION: ORG_ABBREVIATION || null,
            ORG_TYPE: ORG_TYPE || null,
            ORG_INACTIVE_DATE: ORG_INACTIVE_DATE || null
        });

        res.json({
            success: true,
            message: 'Organization updated successfully'
        });
    } catch (err) {
        console.error('Error updating organization:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/**
 * Delete organization
 */
app.delete('/api/organizations/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if organization is used in proposals
        const checkSql = `SELECT COUNT(*) as COUNT FROM "${process.env.ORACLE_SCHEMA}"."PROPOSALS" WHERE ORG_ID = :id`;
        const checkResult = await db.executeQuery(checkSql, { id });
        const count = checkResult.rows[0].COUNT || checkResult.rows[0].count;

        if (count > 0) {
            return res.status(400).json({
                success: false,
                error: `Cannot delete organization. It is referenced by ${count} proposal(s).`
            });
        }

        // Delete organization
        const deleteSql = `DELETE FROM "${process.env.ORACLE_SCHEMA}"."ORGANIZATION" WHERE ORG_ID = :id`;
        await db.executeQuery(deleteSql, { id });

        res.json({
            success: true,
            message: 'Organization deleted successfully'
        });
    } catch (err) {
        console.error('Error deleting organization:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/**
 * Get distinct ORG_TYPE values for dropdown
 */
app.get('/api/dropdowns/org-type', async (req, res) => {
    try {
        const sql = `
            SELECT DISTINCT ORG_TYPE as VALUE
            FROM "${process.env.ORACLE_SCHEMA}"."ORGANIZATION"
            WHERE ORG_TYPE IS NOT NULL
            ORDER BY ORG_TYPE`;
        
        const result = await db.executeQuery(sql);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (err) {
        console.error('Error fetching ORG_TYPE options:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/**
 * Get organization dropdown options for ORG_ID field
 */
app.get('/api/dropdowns/org-id', async (req, res) => {
    try {
        const sql = `
            SELECT
                O.ORG_TYPE||' | '||O.ORG_FULL_NAME||nvl2(O.ORG_ABBREVIATION,'-'||O.ORG_ABBREVIATION,'') AS label,
                O.ORG_ID AS value
            FROM "${process.env.ORACLE_SCHEMA}"."ORGANIZATION" O
            ORDER BY O.ORG_TYPE, O.ORG_FULL_NAME`;
        const result = await db.executeQuery(sql);

        res.json({
            success: true,
            data: toLowerCaseKeys(result.rows)
        });
    } catch (err) {
        console.error('Error fetching org-id dropdown:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/**
 * Get private entity options for PRIME/SUB fields
 */
app.get('/api/dropdowns/private-entities', async (req, res) => {
    try {
        const sql = `
            SELECT COALESCE(ORG_ABBREVIATION, ORG_FULL_NAME) AS value
            FROM "${process.env.ORACLE_SCHEMA}"."ORGANIZATION"
            WHERE ORG_TYPE = 'Private Entity'
            ORDER BY COALESCE(ORG_ABBREVIATION, ORG_FULL_NAME)`;
        const result = await db.executeQuery(sql);

        const lowerCaseRows = toLowerCaseKeys(result.rows);
        res.json({
            success: true,
            data: lowerCaseRows.map(row => row.value)
        });
    } catch (err) {
        console.error('Error fetching private entities:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/**
 * Get distinct status values
 */
app.get('/api/dropdowns/status', async (req, res) => {
    try {
        const sql = `
            SELECT DISTINCT STATUS
            FROM "${process.env.ORACLE_SCHEMA}"."PROPOSALS"
            WHERE STATUS IS NOT NULL
            ORDER BY STATUS`;
        const result = await db.executeQuery(sql);

        res.json({
            success: true,
            data: result.rows.map(row => row.STATUS)
        });
    } catch (err) {
        console.error('Error fetching status values:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/**
 * Get distinct stage values
 */
app.get('/api/dropdowns/stage', async (req, res) => {
    try {
        const sql = `
            SELECT DISTINCT STAGE
            FROM "${process.env.ORACLE_SCHEMA}"."PROPOSALS"
            WHERE STAGE IS NOT NULL
            ORDER BY STAGE`;
        const result = await db.executeQuery(sql);

        // Add predefined stage options
        const predefined = ['Multi-Use Contract', 'Fee Proposal', 'Single Use Contract (Project)', 'AE Selected List'];
        const dbValues = result.rows.map(row => row.STAGE);

        // Combine and deduplicate
        const allStages = [...new Set([...predefined, ...dbValues])].sort();

        res.json({
            success: true,
            data: allStages
        });
    } catch (err) {
        console.error('Error fetching stage values:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/**
 * Get single proposal by ID
 */
app.get('/api/proposals/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const sql = `
            SELECT
                P.*,
                O.ORG_FULL_NAME AS CLIENT_NAME,
                O.ORG_TYPE AS ORG_TYPE
            FROM "${process.env.ORACLE_SCHEMA}"."PROPOSALS" P
            LEFT JOIN "${process.env.ORACLE_SCHEMA}"."ORGANIZATION" O ON P.ORG_ID = O.ORG_ID
            WHERE P.PID = :id`;
        const result = await db.executeQuery(sql, { id });

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Proposal not found'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (err) {
        console.error('Error fetching proposal:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/**
 * Create new proposal
 */
app.post('/api/proposals', async (req, res) => {
    try {
        const data = req.body;

        // Build column names and values for INSERT
        // Exclude: CLIENT_NAME/ORG_TYPE (joined columns), audit columns (auto-generated by triggers)
        const excludeColumns = ['CLIENT_NAME', 'ORG_TYPE', 'CREATED_BY', 'MODIFIED_BY', 'CREATED_DATE', 'MODIFIED_DATE'];
        const columns = Object.keys(data).filter(key => !excludeColumns.includes(key));

        // Date columns that need TO_DATE conversion
        const dateColumns = ['SUBMITTED_DATE', 'EXPECTED_DUE_DATE', 'CONTRACT_EXP_DATE'];

        const placeholders = columns.map(col => {
            if (dateColumns.includes(col) && data[col] !== null && data[col] !== '') {
                return `TO_DATE(:${col}, 'YYYY-MM-DD')`;
            }
            return `:${col}`;
        });

        const sql = `
            INSERT INTO "${process.env.ORACLE_SCHEMA}"."PROPOSALS" (${columns.join(', ')})
            VALUES (${placeholders.join(', ')})`;

        // Build cleanData with only the columns we're inserting
        const cleanData = {};
        columns.forEach(col => {
            // Convert empty date strings to null
            if (dateColumns.includes(col) && data[col] === '') {
                cleanData[col] = null;
            } else {
                cleanData[col] = data[col];
            }
        });

        await db.executeQuery(sql, cleanData);

        res.json({
            success: true,
            message: 'Proposal created successfully'
        });
    } catch (err) {
        console.error('Error creating proposal:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/**
 * Update proposal
 */
app.put('/api/proposals/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        // Date columns that need TO_DATE conversion
        const dateColumns = ['SUBMITTED_DATE', 'EXPECTED_DUE_DATE', 'CONTRACT_EXP_DATE'];

        // Get columns to update (exclude PID and CLIENT_NAME)
        const updateColumns = Object.keys(data).filter(key => key !== 'PID' && key !== 'CLIENT_NAME');

        // Build SET clause for UPDATE
        const updates = updateColumns.map(key => {
                if (dateColumns.includes(key) && data[key] !== null && data[key] !== '') {
                    return `${key} = TO_DATE(:${key}, 'YYYY-MM-DD')`;
                }
                return `${key} = :${key}`;
            })
            .join(', ');

        const sql = `
            UPDATE "${process.env.ORACLE_SCHEMA}"."PROPOSALS"
            SET ${updates}
            WHERE PID = :id`;

        // Only include the columns that are in the UPDATE SET clause, plus id
        const binds = { id };
        
        // Fields that should be set to NULL when empty (allows clearing values)
        const nullableStringFields = ['PRIME', 'SUB', 'STATUS', 'STAGE', 'DETAILS', 'MSMM_POC', 'EXTERNAL_POC', 'SELECTION_CHANCE'];
        
        updateColumns.forEach(key => {
            // Convert empty strings to null for date fields
            if (dateColumns.includes(key) && data[key] === '') {
                binds[key] = null;
            // Convert empty strings to null for nullable string fields
            } else if (nullableStringFields.includes(key) && data[key] === '') {
                binds[key] = null;
            } else {
                binds[key] = data[key];
            }
        });

        await db.executeQuery(sql, binds);

        res.json({
            success: true,
            message: 'Proposal updated successfully'
        });
    } catch (err) {
        console.error('Error updating proposal:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/**
 * Delete proposal
 */
app.delete('/api/proposals/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const sql = `DELETE FROM "${process.env.ORACLE_SCHEMA}"."PROPOSALS" WHERE PID = :id`;
        await db.executeQuery(sql, { id });

        res.json({
            success: true,
            message: 'Proposal deleted successfully'
        });
    } catch (err) {
        console.error('Error deleting proposal:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/**
 * Archive pursuit and copy to proposal
 */
app.post('/api/proposals/:id/archive-and-copy-to-proposal', async (req, res) => {
    try {
        const { id } = req.params;

        // First, get the current pursuit data
        const getProposalSql = `
            SELECT * FROM "${process.env.ORACLE_SCHEMA}"."PROPOSALS" WHERE PID = :id`;
        const proposalResult = await db.executeQuery(getProposalSql, { id });

        if (proposalResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Pursuit not found'
            });
        }

        const pursuit = proposalResult.rows[0];

        // Archive the pursuit (set ARCHIVE to 'Y')
        const archiveSql = `
            UPDATE "${process.env.ORACLE_SCHEMA}"."PROPOSALS"
            SET ARCHIVE = 'Y'
            WHERE PID = :id`;
        await db.executeQuery(archiveSql, { id });

        // Create new proposal with same data except STATUS and CATEGORY
        // Exclude: PID (auto-generated), CLIENT_NAME/ORG_TYPE (joined columns), audit columns (auto-generated)
        const excludeColumns = ['PID', 'CLIENT_NAME', 'ORG_TYPE', 'CREATED_BY', 'MODIFIED_BY', 'CREATED_DATE', 'MODIFIED_DATE'];
        const columns = Object.keys(pursuit).filter(key => !excludeColumns.includes(key));

        // Build newData object with only the columns we're inserting
        const newData = {};
        columns.forEach(col => {
            newData[col] = pursuit[col];
        });
        newData.STATUS = 'Awaiting Verdict';
        newData.CATEGORY = 'Proposal Submitted';

        const placeholders = columns.map(col => `:${col}`);
        
        const insertSql = `
            INSERT INTO "${process.env.ORACLE_SCHEMA}"."PROPOSALS" (${columns.join(', ')})
            VALUES (${placeholders.join(', ')})`;

        await db.executeQuery(insertSql, newData);

        res.json({
            success: true,
            message: 'The Current Pursuit Record has been Archived and New Proposal has been created with the same information. Please go edit the new proposal.'
        });
    } catch (err) {
        console.error('Error archiving and copying pursuit:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/**
 * Copy pursuit to new pursuit
 */
app.post('/api/proposals/:id/copy-to-new-pursuit', async (req, res) => {
    try {
        const { id } = req.params;

        // Get the current pursuit data
        const getProposalSql = `
            SELECT * FROM "${process.env.ORACLE_SCHEMA}"."PROPOSALS" WHERE PID = :id`;
        const proposalResult = await db.executeQuery(getProposalSql, { id });

        if (proposalResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Pursuit not found'
            });
        }

        const pursuit = proposalResult.rows[0];

        // Create new pursuit with same data
        // Exclude: PID (auto-generated), CLIENT_NAME/ORG_TYPE (joined columns), audit columns (auto-generated)
        const excludeColumns = ['PID', 'CLIENT_NAME', 'ORG_TYPE', 'CREATED_BY', 'MODIFIED_BY', 'CREATED_DATE', 'MODIFIED_DATE'];
        const columns = Object.keys(pursuit).filter(key => !excludeColumns.includes(key));

        // Build newData object with only the columns we're inserting
        const newData = {};
        columns.forEach(col => {
            newData[col] = pursuit[col];
        });
        
        // Append " - Copy" to the title to distinguish from original
        console.log('Original title:', newData.TITLE);
        if (newData.TITLE) {
            newData.TITLE = newData.TITLE + ' - Copy';
        }
        console.log('New title:', newData.TITLE);

        const placeholders = columns.map(col => `:${col}`);
        const insertSql = `
            INSERT INTO "${process.env.ORACLE_SCHEMA}"."PROPOSALS" (${columns.join(', ')})
            VALUES (${placeholders.join(', ')})`;

        await db.executeQuery(insertSql, newData);

        res.json({
            success: true,
            message: 'A New Pursuit has been created with the same information. Please go edit the new pursuit.'
        });
    } catch (err) {
        console.error('Error copying pursuit:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/**
 * Get all events
 */
app.get('/api/events', async (req, res) => {
    try {
        const sql = `SELECT * FROM "${process.env.ORACLE_SCHEMA}"."EVENTS" ORDER BY START_DATE DESC`;
        const result = await db.executeQuery(sql);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (err) {
        console.error('Error fetching events:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/**
 * Get single event by ID
 */
app.get('/api/events/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const sql = `SELECT * FROM "${process.env.ORACLE_SCHEMA}"."EVENTS" WHERE EVENT_ID = :id`;
        const result = await db.executeQuery(sql, { id });

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Event not found'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (err) {
        console.error('Error fetching event:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/**
 * Create new event
 */
app.post('/api/events', async (req, res) => {
    try {
        const data = req.body;

        // Exclude EVENT_ID to let the trigger auto-generate it
        const columns = Object.keys(data).filter(key => key !== 'EVENT_ID');
        const placeholders = columns.map(col => `:${col}`);
        const insertData = {};
        
        // Convert date strings to JavaScript Date objects for Oracle
        columns.forEach(col => {
            if (col === 'START_DATE' || col === 'END_DATE' || col === 'CREATED_DATE' || col === 'MODIFIED_DATE') {
                insertData[col] = data[col] ? new Date(data[col]) : null;
            } else if (col === 'NOTES') {
                // Handle CLOB field - convert empty string to null
                insertData[col] = (data[col] && data[col].trim()) ? data[col] : null;
            } else {
                insertData[col] = data[col];
            }
        });

        const sql = `
            INSERT INTO "${process.env.ORACLE_SCHEMA}"."EVENTS" (${columns.join(', ')})
            VALUES (${placeholders.join(', ')})`;

        await db.executeQuery(sql, insertData);

        res.json({
            success: true,
            message: 'Event created successfully'
        });
    } catch (err) {
        console.error('Error creating event:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/**
 * Update event
 */
app.put('/api/events/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const updates = Object.keys(data)
            .filter(key => key !== 'EVENT_ID')
            .map(key => `${key} = :${key}`)
            .join(', ');

        const sql = `
            UPDATE "${process.env.ORACLE_SCHEMA}"."EVENTS"
            SET ${updates}
            WHERE EVENT_ID = :id`;

        // Convert date strings to JavaScript Date objects for Oracle
        const binds = { id };
        Object.keys(data).forEach(key => {
            if (key !== 'EVENT_ID') {
                if (key === 'START_DATE' || key === 'END_DATE' || key === 'CREATED_DATE' || key === 'MODIFIED_DATE') {
                    binds[key] = data[key] ? new Date(data[key]) : null;
                } else if (key === 'NOTES') {
                    // Handle CLOB field - convert empty string to null
                    binds[key] = (data[key] && data[key].trim()) ? data[key] : null;
                } else {
                    binds[key] = data[key];
                }
            }
        });

        await db.executeQuery(sql, binds);

        res.json({
            success: true,
            message: 'Event updated successfully'
        });
    } catch (err) {
        console.error('Error updating event:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/**
 * Delete event
 */
app.delete('/api/events/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const sql = `DELETE FROM "${process.env.ORACLE_SCHEMA}"."EVENTS" WHERE EVENT_ID = :id`;
        await db.executeQuery(sql, { id });

        res.json({
            success: true,
            message: 'Event deleted successfully'
        });
    } catch (err) {
        console.error('Error deleting event:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/**
 * Get all license expirations
 */
app.get('/api/licenses', async (req, res) => {
    try {
        const sql = `
            SELECT 
                LIC_ID,
                LIC_NAME,
                LIC_STATE,
                LIC_TYPE,
                LIC_NO,
                EXPIRATION_DATE,
                LIC_FULL_TEXT
            FROM "${process.env.ORACLE_SCHEMA}"."LICENSES"
            WHERE EXPIRATION_DATE IS NOT NULL
            ORDER BY EXPIRATION_DATE`;

        const result = await db.executeQuery(sql);

        res.json({
            success: true,
            data: result.rows || []
        });
    } catch (err) {
        console.error('Error fetching licenses:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/**
 * CALENDAR PROJECTS CRUD
 */
app.get('/api/projects', async (req, res) => {
    try {
        const sql = `SELECT * FROM "${process.env.ORACLE_SCHEMA}"."CALENDAR_PROJECTS" ORDER BY CREATED_AT DESC`;
        const result = await db.executeQuery(sql);
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error('Error fetching projects:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/api/projects/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const sql = `SELECT * FROM "${process.env.ORACLE_SCHEMA}"."CALENDAR_PROJECTS" WHERE PROJECT_ID = :id`;
        const result = await db.executeQuery(sql, { id });
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error('Error fetching project:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/projects', async (req, res) => {
    try {
        const data = req.body;
        // Exclude PROJECT_ID to let the trigger auto-generate it
        const columns = Object.keys(data).filter(key => key !== 'PROJECT_ID');
        const placeholders = columns.map(col => `:${col}`);
        const insertData = {};
        columns.forEach(col => insertData[col] = data[col]);
        const sql = `INSERT INTO "${process.env.ORACLE_SCHEMA}"."CALENDAR_PROJECTS" (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`;
        await db.executeQuery(sql, insertData);
        res.json({ success: true, message: 'Project created successfully' });
    } catch (err) {
        console.error('Error creating project:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.put('/api/projects/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const updates = Object.keys(data).filter(key => key !== 'PROJECT_ID').map(key => `${key} = :${key}`).join(', ');
        const sql = `UPDATE "${process.env.ORACLE_SCHEMA}"."CALENDAR_PROJECTS" SET ${updates} WHERE PROJECT_ID = :id`;
        await db.executeQuery(sql, { ...data, id });
        res.json({ success: true, message: 'Project updated successfully' });
    } catch (err) {
        console.error('Error updating project:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.delete('/api/projects/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const sql = `DELETE FROM "${process.env.ORACLE_SCHEMA}"."CALENDAR_PROJECTS" WHERE PROJECT_ID = :id`;
        await db.executeQuery(sql, { id });
        res.json({ success: true, message: 'Project deleted successfully' });
    } catch (err) {
        console.error('Error deleting project:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * MILESTONES CRUD
 */
app.get('/api/projects/:projectId/milestones', async (req, res) => {
    try {
        const { projectId } = req.params;
        const sql = `SELECT * FROM "${process.env.ORACLE_SCHEMA}"."CALENDAR_MILESTONES" WHERE PROJECT_ID = :projectId ORDER BY DUE_DATE`;
        const result = await db.executeQuery(sql, { projectId });
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error('Error fetching milestones:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/projects/:projectId/milestones', async (req, res) => {
    try {
        const { projectId } = req.params;
        const data = { ...req.body, PROJECT_ID: projectId };
        // Exclude MILESTONE_ID to let the trigger auto-generate it
        const columns = Object.keys(data).filter(key => key !== 'MILESTONE_ID');
        const placeholders = columns.map(col => `:${col}`);
        const insertData = {};
        columns.forEach(col => insertData[col] = data[col]);
        const sql = `INSERT INTO "${process.env.ORACLE_SCHEMA}"."CALENDAR_MILESTONES" (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`;
        await db.executeQuery(sql, insertData);
        res.json({ success: true, message: 'Milestone created successfully' });
    } catch (err) {
        console.error('Error creating milestone:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.put('/api/milestones/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const updates = Object.keys(data).filter(key => key !== 'MILESTONE_ID').map(key => `${key} = :${key}`).join(', ');
        const sql = `UPDATE "${process.env.ORACLE_SCHEMA}"."CALENDAR_MILESTONES" SET ${updates} WHERE MILESTONE_ID = :id`;
        await db.executeQuery(sql, { ...data, id });
        res.json({ success: true, message: 'Milestone updated successfully' });
    } catch (err) {
        console.error('Error updating milestone:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.delete('/api/milestones/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const sql = `DELETE FROM "${process.env.ORACLE_SCHEMA}"."CALENDAR_MILESTONES" WHERE MILESTONE_ID = :id`;
        await db.executeQuery(sql, { id });
        res.json({ success: true, message: 'Milestone deleted successfully' });
    } catch (err) {
        console.error('Error deleting milestone:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * PROJECT RESOURCES CRUD
 */
app.get('/api/projects/:projectId/resources', async (req, res) => {
    try {
        const { projectId } = req.params;
        const sql = `SELECT * FROM "${process.env.ORACLE_SCHEMA}"."CALENDAR_RESOURCES" WHERE PROJECT_ID = :projectId ORDER BY RESOURCE_NAME`;
        const result = await db.executeQuery(sql, { projectId });
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error('Error fetching resources:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/projects/:projectId/resources', async (req, res) => {
    try {
        const { projectId } = req.params;
        const data = { ...req.body, PROJECT_ID: projectId };
        // Exclude RESOURCE_ID to let the trigger auto-generate it
        const columns = Object.keys(data).filter(key => key !== 'RESOURCE_ID');
        const placeholders = columns.map(col => `:${col}`);
        const insertData = {};
        columns.forEach(col => insertData[col] = data[col]);
        const sql = `INSERT INTO "${process.env.ORACLE_SCHEMA}"."CALENDAR_RESOURCES" (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`;
        await db.executeQuery(sql, insertData);
        res.json({ success: true, message: 'Resource added successfully' });
    } catch (err) {
        console.error('Error adding resource:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.put('/api/resources/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const updates = Object.keys(data).filter(key => key !== 'RESOURCE_ID').map(key => `${key} = :${key}`).join(', ');
        const sql = `UPDATE "${process.env.ORACLE_SCHEMA}"."CALENDAR_RESOURCES" SET ${updates} WHERE RESOURCE_ID = :id`;
        await db.executeQuery(sql, { ...data, id });
        res.json({ success: true, message: 'Resource updated successfully' });
    } catch (err) {
        console.error('Error updating resource:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.delete('/api/resources/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const sql = `DELETE FROM "${process.env.ORACLE_SCHEMA}"."CALENDAR_RESOURCES" WHERE RESOURCE_ID = :id`;
        await db.executeQuery(sql, { id });
        res.json({ success: true, message: 'Resource deleted successfully' });
    } catch (err) {
        console.error('Error deleting resource:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * PROJECT TASKS CRUD (for Kanban board)
 */
app.get('/api/projects/:projectId/tasks', async (req, res) => {
    try {
        const { projectId } = req.params;
        const sql = `SELECT * FROM "${process.env.ORACLE_SCHEMA}"."CALENDAR_TASKS" WHERE PROJECT_ID = :projectId ORDER BY SORT_ORDER, CREATED_AT`;
        const result = await db.executeQuery(sql, { projectId });
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error('Error fetching tasks:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/projects/:projectId/tasks', async (req, res) => {
    try {
        const { projectId } = req.params;
        const data = { ...req.body, PROJECT_ID: projectId };
        // Exclude TASK_ID to let the trigger auto-generate it
        const columns = Object.keys(data).filter(key => key !== 'TASK_ID');
        const placeholders = columns.map(col => `:${col}`);
        const insertData = {};
        columns.forEach(col => insertData[col] = data[col]);
        const sql = `INSERT INTO "${process.env.ORACLE_SCHEMA}"."CALENDAR_TASKS" (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`;
        await db.executeQuery(sql, insertData);
        res.json({ success: true, message: 'Task created successfully' });
    } catch (err) {
        console.error('Error creating task:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.put('/api/tasks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const updates = Object.keys(data).filter(key => key !== 'TASK_ID').map(key => `${key} = :${key}`).join(', ');
        const sql = `UPDATE "${process.env.ORACLE_SCHEMA}"."CALENDAR_TASKS" SET ${updates} WHERE TASK_ID = :id`;
        await db.executeQuery(sql, { ...data, id });
        res.json({ success: true, message: 'Task updated successfully' });
    } catch (err) {
        console.error('Error updating task:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.delete('/api/tasks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const sql = `DELETE FROM "${process.env.ORACLE_SCHEMA}"."CALENDAR_TASKS" WHERE TASK_ID = :id`;
        await db.executeQuery(sql, { id });
        res.json({ success: true, message: 'Task deleted successfully' });
    } catch (err) {
        console.error('Error deleting task:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'API server is running',
        timestamp: new Date().toISOString()
    });
});

// Start server only if run directly (not when imported as a module)
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`API server running on http://localhost:${PORT}`);
        console.log(`Health check: http://localhost:${PORT}/api/health`);
    });
}

module.exports = app;
