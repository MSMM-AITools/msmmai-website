/**
 * BusinessDev Tool - Vercel Serverless Function Handler
 * Mounts the Express app under /businessdev path prefix
 */

// Load environment from BusinessDev folder
require('dotenv').config({ path: require('path').resolve(__dirname, '../AI Tools/BusinessDev_NewUI/.env') });

const path = require('path');

// Import the original server app (without the listen() call)
const originalApp = require('../AI Tools/BusinessDev_NewUI/server/api');

// Export for Vercel serverless
module.exports = originalApp;
