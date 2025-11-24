"""
License Reminder Tool - Vercel Serverless Function Handler
Mounts the Flask app under /licenseremindertool path prefix
"""

import sys
import os
from pathlib import Path
import traceback

# Add the LicenseReminderTool directory to Python path
lrt_path = Path(__file__).parent.parent / 'AI Tools' / 'LicenseReminderTool-main'
sys.path.insert(0, str(lrt_path))

try:
    # Load environment variables BEFORE importing anything else
    from dotenv import load_dotenv
    load_dotenv()

    # Set template folder path for Flask to find
    os.environ['TEMPLATE_FOLDER'] = str(lrt_path / 'templates')
    os.environ['STATIC_FOLDER'] = str(lrt_path / 'static')

    # Import the Flask app
    from api.index import app

    # Export handler for Vercel
    handler = app

except Exception as e:
    print(f"ERROR IMPORTING FLASK APP: {type(e).__name__}: {str(e)}", file=sys.stderr)
    print(f"Full traceback:", file=sys.stderr)
    traceback.print_exc(file=sys.stderr)
    print(f"Python path: {sys.path}", file=sys.stderr)
    print(f"LRT path: {lrt_path}", file=sys.stderr)
    print(f"LRT path exists: {lrt_path.exists()}", file=sys.stderr)
    raise
