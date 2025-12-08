"""
Project Writeup Tool - Vercel Serverless Function Handler
Mounts the Flask app under /project-writeup path prefix
"""

import sys
import os
from pathlib import Path
import traceback

print("[ProjectWriteup Init] Starting projectwriteup.py initialization", file=sys.stderr)
print(f"[ProjectWriteup Init] Current working directory: {os.getcwd()}", file=sys.stderr)
print(f"[ProjectWriteup Init] __file__: {__file__}", file=sys.stderr)

# List contents to debug
try:
    base_path = Path(__file__).parent.parent
    print(f"[ProjectWriteup Init] Base path: {base_path}", file=sys.stderr)
    if base_path.exists():
        items = list(base_path.iterdir())
        print(f"[ProjectWriteup Init] Base path contents: {[str(x.name) for x in items[:10]]}", file=sys.stderr)

        # Check for AI Tools directory
        ai_tools_candidates = [
            base_path / 'AI Tools',
            base_path / 'AI_Tools',
            base_path / 'AITools',
        ]
        for candidate in ai_tools_candidates:
            if candidate.exists():
                print(f"[ProjectWriteup Init] Found AI Tools at: {candidate}", file=sys.stderr)
                items = list(candidate.iterdir())
                print(f"[ProjectWriteup Init] AI Tools contents: {[str(x.name) for x in items[:10]]}", file=sys.stderr)
                break
except Exception as e:
    print(f"[ProjectWriteup Init] Error listing directories: {e}", file=sys.stderr)

# Try multiple possible paths for Projects_Writeup
possible_paths = [
    Path(__file__).parent.parent / 'AI Tools' / 'Projects_Writeup',
    Path(__file__).parent.parent / 'AI_Tools' / 'Projects_Writeup',
    Path(__file__).parent.parent / 'Projects_Writeup',
]

project_path = None
for path_candidate in possible_paths:
    print(f"[ProjectWriteup Init] Trying path: {path_candidate}", file=sys.stderr)
    if path_candidate.exists():
        project_path = path_candidate
        print(f"[ProjectWriteup Init] Found project at: {project_path}", file=sys.stderr)
        break

if not project_path:
    print(f"[ProjectWriteup Init] ERROR: Could not find Projects_Writeup directory", file=sys.stderr)
    print(f"[ProjectWriteup Init] Tried paths: {[str(p) for p in possible_paths]}", file=sys.stderr)
    raise FileNotFoundError("Projects_Writeup directory not found")

sys.path.insert(0, str(project_path))
print(f"[ProjectWriteup Init] Python path after insert: {sys.path[:3]}", file=sys.stderr)

try:
    print("[ProjectWriteup Init] Importing dotenv...", file=sys.stderr)
    from dotenv import load_dotenv
    print("[ProjectWriteup Init] Loading .env...", file=sys.stderr)
    load_dotenv()

    # Set template and static folder paths for Flask to find
    template_path = project_path / 'templates'
    static_path = project_path / 'static'
    print(f"[ProjectWriteup Init] Template path: {template_path}, exists: {template_path.exists()}", file=sys.stderr)
    print(f"[ProjectWriteup Init] Static path: {static_path}, exists: {static_path.exists()}", file=sys.stderr)

    os.environ['TEMPLATE_FOLDER'] = str(template_path)
    os.environ['STATIC_FOLDER'] = str(static_path)

    # Check if api/index.py exists
    api_index_path = project_path / 'api' / 'index.py'
    print(f"[ProjectWriteup Init] api/index.py path: {api_index_path}, exists: {api_index_path.exists()}", file=sys.stderr)

    # Import the Flask app
    print("[ProjectWriteup Init] Attempting to import api.index...", file=sys.stderr)
    from api.index import app as flask_app
    print("[ProjectWriteup Init] Successfully imported Flask app", file=sys.stderr)

    # Wrap Flask app to handle /project-writeup prefix
    from werkzeug.middleware.dispatcher import DispatcherMiddleware
    from werkzeug.exceptions import NotFound

    # Create a middleware that strips the /project-writeup prefix
    app = DispatcherMiddleware(
        NotFound(),  # Default app (404)
        {'/project-writeup': flask_app}  # Mount Flask app at /project-writeup
    )
    print("[ProjectWriteup Init] App wrapped with DispatcherMiddleware for path handling", file=sys.stderr)

except Exception as e:
    print(f"[ProjectWriteup ERROR] ERROR IMPORTING FLASK APP: {type(e).__name__}: {str(e)}", file=sys.stderr)
    print(f"[ProjectWriteup ERROR] Full traceback:", file=sys.stderr)
    traceback.print_exc(file=sys.stderr)
    print(f"[ProjectWriteup ERROR] Python path: {sys.path}", file=sys.stderr)
    print(f"[ProjectWriteup ERROR] Project path: {project_path}", file=sys.stderr)
    print(f"[ProjectWriteup ERROR] Project path exists: {project_path.exists()}", file=sys.stderr)
    print(f"[ProjectWriteup ERROR] Environment variables:", file=sys.stderr)
    for key in ['OPENAI_API_KEY', 'FLASK_SECRET_KEY']:
        value = os.getenv(key)
        masked = value[:3] + '***' if value and len(value) > 3 else 'NOT_SET'
        print(f"[ProjectWriteup ERROR]   {key}: {masked}", file=sys.stderr)
    raise
