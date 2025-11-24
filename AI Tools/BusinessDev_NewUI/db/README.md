# Oracle Database Connection Module

This module provides connectivity to the Oracle Database for the MSMM Business Development application.

## Database Configuration

The database connection is configured using environment variables in the `.env` file:

```
ORACLE_HOST=msmm-dashboard.maxapex.net
ORACLE_PORT=1521
ORACLE_SERVICE_NAME=XEPDB1
ORACLE_USER=SYS
ORACLE_PASSWORD=XL4JLLGKCTBD6
ORACLE_SCHEMA=MSMM DASHBOARD
```

## Database Information

- **Database Version**: Oracle Database 23ai Free Release 23.0.0.0.0
- **Connection Mode**: Thin Mode (no Oracle Client installation required)
- **Privilege**: SYSDBA (required for SYS user)

## Verified Tables

### ORGANIZATION Table
- **Columns**: 5
- **Structure**:
  - `ORG_ID`: NUMBER(22) NOT NULL
  - `ORG_FULL_NAME`: VARCHAR2(600) NULLABLE
  - `ORG_ABBREVIATION`: VARCHAR2(120) NULLABLE
  - `ORG_TYPE`: VARCHAR2(200) NULLABLE
  - `ORG_INACTIVE_DATE`: DATE(7) NULLABLE

### PROPOSALS Table
- **Columns**: 23
- **Structure**:
  - `PID`: NUMBER(22) NOT NULL
  - `TITLE`: VARCHAR2(800) NOT NULL
  - `PRIME`: VARCHAR2(800) NULLABLE
  - `SUB`: VARCHAR2(1200) NULLABLE
  - `STATUS`: VARCHAR2(400) NULLABLE
  - `DETAILS`: VARCHAR2(2400) NULLABLE
  - `SUBMITTED_DATE`: DATE(7) NULLABLE
  - `CATEGORY`: VARCHAR2(100) NOT NULL
  - `ARCHIVE`: VARCHAR2(1) NULLABLE
  - `PROJECTED_AMOUNT`: NUMBER(22) NULLABLE
  - `SELECTION_CHANCE`: VARCHAR2(50) NULLABLE
  - `MSMM_POC`: VARCHAR2(100) NULLABLE
  - `EXTERNAL_POC`: VARCHAR2(100) NULLABLE
  - `EXPECTED_DUE_DATE`: DATE(7) NULLABLE
  - `ORG_ID`: NUMBER(22) NULLABLE
  - `STAGE`: VARCHAR2(50) NULLABLE
  - `CLIENT_CONTRACT_NO`: VARCHAR2(400) NULLABLE
  - `MSMM_CONTRACT_NO`: VARCHAR2(200) NULLABLE
  - `CONTRACT_EXP_DATE`: DATE(7) NULLABLE
  - `POOL`: VARCHAR2(800) NULLABLE
  - `AWARD_NUMBER`: NUMBER(22) NULLABLE
  - `MSMM_CAPACITY`: NUMBER(22) NULLABLE
  - `PROPOSED_SUB_AMT`: NUMBER(22) NULLABLE

### EVENTS Table
- **Columns**: 11
- **Structure**:
  - `EVENT_ID`: NUMBER(22) NOT NULL (auto-generated primary key)
  - `TITLE`: VARCHAR2(800) NOT NULL
  - `DESCRIPTION`: VARCHAR2(2400) NULLABLE
  - `START_DATE`: DATE(7) NOT NULL
  - `END_DATE`: DATE(7) NOT NULL
  - `LOCATION`: VARCHAR2(400) NULLABLE
  - `COLOR`: VARCHAR2(20) NULLABLE (default: '#3B82F6')
  - `ALL_DAY`: VARCHAR2(1) NULLABLE (default: 'N', values: 'Y' or 'N')
  - `NOTES`: CLOB NULLABLE (meeting minutes, detailed notes, action items)
  - `CREATED_DATE`: DATE(7) NULLABLE (auto-set on insert)
  - `MODIFIED_DATE`: DATE(7) NULLABLE (auto-updated on modify)
- **Indexes**:
  - `IDX_EVENTS_START_DATE` on START_DATE
  - `IDX_EVENTS_END_DATE` on END_DATE
- **Triggers**:
  - `TRG_EVENTS_MODIFIED`: Automatically updates MODIFIED_DATE on record update

## Usage

### Running the Test

To test the database connection and verify tables:

```bash
npm run test:db
```

### Using the Connection Module

```javascript
const db = require('./db/connection');

// Get a connection
const connection = await db.getConnection();

// Execute a query
const result = await db.executeQuery('SELECT * FROM "MSMM DASHBOARD"."ORGANIZATION" WHERE ROWNUM <= 10');

// Check if a table exists
const exists = await db.tableExists('ORGANIZATION');

// Get table structure
const structure = await db.getTableStructure('ORGANIZATION');

// Fetch table data
const data = await db.fetchTableData('PROPOSALS', 10);
```

## Files

- `connection.js` - Main database connection module with helper functions
- `testConnection.js` - Test script to verify database connectivity and tables
- `README.md` - This documentation file

## Notes

- The connection uses Thin Mode, which does not require Oracle Client installation
- When connecting as SYS user, SYSDBA privilege is automatically applied
- Tables are accessed with the schema qualifier: `"MSMM DASHBOARD"."TABLE_NAME"`
- All queries use OUT_FORMAT_OBJECT for easy JSON-like result handling
