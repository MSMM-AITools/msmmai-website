// API Configuration - uses window.API_CONFIG from config.js
const getApiBaseUrl = () => window.API_CONFIG ? `${window.API_CONFIG.baseUrl}/api` : 'http://localhost:3001/api';
const API_BASE_URL = getApiBaseUrl();

// Table state
let tableData = [];
let filteredData = [];
let searchQuery = '';
let currentEditId = null;
let orgTypeOptions = [];
let sortColumn = null;
let sortDirection = 'asc';

// Column definitions for ORGANIZATION table
const COLUMNS = [
    { name: 'ORG_ID', label: 'ID', type: 'NUMBER' },
    { name: 'ORG_FULL_NAME', label: 'ORGANIZATION NAME', type: 'VARCHAR2' },
    { name: 'ORG_ABBREVIATION', label: 'ABBREVIATION', type: 'VARCHAR2' },
    { name: 'ORG_TYPE', label: 'TYPE', type: 'VARCHAR2' },
    { name: 'ORG_INACTIVE_DATE', label: 'INACTIVE DATE', type: 'DATE' }
];

/**
 * Initialize the page
 */
async function init() {
    await loadOrgTypeOptions();
    await loadData();
    setupEventListeners();
}

/**
 * Load ORG_TYPE dropdown options
 */
async function loadOrgTypeOptions() {
    try {
        const response = await fetch(`${API_BASE_URL}/dropdowns/org-type`);
        const result = await response.json();
        if (result.success) {
            orgTypeOptions = result.data.map(item => item.VALUE || item.value);
        }
    } catch (error) {
        console.error('Error loading ORG_TYPE options:', error);
        orgTypeOptions = [];
    }
}

/**
 * Load data from API
 */
async function loadData() {
    try {
        document.getElementById('loading-spinner').classList.remove('hidden');
        document.getElementById('table-container').classList.add('hidden');
        document.getElementById('error-message').classList.add('hidden');

        const response = await fetch(`${API_BASE_URL}/organizations`);
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error);
        }

        tableData = result.data;
        filterData();
        renderTable();
        hideLoading();

    } catch (error) {
        console.error('Error loading data:', error);
        showError('Failed to load data: ' + error.message);
    }
}

/**
 * Filter data based on search query
 */
function filterData() {
    if (!searchQuery) {
        filteredData = [...tableData];
    } else {
        const query = searchQuery.toLowerCase();
        filteredData = tableData.filter(row => {
            return Object.values(row).some(value => {
                if (value === null || value === undefined) return false;
                return String(value).toLowerCase().includes(query);
            });
        });
    }
    
    // Apply sorting
    sortData();
}

/**
 * Sort data by current sort column and direction
 */
function sortData() {
    if (!sortColumn) {
        // Default sort by Organization Name
        filteredData.sort((a, b) => {
            const nameA = (a.ORG_FULL_NAME || a.org_full_name || '').toUpperCase();
            const nameB = (b.ORG_FULL_NAME || b.org_full_name || '').toUpperCase();
            return nameA.localeCompare(nameB);
        });
        return;
    }

    filteredData.sort((a, b) => {
        let valA = a[sortColumn] || a[sortColumn.toLowerCase()] || '';
        let valB = b[sortColumn] || b[sortColumn.toLowerCase()] || '';

        // Handle dates
        const col = COLUMNS.find(c => c.name === sortColumn);
        if (col && col.type === 'DATE') {
            valA = valA ? new Date(valA).getTime() : 0;
            valB = valB ? new Date(valB).getTime() : 0;
        } else if (col && col.type === 'NUMBER') {
            valA = parseFloat(valA) || 0;
            valB = parseFloat(valB) || 0;
        } else {
            // String comparison
            valA = String(valA).toUpperCase();
            valB = String(valB).toUpperCase();
        }

        let comparison = 0;
        if (valA > valB) {
            comparison = 1;
        } else if (valA < valB) {
            comparison = -1;
        }

        return sortDirection === 'asc' ? comparison : -comparison;
    });
}

/**
 * Render the table
 */
function renderTable() {
    renderTableHeader();
    renderTableBody();
    updateTableInfo();
    document.getElementById('table-container').classList.remove('hidden');
}

/**
 * Render table header
 */
function renderTableHeader() {
    const thead = document.getElementById('table-header');
    thead.innerHTML = '';

    const tr = document.createElement('tr');
    
    // Add action column (not sortable, centered)
    const actionTh = document.createElement('th');
    actionTh.className = 'py-3.5 pl-4 pr-3 text-center text-sm font-semibold text-blue-700 sm:pl-6';
    actionTh.textContent = 'ACTIONS';
    tr.appendChild(actionTh);

    // Add data columns (sortable)
    COLUMNS.forEach(col => {
        const th = document.createElement('th');
        th.className = 'px-3 py-3.5 text-left text-sm font-semibold text-blue-700 cursor-pointer hover:bg-gray-100 select-none';
        th.style.position = 'relative';
        
        // Create header content with sort indicator
        const headerContent = document.createElement('div');
        headerContent.className = 'flex items-center gap-2';
        
        const labelSpan = document.createElement('span');
        labelSpan.textContent = col.label;
        headerContent.appendChild(labelSpan);
        
        // Add sort indicator
        const sortIndicator = document.createElement('span');
        sortIndicator.className = 'inline-block';
        if (sortColumn === col.name) {
            sortIndicator.innerHTML = sortDirection === 'asc' 
                ? '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clip-rule="evenodd"/></svg>'
                : '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>';
        } else {
            sortIndicator.innerHTML = '<svg class="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path d="M5 12a1 1 0 102 0V6.414l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L5 6.414V12zM15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 13.586V8z"/></svg>';
        }
        headerContent.appendChild(sortIndicator);
        
        th.appendChild(headerContent);
        
        // Add click handler for sorting
        th.addEventListener('click', () => {
            if (sortColumn === col.name) {
                // Toggle direction
                sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                // New column, default to ascending
                sortColumn = col.name;
                sortDirection = 'asc';
            }
            filterData();
            renderTable();
        });
        
        tr.appendChild(th);
    });

    thead.appendChild(tr);
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
        td.colSpan = COLUMNS.length + 1;
        td.className = 'px-3 py-8 text-center text-sm text-gray-500';
        td.textContent = searchQuery ? 'No organizations found matching your search.' : 'No organizations found.';
        tr.appendChild(td);
        tbody.appendChild(tr);
        return;
    }

    filteredData.forEach(row => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-50';

        // Action column
        const actionTd = document.createElement('td');
        actionTd.className = 'relative whitespace-nowrap py-4 pl-3 pr-4 text-sm font-medium sm:pr-6 text-center';
        
        const editBtn = document.createElement('button');
        editBtn.className = 'text-indigo-600 hover:text-indigo-900 inline-block';
        editBtn.title = 'Edit Organization';
        editBtn.innerHTML = `
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
        `;
        editBtn.addEventListener('click', () => openEditModal(row.ORG_ID || row.org_id));
        
        actionTd.appendChild(editBtn);
        tr.appendChild(actionTd);

        // Data columns
        COLUMNS.forEach(col => {
            const td = document.createElement('td');
            td.className = 'whitespace-nowrap px-3 py-4 text-sm text-gray-900';
            
            let value = row[col.name] || row[col.name.toLowerCase()];
            
            // Format dates
            if (col.type === 'DATE' && value) {
                value = new Date(value).toLocaleDateString();
            }
            
            td.textContent = value || '';
            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });
}

/**
 * Update table info
 */
function updateTableInfo() {
    const infoText = document.getElementById('table-info-text');
    infoText.textContent = filteredData.length;
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Search
    document.getElementById('search-input').addEventListener('input', (e) => {
        searchQuery = e.target.value;
        filterData();
        renderTable();
    });

    // Create new
    document.getElementById('create-new-btn').addEventListener('click', () => openEditModal(null));

    // Export
    document.getElementById('export-btn').addEventListener('click', exportToExcel);

    // Modal buttons
    document.getElementById('close-modal-btn').addEventListener('click', closeEditModal);
    document.getElementById('cancel-btn').addEventListener('click', closeEditModal);
    document.getElementById('save-org-btn').addEventListener('click', saveOrganization);
    document.getElementById('delete-btn').addEventListener('click', deleteOrganization);

    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const menuOpenIcon = document.getElementById('menu-open-icon');
    const menuCloseIcon = document.getElementById('menu-close-icon');

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
            menuOpenIcon.classList.toggle('hidden');
            menuCloseIcon.classList.toggle('hidden');
        });
    }

    // Profile dropdown
    const profileMenuBtn = document.getElementById('profile-menu-btn');
    const profileDropdown = document.getElementById('profile-dropdown');

    if (profileMenuBtn) {
        profileMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('hidden');
        });

        document.addEventListener('click', (e) => {
            if (!profileMenuBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
                profileDropdown.classList.add('hidden');
            }
        });
    }
}

/**
 * Create editable dropdown for ORG_TYPE
 */
function createEditableOrgTypeDropdown(selectedValue) {
    const select = document.createElement('select');
    select.className = 'block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm';
    select.id = 'field-ORG_TYPE';
    select.name = 'ORG_TYPE';

    // Add empty option
    const emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.textContent = '-- Select Type --';
    select.appendChild(emptyOption);

    // Add existing options
    orgTypeOptions.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        if (selectedValue && selectedValue === type) {
            option.selected = true;
        }
        select.appendChild(option);
    });

    // If current value is not in options, add it as selected
    if (selectedValue && !orgTypeOptions.includes(selectedValue)) {
        const customOption = document.createElement('option');
        customOption.value = selectedValue;
        customOption.textContent = selectedValue;
        customOption.selected = true;
        select.appendChild(customOption);
    }

    // Add "Add New" option
    const addNewOption = document.createElement('option');
    addNewOption.value = '__ADD_NEW__';
    addNewOption.textContent = '+ Add New Type';
    select.appendChild(addNewOption);

    // Handle selection
    select.addEventListener('change', (e) => {
        if (e.target.value === '__ADD_NEW__') {
            const newType = prompt('Enter new organization type:');
            if (newType && newType.trim()) {
                const trimmedType = newType.trim();
                
                // Check if it already exists
                if (!orgTypeOptions.includes(trimmedType)) {
                    orgTypeOptions.push(trimmedType);
                    orgTypeOptions.sort();
                }

                // Add new option before "Add New"
                const newOption = document.createElement('option');
                newOption.value = trimmedType;
                newOption.textContent = trimmedType;
                newOption.selected = true;
                
                // Insert before the last option (Add New)
                select.insertBefore(newOption, select.lastChild);
            } else {
                // Reset to empty if cancelled
                select.value = '';
            }
        }
    });

    return select;
}

/**
 * Open edit modal
 */
async function openEditModal(orgId) {
    currentEditId = orgId;
    const modal = document.getElementById('edit-modal');
    const modalTitle = document.getElementById('modal-title');
    const deleteBtn = document.getElementById('delete-btn');
    const form = document.getElementById('edit-form');

    // Set title
    if (orgId) {
        modalTitle.textContent = 'Edit Organization';
        deleteBtn.classList.remove('hidden');
    } else {
        modalTitle.textContent = 'Create New Organization';
        deleteBtn.classList.add('hidden');
    }

    // Get data if editing
    let data = {};
    if (orgId) {
        try {
            const response = await fetch(`${API_BASE_URL}/organizations/${orgId}`);
            const result = await response.json();
            if (result.success) {
                data = result.data;
            }
        } catch (error) {
            console.error('Error loading organization:', error);
            toast.error('Failed to load organization data');
            return;
        }
    }

    // Build form
    form.innerHTML = '';
    COLUMNS.forEach(col => {
        // Skip ORG_ID for new entries
        if (col.name === 'ORG_ID' && !orgId) return;

        const div = document.createElement('div');
        div.className = 'flex flex-col';

        const label = document.createElement('label');
        label.htmlFor = `field-${col.name}`;
        label.className = 'text-sm font-medium text-gray-900 mb-1';
        label.textContent = col.label;

        let input;

        if (col.type === 'DATE') {
            input = document.createElement('input');
            input.type = 'date';
            input.className = 'block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm';
            
            if (data[col.name]) {
                const date = new Date(data[col.name]);
                input.value = date.toISOString().split('T')[0];
            }
        } else if (col.name === 'ORG_ID') {
            input = document.createElement('input');
            input.type = 'text';
            input.className = 'block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 bg-gray-100 sm:text-sm';
            input.readOnly = true;
            input.value = data[col.name] || '';
        } else if (col.name === 'ORG_TYPE') {
            // Create editable dropdown for ORG_TYPE
            input = createEditableOrgTypeDropdown(data[col.name]);
        } else {
            input = document.createElement('input');
            input.type = 'text';
            input.className = 'block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm';
            input.value = data[col.name] || '';
        }

        input.id = `field-${col.name}`;
        input.name = col.name;

        div.appendChild(label);
        div.appendChild(input);
        form.appendChild(div);
    });

    modal.classList.remove('hidden');
}

/**
 * Close edit modal
 */
function closeEditModal() {
    document.getElementById('edit-modal').classList.add('hidden');
    currentEditId = null;
}

/**
 * Save organization
 */
async function saveOrganization() {
    const saveButton = document.getElementById('save-org-btn');
    
    try {
        // Set loading state on save button
        ButtonUtils.setLoading(saveButton, currentEditId ? 'Updating...' : 'Creating...');
        
        const form = document.getElementById('edit-form');
        const formData = new FormData(form);
        const data = {};

        formData.forEach((value, key) => {
            data[key] = value || null;
        });

        const url = currentEditId 
            ? `${API_BASE_URL}/organizations/${currentEditId}`
            : `${API_BASE_URL}/organizations`;
        
        const method = currentEditId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error);
        }

        closeEditModal();
        await loadData();
        toast.success(currentEditId ? 'Organization updated successfully!' : 'Organization created successfully!');

    } catch (error) {
        console.error('Error saving organization:', error);
        toast.error('Failed to save organization: ' + error.message);
    } finally {
        // Always remove loading state
        ButtonUtils.removeLoading(saveButton);
    }
}

/**
 * Delete organization
 */
async function deleteOrganization() {
    if (!currentEditId) return;

    // Get organization name for confirmation
    const org = allData.find(item => item.ORG_ID === currentEditId);
    const orgName = org ? `"${org.ORG_FULL_NAME || 'this organization'}"` : 'this organization';

    const confirmed = await ConfirmDialog.confirmDelete(orgName);
    if (!confirmed) return;

    try {
        const response = await fetch(`${API_BASE_URL}/organizations/${currentEditId}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error);
        }

        closeEditModal();
        await loadData();
        toast.success('Organization deleted successfully!');

    } catch (error) {
        console.error('Error deleting organization:', error);
        toast.error('Failed to delete organization: ' + error.message);
    }
}

/**
 * Export to Excel
 */
function exportToExcel() {
    if (filteredData.length === 0) {
        toast.warning('No data to export');
        return;
    }

    // Prepare data for export
    const exportData = filteredData.map(row => {
        const exportRow = {};
        COLUMNS.forEach(col => {
            let value = row[col.name] || row[col.name.toLowerCase()];
            if (col.type === 'DATE' && value) {
                value = new Date(value).toLocaleDateString();
            }
            exportRow[col.label] = value || '';
        });
        return exportRow;
    });

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Organizations');

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `Organizations_${timestamp}.xlsx`;

    // Save file
    XLSX.writeFile(wb, filename);
    toast.success(`Exported ${exportData.length} organizations to ${filename}`);
}

/**
 * Hide loading spinner
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

// Initialize when page loads
document.addEventListener('DOMContentLoaded', init);
