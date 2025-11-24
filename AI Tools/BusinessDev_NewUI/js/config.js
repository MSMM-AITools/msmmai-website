/**
 * API Configuration
 * Automatically detects environment and sets correct API base URL
 */

(function() {
    'use strict';

    // Detect if we're running under a path prefix (e.g., /businessdev)
    function getBasePath() {
        // Check if we're in a subdirectory
        const path = window.location.pathname;

        // If path starts with /businessdev, we're on Vercel with prefix
        if (path.startsWith('/businessdev')) {
            return '/businessdev';
        }

        // Otherwise, we're on localhost or root domain
        return '';
    }

    // Determine API base URL based on environment
    function getApiBaseUrl() {
        const hostname = window.location.hostname;
        const basePath = getBasePath();

        // Local development
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:3001';
        }

        // Production/Vercel - use relative path with prefix
        return basePath;
    }

    // Export configuration
    window.API_CONFIG = {
        baseUrl: getApiBaseUrl(),
        basePath: getBasePath()
    };

    console.log('API Config loaded:', window.API_CONFIG);
})();
