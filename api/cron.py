"""
Cron Job Handler for License Reminder Tool
Triggered daily by Vercel Cron
"""

import sys
from pathlib import Path

# Add the LicenseReminderTool directory to Python path
lrt_path = Path(__file__).parent.parent / 'AI Tools' / 'LicenseReminderTool-main'
sys.path.insert(0, str(lrt_path))

# Import the cron handler from the original location
from api.cron import handler

# Export the handler for Vercel
__all__ = ['handler']
