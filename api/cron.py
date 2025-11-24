"""
Cron Job Handler for License Reminder Tool
Triggered daily by Vercel Cron
"""

import sys
import os
from pathlib import Path

# Add the LicenseReminderTool directory to Python path
lrt_path = Path(__file__).parent.parent / 'AI Tools' / 'LicenseReminderTool-main'
sys.path.insert(0, str(lrt_path))

# Load environment variables BEFORE importing anything else
from dotenv import load_dotenv
load_dotenv()

# Set template folder path for Flask to find
os.environ['TEMPLATE_FOLDER'] = str(lrt_path / 'templates')
os.environ['STATIC_FOLDER'] = str(lrt_path / 'static')

# Import the cron handler
from api.cron import handler

# Export handler for Vercel
handler = handler
