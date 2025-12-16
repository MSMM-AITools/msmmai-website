// API Configuration - uses window.API_CONFIG from config.js
const getApiBaseUrl = () => window.API_CONFIG ? `${window.API_CONFIG.baseUrl}/api` : 'http://localhost:3001/api';
const API_BASE_URL = getApiBaseUrl();

// Calendar state
let calendar;
let currentEventId = null;
let quillEditor = null;
let licensesVisible = true; // Show licenses by default
let licenseEventSource = null;

/**
 * Initialize calendar
 */
document.addEventListener('DOMContentLoaded', function() {
    const calendarEl = document.getElementById('calendar');

    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
        },
        editable: true,
        selectable: true,
        selectMirror: true,
        dayMaxEvents: true,
        weekends: true,

        // Event handlers
        select: handleDateSelect,
        eventClick: handleEventClick,
        eventDrop: handleEventDrop,
        eventResize: handleEventResize,
        eventMouseEnter: handleEventMouseEnter,
        eventMouseLeave: handleEventMouseLeave,
        
        // Make license events non-editable
        eventAllow: function(dropInfo, draggedEvent) {
            // Prevent dragging license events
            return !draggedEvent.extendedProps.isLicense;
        },
        eventResizableFromStart: function(arg) {
            // Prevent resizing license events
            return !arg.event.extendedProps.isLicense;
        },

        // Load events from API
        events: loadEvents
    });

    calendar.render();

    // Initialize Quill Rich Text Editor
    initializeQuillEditor();

    // Setup event listeners
    setupEventListeners();

    // Setup menu toggles
    setupMenuToggles();

    // Load licenses by default
    initializeLicenses();
});

/**
 * Initialize Quill Rich Text Editor
 */
function initializeQuillEditor() {
    const toolbarOptions = [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'indent': '-1'}, { 'indent': '+1' }],
        [{ 'color': [] }, { 'background': [] }],
        ['link'],
        ['clean']
    ];

    quillEditor = new Quill('#event-notes-editor', {
        theme: 'snow',
        modules: {
            toolbar: toolbarOptions
        },
        placeholder: 'Paste your meeting minutes, notes, action items, etc. here...'
    });

    // Sync Quill content to hidden textarea when content changes
    quillEditor.on('text-change', function() {
        const html = quillEditor.root.innerHTML;
        document.getElementById('event-notes').value = html;
    });
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    document.getElementById('create-event-btn').addEventListener('click', () => {
        showEventModal();
    });

    document.getElementById('save-event-btn').addEventListener('click', saveEvent);
    document.getElementById('delete-event-btn').addEventListener('click', deleteEvent);
    document.getElementById('cancel-event-btn').addEventListener('click', hideEventModal);

    // Toggle licenses button
    document.getElementById('toggle-licenses-btn').addEventListener('click', toggleLicenses);

    // All-day checkbox handler
    document.getElementById('event-all-day').addEventListener('change', (e) => {
        const startInput = document.getElementById('event-start');
        const endInput = document.getElementById('event-end');

        if (e.target.checked) {
            // Convert to date-only inputs
            startInput.type = 'date';
            endInput.type = 'date';
        } else {
            // Convert to datetime inputs
            startInput.type = 'datetime-local';
            endInput.type = 'datetime-local';
        }
    });
}

/**
 * Setup menu toggles
 */
function setupMenuToggles() {
    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const menuOpenIcon = document.getElementById('menu-open-icon');
    const menuCloseIcon = document.getElementById('menu-close-icon');

    mobileMenuBtn.addEventListener('click', () => {
        const isHidden = mobileMenu.classList.contains('hidden');

        if (isHidden) {
            mobileMenu.classList.remove('hidden');
            menuOpenIcon.classList.add('hidden');
            menuCloseIcon.classList.remove('hidden');
        } else {
            mobileMenu.classList.add('hidden');
            menuOpenIcon.classList.remove('hidden');
            menuCloseIcon.classList.add('hidden');
        }
    });

    // Profile dropdown toggle
    const profileMenuBtn = document.getElementById('profile-menu-btn');
    const profileDropdown = document.getElementById('profile-dropdown');

    profileMenuBtn.addEventListener('click', () => {
        profileDropdown.classList.toggle('hidden');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!profileMenuBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
            profileDropdown.classList.add('hidden');
        }
    });
}

/**
 * Load events from API
 */
async function loadEvents(info, successCallback, failureCallback) {
    try {
        const response = await fetch(`${API_BASE_URL}/events`);
        const result = await response.json();

        if (result.success) {
            const events = result.data.map(event => ({
                id: event.EVENT_ID,
                title: event.TITLE,
                start: event.START_DATE,
                end: event.END_DATE,
                allDay: event.ALL_DAY === 'Y',
                backgroundColor: event.COLOR || '#3B82F6',
                borderColor: event.COLOR || '#3B82F6',
                extendedProps: {
                    description: event.DESCRIPTION,
                    location: event.LOCATION,
                    notes: event.NOTES,
                    editable: true
                }
            }));

            successCallback(events);
        } else {
            failureCallback(result.error);
        }
    } catch (error) {
        console.error('Error loading events:', error);
        failureCallback(error);
    }
}

/**
 * Load licenses from API
 */
async function loadLicenses(info, successCallback, failureCallback) {
    try {
        const response = await fetch(`${API_BASE_URL}/licenses`);
        const result = await response.json();

        if (result.success) {
            const licenses = result.data.map(license => {
                // Fix timezone issue: extract just the date part and use noon UTC
                // This prevents the date from shifting to the previous day in US timezones
                let startDate = license.EXPIRATION_DATE;
                if (startDate) {
                    // Extract YYYY-MM-DD from the date string (handles both ISO and date-only formats)
                    const dateOnly = startDate.split('T')[0];
                    // Use noon UTC to prevent timezone shifts from changing the calendar date
                    startDate = dateOnly + 'T12:00:00.000Z';
                }
                
                return {
                    id: `license-${license.LIC_ID}`,
                    title: `🔒 License: ${license.LIC_NAME || license.LIC_TYPE}`,
                    start: startDate,
                    allDay: true,
                    backgroundColor: '#F59E0B', // Amber/orange color
                    borderColor: '#D97706',
                    textColor: '#FFFFFF',
                    classNames: ['license-event'],
                    extendedProps: {
                        licenseId: license.LIC_ID,
                        licenseName: license.LIC_NAME,
                        licenseState: license.LIC_STATE,
                        licenseType: license.LIC_TYPE,
                        licenseNumber: license.LIC_NO,
                        fullText: license.LIC_FULL_TEXT,
                        licenseComments: license.LIC_COMMENTS,
                        editable: false,
                        isLicense: true
                    }
                };
            });

            successCallback(licenses);
        } else {
            failureCallback(result.error);
        }
    } catch (error) {
        console.error('Error loading licenses:', error);
        failureCallback(error);
    }
}

/**
 * Toggle license visibility
 */
function toggleLicenses() {
    licensesVisible = !licensesVisible;
    const btn = document.getElementById('toggle-licenses-btn');
    const btnText = document.getElementById('licenses-toggle-text');

    if (licensesVisible) {
        // Add license event source
        licenseEventSource = calendar.addEventSource(loadLicenses);
        btnText.textContent = 'Hide Licenses';
        btn.classList.remove('bg-white', 'text-gray-900', 'ring-gray-300');
        btn.classList.add('bg-amber-500', 'text-white', 'ring-amber-600');
    } else {
        // Remove license event source
        if (licenseEventSource) {
            licenseEventSource.remove();
            licenseEventSource = null;
        }
        btnText.textContent = 'Show Licenses';
        btn.classList.remove('bg-amber-500', 'text-white', 'ring-amber-600');
        btn.classList.add('bg-white', 'text-gray-900', 'ring-gray-300');
    }
}

/**
 * Initialize licenses on page load (show by default)
 */
function initializeLicenses() {
    const btn = document.getElementById('toggle-licenses-btn');
    const btnText = document.getElementById('licenses-toggle-text');
    
    // Add license event source
    licenseEventSource = calendar.addEventSource(loadLicenses);
    
    // Update button appearance to show licenses are visible
    btnText.textContent = 'Hide Licenses';
    btn.classList.remove('bg-white', 'text-gray-900', 'ring-gray-300');
    btn.classList.add('bg-amber-500', 'text-white', 'ring-amber-600');
}

/**
 * Handle date selection (create new event)
 */
function handleDateSelect(selectInfo) {
    const startDate = selectInfo.start;
    const endDate = selectInfo.end;

    showEventModal(null, startDate, endDate, selectInfo.allDay);
    calendar.unselect();
}

/**
 * Handle event click (edit event)
 */
function handleEventClick(clickInfo) {
    const event = clickInfo.event;
    
    // Check if this is a license event (read-only)
    if (event.extendedProps.isLicense) {
        showLicenseModal(event);
        return;
    }

    currentEventId = event.id;
    showEventModal(event);
}

/**
 * Handle mouse enter on event (show tooltip for licenses)
 */
function handleEventMouseEnter(info) {
    const event = info.event;
    
    // Only show tooltip for license events
    if (!event.extendedProps.isLicense) {
        return;
    }
    
    // Remove any existing tooltips
    const existingTooltip = document.querySelector('.license-tooltip');
    if (existingTooltip) {
        existingTooltip.remove();
    }
    
    // Create tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'license-tooltip';
    
    let fullText = event.extendedProps.fullText || '';
    
    // If LIC_FULL_TEXT is missing or null, create a basic summary
    if (!fullText || fullText.trim() === '') {
        fullText = `License Name: ${event.extendedProps.licenseName || 'N/A'}, License Type: ${event.extendedProps.licenseType || 'N/A'}, License State: ${event.extendedProps.licenseState || 'N/A'}, Expiration Date: ${new Date(event.start).toLocaleDateString()}`;
        // Add comments if available
        if (event.extendedProps.licenseComments) {
            fullText += `, Comments: ${event.extendedProps.licenseComments}`;
        }
    } else {
        // Check if expiration date is missing from LIC_FULL_TEXT (empty value after "Expiration Date:")
        if (fullText.includes('Expiration Date: ,') || fullText.includes('Expiration Date:  ,') || (fullText.includes('Expiration Date:') && !fullText.match(/Expiration Date:\s*\d{4}-\d{2}-\d{2}/))) {
            // Add the actual expiration date from the event
            const expirationDate = new Date(event.start).toLocaleDateString();
            fullText = fullText.replace(/Expiration Date:\s*,/, `Expiration Date: ${expirationDate},`);
            fullText = fullText.replace(/Expiration Date:\s+,/, `Expiration Date: ${expirationDate},`);
            fullText = fullText.replace(/Expiration Date:\s*$/, `Expiration Date: ${expirationDate}`);
        }
        // Add comments to existing fullText if not already included
        if (event.extendedProps.licenseComments && !fullText.includes('Comments:')) {
            fullText += `, Comments: ${event.extendedProps.licenseComments}`;
        }
    }
    
    // Split by comma and create line breaks for better readability
    const formattedText = fullText.split(',').map(line => line.trim()).filter(line => line).join('<br>');
    
    tooltip.innerHTML = `
        <div class="license-tooltip-title">🔒 License Information</div>
        <div>${formattedText}</div>
    `;
    
    document.body.appendChild(tooltip);
    
    // Position tooltip near the event element (not mouse position)
    const updateTooltipPosition = (e) => {
        // Get the event element's position
        const eventRect = info.el.getBoundingClientRect();
        const tooltipWidth = tooltip.offsetWidth;
        const tooltipHeight = tooltip.offsetHeight;
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;
        const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
        
        // Start by positioning to the right and slightly below the event
        let left = eventRect.right + 10 + scrollX;
        let top = eventRect.top + scrollY;
        
        // If tooltip would go off right edge, position to the left of event
        if (left + tooltipWidth > windowWidth + scrollX) {
            left = eventRect.left - tooltipWidth - 10 + scrollX;
        }
        
        // If tooltip would go off left edge, center it horizontally
        if (left < scrollX) {
            left = eventRect.left + (eventRect.width / 2) - (tooltipWidth / 2) + scrollX;
        }
        
        // If tooltip would go off bottom, position above the event
        if (top + tooltipHeight > windowHeight + scrollY) {
            top = eventRect.bottom - tooltipHeight + scrollY;
        }
        
        // Make sure tooltip doesn't go above viewport
        if (top < scrollY) {
            top = eventRect.bottom + 10 + scrollY;
        }
        
        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
        tooltip.style.position = 'absolute';
    };
    
    // Initial positioning
    updateTooltipPosition(info.jsEvent);
    
    // Store event element for mouse move tracking
    info.el.addEventListener('mousemove', updateTooltipPosition);
    info.el._tooltipMoveHandler = updateTooltipPosition;
}

/**
 * Handle mouse leave on event (hide tooltip)
 */
function handleEventMouseLeave(info) {
    // Remove tooltip
    const tooltip = document.querySelector('.license-tooltip');
    if (tooltip) {
        tooltip.remove();
    }
    
    // Remove mouse move handler
    if (info.el._tooltipMoveHandler) {
        info.el.removeEventListener('mousemove', info.el._tooltipMoveHandler);
        delete info.el._tooltipMoveHandler;
    }
}

/**
 * Handle event drag and drop
 */
async function handleEventDrop(info) {
    const event = info.event;

    try {
        await updateEventDates(event.id, event.start, event.end, event.allDay);
        toast.success('Event rescheduled successfully');
    } catch (error) {
        console.error('Error updating event:', error);
        toast.error('Failed to update event: ' + error.message);
        info.revert();
    }
}

/**
 * Handle event resize
 */
async function handleEventResize(info) {
    const event = info.event;

    try {
        await updateEventDates(event.id, event.start, event.end, event.allDay);
        toast.success('Event duration updated');
    } catch (error) {
        console.error('Error updating event:', error);
        toast.error('Failed to update event: ' + error.message);
        info.revert();
    }
}

/**
 * Update event dates via API
 */
async function updateEventDates(eventId, start, end, allDay) {
    let startDate, endDate;
    
    if (allDay) {
        // For all-day events, use noon UTC to prevent timezone shifts from changing the date
        const startStr = start.toISOString().split('T')[0];
        const endStr = end ? end.toISOString().split('T')[0] : startStr;
        startDate = startStr + 'T12:00:00.000Z';
        endDate = endStr + 'T12:00:00.000Z';
    } else {
        startDate = start.toISOString();
        endDate = end ? end.toISOString() : start.toISOString();
    }
    
    const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            START_DATE: startDate,
            END_DATE: endDate,
            ALL_DAY: allDay ? 'Y' : 'N'
        })
    });

    const result = await response.json();

    if (!result.success) {
        throw new Error(result.error);
    }
}

/**
 * Show event modal
 */
function showEventModal(event = null, startDate = null, endDate = null, allDay = false) {
    const modal = document.getElementById('event-modal');
    const title = document.getElementById('event-modal-title');
    const deleteBtn = document.getElementById('delete-event-btn');

    // Reset form
    document.getElementById('event-form').reset();

    if (event) {
        // Edit mode
        currentEventId = event.id;
        title.textContent = 'Edit Event';
        deleteBtn.classList.remove('hidden');

        // Populate form
        document.getElementById('event-title').value = event.title || '';
        document.getElementById('event-description').value = event.extendedProps.description || '';
        document.getElementById('event-location').value = event.extendedProps.location || '';
        document.getElementById('event-color').value = event.backgroundColor || '#3B82F6';
        document.getElementById('event-all-day').checked = event.allDay;
        
        // Set Quill editor content
        const notes = event.extendedProps.notes || '';
        if (quillEditor) {
            quillEditor.root.innerHTML = notes;
            document.getElementById('event-notes').value = notes;
        }

        // Set dates
        const startInput = document.getElementById('event-start');
        const endInput = document.getElementById('event-end');

        if (event.allDay) {
            startInput.type = 'date';
            endInput.type = 'date';
            startInput.value = formatDateForInput(event.start, true);
            endInput.value = formatDateForInput(event.end || event.start, true);
        } else {
            startInput.type = 'datetime-local';
            endInput.type = 'datetime-local';
            startInput.value = formatDateForInput(event.start, false);
            endInput.value = formatDateForInput(event.end || event.start, false);
        }
    } else {
        // Create mode
        currentEventId = null;
        title.textContent = 'Add Event';
        deleteBtn.classList.add('hidden');

        // Clear Quill editor for new event
        if (quillEditor) {
            quillEditor.setText('');
            document.getElementById('event-notes').value = '';
        }

        // Set default dates if provided
        if (startDate) {
            const startInput = document.getElementById('event-start');
            const endInput = document.getElementById('event-end');

            if (allDay) {
                startInput.type = 'date';
                endInput.type = 'date';
                startInput.value = formatDateForInput(startDate, true);
                endInput.value = formatDateForInput(endDate || startDate, true);
            } else {
                startInput.type = 'datetime-local';
                endInput.type = 'datetime-local';
                startInput.value = formatDateForInput(startDate, false);
                endInput.value = formatDateForInput(endDate || new Date(startDate.getTime() + 3600000), false);
            }

            document.getElementById('event-all-day').checked = allDay;
        }

        // Set default color
        document.getElementById('event-color').value = '#3B82F6';
    }

    modal.classList.remove('hidden');
}

/**
 * Hide event modal
 */
function hideEventModal() {
    document.getElementById('event-modal').classList.add('hidden');
    currentEventId = null;
}

/**
 * Show license modal (read-only)
 */
function showLicenseModal(event) {
    const props = event.extendedProps;
    
    // Build license info HTML
    const infoHtml = `
        <div class="space-y-3">
            <div>
                <h3 class="text-lg font-semibold text-gray-900 mb-4">📄 License Information</h3>
                <p class="text-sm text-amber-600 mb-4">This is a license expiration date from the LICENSES table. License records cannot be edited from the calendar.</p>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">License Name</label>
                <p class="mt-1 text-sm text-gray-900">${props.licenseName || 'N/A'}</p>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">License Type</label>
                <p class="mt-1 text-sm text-gray-900">${props.licenseType || 'N/A'}</p>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">State</label>
                <p class="mt-1 text-sm text-gray-900">${props.licenseState || 'N/A'}</p>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">License Number</label>
                <p class="mt-1 text-sm text-gray-900">${props.licenseNumber || 'N/A'}</p>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Expiration Date</label>
                <p class="mt-1 text-sm text-gray-900">${new Date(event.start).toLocaleDateString()}</p>
            </div>
            ${props.licenseComments ? `
            <div>
                <label class="block text-sm font-medium text-gray-700">Comments</label>
                <p class="mt-1 text-sm text-gray-600">${props.licenseComments}</p>
            </div>
            ` : ''}
            ${props.fullText ? `
            <div>
                <label class="block text-sm font-medium text-gray-700">Full Details</label>
                <p class="mt-1 text-sm text-gray-600">${props.fullText}</p>
            </div>
            ` : ''}
        </div>
    `;
    
    // Show alert/modal with license info
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 overflow-y-auto';
    modal.innerHTML = `
        <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
            <span class="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div class="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                ${infoHtml}
                <div class="mt-5 sm:mt-6">
                    <button type="button" id="close-license-modal" class="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm">
                        Close
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close button handler
    document.getElementById('close-license-modal').addEventListener('click', () => {
        modal.remove();
    });
    
    // Click outside to close
    modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.classList.contains('bg-gray-500')) {
            modal.remove();
        }
    });
}

/**
 * Save event
 */
async function saveEvent() {
    const saveButton = document.getElementById('save-event-btn');
    
    try {
        // Set loading state on save button
        ButtonUtils.setLoading(saveButton, currentEventId ? 'Updating...' : 'Creating...');
        
        const title = document.getElementById('event-title').value;
        const description = document.getElementById('event-description').value;
        const start = document.getElementById('event-start').value;
        const end = document.getElementById('event-end').value;
        const location = document.getElementById('event-location').value;
        const color = document.getElementById('event-color').value;
        const allDay = document.getElementById('event-all-day').checked;
        const notes = document.getElementById('event-notes').value;

        if (!title || !start || !end) {
            toast.warning('Please fill in all required fields (Title, Start Date, End Date)');
            ButtonUtils.removeLoading(saveButton);
            return;
        }

        // Handle date conversion properly to avoid timezone issues
        let startDate, endDate;
        
        if (allDay) {
            // For all-day events, use NOON (12:00) instead of midnight to prevent
            // timezone shifts from changing the calendar date.
            // Using noon means ±12 hour timezone shifts won't affect the date.
            startDate = start + 'T12:00:00.000Z';
            endDate = end + 'T12:00:00.000Z';
        } else {
            // For timed events, the datetime-local input gives us local time
            // Convert to ISO but preserve the local time
            startDate = new Date(start).toISOString();
            endDate = new Date(end).toISOString();
        }

        const eventData = {
            TITLE: title,
            DESCRIPTION: description,
            START_DATE: startDate,
            END_DATE: endDate,
            LOCATION: location,
            COLOR: color,
            ALL_DAY: allDay ? 'Y' : 'N',
            NOTES: notes
        };

        let response;
        if (currentEventId) {
            // Update existing event
            response = await fetch(`${API_BASE_URL}/events/${currentEventId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(eventData)
            });
        } else {
            // Create new event
            response = await fetch(`${API_BASE_URL}/events`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(eventData)
            });
        }

        const result = await response.json();

        if (result.success) {
            hideEventModal();
            calendar.refetchEvents();
            toast.success(currentEventId ? 'Event updated successfully!' : 'Event created successfully!');
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error saving event:', error);
        toast.error('Failed to save event: ' + error.message);
    } finally {
        // Always remove loading state
        ButtonUtils.removeLoading(saveButton);
    }
}

/**
 * Delete event
 */
async function deleteEvent() {
    if (!currentEventId) return;

    // Get event title for confirmation
    const titleElement = document.getElementById('event-title');
    const eventTitle = titleElement ? `"${titleElement.value}"` : 'this event';

    const confirmed = await ConfirmDialog.confirmDelete(eventTitle);
    if (!confirmed) return;

    try {
        const response = await fetch(`${API_BASE_URL}/events/${currentEventId}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            hideEventModal();
            calendar.refetchEvents();
            toast.success('Event deleted successfully');
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error deleting event:', error);
        toast.error('Failed to delete event: ' + error.message);
    }
}

/**
 * Format date for input field
 */
function formatDateForInput(date, dateOnly = false) {
    if (!date) return '';

    // Handle both Date objects and ISO strings
    const d = typeof date === 'string' ? new Date(date) : date;
    
    if (dateOnly) {
        // For all-day events, use LOCAL date methods.
        // This works correctly for both:
        // 1. Dates from FullCalendar selection (midnight local time)
        // 2. Dates from database (noon UTC - when converted to local time, 
        //    noon UTC stays within the same calendar date for all timezones)
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    } else {
        // For timed events, use local time
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }
}
