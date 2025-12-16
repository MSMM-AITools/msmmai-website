// API Configuration - uses window.API_CONFIG from config.js
// This is set dynamically based on environment
const getApiBaseUrl = () => window.API_CONFIG ? `${window.API_CONFIG.baseUrl}/api` : 'http://localhost:3001/api';
const API_BASE_URL = getApiBaseUrl();

// Table state
let allColumns = [];
let visibleColumns = [];
let tableData = [];
let filteredData = [];
let sortColumn = null;
let sortDirection = 'asc';
let currentFilters = {};
let searchQuery = '';
let organizations = [];
let currentEditId = null;
let currentConfig = null; // Store current page config
let columnWidths = {}; // Store column widths
let isResizing = false;
let resizingColumn = null;
let startX = 0;
let startWidth = 0;

// Page configuration based on URL parameters
const pageConfigs = {
    'future-pursuits': {
        title: 'Future Pursuits',
        description: 'Active pursuits that are being tracked',
        filters: { CATEGORY: 'Pursuits', ARCHIVE: 'N' },
        defaultColumns: ['ACTION', 'TITLE', 'CLIENT_NAME', 'ORG_TYPE', 'PRIME', 'SUB', 'STATUS', 'DETAILS', 'EXPECTED_DUE_DATE', 'SELECTION_CHANCE', 'PROJECTED_AMOUNT', 'MSMM_POC', 'EXTERNAL_POC']
    },
    'archived-pursuits': {
        title: 'Archived Pursuits',
        description: 'Historical pursuits that have been archived',
        filters: { CATEGORY: 'Pursuits', ARCHIVE: 'Y' },
        defaultColumns: ['ACTION', 'TITLE', 'CLIENT_NAME', 'ORG_TYPE', 'PRIME', 'SUB', 'STATUS', 'DETAILS', 'EXPECTED_DUE_DATE', 'SELECTION_CHANCE', 'PROJECTED_AMOUNT', 'MSMM_POC', 'EXTERNAL_POC']
    },
    'active-proposals': {
        title: 'Active Proposals',
        description: 'Active proposals submitted',
        filters: { CATEGORY: 'Proposal Submitted', ARCHIVE: 'N' },
        defaultColumns: ['ACTION', 'TITLE', 'CLIENT_NAME', 'ORG_TYPE', 'PRIME', 'SUB', 'STATUS', 'STAGE', 'DETAILS', 'SUBMITTED_DATE', 'EXPECTED_DUE_DATE', 'PROJECTED_AMOUNT', 'MSMM_POC', 'EXTERNAL_POC']
    },
    'archived-proposals': {
        title: 'Archived Proposals',
        description: 'Historical proposals that have been archived',
        filters: { CATEGORY: 'Proposal Submitted', ARCHIVE: 'Y' },
        defaultColumns: ['ACTION', 'TITLE', 'CLIENT_NAME', 'ORG_TYPE', 'PRIME', 'SUB', 'STATUS', 'STAGE', 'DETAILS', 'SUBMITTED_DATE', 'EXPECTED_DUE_DATE', 'PROJECTED_AMOUNT', 'MSMM_POC', 'EXTERNAL_POC']
    },
    // Multi-use Contracts
    'active-prime-multiuse': {
        title: 'Active Prime Multi-Use Contracts',
        description: 'Active multi-use contracts where MSMM is the prime',
        filters: { CATEGORY: 'Proposal Submitted', ARCHIVE: 'N', STAGE: 'Multi-Use Contract', PRIME: 'MSMM' },
        defaultColumns: ['ACTION', 'TITLE', 'CLIENT_NAME', 'ORG_TYPE', 'PRIME', 'SUB', 'STATUS', 'DETAILS', 'SUBMITTED_DATE', 'EXPECTED_DUE_DATE', 'PROJECTED_AMOUNT', 'MSMM_POC', 'EXTERNAL_POC']
    },
    'active-sub-multiuse': {
        title: 'Active Sub Multi-Use Contracts',
        description: 'Active multi-use contracts where MSMM is a sub',
        filters: { CATEGORY: 'Proposal Submitted', ARCHIVE: 'N', STAGE: 'Multi-Use Contract', SUB_LIKE: 'MSMM' },
        defaultColumns: ['ACTION', 'TITLE', 'CLIENT_NAME', 'ORG_TYPE', 'PRIME', 'SUB', 'STATUS', 'DETAILS', 'SUBMITTED_DATE', 'EXPECTED_DUE_DATE', 'PROJECTED_AMOUNT', 'MSMM_POC', 'EXTERNAL_POC']
    },
    'archived-prime-multiuse': {
        title: 'Archived Prime Multi-Use Contracts',
        description: 'Archived multi-use contracts where MSMM is the prime',
        filters: { CATEGORY: 'Proposal Submitted', ARCHIVE: 'Y', STAGE: 'Multi-Use Contract', PRIME: 'MSMM' },
        defaultColumns: ['ACTION', 'TITLE', 'CLIENT_NAME', 'ORG_TYPE', 'PRIME', 'SUB', 'STATUS', 'DETAILS', 'SUBMITTED_DATE', 'EXPECTED_DUE_DATE', 'PROJECTED_AMOUNT', 'MSMM_POC', 'EXTERNAL_POC']
    },
    'archived-sub-multiuse': {
        title: 'Archived Sub Multi-Use Contracts',
        description: 'Archived multi-use contracts where MSMM is a sub',
        filters: { CATEGORY: 'Proposal Submitted', ARCHIVE: 'Y', STAGE: 'Multi-Use Contract', SUB_LIKE: 'MSMM' },
        defaultColumns: ['ACTION', 'TITLE', 'CLIENT_NAME', 'ORG_TYPE', 'PRIME', 'SUB', 'STATUS', 'DETAILS', 'SUBMITTED_DATE', 'EXPECTED_DUE_DATE', 'PROJECTED_AMOUNT', 'MSMM_POC', 'EXTERNAL_POC']
    },
    // AE Selected List
    'active-ae-selected': {
        title: 'Active AE Selected List',
        description: 'Active AE selected list entries',
        filters: { CATEGORY: 'Proposal Submitted', ARCHIVE: 'N', STAGE: 'AE Selected List' },
        defaultColumns: ['ACTION', 'TITLE', 'CLIENT_NAME', 'ORG_TYPE', 'PRIME', 'SUB', 'STATUS', 'DETAILS', 'SUBMITTED_DATE', 'EXPECTED_DUE_DATE', 'PROJECTED_AMOUNT', 'MSMM_POC', 'EXTERNAL_POC']
    },
    'archived-ae-selected': {
        title: 'Archived AE Selected List',
        description: 'Archived AE selected list entries',
        filters: { CATEGORY: 'Proposal Submitted', ARCHIVE: 'Y', STAGE: 'AE Selected List' },
        defaultColumns: ['ACTION', 'TITLE', 'CLIENT_NAME', 'ORG_TYPE', 'PRIME', 'SUB', 'STATUS', 'DETAILS', 'SUBMITTED_DATE', 'EXPECTED_DUE_DATE', 'PROJECTED_AMOUNT', 'MSMM_POC', 'EXTERNAL_POC']
    },
    // Single Use Contracts (Project)
    'active-single-use': {
        title: 'Active Single Use Contracts (Project)',
        description: 'Active single use contracts',
        filters: { CATEGORY: 'Proposal Submitted', ARCHIVE: 'N', STAGE: 'Single Use Contract (Project)' },
        defaultColumns: ['ACTION', 'TITLE', 'CLIENT_NAME', 'ORG_TYPE', 'PRIME', 'SUB', 'STATUS', 'DETAILS', 'SUBMITTED_DATE', 'EXPECTED_DUE_DATE', 'PROJECTED_AMOUNT', 'MSMM_POC', 'EXTERNAL_POC']
    },
    'archived-single-use': {
        title: 'Archived Single Use Contracts (Project)',
        description: 'Archived single use contracts',
        filters: { CATEGORY: 'Proposal Submitted', ARCHIVE: 'Y', STAGE: 'Single Use Contract (Project)' },
        defaultColumns: ['ACTION', 'TITLE', 'CLIENT_NAME', 'ORG_TYPE', 'PRIME', 'SUB', 'STATUS', 'DETAILS', 'SUBMITTED_DATE', 'EXPECTED_DUE_DATE', 'PROJECTED_AMOUNT', 'MSMM_POC', 'EXTERNAL_POC']
    },
    // Fee Proposals
    'active-fee-proposals': {
        title: 'Active Fee Proposals',
        description: 'Active fee proposals',
        filters: { CATEGORY: 'Fee Proposal', ARCHIVE: 'N' },
        defaultColumns: ['ACTION', 'TITLE', 'CLIENT_NAME', 'ORG_TYPE', 'PRIME', 'SUB', 'STATUS', 'DETAILS', 'SUBMITTED_DATE', 'EXPECTED_DUE_DATE', 'PROJECTED_AMOUNT', 'MSMM_POC', 'EXTERNAL_POC']
    },
    'archived-fee-proposals': {
        title: 'Archived Fee Proposals',
        description: 'Archived fee proposals',
        filters: { CATEGORY: 'Fee Proposal', ARCHIVE: 'Y' },
        defaultColumns: ['ACTION', 'TITLE', 'CLIENT_NAME', 'ORG_TYPE', 'PRIME', 'SUB', 'STATUS', 'DETAILS', 'SUBMITTED_DATE', 'EXPECTED_DUE_DATE', 'PROJECTED_AMOUNT', 'MSMM_POC', 'EXTERNAL_POC']
    },
    // Project Avenue
    'project-avenue': {
        title: 'Project Avenue',
        description: 'Awarded proposals in AE Selected List, Multi-Use Contract, or Single Use Contract stages',
        filters: { CATEGORY: 'Proposal Submitted', ARCHIVE: 'N', STATUS: 'Awarded', STAGE_IN: ['AE Selected List', 'Multi-Use Contract', 'Single Use Contract (Project)'] },
        defaultColumns: ['ACTION', 'TITLE', 'CLIENT_NAME', 'ORG_TYPE', 'PRIME', 'SUB', 'STATUS', 'STAGE', 'DETAILS', 'SUBMITTED_DATE', 'EXPECTED_DUE_DATE', 'PROJECTED_AMOUNT', 'MSMM_POC', 'EXTERNAL_POC']
    }
};

/**
 * Get page type from URL parameter
 */
function getPageType() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('type') || 'future-pursuits';
}

/**
 * Display active filters as badges
 */
function displayActiveFilters() {
    const descElement = document.getElementById('table-description');
    let filterHTML = '<div class="mt-2 flex flex-wrap gap-2">';

    Object.entries(currentFilters).forEach(([key, value]) => {
        filterHTML += `
            <span class="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                <svg class="h-1.5 w-1.5 fill-indigo-500" viewBox="0 0 6 6" aria-hidden="true">
                    <circle cx="3" cy="3" r="3" />
                </svg>
                ${formatColumnName(key)}: ${value}
            </span>
        `;
    });

    filterHTML += '</div>';
    descElement.innerHTML += filterHTML;
}

/**
 * Initialize the page
 */
async function init() {
    const pageType = getPageType();
    const config = pageConfigs[pageType];

    if (!config) {
        showError('Invalid page type');
        return;
    }

    // Store config globally for export and other functions
    currentConfig = config;
    currentFilters = { ...config.filters };

    // Check for additional URL parameters and merge them into filters
    const urlParams = new URLSearchParams(window.location.search);
    for (const [key, value] of urlParams.entries()) {
        if (key !== 'type') { // Skip the 'type' parameter
            // Handle array parameters (like STAGE_IN)
            if (key.endsWith('_IN')) {
                if (!currentFilters[key]) {
                    currentFilters[key] = [];
                }
                currentFilters[key].push(value);
            } else {
                currentFilters[key] = value;
            }
        }
    }

    // Set page title and description
    document.getElementById('table-title').textContent = config.title;
    document.getElementById('table-description').textContent = config.description;
    document.getElementById('page-title').textContent = `${config.title} - BusinessDev`;
    document.getElementById('table-subtitle').textContent = config.title;

    // Display active filters
    displayActiveFilters();

    // Load columns first
    await loadColumns(config);

    // Load organizations for CRUD operations
    await loadOrganizations();

    // Load data
    await loadData();

    // Setup event listeners
    setupEventListeners();

    // Setup scroll synchronization
    updateScrollWidth = setupScrollSync();
}

/**
 * Load available columns from API
 */
async function loadColumns(config) {
    try {
        const response = await fetch(`${API_BASE_URL}/proposals/columns`);
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error);
        }

        allColumns = result.data;

        // Use page-specific default columns if available, otherwise use generic defaults
        const defaultColumns = config.defaultColumns || ['PID', 'TITLE', 'PRIME', 'SUB', 'STATUS', 'SUBMITTED_DATE', 'CATEGORY', 'ARCHIVE'];

        // Preserve the order specified in defaultColumns
        visibleColumns = defaultColumns.filter(colName => 
            allColumns.some(col => col.name === colName)
        );

        // If no columns match defaults, show first 8
        if (visibleColumns.length === 0) {
            visibleColumns = allColumns.slice(0, 8).map(col => col.name);
        }

    } catch (error) {
        console.error('Error loading columns:', error);
        showError('Failed to load column information: ' + error.message);
    }
}

/**
 * Load data from API
 */
async function loadData() {
    try {
        showLoading();

        const params = new URLSearchParams();
        
        // Handle filters, including arrays like STAGE_IN
        Object.keys(currentFilters).forEach(key => {
            const value = currentFilters[key];
            if (Array.isArray(value)) {
                // For arrays, add each value separately with the same key
                value.forEach(v => params.append(key, v));
            } else {
                params.append(key, value);
            }
        });
        
        const response = await fetch(`${API_BASE_URL}/proposals?${params}`);
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error);
        }

        tableData = result.data;

        renderTable();
        hideLoading();

    } catch (error) {
        console.error('Error loading data:', error);
        showError('Failed to load data: ' + error.message);
    }
}

/**
 * Render the table
 */
function renderTable() {
    // Initialize filtered data
    filteredData = tableData.map(row => ({ row, matches: [] }));

    renderTableHeader();
    renderTableBody();
    updateTableInfo();

    document.getElementById('table-container').classList.remove('hidden');

    // Update top scroll width after rendering
    if (updateScrollWidth) {
        setTimeout(updateScrollWidth, 0);
    }
}

/**
 * Render table header
 */
function renderTableHeader() {
    const thead = document.getElementById('table-header');
    thead.innerHTML = '';

    visibleColumns.forEach((columnName, index) => {
        const th = document.createElement('th');
        th.scope = 'col';
        th.className = 'sticky top-0 z-10 border-b border-gray-300 bg-gray-50 bg-opacity-75 px-4 py-3.5 text-left text-sm font-semibold text-blue-700 backdrop-blur backdrop-filter hover:bg-gray-100 transition-colors relative';
        th.draggable = true;
        th.dataset.column = columnName;
        th.dataset.index = index;

        // Apply stored width or default with overflow handling
        if (columnWidths[columnName]) {
            th.style.width = columnWidths[columnName] + 'px';
            th.style.minWidth = columnWidths[columnName] + 'px';
            th.style.maxWidth = columnWidths[columnName] + 'px';
            th.style.overflow = 'hidden';
            th.style.textOverflow = 'ellipsis';
            th.style.whiteSpace = 'nowrap';
        }

        // Skip sort icon and functionality for ACTION column
        let sortIcon = '';
        if (columnName !== 'ACTION') {
            sortIcon = `
                <svg class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
            `;

            if (sortColumn === columnName) {
                if (sortDirection === 'asc') {
                    sortIcon = `
                        <svg class="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                        </svg>
                    `;
                } else {
                    sortIcon = `
                        <svg class="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    `;
                }
            }
        }

        th.innerHTML = `
            <div class="flex items-center ${columnName === 'ACTION' ? 'justify-center' : 'justify-between'} gap-2 group">
                <div class="flex items-center gap-2 ${columnName !== 'ACTION' ? 'cursor-pointer' : ''}" data-sort-trigger="${columnName !== 'ACTION'}">
                    <span class="drag-handle cursor-move text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" title="Drag to reorder">⋮⋮</span>
                    <span class="font-semibold">${formatColumnName(columnName)}</span>
                </div>
                ${sortIcon}
            </div>
            <div class="resize-handle absolute top-0 right-0 w-2 h-full cursor-col-resize hover:bg-indigo-500 bg-gray-300 opacity-0 hover:opacity-100 transition-opacity" data-column="${columnName}"></div>
        `;

        // Click to sort (only on the content area, not resize handle, and not for ACTION column)
        th.addEventListener('click', (e) => {
            if (!e.target.closest('.resize-handle') && columnName !== 'ACTION') {
                handleSort(columnName);
            }
        });

        // Drag and drop for reordering
        th.addEventListener('dragstart', handleDragStart);
        th.addEventListener('dragover', handleDragOver);
        th.addEventListener('drop', handleDrop);
        th.addEventListener('dragend', handleDragEnd);

        // Resize handle
        const resizeHandle = th.querySelector('.resize-handle');
        resizeHandle.addEventListener('mousedown', (e) => handleResizeStart(e, columnName, th));

        thead.appendChild(th);
    });
}

/**
 * Render table body
 */
function renderTableBody() {
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = '';

    if (filteredData.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = visibleColumns.length;
        td.className = 'px-4 py-12 text-sm text-center text-gray-500';

        const message = searchQuery
            ? `No results found for "${searchQuery}"`
            : 'No data available';

        td.innerHTML = `
            <div class="flex flex-col items-center">
                <svg class="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p class="text-base font-medium">${message}</p>
                <p class="text-sm text-gray-400 mt-1">${searchQuery ? 'Try a different search term' : 'Try adjusting your filters or check back later'}</p>
            </div>
        `;
        tr.appendChild(td);
        tbody.appendChild(tr);
        return;
    }

    filteredData.forEach((item, index) => {
        const row = item.row;
        const matches = item.matches;
        const hasMatch = matches.length > 0;

        const tr = document.createElement('tr');
        // Remove alternating colors, keep hover effect
        tr.className = `bg-white hover:bg-indigo-50 transition-colors cursor-pointer`;

        visibleColumns.forEach((columnName, colIndex) => {
            const td = document.createElement('td');
            td.className = colIndex === 0
                ? 'px-4 py-4 text-sm font-medium text-gray-900'
                : 'px-4 py-4 text-sm text-gray-700';

            // Apply stored width to match header with overflow handling
            if (columnWidths[columnName]) {
                td.style.width = columnWidths[columnName] + 'px';
                td.style.minWidth = columnWidths[columnName] + 'px';
                td.style.maxWidth = columnWidths[columnName] + 'px';
                td.style.overflow = 'hidden';
                td.style.textOverflow = 'ellipsis';
                td.style.whiteSpace = 'nowrap';
            } else {
                td.style.whiteSpace = 'nowrap';
            }

            const value = row[columnName];
            const formattedValue = formatCellValue(value, columnName, row);

            // Add title attribute for tooltip on hover (shows full text when truncated)
            if (columnName !== 'ACTION' && value !== null && value !== undefined && value !== '') {
                const plainText = typeof value === 'string' ? value : String(value);
                td.title = plainText;
            }

            // Highlight matching text if this column has a match (skip ACTION column)
            const shouldHighlight = hasMatch && matches.includes(columnName) && columnName !== 'ACTION';
            const displayValue = shouldHighlight ? highlightText(formattedValue, searchQuery) : formattedValue;

            // Add special styling for certain columns
            if (columnName === 'ACTION') {
                td.innerHTML = formattedValue; // Already formatted with buttons
            } else if (columnName === 'ARCHIVE') {
                td.innerHTML = value === 'Y'
                    ? '<span class="inline-flex items-center rounded-full bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">Archived</span>'
                    : '<span class="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">Active</span>';
            } else if (columnName === 'STATUS' && value) {
                const highlightedStatus = shouldHighlight ? highlightText(formattedValue, searchQuery) : formattedValue;
                td.innerHTML = `<span class="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">${highlightedStatus}</span>`;
            } else if (columnName.includes('AMOUNT') && value) {
                td.className += ' font-semibold text-gray-900';
                td.innerHTML = displayValue;
            } else {
                td.innerHTML = displayValue;
            }

            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });
}

/**
 * Format column name for display
 */
function formatColumnName(name) {
    return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Format cell value
 */
function formatCellValue(value, columnName, row = null) {
    // Handle ACTION column specially (BEFORE null check, since it's virtual)
    if (columnName === 'ACTION' && row) {
        return `
            <div class="flex justify-center">
                <button class="edit-btn p-1 text-indigo-600 hover:text-indigo-900" data-id="${row.PID}" title="Edit">
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                </button>
            </div>
        `;
    }

    if (value === null || value === undefined || value === '') {
        return '-';
    }

    // Format dates
    if (columnName.includes('DATE') && value) {
        try {
            const date = new Date(value);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (e) {
            return value;
        }
    }

    // Format currency amounts
    if (typeof value === 'number' && columnName.includes('AMOUNT')) {
        return '$' + value.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    // Format regular numbers
    if (typeof value === 'number') {
        return value.toLocaleString();
    }

    // Truncate long text with better handling
    const strValue = String(value);
    if (strValue.length > 50) {
        return strValue.substring(0, 50) + '...';
    }

    return strValue;
}

/**
 * Handle sorting
 */
function handleSort(columnName) {
    if (sortColumn === columnName) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        sortColumn = columnName;
        sortDirection = 'asc';
    }

    applySearchAndSort();
    renderTableHeader();
}

/**
 * Drag and drop handlers for column reordering
 */
let draggedColumn = null;

function handleDragStart(e) {
    // Prevent drag if clicking on resize handle
    if (e.target.closest('.resize-handle')) {
        e.preventDefault();
        return false;
    }

    draggedColumn = parseInt(e.currentTarget.dataset.index);
    e.currentTarget.classList.add('opacity-50');
}

function handleDragOver(e) {
    e.preventDefault();
    return false;
}

function handleDrop(e) {
    e.stopPropagation();
    e.preventDefault();

    const dropIndex = parseInt(e.currentTarget.dataset.index);

    if (draggedColumn !== dropIndex) {
        const draggedItem = visibleColumns[draggedColumn];
        visibleColumns.splice(draggedColumn, 1);
        visibleColumns.splice(dropIndex, 0, draggedItem);
        renderTable();
    }

    return false;
}

function handleDragEnd(e) {
    e.currentTarget.classList.remove('opacity-50');
    draggedColumn = null;
}

/**
 * Column resize handlers
 */
function handleResizeStart(e, columnName, th) {
    e.stopPropagation();
    e.preventDefault();

    isResizing = true;
    resizingColumn = columnName;
    startX = e.pageX;
    startWidth = th.offsetWidth;

    // Prevent text selection while resizing
    document.body.style.userSelect = 'none';

    // Add global mouse event listeners
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
}

function handleResizeMove(e) {
    if (!isResizing) return;

    const diff = e.pageX - startX;
    const newWidth = Math.max(100, startWidth + diff); // Minimum width of 100px

    columnWidths[resizingColumn] = newWidth;

    // Update all cells in this column
    updateColumnWidths(resizingColumn, newWidth);
}

function handleResizeEnd(e) {
    if (!isResizing) return;

    isResizing = false;
    resizingColumn = null;

    // Re-enable text selection
    document.body.style.userSelect = '';

    // Remove global mouse event listeners
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
}

function updateColumnWidths(columnName, width) {
    // Update header
    const headers = document.querySelectorAll(`th[data-column="${columnName}"]`);
    headers.forEach(th => {
        th.style.width = width + 'px';
        th.style.minWidth = width + 'px';
        th.style.maxWidth = width + 'px';
        th.style.overflow = 'hidden';
        th.style.textOverflow = 'ellipsis';
        th.style.whiteSpace = 'nowrap';
    });

    // Update all cells in this column
    const columnIndex = visibleColumns.indexOf(columnName);
    if (columnIndex === -1) return;

    const rows = document.querySelectorAll('#table-body tr');
    rows.forEach(row => {
        const cell = row.children[columnIndex];
        if (cell) {
            cell.style.width = width + 'px';
            cell.style.minWidth = width + 'px';
            cell.style.maxWidth = width + 'px';
            cell.style.overflow = 'hidden';
            cell.style.textOverflow = 'ellipsis';
            cell.style.whiteSpace = 'nowrap';
        }
    });
}

/**
 * Show column editor modal
 */
function showColumnEditor() {
    const modal = document.getElementById('column-modal');
    const columnList = document.getElementById('column-list');

    columnList.innerHTML = '';

    // Sort columns to have a logical order: ACTION, TITLE, CLIENT_NAME, ORG_TYPE, then others
    const sortedColumns = [...allColumns].sort((a, b) => {
        const order = {
            'ACTION': 1,
            'TITLE': 2,
            'CLIENT_NAME': 3,
            'ORG_TYPE': 4,
            'ORG_ID': 5,
            'PRIME': 6,
            'SUB': 7,
            'STATUS': 8,
            'CATEGORY': 9,
            'STAGE': 10,
            'DETAILS': 11
        };
        const orderA = order[a.name] || 100;
        const orderB = order[b.name] || 100;
        if (orderA !== orderB) return orderA - orderB;
        // Keep alphabetical order for remaining fields
        return a.name.localeCompare(b.name);
    });

    sortedColumns.forEach(col => {
        const div = document.createElement('div');
        div.className = 'flex items-center';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `col-${col.name}`;
        checkbox.value = col.name;
        checkbox.checked = visibleColumns.includes(col.name);
        checkbox.className = 'h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600';

        const label = document.createElement('label');
        label.htmlFor = `col-${col.name}`;
        label.className = 'ml-3 text-sm text-gray-700';
        label.textContent = formatColumnName(col.name);

        div.appendChild(checkbox);
        div.appendChild(label);
        columnList.appendChild(div);
    });

    modal.classList.remove('hidden');
}

/**
 * Apply column changes
 */
function applyColumnChanges() {
    const checkboxes = document.querySelectorAll('#column-list input[type="checkbox"]:checked');
    visibleColumns = Array.from(checkboxes).map(cb => cb.value);

    if (visibleColumns.length === 0) {
        toast.warning('Please select at least one column');
        return;
    }

    hideColumnEditor();
    renderTable();
}

/**
 * Hide column editor modal
 */
function hideColumnEditor() {
    document.getElementById('column-modal').classList.add('hidden');
}

/**
 * Load organizations for dropdown
 */
async function loadOrganizations() {
    try {
        const response = await fetch(`${API_BASE_URL}/organizations`);
        const result = await response.json();

        if (result.success) {
            organizations = result.data;
        }
    } catch (error) {
        console.error('Error loading organizations:', error);
    }
}

/**
 * Show create modal with pre-filled filter values
 */
async function showCreateModal() {
    currentEditId = null;

    // Set modal title
    document.getElementById('edit-modal-title').textContent = 'Create New Entry';

    // Hide delete button
    document.getElementById('delete-entry-btn').classList.add('hidden');

    // Build form fields with pre-filled filter values
    await buildFormFields(currentFilters);

    // Show modal
    document.getElementById('edit-modal').classList.remove('hidden');
}

/**
 * Show edit modal with existing data
 */
async function showEditModal(id) {
    try {
        currentEditId = id;

        // Fetch the proposal data
        const response = await fetch(`${API_BASE_URL}/proposals/${id}`);
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error);
        }

        const data = result.data;

        // Set modal title
        document.getElementById('edit-modal-title').textContent = 'Edit Entry';

        // Show delete button
        document.getElementById('delete-entry-btn').classList.remove('hidden');

        // Build form fields with existing data
        await buildFormFields(data);

        // Show modal
        document.getElementById('edit-modal').classList.remove('hidden');

    } catch (error) {
        console.error('Error loading entry:', error);
        toast.error('Failed to load entry: ' + error.message);
    }
}

/**
 * Build form fields dynamically
 */
async function buildFormFields(data = {}) {
    const form = document.getElementById('edit-form');
    form.innerHTML = '';

    // Ensure organizations are loaded
    if (organizations.length === 0) {
        await loadOrganizations();
    }

    // Load dropdown data
    const [orgIdOptions, privateEntities, statusOptions, stageOptions] = await Promise.all([
        fetch(`${API_BASE_URL}/dropdowns/org-id`).then(r => r.json()),
        fetch(`${API_BASE_URL}/dropdowns/private-entities`).then(r => r.json()),
        fetch(`${API_BASE_URL}/dropdowns/status`).then(r => r.json()),
        fetch(`${API_BASE_URL}/dropdowns/stage`).then(r => r.json())
    ]);

    // Normalize keys to lowercase for consistency
    if (orgIdOptions.data && orgIdOptions.data.length > 0) {
        orgIdOptions.data = orgIdOptions.data.map(item => ({
            label: item.label || item.LABEL,
            value: item.value || item.VALUE
        }));
    }

    // Get all columns except ACTION, CLIENT_NAME (virtual/joined columns), and PID (auto-generated primary key)
    let formColumns = allColumns.filter(col => 
        col.name !== 'ACTION' && col.name !== 'CLIENT_NAME' && col.name !== 'PID' && col.name !== 'ORG_TYPE'
    );

    // Sort columns to ensure proper layout:
    // Line 1: TITLE (full width)
    // Line 2: ORG_ID (full width)
    // Line 3: PRIME, SUB
    // Line 4: STATUS, CATEGORY
    // Line 5: DETAILS (full width)
    // Line 6: SUBMITTED_DATE (left), EXPECTED_DUE_DATE (right) (side by side)
    // Line 7: MSMM_POC (left), EXTERNAL_POC (right) (side by side)
    // Rest: remaining fields
    formColumns.sort((a, b) => {
        const order = { 
            'TITLE': 1, 
            'ORG_ID': 2, 
            'PRIME': 3, 
            'SUB': 4, 
            'STATUS': 5, 
            'CATEGORY': 6, 
            'DETAILS': 7,
            'SUBMITTED_DATE': 8,
            'EXPECTED_DUE_DATE': 9,
            'MSMM_POC': 10,
            'EXTERNAL_POC': 11
        };
        const orderA = order[a.name] || 100;
        const orderB = order[b.name] || 100;
        if (orderA !== orderB) return orderA - orderB;
        // Keep original order for other fields
        return allColumns.indexOf(a) - allColumns.indexOf(b);
    });

    formColumns.forEach(col => {
        const div = document.createElement('div');
        // TITLE, ORG_ID, and DETAILS fields should span full width (both columns)
        if (col.name === 'TITLE' || col.name === 'ORG_ID' || col.name === 'DETAILS') {
            div.className = 'flex flex-col col-span-2';
        } else {
            div.className = 'flex flex-col';
        }

        const label = document.createElement('label');
        label.htmlFor = `field-${col.name}`;
        label.className = 'text-sm font-medium text-gray-900 mb-1';
        // Special label for ORG_ID on edit form
        if (col.name === 'ORG_ID') {
            label.textContent = 'CLIENT NAME';
        } else {
            label.textContent = formatColumnName(col.name);
        }

        let input;

        // ORG_ID dropdown with search and add new
        if (col.name === 'ORG_ID') {
            input = createSearchableOrgDropdown(orgIdOptions.data, data[col.name]);
        }
        // PRIME - multi-select dropdown with custom values
        else if (col.name === 'PRIME') {
            input = createMultiSelectDropdown(privateEntities.data, data[col.name], 'PRIME');
        }
        // SUB - multi-select dropdown with custom values
        else if (col.name === 'SUB') {
            input = createMultiSelectDropdown(privateEntities.data, data[col.name], 'SUB');
        }
        // STATUS dropdown (with ability to add new)
        else if (col.name === 'STATUS') {
            input = createEditableSelect(statusOptions.data, data[col.name], '-- Select Status --', 'value');
        }
        // STAGE dropdown (with ability to add new, only on proposals)
        else if (col.name === 'STAGE') {
            input = createEditableSelect(stageOptions.data, data[col.name], '-- Select Stage --', 'value');
        }
        // CATEGORY dropdown
        else if (col.name === 'CATEGORY') {
            input = document.createElement('select');
            input.className = 'block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm';
            const categoryOptions = ['Pursuits', 'Proposal Submitted', 'Fee Proposal'];
            categoryOptions.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt;
                option.textContent = opt;
                if (data[col.name] === opt) {
                    option.selected = true;
                }
                input.appendChild(option);
            });
        }
        // ARCHIVE dropdown (static Y/N)
        else if (col.name === 'ARCHIVE') {
            input = document.createElement('select');
            input.className = 'block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm';
            const options = ['N', 'Y'];
            options.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt;
                option.textContent = opt;
                if (data[col.name] === opt || (!data[col.name] && opt === 'N')) {
                    option.selected = true;
                }
                input.appendChild(option);
            });
        }
        // Date fields
        else if (col.type === 'DATE' || col.name.includes('DATE')) {
            input = document.createElement('input');
            input.type = 'date';
            input.className = 'block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm';

            // Format date value if present
            if (data[col.name]) {
                const date = new Date(data[col.name]);
                input.value = date.toISOString().split('T')[0];
            }
        }
        // Number fields
        else if (col.type === 'NUMBER') {
            input = document.createElement('input');
            input.type = 'number';
            input.step = 'any';
            input.className = 'block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm';
            input.value = data[col.name] !== undefined && data[col.name] !== null ? data[col.name] : '';
        }
        // Large text fields
        else if (col.length > 500 || col.name.includes('DETAILS') || col.name.includes('NOTES') || col.name.includes('DESCRIPTION')) {
            input = document.createElement('textarea');
            // Use 2 rows for TITLE field, 3 rows for other large text fields
            input.rows = col.name === 'TITLE' ? 2 : 3;
            input.className = 'block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm';
            input.value = data[col.name] !== undefined && data[col.name] !== null ? data[col.name] : '';
        }
        // Regular text fields
        else {
            input = document.createElement('input');
            input.type = 'text';
            input.className = 'block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm';
            input.value = data[col.name] !== undefined && data[col.name] !== null ? data[col.name] : '';
        }

        input.id = `field-${col.name}`;
        input.name = col.name;

        div.appendChild(label);
        div.appendChild(input);
        form.appendChild(div);
    });

    // Add special buttons for Pursuits only
    console.log('Checking pursuit buttons - currentEditId:', currentEditId, 'CATEGORY:', data.CATEGORY);
    if (currentEditId && data.CATEGORY === 'Pursuits') {
        console.log('Adding pursuit buttons!');
        addPursuitButtons();
    } else {
        console.log('NOT adding pursuit buttons - conditions not met');
    }
}

/**
 * Create a select element from data array
 */
function createSelectFromData(dataArray, selectedValue, placeholder, labelKey, valueKey) {
    const select = document.createElement('select');
    select.className = 'block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm';

    // Add placeholder option
    const emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.textContent = placeholder;
    select.appendChild(emptyOption);

    // Check if selected value exists in the array
    let selectedFound = false;

    // Add data options
    dataArray.forEach(item => {
        const option = document.createElement('option');
        // Handle both string arrays and object arrays
        if (typeof item === 'string') {
            option.value = item;
            option.textContent = item;
            if (selectedValue == item) {
                option.selected = true;
                selectedFound = true;
            }
        } else {
            option.value = item[valueKey];
            option.textContent = item[labelKey];
            if (selectedValue == item[valueKey]) {
                option.selected = true;
                selectedFound = true;
            }
        }
        select.appendChild(option);
    });

    // If selected value is not in the list, add it as a custom option
    if (selectedValue && !selectedFound) {
        const customOption = document.createElement('option');
        customOption.value = selectedValue;
        customOption.textContent = `${selectedValue} (custom)`;
        customOption.selected = true;
        select.appendChild(customOption);
    }

    return select;
}

/**
 * Create an editable select (allows adding new values)
 */
function createEditableSelect(dataArray, selectedValue, placeholder, valueKey) {
    const container = document.createElement('div');
    container.className = 'flex gap-2';

    const select = document.createElement('select');
    select.className = 'flex-1 block w-full rounded-md border-0 py-0.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm leading-tight';

    // Add placeholder option
    const emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.textContent = placeholder;
    select.appendChild(emptyOption);

    // Check if selected value exists in the array
    let selectedFound = false;

    // Add existing options
    dataArray.forEach(item => {
        const option = document.createElement('option');
        // Handle both string arrays and object arrays
        if (typeof item === 'string') {
            option.value = item;
            option.textContent = item;
            if (selectedValue === item) {
                option.selected = true;
                selectedFound = true;
            }
        } else {
            option.value = item[valueKey];
            option.textContent = item[valueKey];
            if (selectedValue === item[valueKey]) {
                option.selected = true;
                selectedFound = true;
            }
        }
        select.appendChild(option);
    });

    // If selected value is not in the list, add it
    if (selectedValue && !selectedFound) {
        const customOption = document.createElement('option');
        customOption.value = selectedValue;
        customOption.textContent = selectedValue;
        customOption.selected = true;
        // Insert before "Add New" option
        select.appendChild(customOption);
    }

    // Add "Add New" option
    const addNewOption = document.createElement('option');
    addNewOption.value = '__ADD_NEW__';
    addNewOption.textContent = '+ Add New Value';
    select.appendChild(addNewOption);

    // Handle add new
    select.addEventListener('change', (e) => {
        if (e.target.value === '__ADD_NEW__') {
            const newValue = prompt('Enter new value:');
            if (newValue && newValue.trim()) {
                const newOption = document.createElement('option');
                newOption.value = newValue.trim();
                newOption.textContent = newValue.trim();
                newOption.selected = true;
                select.insertBefore(newOption, addNewOption);
            } else {
                select.value = '';
            }
        }
    });

    container.appendChild(select);
    return select;
}

/**
 * Create a searchable organization dropdown with Add New functionality
 */
function createSearchableOrgDropdown(dataArray, selectedValue) {
    const container = document.createElement('div');
    container.className = 'space-y-2';

    // Search input
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search organizations...';
    searchInput.className = 'block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm';

    // Dropdown container
    const dropdownWrapper = document.createElement('div');
    dropdownWrapper.className = 'relative';

    // Hidden select for form submission
    const hiddenSelect = document.createElement('select');
    hiddenSelect.name = 'ORG_ID';
    hiddenSelect.id = 'field-ORG_ID';
    hiddenSelect.className = 'hidden';
    dataArray.forEach(item => {
        const option = document.createElement('option');
        option.value = item.value;
        option.textContent = item.label;
        if (selectedValue == item.value) {
            option.selected = true;
        }
        hiddenSelect.appendChild(option);
    });

    // Display div showing selected value
    const displayDiv = document.createElement('div');
    displayDiv.className = 'block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 bg-white cursor-pointer sm:text-sm';
    const selectedItem = dataArray.find(item => item.value == selectedValue);
    displayDiv.textContent = selectedItem ? selectedItem.label : '-- Select Organization --';

    // Dropdown list
    const dropdownList = document.createElement('div');
    dropdownList.className = 'hidden absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm';

    // Populate dropdown list
    function populateDropdownList(filterText = '') {
        dropdownList.innerHTML = '';

        const filteredData = dataArray.filter(item =>
            item.label.toLowerCase().includes(filterText.toLowerCase())
        );

        if (filteredData.length === 0) {
            const noResultDiv = document.createElement('div');
            noResultDiv.className = 'text-gray-500 px-3 py-2';
            noResultDiv.textContent = 'No organizations found';
            dropdownList.appendChild(noResultDiv);
        } else {
            filteredData.forEach(item => {
                const optionDiv = document.createElement('div');
                optionDiv.className = 'cursor-pointer select-none relative py-2 px-3 hover:bg-indigo-50';
                optionDiv.textContent = item.label;
                optionDiv.dataset.value = item.value;
                optionDiv.dataset.label = item.label;

                optionDiv.addEventListener('click', () => {
                    hiddenSelect.value = item.value;
                    displayDiv.textContent = item.label;
                    dropdownList.classList.add('hidden');
                    searchInput.value = '';
                });

                dropdownList.appendChild(optionDiv);
            });
        }

        // Add "Add New Organization" button at the bottom
        const addNewDiv = document.createElement('div');
        addNewDiv.className = 'border-t border-gray-200 mt-1 pt-1';
        const addNewBtn = document.createElement('button');
        addNewBtn.type = 'button';
        addNewBtn.className = 'w-full text-left px-3 py-2 text-indigo-600 hover:bg-indigo-50 font-medium';
        addNewBtn.textContent = '+ Add New Organization';
        addNewBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropdownList.classList.add('hidden');
            showAddOrganizationModal();
        });
        addNewDiv.appendChild(addNewBtn);
        dropdownList.appendChild(addNewDiv);
    }

    populateDropdownList();

    // Toggle dropdown
    displayDiv.addEventListener('click', () => {
        dropdownList.classList.toggle('hidden');
    });

    // Search functionality
    searchInput.addEventListener('input', (e) => {
        populateDropdownList(e.target.value);
        if (dropdownList.classList.contains('hidden')) {
            dropdownList.classList.remove('hidden');
        }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!container.contains(e.target)) {
            dropdownList.classList.add('hidden');
        }
    });

    dropdownWrapper.appendChild(displayDiv);
    dropdownWrapper.appendChild(dropdownList);

    container.appendChild(searchInput);
    container.appendChild(dropdownWrapper);
    container.appendChild(hiddenSelect);

    return container;
}

/**
 * Create a multi-select dropdown with custom values (values separated by semicolon)
 */
function createMultiSelectDropdown(dataArray, selectedValues, fieldName) {
    const container = document.createElement('div');
    container.className = 'space-y-2';

    // Parse existing values (split by semicolon)
    const currentValues = selectedValues && selectedValues !== null ?
        selectedValues.split(';').map(v => v.trim()).filter(v => v.length > 0) : [];

    // Hidden input to store final value (semicolon-separated)
    const hiddenInput = document.createElement('input');
    hiddenInput.type = 'hidden';
    hiddenInput.name = fieldName;
    hiddenInput.id = `field-${fieldName}`;
    hiddenInput.value = currentValues.join('; ');

    // Tags container to show selected values
    const tagsContainer = document.createElement('div');
    tagsContainer.className = 'flex flex-wrap gap-2 mb-2 min-h-[32px] p-2 border border-gray-300 rounded-md bg-gray-50';

    // Function to render tags
    function renderTags() {
        tagsContainer.innerHTML = '';
        const values = hiddenInput.value ? hiddenInput.value.split(';').map(v => v.trim()).filter(v => v.length > 0) : [];

        if (values.length === 0) {
            const placeholder = document.createElement('span');
            placeholder.className = 'text-gray-400 text-sm';
            placeholder.textContent = 'No selections';
            tagsContainer.appendChild(placeholder);
        } else {
            values.forEach(value => {
                const tag = document.createElement('span');
                tag.className = 'inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-800 text-sm rounded';
                tag.innerHTML = `
                    ${value}
                    <button type="button" class="hover:text-indigo-600" data-value="${value}">
                        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                        </svg>
                    </button>
                `;

                // Remove tag on click
                tag.querySelector('button').addEventListener('click', (e) => {
                    const valueToRemove = e.currentTarget.dataset.value;
                    const currentVals = hiddenInput.value.split(';').map(v => v.trim()).filter(v => v.length > 0);
                    const newVals = currentVals.filter(v => v !== valueToRemove);
                    hiddenInput.value = newVals.join('; ');
                    renderTags();
                });

                tagsContainer.appendChild(tag);
            });
        }
    }

    // Dropdown select
    const select = document.createElement('select');
    select.className = 'block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm';

    // Add placeholder
    const placeholderOption = document.createElement('option');
    placeholderOption.value = '';
    placeholderOption.textContent = '-- Select to Add --';
    select.appendChild(placeholderOption);

    // Add all options
    dataArray.forEach(item => {
        const option = document.createElement('option');
        option.value = item;
        option.textContent = item;
        select.appendChild(option);
    });

    // Add "Add Custom" option
    const customOption = document.createElement('option');
    customOption.value = '__CUSTOM__';
    customOption.textContent = '+ Add Custom Value';
    select.appendChild(customOption);

    // Handle selection
    select.addEventListener('change', (e) => {
        const selectedValue = e.target.value;

        if (selectedValue === '__CUSTOM__') {
            // Add custom value
            const customValue = prompt('Enter custom value:');
            if (customValue && customValue.trim()) {
                const currentVals = hiddenInput.value ? hiddenInput.value.split(';').map(v => v.trim()).filter(v => v.length > 0) : [];
                if (!currentVals.includes(customValue.trim())) {
                    currentVals.push(customValue.trim());
                    hiddenInput.value = currentVals.join('; ');
                    renderTags();
                }
            }
        } else if (selectedValue !== '') {
            // Add selected value
            const currentVals = hiddenInput.value ? hiddenInput.value.split(';').map(v => v.trim()).filter(v => v.length > 0) : [];
            if (!currentVals.includes(selectedValue)) {
                currentVals.push(selectedValue);
                hiddenInput.value = currentVals.join('; ');
                renderTags();
            }
        }

        // Reset dropdown
        select.value = '';
    });

    // Initial render
    renderTags();

    container.appendChild(tagsContainer);
    container.appendChild(select);
    container.appendChild(hiddenInput);

    return container;
}

/**
 * Add special buttons for Pursuit forms
 */
function addPursuitButtons() {
    const modal = document.getElementById('edit-modal');
    let buttonContainer = modal.querySelector('.pursuit-buttons');

    // Remove existing buttons if any
    if (buttonContainer) {
        buttonContainer.remove();
    }

    // Create button container
    buttonContainer = document.createElement('div');
    buttonContainer.className = 'pursuit-buttons mt-4 pt-4 border-t border-gray-200 flex gap-3';

    // Archive and Copy to Proposal button
    const archiveBtn = document.createElement('button');
    archiveBtn.type = 'button';
    archiveBtn.className = 'flex-1 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md text-sm font-medium';
    archiveBtn.textContent = 'Archive this Pursuit and Copy to Proposal';
    archiveBtn.onclick = archiveAndCopyToProposal;

    // Copy to New Pursuit button
    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium';
    copyBtn.textContent = 'Copy this Pursuit to a New Pursuit';
    copyBtn.onclick = copyToNewPursuit;

    buttonContainer.appendChild(archiveBtn);
    buttonContainer.appendChild(copyBtn);

    // Insert before the modal footer (buttons container)
    const form = document.getElementById('edit-form');
    const modalButtonsContainer = form.nextElementSibling;
    
    console.log('Form:', form);
    console.log('Modal buttons container:', modalButtonsContainer);
    console.log('Button container to insert:', buttonContainer);
    
    if (modalButtonsContainer && modalButtonsContainer.parentElement) {
        modalButtonsContainer.parentElement.insertBefore(buttonContainer, modalButtonsContainer);
        console.log('Pursuit buttons inserted successfully!');
    } else {
        // Fallback: append to form parent
        console.warn('Could not find proper insertion point, appending to form parent');
        if (form && form.parentElement) {
            form.parentElement.appendChild(buttonContainer);
        }
    }
}

/**
 * Archive pursuit and copy to proposal
 */
async function archiveAndCopyToProposal() {
    const confirmed = await ConfirmDialog.show({
        title: 'Archive and Copy to Proposal',
        message: 'This will archive the current pursuit and create a new proposal. The pursuit will be marked as archived and a copy will be created in the proposals section. Continue?',
        confirmText: 'Archive & Copy',
        cancelText: 'Cancel',
        type: 'warning'
    });

    if (!confirmed) return;

    try {
        const response = await fetch(`${API_BASE_URL}/proposals/${currentEditId}/archive-and-copy-to-proposal`, {
            method: 'POST'
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error);
        }

        toast.success(result.message);
        hideEditModal();
        await loadData();
    } catch (error) {
        console.error('Error archiving pursuit:', error);
        toast.error('Failed to archive pursuit: ' + error.message);
    }
}

/**
 * Copy pursuit to new pursuit
 */
async function copyToNewPursuit() {
    const confirmed = await ConfirmDialog.show({
        title: 'Copy to New Pursuit',
        message: 'This will create a new pursuit with the same information as this one. Continue?',
        confirmText: 'Create Copy',
        cancelText: 'Cancel',
        type: 'info'
    });

    if (!confirmed) return;

    try {
        const response = await fetch(`${API_BASE_URL}/proposals/${currentEditId}/copy-to-new-pursuit`, {
            method: 'POST'
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error);
        }

        toast.success(result.message);
        hideEditModal();
        await loadData();
    } catch (error) {
        console.error('Error copying pursuit:', error);
        toast.error('Failed to copy pursuit: ' + error.message);
    }
}

/**
 * Save entry (create or update)
 */
async function saveEntry() {
    const saveButton = document.getElementById('save-entry-btn');
    
    console.log('saveEntry called, currentEditId:', currentEditId);
    
    try {
        // Set loading state on save button
        ButtonUtils.setLoading(saveButton, currentEditId ? 'Updating...' : 'Creating...');
        
        const form = document.getElementById('edit-form');
        const formData = new FormData(form);
        const data = {};

        // Fields that should be included even when empty (to allow clearing/nulling)
        const nullableFields = ['PRIME', 'SUB', 'STATUS', 'STAGE', 'DETAILS', 'MSMM_POC', 'EXTERNAL_POC', 'SELECTION_CHANCE'];

        // Build data object from form
        for (const [key, value] of formData.entries()) {
            // Include nullable fields even when empty (so they can be set to NULL)
            // Skip other empty values
            if (value !== '' || nullableFields.includes(key)) {
                data[key] = value;
            }
        }

        console.log('Form data:', data);

        let response;

        if (currentEditId) {
            // Update existing entry
            response = await fetch(`${API_BASE_URL}/proposals/${currentEditId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
        } else {
            // Create new entry
            response = await fetch(`${API_BASE_URL}/proposals`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error);
        }

        // Close modal and reload data
        hideEditModal();
        await loadData();

        toast.success(currentEditId ? 'Entry updated successfully!' : 'Entry created successfully!');

    } catch (error) {
        console.error('Error saving entry:', error);
        toast.error('Failed to save entry: ' + error.message);
    } finally {
        // Always remove loading state
        ButtonUtils.removeLoading(saveButton);
    }
}

/**
 * Delete entry
 */
async function deleteEntry(id) {
    if (!id) return;

    // Get entry title for confirmation message
    const entry = tableData.find(item => item.PID === id);
    const entryName = entry ? `"${entry.TITLE || 'this entry'}"` : 'this entry';

    const confirmed = await ConfirmDialog.confirmDelete(entryName);
    if (!confirmed) return;

    try {
        const response = await fetch(`${API_BASE_URL}/proposals/${id}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error);
        }

        // Close modal if open and reload data
        hideEditModal();
        await loadData();

        toast.success('Entry deleted successfully');

    } catch (error) {
        console.error('Error deleting entry:', error);
        toast.error('Failed to delete entry: ' + error.message);
    }
}

/**
 * Hide edit/create modal
 */
function hideEditModal() {
    document.getElementById('edit-modal').classList.add('hidden');
    currentEditId = null;
}

/**
 * Export table data to Excel
 */
function exportToExcel() {
    try {
        // Prepare data for export - use filteredData to respect search/filters
        const exportData = [];

        // Create header row with formatted column names (excluding ACTION column)
        const headers = visibleColumns
            .filter(col => col !== 'ACTION')
            .map(col => formatColumnName(col));
        exportData.push(headers);

        // Add data rows - only visible columns and current filtered data
        filteredData.forEach(item => {
            const row = item.row || item;
            const dataRow = visibleColumns
                .filter(col => col !== 'ACTION')
                .map(col => {
                    let value = row[col];

                    // Handle null/undefined
                    if (value === null || value === undefined) {
                        return '';
                    }

                    // Handle dates
                    if (value instanceof Date) {
                        return value.toISOString().split('T')[0];
                    }

                    // Convert to string for Excel
                    return String(value);
                });
            exportData.push(dataRow);
        });

        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(exportData);

        // Auto-size columns
        const colWidths = headers.map((header, i) => {
            const maxLength = Math.max(
                header.length,
                ...exportData.slice(1).map(row => String(row[i] || '').length)
            );
            return { wch: Math.min(maxLength + 2, 50) }; // Cap at 50 characters
        });
        ws['!cols'] = colWidths;

        // Add worksheet to workbook
        const sheetName = currentConfig.title || 'Data';
        XLSX.utils.book_append_sheet(wb, ws, sheetName);

        // Generate filename with current date
        const today = new Date().toISOString().split('T')[0];
        const filename = `${sheetName.replace(/\s+/g, '_')}_${today}.xlsx`;

        // Download file
        XLSX.writeFile(wb, filename);

        console.log(`Exported ${filteredData.length} rows to ${filename}`);
        toast.success(`Exported ${filteredData.length} rows to ${filename}`);
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        toast.error('Failed to export data to Excel. Please try again.');
    }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    document.getElementById('edit-columns-btn').addEventListener('click', showColumnEditor);
    document.getElementById('apply-columns-btn').addEventListener('click', applyColumnChanges);
    document.getElementById('cancel-columns-btn').addEventListener('click', hideColumnEditor);
    document.getElementById('export-excel-btn').addEventListener('click', exportToExcel);

    // Select All / Deselect All buttons
    document.getElementById('select-all-columns-btn').addEventListener('click', selectAllColumns);
    document.getElementById('deselect-all-columns-btn').addEventListener('click', deselectAllColumns);

    // Search input listener
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase().trim();
            applySearchAndSort();
        });
    }

    // CRUD event listeners
    document.getElementById('create-new-btn').addEventListener('click', showCreateModal);
    document.getElementById('save-entry-btn').addEventListener('click', saveEntry);
    document.getElementById('delete-entry-btn').addEventListener('click', () => deleteEntry(currentEditId));
    document.getElementById('cancel-edit-btn').addEventListener('click', hideEditModal);

    // Organization modal event listeners
    document.getElementById('save-org-btn').addEventListener('click', saveOrganization);
    document.getElementById('cancel-org-btn').addEventListener('click', hideAddOrganizationModal);

    // Delegate Edit button clicks
    document.getElementById('table-body').addEventListener('click', (e) => {
        const editBtn = e.target.closest('.edit-btn');

        if (editBtn) {
            const id = editBtn.dataset.id;
            showEditModal(id);
        }
    });
}

/**
 * Show Add Organization Modal
 */
function showAddOrganizationModal() {
    // Clear form
    document.getElementById('add-org-form').reset();

    // Show modal
    document.getElementById('add-org-modal').classList.remove('hidden');
}

/**
 * Hide Add Organization Modal
 */
function hideAddOrganizationModal() {
    document.getElementById('add-org-modal').classList.add('hidden');
}

/**
 * Save new organization
 */
async function saveOrganization() {
    try {
        const form = document.getElementById('add-org-form');
        const formData = new FormData(form);
        const data = {};

        // Build data object from form
        for (const [key, value] of formData.entries()) {
            if (value !== '') {
                data[key] = value;
            }
        }

        // Validate required fields
        if (!data.ORG_FULL_NAME || !data.ORG_TYPE) {
            toast.warning('Please fill in all required fields (Full Name and Type)');
            return;
        }

        const response = await fetch(`${API_BASE_URL}/organizations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error);
        }

        toast.success('Organization created successfully!');
        hideAddOrganizationModal();

        // Reload the dropdown data and rebuild form to show new org
        await buildFormFields(currentEditId ? await getCurrentFormData() : currentFilters);

    } catch (error) {
        console.error('Error saving organization:', error);
        toast.error('Failed to save organization: ' + error.message);
    }
}

/**
 * Get current form data
 */
async function getCurrentFormData() {
    if (!currentEditId) return {};

    try {
        const response = await fetch(`${API_BASE_URL}/proposals/${currentEditId}`);
        const result = await response.json();
        return result.success ? result.data : {};
    } catch (error) {
        console.error('Error fetching current data:', error);
        return {};
    }
}

/**
 * Select all columns in the editor
 */
function selectAllColumns() {
    const checkboxes = document.querySelectorAll('#column-list input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = true;
    });
}

/**
 * Deselect all columns in the editor (except must keep at least one)
 */
function deselectAllColumns() {
    const checkboxes = document.querySelectorAll('#column-list input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
}

/**
 * Get searchable text value for a column (without HTML)
 */
function getSearchableValue(value, columnName) {
    if (value === null || value === undefined || value === '') {
        return '';
    }

    // Format dates
    if (columnName.includes('DATE') && value) {
        try {
            const date = new Date(value);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (e) {
            return String(value);
        }
    }

    // Format currency amounts
    if (typeof value === 'number' && columnName.includes('AMOUNT')) {
        return '$' + value.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    // Format regular numbers
    if (typeof value === 'number') {
        return value.toLocaleString();
    }

    return String(value);
}

/**
 * Search data across all visible columns
 */
function searchData(data, query) {
    if (!query) {
        return data.map(row => ({ row, matches: [] }));
    }

    const results = [];

    data.forEach(row => {
        const matches = [];

        visibleColumns.forEach(columnName => {
            // Skip ACTION column (virtual column)
            if (columnName === 'ACTION') return;

            const value = row[columnName];
            const strValue = getSearchableValue(value, columnName).toLowerCase();

            if (strValue.includes(query)) {
                matches.push(columnName);
            }
        });

        // Add row with matches (empty array if no matches)
        results.push({ row, matches });
    });

    return results;
}

/**
 * Highlight matching text in a string
 */
function highlightText(text, query) {
    if (!query || !text) return text;

    const strText = String(text);
    const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
    return strText.replace(regex, '<mark class="bg-yellow-200 px-0.5 rounded">$1</mark>');
}

/**
 * Escape regex special characters
 */
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Apply search and sort
 */
function applySearchAndSort() {
    let results = searchData(tableData, searchQuery);

    // If searching, only show matching results
    if (searchQuery) {
        filteredData = results.filter(r => r.matches.length > 0);
    } else {
        // Show all results when not searching
        filteredData = results;
    }

    // Sort results if needed
    if (sortColumn) {
        filteredData.sort((a, b) => sortCompare(a.row, b.row));
    }

    renderTableBody();
    updateTableInfo();
}

/**
 * Sort comparison function
 */
function sortCompare(a, b) {
    const aVal = a[sortColumn];
    const bVal = b[sortColumn];

    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;

    let comparison = 0;
    if (aVal < bVal) comparison = -1;
    if (aVal > bVal) comparison = 1;

    return sortDirection === 'asc' ? comparison : -comparison;
}

/**
 * Update table info
 */
function updateTableInfo() {
    const totalRows = tableData.length;
    const filteredRows = filteredData.length;
    const rowCountElement = document.getElementById('row-count');

    if (searchQuery) {
        // Show filtered count when searching
        rowCountElement.textContent = `${filteredRows} matching (${totalRows} total)`;
    } else {
        rowCountElement.textContent = filteredRows;
    }
}

/**
 * Show loading state
 */
function showLoading() {
    document.getElementById('loading-spinner').classList.remove('hidden');
    document.getElementById('error-message').classList.add('hidden');
    document.getElementById('table-container').classList.add('hidden');
}

/**
 * Hide loading state
 */
function hideLoading() {
    document.getElementById('loading-spinner').classList.add('hidden');
}

/**
 * Show error message
 */
function showError(message) {
    document.getElementById('error-text').textContent = message;
    document.getElementById('error-message').classList.remove('hidden');
    document.getElementById('loading-spinner').classList.add('hidden');
    document.getElementById('table-container').classList.add('hidden');
}

/**
 * Setup synchronized scroll bars (top and bottom)
 */
function setupScrollSync() {
    const topScroll = document.getElementById('top-scroll');
    const bottomScroll = document.getElementById('bottom-scroll');
    const topScrollContent = document.getElementById('top-scroll-content');
    const table = document.querySelector('#bottom-scroll table');

    if (!topScroll || !bottomScroll || !topScrollContent || !table) return;

    // Function to update the width of the top scroll content to match table width
    function updateTopScrollWidth() {
        const tableWidth = table.scrollWidth;
        topScrollContent.style.width = tableWidth + 'px';
    }

    // Update width initially and whenever the table is rendered
    updateTopScrollWidth();

    // Sync bottom scroll when top scroll moves
    topScroll.addEventListener('scroll', function() {
        if (!topScroll.isSyncing) {
            bottomScroll.isSyncing = true;
            bottomScroll.scrollLeft = topScroll.scrollLeft;
            bottomScroll.isSyncing = false;
        }
    });

    // Sync top scroll when bottom scroll moves
    bottomScroll.addEventListener('scroll', function() {
        if (!bottomScroll.isSyncing) {
            topScroll.isSyncing = true;
            topScroll.scrollLeft = bottomScroll.scrollLeft;
            topScroll.isSyncing = false;
        }
    });

    // Update width when window resizes
    window.addEventListener('resize', updateTopScrollWidth);

    // Return the update function so it can be called after table renders
    return updateTopScrollWidth;
}

// Store the update function globally
let updateScrollWidth = null;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', init);
