/**
 * Custom Confirmation Dialog
 * Modern, styled confirmation dialogs to replace browser confirm()
 */

class ConfirmDialog {
    /**
     * Show a confirmation dialog
     * @param {Object} options - Configuration options
     * @param {string} options.title - Dialog title
     * @param {string} options.message - Dialog message
     * @param {string} options.confirmText - Confirm button text (default: 'Confirm')
     * @param {string} options.cancelText - Cancel button text (default: 'Cancel')
     * @param {string} options.type - Type: 'danger', 'warning', 'info' (default: 'danger')
     * @returns {Promise<boolean>} - Resolves to true if confirmed, false if cancelled
     */
    static show(options = {}) {
        return new Promise((resolve) => {
            const {
                title = 'Confirm Action',
                message = 'Are you sure you want to proceed?',
                confirmText = 'Confirm',
                cancelText = 'Cancel',
                type = 'danger'
            } = options;

            // Determine colors based on type
            let confirmBtnClass, iconHtml;
            switch (type) {
                case 'danger':
                    confirmBtnClass = 'bg-red-600 hover:bg-red-500 focus:ring-red-600';
                    iconHtml = `
                        <div class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                            <svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                            </svg>
                        </div>
                    `;
                    break;
                case 'warning':
                    confirmBtnClass = 'bg-yellow-600 hover:bg-yellow-500 focus:ring-yellow-600';
                    iconHtml = `
                        <div class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                            <svg class="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                            </svg>
                        </div>
                    `;
                    break;
                default: // info
                    confirmBtnClass = 'bg-indigo-600 hover:bg-indigo-500 focus:ring-indigo-600';
                    iconHtml = `
                        <div class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                            <svg class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                            </svg>
                        </div>
                    `;
            }

            // Create modal overlay
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 z-50 overflow-y-auto';
            modal.innerHTML = `
                <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                    <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" data-close="true"></div>
                    <div class="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                        <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                            <div class="sm:flex sm:items-start">
                                ${iconHtml}
                                <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                    <h3 class="text-base font-semibold leading-6 text-gray-900">${title}</h3>
                                    <div class="mt-2">
                                        <p class="text-sm text-gray-500">${message}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 gap-2">
                            <button type="button" data-confirm="true" class="inline-flex w-full justify-center rounded-md ${confirmBtnClass} px-3 py-2 text-sm font-semibold text-white shadow-sm sm:w-auto">
                                ${confirmText}
                            </button>
                            <button type="button" data-close="true" class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto">
                                ${cancelText}
                            </button>
                        </div>
                    </div>
                </div>
            `;

            // Add to body
            document.body.appendChild(modal);

            // Handle confirm
            const confirmBtn = modal.querySelector('[data-confirm]');
            confirmBtn.addEventListener('click', () => {
                modal.remove();
                resolve(true);
            });

            // Handle cancel/close
            const closeElements = modal.querySelectorAll('[data-close]');
            closeElements.forEach(el => {
                el.addEventListener('click', () => {
                    modal.remove();
                    resolve(false);
                });
            });

            // ESC key to cancel
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    modal.remove();
                    resolve(false);
                    document.removeEventListener('keydown', handleEscape);
                }
            };
            document.addEventListener('keydown', handleEscape);

            // Focus the confirm button
            setTimeout(() => confirmBtn.focus(), 100);
        });
    }

    /**
     * Shorthand for delete confirmation
     */
    static async confirmDelete(itemName = 'this item') {
        return this.show({
            title: 'Confirm Deletion',
            message: `Are you sure you want to delete ${itemName}? This action cannot be undone.`,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            type: 'danger'
        });
    }

    /**
     * Shorthand for archive confirmation
     */
    static async confirmArchive(itemName = 'this item') {
        return this.show({
            title: 'Confirm Archive',
            message: `Are you sure you want to archive ${itemName}? You can unarchive it later if needed.`,
            confirmText: 'Archive',
            cancelText: 'Cancel',
            type: 'warning'
        });
    }
}

// Make it available globally
window.ConfirmDialog = ConfirmDialog;

