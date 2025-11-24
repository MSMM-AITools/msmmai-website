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
app.use('/businessdev/assets', express.static(path.join(businessDevPath, 'assets')));
app.use('/businessdev/dist', express.static(path.join(businessDevPath, 'dist')));
app.use('/businessdev/js', express.static(path.join(businessDevPath, 'js')));
app.use('/businessdev/pages', express.static(path.join(businessDevPath, 'pages')));

// Serve index.html at the root /businessdev path
app.get('/businessdev', (req, res) => {
    res.sendFile(path.join(businessDevPath, 'index.html'));
});
app.get('/businessdev/', (req, res) => {
    res.sendFile(path.join(businessDevPath, 'index.html'));
});

// Mount the API routes under /businessdev
app.use('/businessdev', serverApp);

// Export for Vercel serverless
module.exports = app;
