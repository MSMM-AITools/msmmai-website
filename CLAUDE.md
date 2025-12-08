# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a unified deployment of multiple AI tools for MSMM Engineering on Vercel. The repository deploys three main applications under a single domain (msmmai.com):
- **License Reminder Tool** (Flask/Python) - Automated license expiration tracking and email reminders
- **Business Development Tool** (Node.js/Express) - Proposal management system with calendar and organization tracking
- **Project Writeup Tool** (Flask/Python) - AI-powered project documentation generator using GPT-4 Turbo
- **MSMM Local ChatGPT** (External Link) - Link to local network AI assistant at http://10.10.40.103:8080/ (only accessible on MSMM_ENG WiFi)

The License Reminder Tool and Business Development Tool share a single Oracle Database backend. The Project Writeup Tool uses OpenAI API for content generation. All applications are deployed as Vercel serverless functions.

## Development Commands

### Local Development

```bash
# Install dependencies
npm install

# Run full deployment locally (all tools)
vercel dev
# Access at: http://localhost:3000

# Run License Reminder Tool standalone
cd "AI Tools/LicenseReminderTool-main"
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python web_dashboard_oracle.py
# Access at: http://localhost:8080

# Run BusinessDev Tool standalone
cd "AI Tools/BusinessDev_NewUI"
npm install
npm run dev
# Access at: http://localhost:3000
```

### Deployment

```bash
# Deploy to production
vercel --prod

# Check deployment logs
vercel logs
vercel logs --follow

# List deployments
vercel ls
```

### Database Management

```bash
# Add new user to authentication system
./add_user.sh --user username --password password

# Initialize authentication database (first time setup)
# Run init_auth_db.sql manually in Oracle SQL client
```

## Architecture

### Routing Structure

The application uses Vercel's routing configuration (`vercel.json`) to mount multiple applications:

1. **/** - Static homepage (`index.html`) with tool tiles
2. **/licenseremindertool/** - Flask app via `api/licenseremindertool.py` wrapper
3. **/businessdev/** - Express app via `api/businessdev.js` wrapper
4. **/project-writeup/** - Flask app via `api/projectwriteup.py` wrapper

### Serverless Function Wrappers

The `/api` directory contains wrapper functions that mount the original applications under path prefixes:

- **api/licenseremindertool.py** - Imports Flask app from `AI Tools/LicenseReminderTool-main/api/index.py` and mounts it at `/licenseremindertool` using Werkzeug's DispatcherMiddleware
- **api/businessdev.js** - Imports Express app from `AI Tools/BusinessDev_NewUI/server/api.js` and mounts it at `/businessdev` with static file serving
- **api/projectwriteup.py** - Imports Flask app from `AI Tools/Projects_Writeup/api/index.py` and mounts it at `/project-writeup` using Werkzeug's DispatcherMiddleware
- **api/cron.py** - Standalone cron handler for scheduled license reminder checks (runs daily at 9:00 AM UTC)
- **api/auth.py** - Authentication API with database-backed sessions (login, logout, session verification)

### Database Connection Patterns

**Python (Flask apps)**:
```python
import oracledb
dsn = oracledb.makedsn(ORACLE_HOST, ORACLE_PORT, service_name=ORACLE_SERVICE_NAME)

# When connecting as SYS user, use SYSDBA mode
if ORACLE_USER.upper() == 'SYS':
    connection = oracledb.connect(user=ORACLE_USER, password=ORACLE_PASSWORD,
                                   dsn=dsn, mode=oracledb.SYSDBA)
else:
    connection = oracledb.connect(user=ORACLE_USER, password=ORACLE_PASSWORD, dsn=dsn)
```

**Node.js (Express apps)**:
```javascript
const dbConfig = {
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: `${process.env.ORACLE_HOST}:${process.env.ORACLE_PORT}/${process.env.ORACLE_SERVICE_NAME}`,
    privilege: process.env.ORACLE_USER.toUpperCase() === 'SYS' ? oracledb.SYSDBA : undefined
};
```

See `AI Tools/BusinessDev_NewUI/db/connection.js` for the full connection module with pooling and retry logic.

### Schema Access Pattern

All SQL queries must properly quote the schema name since it contains spaces:
```sql
-- Correct
SELECT * FROM "MSMM DASHBOARD"."PROPOSALS"

-- Incorrect (will fail)
SELECT * FROM MSMM DASHBOARD.PROPOSALS
```

In JavaScript:
```javascript
const sql = `SELECT * FROM "${process.env.ORACLE_SCHEMA}"."PROPOSALS"`;
```

### Authentication System

The application has a centralized authentication system:
- **Database Tables**: `MSMMAI_USERS` and `USER_SESSIONS` in Oracle
- **Default credentials**: admin / Scott123$
- **Session storage**: Database-backed (serverless-compatible)
- **Password hashing**: SHA256
- **API**: `api/auth.py` handles all authentication operations
- **Management**: Use `add_user.sh` script to create new users

## Important Database Tables

### License Reminder Tool
- **LICENSES** - License records with expiration tracking
- **EMAIL_REMINDERS** - Log of sent reminder emails
- **MSMMAI_USERS** - User authentication
- **USER_SESSIONS** - Active sessions

### Business Development Tool
- **PROPOSALS** - Proposal/opportunity tracking
- **ORGANIZATION** - Client organizations
- **EVENTS** - Calendar events for deadlines

## Authentication and Security

### Session-Based Authentication
All applications use database-backed session authentication for serverless compatibility:
- **Auth API**: `api/auth.py` handles login, logout, and session verification
- **Session Storage**: `USER_SESSIONS` table in Oracle with expiration timestamps
- **Cookie Name**: `session_token` (HttpOnly, Secure, SameSite=Lax)
- **Session Duration**: 24 hours
- **Password Hashing**: SHA256

### Protected Routes
All API endpoints and pages REQUIRE authentication except:
- `/health` - Health check endpoints (public)
- `/api/cron/check-reminders` - Cron job (protected by CRON_SECRET instead)
- `/login.html` - Login page
- `/api/auth` - Authentication endpoint

### Middleware Implementation

**Node.js (BusinessDev)**:
```javascript
// AI Tools/BusinessDev_NewUI/middleware/auth.js
const { requireAuth } = require('../middleware/auth');
app.use('/api', requireAuth);  // Protects all /api routes
```

**Python (License Tool)**:
```python
# AI Tools/LicenseReminderTool-main/utils/auth_middleware.py
from auth_middleware import require_auth
@app.route('/api/proposals')
@require_auth
def get_proposals():
    # request.user contains authenticated user info
    pass
```

### Authentication Flow
1. User submits credentials to `/api/auth` (POST)
2. Server validates against `MSMMAI_USERS` table
3. Creates session in `USER_SESSIONS` table
4. Returns `session_token` cookie
5. Subsequent requests include cookie
6. Middleware verifies token in database before allowing access
7. Expired sessions are automatically cleaned up

### Default Credentials
- **Username**: admin
- **Password**: Scott123$
- **Management**: Use `./add_user.sh` to create additional users

## Key Technical Details

### Python Dependencies
Only `python-dotenv`, `flask`, and `oracledb` are required for deployment. The root `requirements.txt` excludes CLI-only dependencies like `pandas`, `openpyxl`, and `schedule`.

### Node.js Module Resolution
The BusinessDev wrapper (`api/businessdev.js`) patches `Module.prototype.require` to correctly resolve the `../db/connection` import from `server/api.js` in the serverless environment.

### Static File Serving
Static assets for BusinessDev are served with specific route precedence:
1. `/businessdev/assets` → `AI Tools/BusinessDev_NewUI/assets`
2. `/businessdev/dist` → `AI Tools/BusinessDev_NewUI/dist`
3. `/businessdev/js` → `AI Tools/BusinessDev_NewUI/js`
4. `/businessdev/pages` → `AI Tools/BusinessDev_NewUI/pages`

### CLOB Handling
Oracle CLOBs (used for rich text fields) are configured to auto-fetch as strings:
```javascript
oracledb.fetchAsString = [ oracledb.CLOB ];
```

### Case Sensitivity
Oracle column names are uppercase by default. The BusinessDev API includes a `toLowerCaseKeys()` utility function to convert API responses to lowercase for consistent JavaScript access.

## Environment Variables

All sensitive configuration is stored in environment variables (never commit these):

```bash
# Oracle Database
ORACLE_HOST=
ORACLE_PORT=
ORACLE_SERVICE_NAME=
ORACLE_USER=
ORACLE_PASSWORD=
ORACLE_SCHEMA="MSMM DASHBOARD"

# Email (License Reminders)
SMTP_SERVER=
SMTP_PORT=
SMTP_USERNAME=
SMTP_PASSWORD=
SENDER_EMAIL=
FROM_EMAIL=
FROM_NAME=

# OpenAI (Project Writeup Tool)
OPENAI_API_KEY=

# Application
FLASK_SECRET_KEY=
CRON_SECRET=
COMPANY_NAME="MSMM Engineering"
COMPANY_WEBSITE=
SUPPORT_EMAIL=
```

## Cron Job

A Vercel cron job runs daily at 9:00 AM UTC to check for expiring licenses and send reminder emails. It triggers at: 60, 30, 15, 7, and 1 days before expiration.

Endpoint: `/licenseremindertool/api/cron/check-reminders` → `api/cron.py`

## Common Pitfalls

1. **Schema Quoting**: Always quote schema names with spaces: `"MSMM DASHBOARD"`
2. **SYSDBA Mode**: When connecting as SYS user, must specify SYSDBA privilege
3. **Path Resolution**: In serverless wrappers, use absolute paths from `__file__` or `__dirname`
4. **Template Folders**: Flask templates must use absolute paths in serverless environment
5. **Connection Timeouts**: Set `connectTimeout` and `callTimeout` for Oracle connections (60 seconds recommended)
6. **OpenAI Rate Limits**: Project Writeup Tool uses GPT-4 Turbo - monitor API usage and rate limits
7. **File Size Limits**: Vercel has 4.5MB upload limit for serverless functions (16MB for local dev)
8. **Function Timeout**: Project Writeup Tool has 60-second maxDuration set in vercel.json for AI generation

## File Organization

```
/
├── api/                                    # Serverless function wrappers
│   ├── auth.py                            # Authentication API
│   ├── businessdev.js                     # BusinessDev wrapper
│   ├── cron.py                            # Cron job handler
│   ├── licenseremindertool.py             # License tool wrapper
│   └── projectwriteup.py                  # Project writeup wrapper
│
├── AI Tools/
│   ├── LicenseReminderTool-main/
│   │   ├── api/index.py                   # Main Flask application
│   │   ├── templates/                     # Jinja2 templates
│   │   ├── static/                        # CSS, JS, images
│   │   └── utils/auth_middleware.py       # Shared auth middleware
│   │
│   ├── BusinessDev_NewUI/
│   │   ├── server/api.js                  # Express API routes
│   │   ├── db/connection.js               # Database utilities
│   │   ├── middleware/auth.js             # Auth middleware for Express
│   │   ├── index.html                     # Main UI
│   │   ├── pages/                         # Additional pages (table, calendar)
│   │   └── js/                            # Client-side JavaScript
│   │
│   └── Projects_Writeup/
│       ├── api/index.py                   # Main Flask application
│       ├── templates/                     # HTML templates + Jinja2 DOCX template
│       ├── static/                        # CSS, JS
│       └── app.py                         # Standalone version (for local dev)
│
├── index.html                             # Main homepage
├── login.html                             # Authentication page
├── vercel.json                            # Routing configuration
├── package.json                           # Node.js dependencies
├── requirements.txt                       # Python dependencies
├── init_auth_db.sql                       # Authentication schema setup
└── add_user.sh                            # User management script
```
