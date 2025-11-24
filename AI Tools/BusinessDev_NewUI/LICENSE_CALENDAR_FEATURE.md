# License Expiration Calendar Feature

## 📋 Overview
Added a toggle layer feature to the calendar that displays license expiration dates from the `LICENSES` table. Licenses are **shown by default** when the calendar loads. Users can show/hide license expirations with a single button click.

## ✨ Features

### Toggle Button
- **Location**: Top right of calendar page, next to "Add Event" button
- **Icon**: 📋 Document/license icon
- **Text**: "Show Licenses" / "Hide Licenses"
- **Visual Feedback**: Button changes to amber color when licenses are visible

### License Display
- **Color**: Amber/orange (`#F59E0B`) to distinguish from regular events (blue)
- **Icon**: 🔒 Lock icon prefix
- **Format**: "🔒 License: [Name/Type]"
- **Type**: All-day events (no specific time)

### Read-Only Behavior
- ✅ **Cannot edit** license events from calendar
- ✅ **Cannot drag** license events to different dates
- ✅ **Cannot resize** license events
- ✅ **Cannot delete** license events
- ✅ **View-only modal** when clicked showing license details

### License Information Modal
When clicking a license event, displays:
- License Name
- License Type
- State
- License Number
- Expiration Date
- Full license text details

## 🎨 Visual Design

### Toggle Button States
**Visible State (Default):**
- Amber background (`#F59E0B`)
- White text
- Amber border
- Text: "Hide Licenses"
- **Shows on page load**

**Hidden State:**
- White background
- Gray text
- Gray border
- Text: "Show Licenses"

### License Events
- **Background**: Amber (`#F59E0B`)
- **Border**: Dark amber (`#D97706`)
- **Text**: White
- **Prefix**: 🔒 emoji
- **Class**: `license-event`

## 🔧 Technical Implementation

### Files Modified

1. **pages/calendar.html**
   - Added "Show Licenses" toggle button with document icon
   - Positioned next to "Add Event" button
   - Added `licenses-toggle-text` span for dynamic text

2. **js/calendar.js**
   - Added `licensesVisible` state flag (default: `true`)
   - Added `licenseEventSource` to track license event source
   - Created `loadLicenses()` function to fetch from API
   - Created `toggleLicenses()` function to show/hide
   - Created `initializeLicenses()` function to load licenses on page load
   - Created `showLicenseModal()` for read-only display
   - Updated `handleEventClick()` to detect license events
   - Added `eventAllow` and `eventResizableFromStart` callbacks to prevent editing
   - Added `extendedProps.isLicense` flag for identification
   - Added `extendedProps.editable` flag for all events

3. **server/api.js**
   - Added `GET /api/licenses` endpoint
   - Fetches from `LICENSES` table
   - Returns: `LIC_ID`, `LIC_NAME`, `LIC_STATE`, `LIC_TYPE`, `LIC_NO`, `EXPIRATION_DATE`, `LIC_FULL_TEXT`
   - Filters to only licenses with `EXPIRATION_DATE IS NOT NULL`
   - Orders by `EXPIRATION_DATE`

### API Endpoint

**GET /api/licenses**
```javascript
{
  "success": true,
  "data": [
    {
      "LIC_ID": 72,
      "LIC_NAME": "City of New Orleans Occupational License",
      "LIC_STATE": "LA",
      "LIC_TYPE": "Occupational License",
      "LIC_NO": "123456",
      "EXPIRATION_DATE": "2025-12-31T06:00:00.000Z",
      "LIC_FULL_TEXT": "License Name: City of New Orleans..."
    },
    // ... more licenses
  ]
}
```

### Event Object Structure

**Regular Events:**
```javascript
{
  id: event.EVENT_ID,
  title: event.TITLE,
  start: event.START_DATE,
  end: event.END_DATE,
  allDay: event.ALL_DAY === 'Y',
  backgroundColor: '#3B82F6',
  extendedProps: {
    editable: true,
    isLicense: false
  }
}
```

**License Events:**
```javascript
{
  id: `license-${license.LIC_ID}`,
  title: `🔒 License: ${license.LIC_NAME}`,
  start: license.EXPIRATION_DATE,
  allDay: true,
  backgroundColor: '#F59E0B',
  borderColor: '#D97706',
  classNames: ['license-event'],
  extendedProps: {
    licenseId: license.LIC_ID,
    licenseName: license.LIC_NAME,
    licenseState: license.LIC_STATE,
    licenseType: license.LIC_TYPE,
    licenseNumber: license.LIC_NO,
    fullText: license.LIC_FULL_TEXT,
    editable: false,
    isLicense: true
  }
}
```

## 🚀 How to Use

### Default Behavior
1. Navigate to calendar page: `http://localhost:3000/pages/calendar.html`
2. **Licenses automatically load and display** as amber events with 🔒 icon
3. Button shows as amber with "Hide Licenses" text

### Hide License Expirations
1. Click "Hide Licenses" button (amber button, top right)
2. All license events are removed from calendar
3. Button changes to white with "Show Licenses" text

### Show License Expirations (if hidden)
1. Click "Show Licenses" button (white button, top right)
2. License expirations appear as amber/orange events with 🔒 icon
3. Button changes to amber with "Hide Licenses" text

### View License Details
1. Click any license event (amber with 🔒)
2. Read-only modal opens showing:
   - License name, type, state
   - License number
   - Expiration date
   - Full license details
3. Click "Close" to dismiss modal

## 📊 Database

### LICENSES Table Structure
- `LIC_ID`: NUMBER(22) - Unique identifier
- `LIC_NAME`: VARCHAR2 - License holder name
- `LIC_STATE`: VARCHAR2 - State/jurisdiction
- `LIC_TYPE`: VARCHAR2 - Type of license
- `LIC_NO`: VARCHAR2 - License number
- `EXPIRATION_DATE`: DATE - When license expires
- `LIC_FULL_TEXT`: VARCHAR2 - Complete license information

**Total Licenses**: 41 records (as of implementation)

## ✅ Benefits

1. **Always Visible by Default**: Licenses load automatically so you never miss an expiration
2. **Easy Toggle**: One-click to hide if you need a cleaner view
3. **Visual Distinction**: Amber color makes licenses easy to spot among blue events
4. **Read-Only Protection**: Cannot accidentally edit license data from calendar
5. **Quick Reference**: View license details without leaving calendar
6. **Expiration Tracking**: See upcoming license expirations at a glance

## 🎯 Use Cases

1. **Renewal Planning**: See which licenses are expiring soon
2. **Compliance Management**: Track license expiration dates
3. **Meeting Scheduling**: Avoid scheduling over license expiration dates
4. **Team Awareness**: Share calendar with license expiration visibility
5. **Quick Lookup**: Click license to see full details

## 🔮 Future Enhancements (Optional)

- Add warning indicators for licenses expiring within 30/60/90 days
- Filter licenses by type (e.g., show only P.E. licenses)
- Add license renewal reminder emails
- Link to license management page
- Export license expiration report
- Add license expiration count badge on toggle button

## 📝 Notes

- **Licenses show by default** when calendar loads
- License events are always all-day events
- License data comes from `LICENSES` table (not editable from calendar)
- Toggle state does not persist (always shows on page reload)
- Licenses are ordered by expiration date
- Only licenses with non-null expiration dates are shown

---

**Implemented:** November 19, 2025  
**Feature Type:** Toggle Layer (Option C)  
**Database Table:** LICENSES  
**Total Licenses:** 41 records  
**Color Scheme:** Amber (#F59E0B) for licenses, Blue (#3B82F6) for events

