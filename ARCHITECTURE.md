# 🏗️ Architecture Overview - MSMM AI Tools

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    msmmai.com (Domain)                  │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                   Vercel Edge Network                   │
│                   (SSL, CDN, Routing)                   │
└─────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
            ▼               ▼               ▼
    ┌──────────────┐ ┌─────────────┐ ┌────────────┐
    │   Homepage   │ │ License RT  │ │ BusinessDev│
    │      /       │ │ /license... │ │ /business..│
    │ Static HTML  │ │ Python Flask│ │ Node.js    │
    └──────────────┘ └─────────────┘ └────────────┘
                            │               │
                            │               │
                            ▼               ▼
                    ┌──────────────────────────┐
                    │   Oracle Database        │
                    │   msmm-dashboard.max...  │
                    │   - LICENSES table       │
                    │   - PROPOSALS table      │
                    │   - ORGANIZATION table   │
                    └──────────────────────────┘
```

## Routing Flow

### Route: `/` (Homepage)
```
Request → Vercel → index.html → User
```

**File**: `/index.html`
**Type**: Static HTML
**Features**: Tool discovery tiles, branding, navigation

---

### Route: `/licenseremindertool/*`
```
Request → Vercel → api/licenseremindertool.py
        → Flask App → Oracle DB → Response
```

**Handler**: `/api/licenseremindertool.py`
**Framework**: Flask (Python)
**Database**: Oracle
**Features**:
- License CRUD operations
- Dashboard with statistics
- Email reminder system
- Real-time expiration tracking

**Key Endpoints**:
- `/licenseremindertool/` - Dashboard
- `/licenseremindertool/licenses` - License list
- `/licenseremindertool/reminders` - Reminder history
- `/licenseremindertool/api/*` - JSON API

---

### Route: `/businessdev/*`
```
Request → Vercel → api/businessdev.js
        → Express App → Oracle DB → Response
```

**Handler**: `/api/businessdev.js`
**Framework**: Express (Node.js)
**Database**: Oracle
**Features**:
- Proposal management
- Organization tracking
- Calendar view
- Rich text editing

**Key Endpoints**:
- `/businessdev/` - Main dashboard
- `/businessdev/pages/table.html` - Table view
- `/businessdev/pages/calendar.html` - Calendar view
- `/businessdev/api/proposals` - Proposals API
- `/businessdev/api/organizations` - Organizations API

---

### Cron Job: License Reminders
```
Vercel Cron (9:00 AM UTC) → /licenseremindertool/api/cron/check-reminders
                           → api/cron.py
                           → Check licenses needing reminders
                           → Send emails via SMTP
                           → Log to EMAIL_REMINDERS table
```

**Handler**: `/api/cron.py`
**Schedule**: Daily at 9:00 AM UTC
**Triggers**: 60, 30, 15, 7, 1 days before expiration

---

## Directory Structure

```
MSMM-AI/
│
├── index.html                    # ← Main homepage (NEW)
├── vercel.json                   # ← Unified routing (NEW)
├── package.json                  # ← Node.js deps (NEW)
├── requirements.txt              # ← Python deps (NEW)
├── .gitignore                    # ← Git exclusions (NEW)
├── .env.example                  # ← Env template (NEW)
│
├── api/                          # ← API wrappers (NEW)
│   ├── licenseremindertool.py   # Flask wrapper
│   ├── businessdev.js           # Express wrapper
│   └── cron.py                  # Cron handler
│
├── AI Tools/                     # ← Original apps
│   ├── LicenseReminderTool-main/
│   │   ├── api/index.py         # Original Flask app
│   │   ├── templates/           # HTML templates
│   │   ├── static/              # CSS, JS, images
│   │   └── ...
│   │
│   └── BusinessDev_NewUI/
│       ├── index.html           # Main HTML
│       ├── pages/               # Additional pages
│       ├── js/                  # JavaScript
│       ├── db/connection.js     # DB connection
│       └── ...
│
└── Documentation/                # ← Guides (NEW)
    ├── README.md                # Project overview
    ├── DEPLOYMENT_GUIDE.md      # Step-by-step deploy
    ├── QUICKSTART.md            # 5-min quick start
    ├── FILES_SUMMARY.md         # All files explained
    └── ARCHITECTURE.md          # This file
```

## Technology Stack

### License Reminder Tool
- **Backend**: Python 3.x + Flask
- **Database**: Oracle Database (oracledb)
- **Email**: SMTP (Gmail)
- **Deployment**: Vercel Serverless Functions
- **Cron**: Vercel Cron Jobs

### BusinessDev Tool
- **Backend**: Node.js + Express
- **Frontend**: Vanilla JavaScript + HTML5
- **Database**: Oracle Database (oracledb)
- **Styling**: Tailwind CSS
- **Deployment**: Vercel Serverless Functions

### Shared Infrastructure
- **Hosting**: Vercel
- **Database**: Oracle Database (shared)
- **Domain**: msmmai.com
- **SSL**: Automatic (Vercel)
- **CDN**: Vercel Edge Network

## Data Flow

### License Reminder Flow
```
1. User visits /licenseremindertool
2. Flask app queries Oracle DB
3. Retrieves license data
4. Renders dashboard with statistics
5. User can CRUD licenses
6. Changes saved to Oracle DB

Parallel Process (Daily):
- Cron triggers at 9:00 AM UTC
- Checks licenses needing reminders
- Sends emails via SMTP
- Logs to EMAIL_REMINDERS table
```

### BusinessDev Flow
```
1. User visits /businessdev
2. Static HTML served
3. JavaScript loads and queries /businessdev/api/proposals
4. Express app queries Oracle DB
5. Returns proposal data as JSON
6. Frontend renders data
7. User performs CRUD operations
8. Updates sent to API → Oracle DB
```

## Security

### Authentication
- **Database**: SYSDBA authentication for Oracle
- **Cron Jobs**: Secret token authentication
- **Environment Variables**: Stored in Vercel

### Data Protection
- **HTTPS**: Enforced on all routes
- **Secrets**: Never committed to Git
- **Environment Isolation**: Separate prod/preview/dev

### Network
- **Vercel Edge**: DDoS protection
- **Rate Limiting**: Vercel built-in
- **Oracle**: Firewall-protected database

## Performance

### Optimization
- **Static Assets**: Served from Vercel CDN
- **Serverless Functions**: Auto-scaling
- **Database**: Connection pooling
- **Caching**: Vercel edge caching

### Monitoring
- **Vercel Analytics**: Built-in traffic analysis
- **Function Logs**: Real-time logging
- **Cron Logs**: Scheduled task history
- **Error Tracking**: Vercel error reporting

## Deployment Pipeline

```
Code Changes
    ↓
Git Commit & Push
    ↓
Vercel Auto-Deploy (if GitHub integrated)
OR
Manual Deploy (vercel --prod)
    ↓
Build Process
    ├── Install Python dependencies
    ├── Install Node.js dependencies
    ├── Copy static files
    └── Configure serverless functions
    ↓
Deploy to Edge Network
    ↓
Live at msmmai.com
```

## Future Enhancements

### Potential Additions
- [ ] Authentication system (OAuth, JWT)
- [ ] User management and roles
- [ ] Advanced analytics dashboard
- [ ] Notification preferences
- [ ] Mobile app integration
- [ ] API rate limiting
- [ ] Webhook support
- [ ] Multi-language support

### Scalability
- **Database**: Consider read replicas for high traffic
- **Caching**: Implement Redis for frequent queries
- **CDN**: Already optimized via Vercel
- **Functions**: Auto-scale via Vercel

---

## 📞 Questions?

Refer to:
- **Quick Start**: `QUICKSTART.md`
- **Full Deployment**: `DEPLOYMENT_GUIDE.md`
- **File Reference**: `FILES_SUMMARY.md`
- **Project Info**: `README.md`
