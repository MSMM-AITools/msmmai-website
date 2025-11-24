# MSMM Business Development Dashboard

A professional business development tracking system with dynamic data tables and Oracle database integration.

## Features

### Core Features
- **Dashboard with Cards**: Overview of all business development activities organized by category
- **Top Navbar Navigation**: Professional horizontal navigation with mobile support and menu icons
- **Dynamic Data Tables**: Sortable, filterable tables with column management
- **Column Reordering**: Drag and drop columns to reorder
- **Column Visibility**: Choose which columns to display
- **Advanced Search**: Real-time search with highlighted results
- **Dual Scrollbars**: Horizontal scroll bars at both top and bottom of tables
- **Responsive Design**: Works on mobile, tablet, and desktop
- **Oracle Database Integration**: Real-time data from Oracle DB

### User Experience Enhancements
- **Toast Notifications**: Beautiful, non-blocking notifications for all actions (success, error, warning, info)
- **Button Loading States**: Animated spinners on buttons during operations
- **Custom Confirmation Dialogs**: Styled confirmation modals with context-specific messages
- **Duplicate Detection**: Warns users when creating proposals with duplicate titles
- **Auto-Disable Buttons**: Prevents double-clicks and accidental duplicate submissions

### Business Logic Features
- **Pursuit Actions**: Special buttons for managing pursuits:
  - Archive pursuit and copy to proposal (with status change to "Awaiting Verdict")
  - Copy pursuit to create a new pursuit
- **Organization Management**: Full CRUD operations for organizations with dedicated page
- **Calendar Integration**: Event calendar with rich text notes (Quill.js editor)
- **License Tracking**: 
  - View license expirations on calendar
  - Hover tooltips for quick license info
  - Alert badge for licenses expiring in next 30 days
- **Export to Excel**: Export filtered data to Excel spreadsheets with timestamps

### Data Management
- **CRUD Operations**: Create, Read, Update, Delete for proposals, organizations, and events
- **Editable Dropdowns**: Dynamic dropdowns with "Add New" functionality
- **Form Field Organization**: Smart form layouts with proper field grouping
- **Archive Management**: Track active vs. archived records with color-coded counts

## Getting Started

### Prerequisites

- Node.js installed
- Oracle Database access (credentials in .env file)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure database connection in `.env` file

### Running the Application

Start all servers (API + Frontend + CSS Watch):
```bash
npm run dev
```

This will start:
- API Server on http://localhost:3001
- Frontend on http://localhost:3000
- Tailwind CSS watch mode

Or run individually:
```bash
# API Server only
npm run api

# Frontend only
npm run serve

# Build CSS once
npm run build

# Watch CSS changes
npm run watch
```

## Application Structure

```
BusinessDev/
├── index.html              # Main dashboard page
├── pages/
│   └── table.html         # Dynamic table page
├── js/
│   └── table.js           # Table functionality
├── server/
│   └── api.js             # Express API server
├── db/
│   ├── connection.js      # Database connection module
│   ├── testConnection.js  # Database test script
│   └── README.md          # Database documentation
├── dist/
│   └── output.css         # Compiled Tailwind CSS
└── src/
    └── input.css          # Tailwind CSS source
```

## Dashboard Cards

1. **Future Pursuits**
   - Future Pursuits (CATEGORY='Pursuits', ARCHIVE='N')
   - Archived Pursuits (CATEGORY='Pursuits', ARCHIVE='Y')

2. **Proposals**
   - Active Proposals (CATEGORY='Proposal Submitted', ARCHIVE='N')
   - Archived Proposals (CATEGORY='Proposal Submitted', ARCHIVE='Y')

3. **Multi-Use Contracts**
   - Active Prime Multi-Use Contracts
   - Active Sub Multi-Use Contracts
   - Archived Prime Multi-Use Contracts
   - Archived Sub Multi-Use Contracts

4. **AE Selected List**
   - Active AE Selected List
   - Archived AE Selected List

5. **Single Use Contracts**
   - Active Single Use Contracts (Projects)
   - Archived Single Use Contracts (Projects)

6. **Fee Proposals**
   - Active Fee Proposals
   - Archived Fee Proposals

7. **Project Avenue**
   - Coming soon...

## Table Features

### Sorting
- Click any column header to sort
- Click again to reverse sort direction
- Sort indicator shows current sort state (↑/↓)

### Column Reordering
- Drag column headers using the drag handle (⋮⋮)
- Drop in new position to reorder

### Column Management
- Click "Edit Columns" button
- Check/uncheck columns to show/hide
- At least one column must be visible

### No Horizontal Scroll
- Columns are sized to fit viewport
- Long text is truncated with "..."
- Responsive layout adjusts for different screen sizes

## API Endpoints

### Get Proposals
```
GET /api/proposals?category=Pursuits&archive=N&limit=100&offset=0
```

### Get Proposal Counts
```
GET /api/proposals/counts
```
Returns counts for:
- Future Pursuits (active)
- Archived Pursuits
- Active Proposals
- Archived Proposals

### Get Columns
```
GET /api/proposals/columns
```

### Get Organizations
```
GET /api/organizations
```

### Get Single Proposal
```
GET /api/proposals/:id
```

### Health Check
```
GET /api/health
```

## Database Tables

### PROPOSALS Table
Main table for all proposals, pursuits, and contracts.

**Key Columns:**
- PID (Primary Key)
- TITLE
- CATEGORY (Pursuits, Proposal Submitted, etc.)
- ARCHIVE (Y/N)
- PRIME
- SUB
- STATUS
- SUBMITTED_DATE
- PROJECTED_AMOUNT
- etc.

### ORGANIZATION Table
Contains all organizations (clients, partners, etc.)

**Key Columns:**
- ORG_ID (Primary Key)
- ORG_FULL_NAME
- ORG_ABBREVIATION
- ORG_TYPE
- ORG_INACTIVE_DATE

## Testing

### Test Database Connection
```bash
# Full test with table verification
npm run test:db

# Quick connection test
npm run test:db:simple
```

## URL Parameters

Table pages use URL parameters to determine what data to display:

- `?type=future-pursuits` - Future Pursuits (ARCHIVE='N')
- `?type=archived-pursuits` - Archived Pursuits (ARCHIVE='Y')
- `?type=active-proposals` - Active Proposals (ARCHIVE='N')
- `?type=archived-proposals` - Archived Proposals (ARCHIVE='Y')

## Technology Stack

- **Frontend**: HTML5, Vanilla JavaScript, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: Oracle Database 23ai
- **Database Driver**: node-oracledb (Thin Mode)
- **Build Tools**: Tailwind CSS CLI, Concurrently

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Development Notes

- API runs on port 3001
- Frontend runs on port 3000
- CORS enabled for local development
- Connection pooling for better performance
- Retry logic for network resilience
- 60-second timeout for database operations

## Troubleshooting

### Database Connection Issues
1. Check `.env` file for correct credentials
2. Verify network connectivity to database server
3. Run `npm run test:db:simple` to diagnose
4. Check if VPN is required

### API Not Starting
1. Check if port 3001 is available
2. Verify database connection
3. Check server logs for errors

### Frontend Not Loading
1. Check if port 3000 is available
2. Verify CSS is built (`npm run build`)
3. Check browser console for errors

## License

ISC

## Support

For issues or questions, please contact the development team.
