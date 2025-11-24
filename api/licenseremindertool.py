"""
License Reminder Tool - Vercel Serverless Function Handler
Mounts the Flask app under /licenseremindertool path prefix
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

    # Import the Flask app from the api.index module
    # This should now work because we've set up sys.path and changed directory
    from api.index import app

    # The app is already configured properly, we just need to export it
    # Vercel will handle the routing based on vercel.json configuration
    handler = app

finally:
    # Restore original directory (though in serverless this doesn't matter much)
    os.chdir(original_cwd)
