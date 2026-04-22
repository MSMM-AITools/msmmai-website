"""
Cron Job Handler for License Reminder Tool
Triggered daily by Vercel Cron
"""

import sys
import os
import importlib.util
from pathlib import Path

lrt_path = Path(__file__).parent.parent / 'AI Tools' / 'LicenseReminderTool-main'
sys.path.insert(0, str(lrt_path))

from dotenv import load_dotenv
load_dotenv()

os.environ['TEMPLATE_FOLDER'] = str(lrt_path / 'templates')
os.environ['STATIC_FOLDER'] = str(lrt_path / 'static')

from api.index import app as flask_app

# Load the inner cron module under a non-colliding name so its
# @app.route('/api/cron/check-reminders') decorator registers on flask_app.
# A plain `from api.cron import ...` would collide with this wrapper file.
_cron_spec = importlib.util.spec_from_file_location(
    "_lrt_cron_routes", str(lrt_path / "api" / "cron.py")
)
_cron_module = importlib.util.module_from_spec(_cron_spec)
_cron_spec.loader.exec_module(_cron_module)

from werkzeug.middleware.dispatcher import DispatcherMiddleware
from werkzeug.exceptions import NotFound

# Top-level WSGI `app` so Vercel's Python runtime registers this as a Serverless
# Function. Cron URL is /licenseremindertool/api/cron/check-reminders; strip
# the /licenseremindertool prefix before dispatching to the Flask app.
app = DispatcherMiddleware(NotFound(), {'/licenseremindertool': flask_app})
