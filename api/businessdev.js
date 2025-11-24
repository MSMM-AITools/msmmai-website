/**
 * BusinessDev Tool - Vercel Serverless Function Handler
 * Mounts the Express app under /businessdev path prefix
 */

const path = require('path');
const express = require('express');

// Load environment variables from BusinessDev folder
require('dotenv').config({
    path: path.resolve(__dirname, '../AI Tools/BusinessDev_NewUI/.env')
});

// Set up module paths to allow server/api.js to find its dependencies
const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function(id) {
    // If requiring '../db/connection' from server/api.js, resolve it correctly
    if (id === '../db/connection') {
        return originalRequire.call(this, path.resolve(__dirname, '../AI Tools/BusinessDev_NewUI/db/connection.js'));
    }
    return originalRequire.call(this, id);
};

// Now require the server app
const serverApp = require(path.resolve(__dirname, '../AI Tools/BusinessDev_NewUI/server/api.js'));

// Create a wrapper to handle the /businessdev prefix and serve static files
const app = express();

// Serve static files with correct paths
const businessDevPath = path.resolve(__dirname, '../AI Tools/BusinessDev_NewUI');

// Debug: Log the resolved path and check if directories exist
const fs = require('fs');
console.log('[BusinessDev Init] businessDevPath:', businessDevPath);
console.log('[BusinessDev Init] dist exists:', fs.existsSync(path.join(businessDevPath, 'dist')));
console.log('[BusinessDev Init] js exists:', fs.existsSync(path.join(businessDevPath, 'js')));
console.log('[BusinessDev Init] assets exists:', fs.existsSync(path.join(businessDevPath, 'assets')));

// List actual files in js directory
try {
    const jsFiles = fs.readdirSync(path.join(businessDevPath, 'js'));
    console.log('[BusinessDev Init] JS files:', jsFiles);
} catch(e) {
    console.log('[BusinessDev Init] Error reading js directory:', e.message);
}

// Log middleware for debugging
app.use((req, res, next) => {
    console.log(`[BusinessDev] ${req.method} ${req.url}`);
    console.log(`[BusinessDev] Path: ${req.path}`);
    console.log(`[BusinessDev] OriginalUrl: ${req.originalUrl}`);
    console.log(`[BusinessDev] BaseUrl: ${req.baseUrl}`);
    console.log(`[BusinessDev] Query:`, JSON.stringify(req.query));
    next();
});

// Serve static files - order matters, specific routes first
const staticOptions = {
    maxAge: 0, // No caching for debugging
    fallthrough: true,
    setHeaders: (res, path) => {
        console.log('[BusinessDev Static] Serving:', path);
    }
};

app.use('/businessdev/assets', express.static(path.join(businessDevPath, 'assets'), staticOptions));
app.use('/businessdev/dist', express.static(path.join(businessDevPath, 'dist'), staticOptions));
app.use('/businessdev/js', express.static(path.join(businessDevPath, 'js'), staticOptions));
app.use('/businessdev/pages', express.static(path.join(businessDevPath, 'pages'), staticOptions));

// Serve index.html at the root /businessdev path
app.get('/businessdev', (req, res) => {
    console.log('[BusinessDev] Serving index.html');
    res.sendFile(path.join(businessDevPath, 'index.html'));
});
app.get('/businessdev/', (req, res) => {
    console.log('[BusinessDev] Serving index.html');
    res.sendFile(path.join(businessDevPath, 'index.html'));
});

// Mount the API routes under /businessdev - this should come LAST
app.use('/businessdev', serverApp);

// Catch-all 404 handler for debugging
app.use((req, res) => {
    console.log('[BusinessDev 404] No handler found for:', req.method, req.url, req.path);
    console.log('[BusinessDev 404] Headers:', JSON.stringify(req.headers));
    res.status(404).send(`Not Found: ${req.url}`);
});

// Export for Vercel serverless
module.exports = app;
