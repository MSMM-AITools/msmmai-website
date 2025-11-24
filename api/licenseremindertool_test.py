"""
Minimal test handler for License Reminder Tool
Tests if basic Python serverless function works
"""

import sys
import os

print("[LRT TEST] Starting minimal test handler", file=sys.stderr)

from flask import Flask, jsonify

# Vercel expects 'app' variable for WSGI applications (not 'handler')
app = Flask(__name__)

@app.route('/')
@app.route('/<path:path>')
def test_handler(path=''):
    return jsonify({
        'status': 'Test handler working',
        'message': 'Basic Python serverless function is operational',
        'path': path,
        'python_version': sys.version,
        'cwd': os.getcwd(),
        'env_oracle_host': os.getenv('ORACLE_HOST', 'NOT_SET')[:10] + '***'
    })
