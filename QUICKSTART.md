# ⚡ Quick Start Guide

Deploy MSMM AI Tools to Vercel in 5 minutes.

## 1️⃣ Install Vercel CLI

```bash
npm install -g vercel
```

## 2️⃣ Navigate to Project

```bash
cd "/Users/rajmehta/Desktop/AITools - MSMMEng/MSMM-AI"
```

## 3️⃣ Install Dependencies

```bash
npm install
```

## 4️⃣ Deploy to Vercel

```bash
# Login
vercel login

# Deploy
vercel --prod
```

## 5️⃣ Configure Environment Variables

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

**Required Variables:**
```
ORACLE_HOST
ORACLE_PORT
ORACLE_SERVICE_NAME
ORACLE_USER
ORACLE_PASSWORD
ORACLE_SCHEMA
SMTP_SERVER
SMTP_PORT
SMTP_USERNAME
SMTP_PASSWORD
FLASK_SECRET_KEY
CRON_SECRET
```

Copy from your existing `.env` files in:
- `AI Tools/LicenseReminderTool-main/.env`
- `AI Tools/BusinessDev_NewUI/.env`

## 6️⃣ Add Custom Domain (Optional)

Vercel Dashboard → Domains → Add `msmmai.com`

## ✅ Done!

Visit your deployment:
- **Homepage**: `https://your-project.vercel.app`
- **License Tool**: `https://your-project.vercel.app/licenseremindertool`
- **BusinessDev**: `https://your-project.vercel.app/businessdev`

---

## 🐛 Troubleshooting

**Error: Missing environment variables**
→ Set all required variables in Vercel Dashboard

**Error: Module not found**
→ Run `npm install` and redeploy

**Database connection failed**
→ Verify Oracle credentials are correct

**Static files not loading**
→ Check paths in `vercel.json`

---

## 📖 Need Help?

- **Full Guide**: See `DEPLOYMENT_GUIDE.md`
- **File Details**: See `FILES_SUMMARY.md`
- **Documentation**: See `README.md`
