"""
License Reminder Tool - Vercel Serverless Function Handler
Mounts the Flask app under /licenseremindertool path prefix
"""

import sys
import os
from pathlib import Path

# Add the LicenseReminderTool directory to Python path
lrt_path = Path(__file__).parent.parent / 'AI Tools' / 'LicenseReminderTool-main'
sys.path.insert(0, str(lrt_path))

# Import the Flask app from the original index.py
from api.index import app

# The app is already configured properly, we just need to export it
# Vercel will handle the routing based on vercel.json configuration
handler = app
