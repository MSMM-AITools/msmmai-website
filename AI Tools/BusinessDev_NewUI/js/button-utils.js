/**
 * Button Utility Functions
 * Handle loading states, spinners, and disabled states for buttons
 */

class ButtonUtils {
    /**
     * Set button to loading state
     * @param {HTMLElement|string} button - Button element or ID
     * @param {string} loadingText - Optional text to show while loading
     */
    static setLoading(button, loadingText = 'Processing...') {
        const btn = typeof button === 'string' ? document.getElementById(button) : button;
        if (!btn) return;

        // Store original content and state
        btn.dataset.originalContent = btn.innerHTML;
        btn.dataset.originalDisabled = btn.disabled;

        // Create spinner
        const spinner = `
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 inline-block" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        `;

        // Set loading state
        btn.innerHTML = spinner + loadingText;
        btn.disabled = true;
        btn.classList.add('opacity-75', 'cursor-not-allowed');
    }

    /**
     * Remove loading state from button
     * @param {HTMLElement|string} button - Button element or ID
     */
    static removeLoading(button) {
        const btn = typeof button === 'string' ? document.getElementById(button) : button;
        if (!btn) return;

        // Restore original content and state
        if (btn.dataset.originalContent) {
            btn.innerHTML = btn.dataset.originalContent;
            delete btn.dataset.originalContent;
        }

        if (btn.dataset.originalDisabled !== undefined) {
            btn.disabled = btn.dataset.originalDisabled === 'true';
            delete btn.dataset.originalDisabled;
        }

        btn.classList.remove('opacity-75', 'cursor-not-allowed');
    }

    /**
     * Execute an async function with button loading state
     * @param {HTMLElement|string} button - Button element or ID
     * @param {Function} asyncFn - Async function to execute
     * @param {string} loadingText - Optional loading text
     */
    static async withLoading(button, asyncFn, loadingText = 'Processing...') {
        const btn = typeof button === 'string' ? document.getElementById(button) : button;
        if (!btn) return;

        try {
            this.setLoading(btn, loadingText);
            const result = await asyncFn();
            return result;
        } finally {
            this.removeLoading(btn);
        }
    }

    /**
     * Disable button temporarily to prevent double-clicks
     * @param {HTMLElement|string} button - Button element or ID
     * @param {number} duration - Duration in milliseconds (default 1000)
     */
    static disableTemporarily(button, duration = 1000) {
        const btn = typeof button === 'string' ? document.getElementById(button) : button;
        if (!btn) return;

        btn.disabled = true;
        btn.classList.add('opacity-50', 'cursor-not-allowed');

        setTimeout(() => {
            btn.disabled = false;
            btn.classList.remove('opacity-50', 'cursor-not-allowed');
        }, duration);
    }
}

// Make it available globally
window.ButtonUtils = ButtonUtils;

