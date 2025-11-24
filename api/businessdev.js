/**
 * BusinessDev Tool - Vercel Serverless Function Handler
 * Mounts the Express app under /businessdev path prefix
 */

const path = require('path');

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

// Export for Vercel serverless
module.exports = serverApp;
