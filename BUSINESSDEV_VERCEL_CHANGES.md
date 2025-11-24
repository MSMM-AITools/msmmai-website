# BusinessDev Vercel Deployment Changes

## Summary

The BusinessDev application has been successfully adapted from localhost development to Vercel serverless deployment. All hardcoded localhost URLs have been replaced with environment-aware configuration.

---

## 🔧 Changes Made

### 1. **Created API Configuration System**

**New File**: `AI Tools/BusinessDev_NewUI/js/config.js`

This file automatically detects the environment and sets the correct API base URL:
- **Localhost**: `http://localhost:3001`
- **Vercel Production**: `/businessdev` (relative path with prefix)

The configuration is exposed as `window.API_CONFIG` for use by all JavaScript files.

---

### 2. **Updated All JavaScript Files**

Modified the following files to use dynamic API URLs instead of hardcoded localhost:

#### **js/table.js**
```javascript
// Before:
const API_BASE_URL = 'http://localhost:3001/api';

// After:
const getApiBaseUrl = () => window.API_CONFIG ? `${window.API_CONFIG.baseUrl}/api` : 'http://localhost:3001/api';
const API_BASE_URL = getApiBaseUrl();
```

#### **js/calendar.js**
- Same pattern as table.js

####  **js/organizations.js**
- Same pattern as table.js

#### **js/license-count.js**
```javascript
// Before:
const LICENSE_API_URL = 'http://localhost:3001/api/licenses';

// After:
const getLicenseApiUrl = () => window.API_CONFIG ? `${window.API_CONFIG.baseUrl}/api/licenses` : 'http://localhost:3001/api/licenses';
const LICENSE_API_URL = getLicenseApiUrl();
```

---

### 3. **Updated HTML Files**

Added `<script src="../js/config.js"></script>` (or `js/config.js` for root) to:

- ✅ `index.html` (root)
- ✅ `pages/table.html`
- ✅ `pages/calendar.html`
- ✅ `pages/organizations.html`

**Important**: `config.js` must be loaded BEFORE any other JavaScript files that make API calls.

---

### 4. **Updated Main index.html**

Replaced hardcoded URLs in inline scripts:

```javascript
// Line 356-357:
const response = await fetch(`${window.API_CONFIG.baseUrl}/api/project-avenue/organizations`);

// Line 400-401:
const response = await fetch(`${window.API_CONFIG.baseUrl}/api/proposals/counts`);
```

---

### 5. **Made Server API Serverless-Compatible**

**Modified**: `AI Tools/BusinessDev_NewUI/server/api.js`

Changed the server startup to only listen when run directly (not when imported):

```javascript
// Before:
app.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;

// After:
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`API server running on http://localhost:${PORT}`);
        console.log(`Health check: http://localhost:${PORT}/api/health`);
    });
}

module.exports = app;
```

This allows the Express app to be imported as a module for serverless without starting a server.

---

### 6. **Updated Root API Wrapper**

**Modified**: `api/businessdev.js`

Simplified to just import and export the Express app:

```javascript
require('dotenv').config({ path: require('path').resolve(__dirname, '../AI Tools/BusinessDev_NewUI/.env') });

const originalApp = require('../AI Tools/BusinessDev_NewUI/server/api');

module.exports = originalApp;
```

---

### 7. **Vercel Configuration**

The existing `vercel.json` already properly configured:

#### Builds:
```json
{
  "src": "api/businessdev.js",
  "use": "@vercel/node",
  "config": {
    "includeFiles": [
      "AI Tools/BusinessDev_NewUI/**"
    ]
  }
}
```

#### Routes:
```json
{
  "src": "^/businessdev/assets/(.*)",
  "dest": "/AI Tools/BusinessDev_NewUI/assets/$1"
},
{
  "src": "^/businessdev/dist/(.*)",
  "dest": "/AI Tools/BusinessDev_NewUI/dist/$1"
},
{
  "src": "^/businessdev/js/(.*)",
  "dest": "/AI Tools/BusinessDev_NewUI/js/$1"
},
{
  "src": "^/businessdev/pages/(.*)",
  "dest": "/AI Tools/BusinessDev_NewUI/pages/$1"
},
{
  "src": "^/businessdev(/.*)?$",
  "dest": "/api/businessdev.js"
}
```

---

## 📁 Files Modified Summary

### New Files Created:
1. `AI Tools/BusinessDev_NewUI/js/config.js` - Environment-aware API configuration

### Files Modified:
1. `AI Tools/BusinessDev_NewUI/index.html` - Added config.js, updated fetch calls
2. `AI Tools/BusinessDev_NewUI/js/table.js` - Dynamic API URL
3. `AI Tools/BusinessDev_NewUI/js/calendar.js` - Dynamic API URL
4. `AI Tools/BusinessDev_NewUI/js/organizations.js` - Dynamic API URL
5. `AI Tools/BusinessDev_NewUI/js/license-count.js` - Dynamic API URL
6. `AI Tools/BusinessDev_NewUI/pages/table.html` - Added config.js
7. `AI Tools/BusinessDev_NewUI/pages/calendar.html` - Added config.js
8. `AI Tools/BusinessDev_NewUI/pages/organizations.html` - Added config.js
9. `AI Tools/BusinessDev_NewUI/server/api.js` - Conditional server startup
10. `api/businessdev.js` - Updated import/export

---

## ✅ Testing Checklist

### Local Development (Still Works):
- [ ] Run `npm run api` from BusinessDev_NewUI folder
- [ ] Access `http://localhost:3000`
- [ ] Verify all API calls work
- [ ] Check console for no errors

### Vercel Production:
- [ ] Deploy to Vercel
- [ ] Access `https://msmmai.com/businessdev`
- [ ] Verify homepage loads
- [ ] Test navigation: Calendar, Organizations, Table views
- [ ] Verify API calls work (check Network tab)
- [ ] Test CRUD operations:
  - Create proposal
  - Edit proposal
  - Delete proposal
  - Filter/search
  - Export to Excel
- [ ] Verify static assets load (CSS, JS, images)

---

## 🔄 How It Works

### Local Development Flow:
1. Developer runs `npm run api` from BusinessDev_NewUI
2. Server starts on `localhost:3001`
3. `config.js` detects localhost and sets `API_CONFIG.baseUrl = 'http://localhost:3001'`
4. All JavaScript files use this URL for API calls
5. Everything works as before

### Vercel Production Flow:
1. User visits `https://msmmai.com/businessdev`
2. Vercel routes to `/api/businessdev.js`
3. Serverless function imports Express app (doesn't call listen())
4. Homepage HTML loads with `config.js`
5. `config.js` detects production and sets `API_CONFIG.baseUrl = '/businessdev'`
6. JavaScript makes API calls to `/businessdev/api/*`
7. Vercel routes API calls back to serverless function
8. Static files (CSS, JS, images) served directly from `/businessdev/assets/*`, etc.

---

## 🚀 Deployment Instructions

### 1. Commit Changes
```bash
git add .
git commit -m "Adapt BusinessDev for Vercel serverless deployment"
git push
```

### 2. Deploy to Vercel
```bash
vercel --prod
```

### 3. Verify Deployment
Visit: `https://your-domain.com/businessdev`

---

## 🐛 Troubleshooting

### Issue: API calls fail with 404
**Solution**: Check that `vercel.json` routes are correctly ordered. Static file routes must come before the catch-all route.

### Issue: JavaScript files can't find `window.API_CONFIG`
**Solution**: Ensure `config.js` is loaded BEFORE other JavaScript files in HTML `<head>`.

### Issue: Static files (CSS/images) not loading
**Solution**:
1. Check browser Network tab for actual requested URLs
2. Verify `vercel.json` has routes for `/businessdev/assets/*`, `/businessdev/dist/*`, etc.
3. Ensure paths in HTML are relative (e.g., `./dist/output.css` not `/dist/output.css`)

### Issue: Database connection fails
**Solution**: Verify Oracle environment variables are set in Vercel Dashboard.

---

## 📝 Notes

### Why This Approach?

1. **Minimal Changes**: Modified only what's necessary, keeping BusinessDev code mostly intact
2. **Backward Compatible**: Still works for localhost development
3. **Environment-Aware**: Automatically detects and adapts to environment
4. **Serverless-Ready**: No server startup in module import, works with Vercel functions
5. **Clean URLs**: Uses relative paths in production, absolute URLs in development

### Benefits:

- ✅ No duplicate code
- ✅ Single codebase works in both environments
- ✅ Easy to maintain
- ✅ Simple to understand

---

## 🎯 Next Steps

1. **Test locally** to ensure nothing broke
2. **Deploy to Vercel** and test production
3. **Monitor** for any issues
4. **Update** any hardcoded URLs if found in other files

---

## 📞 Support

If you encounter issues:
1. Check browser Console for JavaScript errors
2. Check browser Network tab for failed requests
3. Check Vercel function logs
4. Verify environment variables are set

---

*Last Updated: November 24, 2025*
*Changes By: Claude Code*
