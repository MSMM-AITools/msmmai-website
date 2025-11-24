"""
Cron Job Handler for License Reminder Tool
Triggered daily by Vercel Cron
"""

import sys
import os
from pathlib import Path

# Add the LicenseReminderTool directory to Python path FIRST
lrt_path = Path(__file__).parent.parent / 'AI Tools' / 'LicenseReminderTool-main'
sys.path.insert(0, str(lrt_path))

# Change working directory to ensure relative paths work
original_cwd = os.getcwd()
os.chdir(str(lrt_path))

try:
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()

    # Import the cron module which includes the handler
    # The cron logic is defined in LicenseReminderTool-main/api/cron.py
    from api.cron import handler

    # Export the handler (which is the Flask app with cron routes)
    # This is already defined, just re-export it
    handler = handler

finally:
    # Restore original directory
    os.chdir(original_cwd)
