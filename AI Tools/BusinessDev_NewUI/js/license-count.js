/**
 * License Count Badge
 * Fetches and displays count of licenses expiring in next 30 days
 */

// Use window.API_CONFIG for environment-aware URL
const getLicenseApiUrl = () => window.API_CONFIG ? `${window.API_CONFIG.baseUrl}/api/licenses` : 'http://localhost:3001/api/licenses';
const LICENSE_API_URL = getLicenseApiUrl();

/**
 * Calculate licenses expiring in next 30 days
 */
async function updateLicenseCount() {
    try {
        const response = await fetch(LICENSE_API_URL);
        const result = await response.json();
        
        if (!result.success) {
            console.error('Failed to fetch licenses');
            return;
        }
        
        const licenses = result.data || [];
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
        
        // Count licenses expiring in next 30 days
        const expiringCount = licenses.filter(license => {
            if (!license.EXPIRATION_DATE) return false;
            const expirationDate = new Date(license.EXPIRATION_DATE);
            return expirationDate >= now && expirationDate <= thirtyDaysFromNow;
        }).length;
        
        // Update all license manager menu items
        const menuItems = document.querySelectorAll('[data-license-count]');
        menuItems.forEach(item => {
            const countSpan = item.querySelector('.license-count');
            if (countSpan) {
                if (expiringCount > 0) {
                    countSpan.textContent = `(${expiringCount})`;
                    countSpan.classList.remove('hidden');
                } else {
                    countSpan.classList.add('hidden');
                }
            }
        });
        
    } catch (error) {
        console.error('Error fetching license count:', error);
    }
}

// Load count when page loads
document.addEventListener('DOMContentLoaded', function() {
    updateLicenseCount();
});

