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

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Import the Flask app from index.py instead (to avoid circular imports)
# The cron logic is defined in LicenseReminderTool-main/api/cron.py
# but it uses the app from index.py
import importlib.util
spec = importlib.util.spec_from_file_location("lrt_cron", lrt_path / 'api' / 'cron.py')
lrt_cron = importlib.util.module_from_spec(spec)
spec.loader.exec_module(lrt_cron)

# Export the handler (which is the Flask app)
handler = lrt_cron.handler
