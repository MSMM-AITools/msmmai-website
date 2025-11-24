# Timezone Issue Fix - Calendar Dates

## 🐛 Problem
When editing an existing calendar event without changing the date, the event would shift to the previous day after saving.

## 🔍 Root Cause
**Timezone conversion mismatch:**

1. **Loading dates into form**: Date was parsed in local timezone
2. **Saving dates**: Date was converted to UTC via `.toISOString()`
3. **Result**: Each save/load cycle shifted the date backward

### Example of the Bug:
```javascript
// Event stored in DB: 2025-11-19 00:00:00 UTC
// Loaded into form (EST = UTC-5): Shows as 2025-11-18 19:00:00
// Saved back to DB: 2025-11-18 19:00:00 → converted to UTC → 2025-11-19 00:00:00
// BUT if user didn't change it: Form shows 2025-11-18, saves as 2025-11-18 00:00:00 UTC
// Now event is ONE DAY EARLIER! 😱
```

## ✅ Solution

### 1. Fixed `saveEvent()` in `js/calendar.js`
**Before:**
```javascript
const eventData = {
    START_DATE: new Date(start).toISOString(),
    END_DATE: new Date(end).toISOString(),
    // ...
};
```

**After:**
```javascript
let startDate, endDate;

if (allDay) {
    // For all-day events, append time without timezone conversion
    startDate = start + 'T00:00:00';  // e.g., "2025-11-19T00:00:00"
    endDate = end + 'T00:00:00';
} else {
    // For timed events, use ISO with timezone
    startDate = new Date(start).toISOString();
    endDate = new Date(end).toISOString();
}

const eventData = {
    START_DATE: startDate,
    END_DATE: endDate,
    // ...
};
```

### 2. Fixed `formatDateForInput()` in `js/calendar.js`
**Before:**
```javascript
function formatDateForInput(date, dateOnly = false) {
    const d = new Date(date);
    const year = d.getFullYear();        // Uses LOCAL timezone
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    // ...
}
```

**After:**
```javascript
function formatDateForInput(date, dateOnly = false) {
    const d = typeof date === 'string' ? new Date(date) : date;
    
    if (dateOnly) {
        // For date-only inputs, use UTC to avoid timezone shifts
        const year = d.getUTCFullYear();
        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
        const day = String(d.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    } else {
        // For datetime inputs, use local time (correct behavior)
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }
}
```

## 🎯 Key Changes

1. **All-Day Events**: Now use date strings with `T00:00:00` appended, avoiding timezone conversion entirely
2. **Timed Events**: Continue to use proper timezone conversion (this is correct behavior)
3. **Loading Dates**: Use `getUTC*()` methods for date-only fields to match how they're saved

## ✅ Result
- ✅ All-day events stay on the correct day when edited
- ✅ Timed events maintain correct time when edited
- ✅ No more phantom date shifts
- ✅ Consistent behavior across timezones

## 🧪 Testing Checklist
- [x] Edit all-day event without changing date → stays on same day ✅
- [x] Edit all-day event and change date → updates correctly ✅
- [x] Edit timed event without changing time → stays at same time ✅
- [x] Edit timed event and change time → updates correctly ✅
- [x] Create new all-day event → appears on correct day ✅
- [x] Create new timed event → appears at correct time ✅

---

**Fixed:** November 19, 2025  
**Issue:** Timezone conversion causing date shifts  
**Files Modified:**
- `js/calendar.js` - `saveEvent()` function
- `js/calendar.js` - `formatDateForInput()` function

