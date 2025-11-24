# MSMM AI Tools Suite

Unified deployment of multiple AI tools for MSMM Engineering on Vercel.

## 🏗️ Architecture

This repository deploys multiple AI tools under a single domain (msmmai.com) with the following structure:

```
/                           → Main homepage with tool tiles
/licenseremindertool        → License Reminder Tool (Flask/Python)
/businessdev                → Business Development Tool (Node.js/Express)
```

## 📁 Project Structure

```
/
├── index.html                          # Main homepage
├── api/
│   ├── licenseremindertool.py         # LRT API wrapper
│   ├── businessdev.js                 # BusinessDev API wrapper
│   └── cron.py                        # Cron job handler
├── AI Tools/
│   ├── LicenseReminderTool-main/      # Flask app for license management
│   └── BusinessDev_NewUI/             # Express app + static frontend
├── vercel.json                        # Unified routing configuration
├── package.json                       # Node.js dependencies
└── requirements.txt                   # Python dependencies
```

## 🚀 Deployment Instructions

### Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI**: Install globally
   ```bash
   npm install -g vercel
   ```

### Step 1: Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Python dependencies are automatically handled by Vercel
```

### Step 2: Configure Environment Variables

Set the following environment variables in Vercel dashboard or via CLI:

#### Oracle Database
- `ORACLE_HOST`
- `ORACLE_PORT`
- `ORACLE_SERVICE_NAME`
- `ORACLE_USER`
- `ORACLE_PASSWORD`
- `ORACLE_SCHEMA`

#### Email Configuration (for License Reminders)
- `SMTP_SERVER`
- `SMTP_PORT`
- `SMTP_USERNAME`
- `SMTP_PASSWORD`
- `SENDER_EMAIL`
- `FROM_EMAIL`
- `FROM_NAME`

#### Application Settings
- `FLASK_SECRET_KEY`
- `CRON_SECRET`
- `COMPANY_NAME`
- `COMPANY_WEBSITE`
- `SUPPORT_EMAIL`

### Step 3: Deploy to Vercel

```bash
# Login to Vercel
vercel login

# Deploy (first time)
vercel

# Deploy to production
vercel --prod
```

### Step 4: Configure Custom Domain

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Domains**
3. Add `msmmai.com` and configure DNS records as instructed

## 🛠️ Local Development

### Running License Reminder Tool Locally

```bash
cd "AI Tools/LicenseReminderTool-main"
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python web_dashboard_oracle.py
```

Access at: `http://localhost:8080`

### Running BusinessDev Tool Locally

```bash
cd "AI Tools/BusinessDev_NewUI"
npm install
npm run dev
```

Access at: `http://localhost:3000`

### Testing Full Deployment Locally

```bash
# From root directory
vercel dev
```

Access at: `http://localhost:3000`

## 📋 Features

### License Reminder Tool
- ✅ Automated license expiration tracking
- ✅ Email reminder system (60, 30, 15, 7, 1 days before expiration)
- ✅ Oracle Database backend
- ✅ Real-time dashboard with statistics
- ✅ CRUD operations for licenses
- ✅ Daily cron job for automated reminders

### Business Development Tool
- ✅ Proposal management system
- ✅ Organization tracking
- ✅ Calendar view for deadlines
- ✅ Oracle Database backend
- ✅ Rich text editor for notes
- ✅ Real-time data synchronization

## 🔄 Routing Configuration

The routing is configured in `vercel.json`:

| Route | Handler | Description |
|-------|---------|-------------|
| `/` | `index.html` | Main homepage |
| `/licenseremindertool/*` | `api/licenseremindertool.py` | License tool routes |
| `/businessdev/*` | `api/businessdev.js` | BusinessDev routes |

Static assets are served directly from their respective directories.

## ⏰ Cron Jobs

- **License Reminder Check**: Runs daily at 9:00 AM UTC
  - Endpoint: `/licenseremindertool/api/cron/check-reminders`
  - Sends automated email reminders for expiring licenses

## 🔒 Security

- All sensitive credentials stored as Vercel environment variables
- CRON_SECRET protects cron endpoints from unauthorized access
- Oracle connections use SYSDBA authentication
- HTTPS enforced on all routes

## 📞 Support

For issues or questions:
- Email: support@msmmeng.com
- Website: https://www.msmmeng.com

## 📝 License

Copyright © 2025 MSMM Engineering. All rights reserved.
