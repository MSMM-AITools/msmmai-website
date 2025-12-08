# MSMM Engineering Project Writer - Vercel Deployment Guide

This guide will walk you through deploying the MSMM Engineering Project Writer to Vercel using the Vercel Web UI (Dashboard).

## 📋 Prerequisites

Before deploying, ensure you have:

1. **GitHub Account**: Your code should be pushed to a GitHub repository
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
3. **OpenAI API Key**: Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)

## 🗂️ Project Structure for Vercel

The project has been restructured for Vercel deployment:

```
Projects_Writeup/
├── api/
│   └── index.py              # Main Flask app (Vercel serverless function)
├── static/
│   └── script.js            # Frontend JavaScript
├── templates/
│   ├── index.html           # Main HTML template
│   └── jinja_template.docx  # Word template for document generation
├── vercel.json              # Vercel configuration
├── requirements.txt         # Python dependencies
├── README.md               # Project documentation
├── TEMPLATE_GUIDE.md       # Template modification guide
└── DEPLOYMENT.md           # This deployment guide
```

## 🚀 Step-by-Step Deployment Instructions

### Step 1: Prepare Your Repository

1. **Push to GitHub**: Ensure all your code is committed and pushed to a GitHub repository.

2. **Verify File Structure**: Confirm your project has the following structure:
   - `api/index.py` (main Flask app)
   - `vercel.json` (configuration file)
   - `requirements.txt` (dependencies)
   - `static/` and `templates/` directories

### Step 2: Connect to Vercel

1. **Login to Vercel**: Go to [vercel.com](https://vercel.com) and log in
2. **Import Project**: Click "New Project" or "Import Project"
3. **Connect GitHub**: If not already connected, authorize Vercel to access your GitHub account
4. **Select Repository**: Choose your MSMM Engineering Project Writer repository

### Step 3: Configure Project Settings

When importing the project, Vercel will automatically detect it as a Python project. Configure the following:

#### Build & Development Settings:
- **Framework Preset**: `Other`
- **Build Command**: Leave empty (Vercel auto-detects Python)
- **Output Directory**: Leave empty
- **Install Command**: `pip install -r requirements.txt`

#### Root Directory:
- **Root Directory**: Leave as `.` (project root)

### Step 4: Configure Environment Variables

⚠️ **CRITICAL**: Add your OpenAI API key as an environment variable:

1. In the Vercel dashboard, go to your project settings
2. Navigate to "Environment Variables" tab
3. Add the following variable:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: Your actual OpenAI API key (e.g., `sk-...`)
   - **Environment**: Select "Production", "Preview", and "Development"

### Step 5: Deploy

1. **Click Deploy**: After configuring settings and environment variables
2. **Wait for Build**: Vercel will install dependencies and deploy your app
3. **Get URL**: Once deployed, you'll receive a unique Vercel URL

## 🔧 Vercel Configuration Details

### vercel.json Configuration

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/static/(.*)",
      "dest": "/static/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/api/index.py"
    }
  ],
  "functions": {
    "api/index.py": {
      "maxDuration": 30
    }
  }
}
```

### Key Configuration Points:

1. **Serverless Function**: The Flask app runs as a serverless function in `api/index.py`
2. **Static Files**: CSS/JS files are served from the `static/` directory
3. **Templates**: HTML templates are in the `templates/` directory
4. **Max Duration**: Functions can run for up to 30 seconds (sufficient for AI processing)

## 🌍 Domain Configuration (Optional)

### Using Custom Domain:

1. **Go to Project Settings**: In Vercel dashboard
2. **Navigate to Domains**: Add your custom domain
3. **Configure DNS**: Point your domain to Vercel's servers
4. **SSL Certificate**: Vercel automatically provides SSL certificates

### Default Vercel Domain:
Your app will be accessible at: `https://your-project-name.vercel.app`

## 🔍 Testing Your Deployment

After deployment, test the following features:

1. **Homepage Loading**: Visit your Vercel URL
2. **File Upload**: Test uploading project documents (DOC, DOCX, PDF, TXT)
3. **Quote Upload**: Test uploading quote documents
4. **AI Generation**: Test generating brief descriptions
5. **Document Generation**: Test final document download
6. **Regeneration**: Test the "Generate More Response" feature

## 🛠️ Troubleshooting

### Common Issues and Solutions:

#### 1. **Build Failures**
- **Issue**: Dependencies not installing
- **Solution**: Check `requirements.txt` format and dependencies compatibility

#### 2. **Environment Variable Errors**
- **Issue**: `OPENAI_API_KEY not found`
- **Solution**: Ensure the environment variable is properly set in Vercel dashboard

#### 3. **File Upload Issues**
- **Issue**: File uploads failing
- **Solution**: Vercel has file size limits (4.5MB for serverless functions)

#### 4. **Template Loading Errors**
- **Issue**: `jinja_template.docx` not found
- **Solution**: Ensure the template file is in the `templates/` directory

#### 5. **Timeout Errors**
- **Issue**: Function timeout during AI processing
- **Solution**: The current configuration allows 30 seconds, which should be sufficient

### Monitoring and Logs:

1. **Function Logs**: View in Vercel dashboard under "Functions" tab
2. **Real-time Logs**: Available during development and debugging
3. **Error Tracking**: Vercel provides built-in error monitoring

## 📊 Performance Considerations

### Vercel Limits:

- **Function Duration**: 30 seconds (configured)
- **Function Memory**: 1024MB (default)
- **File Upload**: 4.5MB max per request
- **Monthly Function Invocations**: Based on your Vercel plan

### Optimization Tips:

1. **File Size**: Keep uploaded documents under 4MB
2. **Concurrent Processing**: Vercel handles multiple requests automatically
3. **Caching**: Static files are automatically cached by Vercel CDN

## 🔐 Security Considerations

1. **Environment Variables**: Never commit API keys to your repository
2. **File Validation**: The app validates file types and sizes
3. **Temporary Files**: Files are automatically cleaned up after processing
4. **HTTPS**: Vercel provides automatic HTTPS for all deployments

## 📈 Scaling

Vercel automatically scales your application:

- **Auto-scaling**: Functions scale based on demand
- **Global CDN**: Static files served from global edge locations
- **Zero-config**: No server management required

## 💰 Cost Considerations

### Vercel Pricing:

- **Hobby Plan**: Free tier with generous limits
- **Pro Plan**: $20/month for advanced features
- **Enterprise**: Custom pricing for large organizations

### OpenAI Costs:

- **GPT-4 Turbo**: ~$0.01-0.03 per request (depending on document size)
- **Monitor Usage**: Track usage in OpenAI dashboard

## 🎯 Production Checklist

Before going live:

- [ ] OpenAI API key configured
- [ ] All features tested
- [ ] Custom domain configured (if desired)
- [ ] Error monitoring set up
- [ ] Usage limits understood
- [ ] Backup of template files

## 📞 Support

For deployment issues:

1. **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
2. **Vercel Community**: [github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions)
3. **OpenAI Support**: For API-related issues

## 🔄 Updates and Maintenance

### Updating the Application:

1. **Push Changes**: Commit and push changes to your GitHub repository
2. **Auto-Deploy**: Vercel automatically deploys changes from the main branch
3. **Preview Deployments**: Pull requests create preview deployments

### Monitoring:

- **Analytics**: Available in Vercel dashboard
- **Error Tracking**: Built-in error monitoring
- **Performance**: Function execution time and memory usage

---

## 🎉 Congratulations!

Your MSMM Engineering Project Writer is now deployed on Vercel and ready for professional use. The application will automatically handle scaling, security, and performance optimization.

**Your deployed application includes:**
- ✅ Professional web interface
- ✅ Document processing (DOC, DOCX, PDF, TXT)
- ✅ AI-powered content generation with GPT-4 Turbo
- ✅ Quote extraction from client correspondence
- ✅ Customizable description parameters
- ✅ Professional document generation
- ✅ "Generate More Response" feature
- ✅ Global CDN delivery
- ✅ Automatic HTTPS
- ✅ Zero-config scaling 