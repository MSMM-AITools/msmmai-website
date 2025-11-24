# 🚀 Deployment Guide - MSMM AI Tools

Complete step-by-step guide to deploy the MSMM AI Tools suite to Vercel.

## 📋 Pre-Deployment Checklist

- [ ] Vercel account created
- [ ] Git repository initialized
- [ ] Oracle Database credentials available
- [ ] SMTP/Email credentials ready
- [ ] Domain `msmmai.com` registered and accessible

## 🔧 Step 1: Prepare Your Repository

### 1.1 Verify File Structure

Ensure your directory structure matches:

```
/
├── index.html
├── api/
│   ├── licenseremindertool.py
│   ├── businessdev.js
│   └── cron.py
├── AI Tools/
│   ├── LicenseReminderTool-main/
│   └── BusinessDev_NewUI/
├── vercel.json
├── package.json
├── requirements.txt
└── README.md
```

### 1.2 Initialize Git (if not already done)

```bash
cd "/Users/rajmehta/Desktop/AITools - MSMMEng/MSMM-AI"
git init
git add .
git commit -m "Initial commit: MSMM AI Tools unified deployment"
```

### 1.3 Create GitHub Repository

```bash
# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/msmm-ai-tools.git
git branch -M main
git push -u origin main
```

## 🌐 Step 2: Deploy to Vercel

### 2.1 Install Vercel CLI

```bash
npm install -g vercel
```

### 2.2 Login to Vercel

```bash
vercel login
```

Follow the prompts to authenticate.

### 2.3 Deploy to Vercel

```bash
# From the root directory
cd "/Users/rajmehta/Desktop/AITools - MSMMEng/MSMM-AI"

# First deployment (preview)
vercel

# Production deployment
vercel --prod
```

During deployment, Vercel will ask:
- **Set up and deploy?** → Yes
- **Which scope?** → Select your account/team
- **Link to existing project?** → No
- **Project name?** → `msmm-ai-tools` (or your choice)
- **Directory?** → `.` (current directory)
- **Override settings?** → No

## 🔐 Step 3: Configure Environment Variables

### 3.1 Via Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Select your project (`msmm-ai-tools`)
3. Go to **Settings** → **Environment Variables**
4. Add the following variables (one by one):

#### Oracle Database Variables
```
ORACLE_HOST = msmm-dashboard.maxapex.net
ORACLE_PORT = 1521
ORACLE_SERVICE_NAME = XEPDB1
ORACLE_USER = SYS
ORACLE_PASSWORD = [your-password]
ORACLE_SCHEMA = MSMM DASHBOARD
```

#### Email Configuration
```
SMTP_SERVER = smtp.gmail.com
SMTP_PORT = 587
SMTP_USERNAME = [your-email@gmail.com]
SMTP_PASSWORD = [your-app-password]
SENDER_EMAIL = [your-email@gmail.com]
FROM_EMAIL = [your-email@gmail.com]
FROM_NAME = License Reminder System
EMAIL_USERNAME = [your-email@gmail.com]
EMAIL_PASSWORD = [your-app-password]
```

#### Application Settings
```
FLASK_SECRET_KEY = [generate-random-secret]
CRON_SECRET = [generate-random-secret]
COMPANY_NAME = MSMM Engineering
COMPANY_WEBSITE = https://www.msmmeng.com
SUPPORT_EMAIL = support@msmmeng.com
TIMEZONE = America/Chicago
```

**Note**: For each variable, select "All Environments" or choose specific environments.

### 3.2 Via Vercel CLI (Alternative)

```bash
# Set environment variables via CLI
vercel env add ORACLE_HOST
vercel env add ORACLE_PORT
vercel env add ORACLE_SERVICE_NAME
# ... etc for all variables
```

### 3.3 Generate Secret Keys

```bash
# Generate FLASK_SECRET_KEY
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Generate CRON_SECRET
python3 -c "import secrets; print(secrets.token_urlsafe(16))"
```

## 🌍 Step 4: Configure Custom Domain

### 4.1 Add Domain to Vercel

1. In Vercel Dashboard → Your Project → **Settings** → **Domains**
2. Click **Add Domain**
3. Enter: `msmmai.com`
4. Click **Add**

### 4.2 Configure DNS Records

Vercel will provide DNS configuration. Add these records to your domain registrar:

**A Record:**
```
Type: A
Name: @
Value: 76.76.21.21
```

**CNAME Record (for www):**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 4.3 Verify Domain

- Wait 5-10 minutes for DNS propagation
- Vercel will automatically verify and issue SSL certificate

## ✅ Step 5: Verify Deployment

### 5.1 Test Homepage

Visit: `https://msmmai.com`

You should see the main dashboard with two tool tiles.

### 5.2 Test License Reminder Tool

Visit: `https://msmmai.com/licenseremindertool`

- Check dashboard loads
- Verify license data displays correctly
- Test navigation between pages

### 5.3 Test BusinessDev Tool

Visit: `https://msmmai.com/businessdev`

- Check main page loads
- Verify proposals display
- Test organization management

### 5.4 Test Cron Job

```bash
# Manually trigger cron job
curl -X GET "https://msmmai.com/licenseremindertool/api/cron/check-reminders" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Check response for successful execution.

## 🐛 Troubleshooting

### Issue: "Application Error"

**Solution:**
1. Check Vercel logs: Dashboard → Your Project → **Deployments** → Click latest → **View Function Logs**
2. Verify all environment variables are set correctly
3. Check for Python/Node.js dependency issues

### Issue: "404 Not Found" on sub-routes

**Solution:**
1. Verify `vercel.json` routing configuration
2. Ensure `api/` files are present
3. Redeploy: `vercel --prod`

### Issue: "Database Connection Failed"

**Solution:**
1. Verify Oracle credentials in environment variables
2. Check ORACLE_HOST is accessible from Vercel
3. Ensure ORACLE_USER has SYSDBA privileges
4. Test connection locally first

### Issue: Static files not loading (CSS/JS)

**Solution:**
1. Check file paths in HTML files use relative paths
2. Verify `vercel.json` includes static file routes
3. Clear browser cache

### Issue: Cron job not running

**Solution:**
1. Verify cron configuration in `vercel.json`
2. Check CRON_SECRET is set correctly
3. View cron logs in Vercel Dashboard → **Settings** → **Cron Jobs**

## 📊 Monitoring

### View Logs

```bash
# Real-time logs
vercel logs

# Production logs
vercel logs --prod

# Filter by function
vercel logs --prod --output api/licenseremindertool.py
```

### Vercel Dashboard

Monitor:
- **Analytics**: Traffic and performance metrics
- **Deployments**: Deployment history and status
- **Functions**: Serverless function execution logs
- **Cron Jobs**: Scheduled task execution history

## 🔄 Updating the Deployment

### Update Code

```bash
# Make changes to your code
git add .
git commit -m "Update: description of changes"
git push

# Vercel auto-deploys on push if GitHub integration is enabled
# OR manually deploy:
vercel --prod
```

### Update Environment Variables

1. Go to Vercel Dashboard → Settings → Environment Variables
2. Click on variable to edit
3. Update value
4. **Important**: Redeploy for changes to take effect

```bash
vercel --prod
```

## 🎯 Post-Deployment Tasks

- [ ] Test all routes and functionality
- [ ] Verify cron job executes at scheduled time
- [ ] Set up monitoring/alerting (optional)
- [ ] Document any custom configurations
- [ ] Share access with team members
- [ ] Set up staging environment (optional)

## 📞 Support

If you encounter issues:

1. **Check Vercel Documentation**: https://vercel.com/docs
2. **View Deployment Logs**: Vercel Dashboard → Deployments
3. **Contact Support**:
   - Vercel Support: support@vercel.com
   - MSMM Engineering: support@msmmeng.com

## 🎉 Success!

Your MSMM AI Tools suite should now be live at:
- 🏠 Homepage: https://msmmai.com
- 📋 License Tool: https://msmmai.com/licenseremindertool
- 💼 BusinessDev: https://msmmai.com/businessdev

Congratulations on your deployment! 🚀
