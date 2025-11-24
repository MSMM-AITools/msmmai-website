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

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Import the Flask app from the LicenseReminderTool using importlib to avoid naming conflicts
import importlib.util
spec = importlib.util.spec_from_file_location("lrt_index", lrt_path / 'api' / 'index.py')
lrt_index = importlib.util.module_from_spec(spec)
spec.loader.exec_module(lrt_index)

# The app is already configured properly, we just need to export it
# Vercel will handle the routing based on vercel.json configuration
handler = lrt_index.app
