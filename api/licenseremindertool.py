"""
License Reminder Tool - Vercel Serverless Function Handler
Mounts the Flask app under /licenseremindertool path prefix
"""

import sys
import os
from pathlib import Path
import traceback

print("[LRT Init] Starting licenseremindertool.py initialization", file=sys.stderr)
print(f"[LRT Init] Current working directory: {os.getcwd()}", file=sys.stderr)
print(f"[LRT Init] __file__: {__file__}", file=sys.stderr)

# Add the LicenseReminderTool directory to Python path
lrt_path = Path(__file__).parent.parent / 'AI Tools' / 'LicenseReminderTool-main'
print(f"[LRT Init] LRT path: {lrt_path}", file=sys.stderr)
print(f"[LRT Init] LRT path exists: {lrt_path.exists()}", file=sys.stderr)
print(f"[LRT Init] LRT path absolute: {lrt_path.absolute()}", file=sys.stderr)

sys.path.insert(0, str(lrt_path))
print(f"[LRT Init] Python path after insert: {sys.path[:3]}", file=sys.stderr)

try:
    print("[LRT Init] Importing dotenv...", file=sys.stderr)
    from dotenv import load_dotenv
    print("[LRT Init] Loading .env...", file=sys.stderr)
    load_dotenv()

    # Set template folder path for Flask to find
    template_path = lrt_path / 'templates'
    static_path = lrt_path / 'static'
    print(f"[LRT Init] Template path: {template_path}, exists: {template_path.exists()}", file=sys.stderr)
    print(f"[LRT Init] Static path: {static_path}, exists: {static_path.exists()}", file=sys.stderr)

    os.environ['TEMPLATE_FOLDER'] = str(template_path)
    os.environ['STATIC_FOLDER'] = str(static_path)

    # Check if api/index.py exists
    api_index_path = lrt_path / 'api' / 'index.py'
    print(f"[LRT Init] api/index.py path: {api_index_path}, exists: {api_index_path.exists()}", file=sys.stderr)

    # Import the Flask app
    print("[LRT Init] Attempting to import api.index...", file=sys.stderr)
    from api.index import app as flask_app
    print("[LRT Init] Successfully imported Flask app", file=sys.stderr)

    # Export app for Vercel (Vercel looks for 'app' variable for WSGI apps)
    app = flask_app
    print("[LRT Init] App exported successfully", file=sys.stderr)

except Exception as e:
    print(f"[LRT ERROR] ERROR IMPORTING FLASK APP: {type(e).__name__}: {str(e)}", file=sys.stderr)
    print(f"[LRT ERROR] Full traceback:", file=sys.stderr)
    traceback.print_exc(file=sys.stderr)
    print(f"[LRT ERROR] Python path: {sys.path}", file=sys.stderr)
    print(f"[LRT ERROR] LRT path: {lrt_path}", file=sys.stderr)
    print(f"[LRT ERROR] LRT path exists: {lrt_path.exists()}", file=sys.stderr)
    print(f"[LRT ERROR] Environment variables:", file=sys.stderr)
    for key in ['ORACLE_HOST', 'ORACLE_USER', 'ORACLE_SCHEMA', 'FLASK_SECRET_KEY']:
        value = os.getenv(key)
        masked = value[:3] + '***' if value and len(value) > 3 else 'NOT_SET'
        print(f"[LRT ERROR]   {key}: {masked}", file=sys.stderr)
    raise
