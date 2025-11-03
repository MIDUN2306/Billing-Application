# Dashboard Enhanced Date Filters - Design

## Overview

This design document outlines the implementation of an enhanced date filtering system for the dashboard. The new system replaces button-based quick filters with a more intuitive combination of dropdowns and inline date pickers.

## Architecture

### Component Structure

```
DashboardPage
├── Header (Title + Refresh)
├── EnhancedDateFilter (NEW)
│   ├── Last 7 Days Link
│   ├── Month Dropdown
│   ├── Year Dropdown
│   └── Custom Date Inputs (From/To)
├── Filter Label Display
├── Dashboard Cards
└── Modals
```

### Data Flow

```
User selects filter
      ↓
Update filter state
      ↓
Calculate date range
      ↓
Call RPC: get_dashboard_stats_range(store_id, start_date, end_date)
      ↓
Update dashboard cards
      ↓
Update filter label
```

## Components and Interfaces

### 1. EnhancedDateFilter Component

**File**: `src/components/EnhancedDateFilter.tsx`

**Props**:
```typescript
interface Props {
  currentFilter: DateFilter;
  onFilterChange: (filter: DateFilter) => void;
}
```

**State**:
```typescript
const [filterType, setFilterType] = useState<'7days' | 'month' | 'year' | 'custom'>('7days');
const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
const [customStart, setCustomStart] = useState<string>('');
const [customEnd, setCustomEnd] = useState<string>('');
const [error, setError] = useState<string>('');
```

**Layout**:
```tsx
<div className="space-y-3">
  {/* Filter Options Row */}
  <div className="flex flex-wrap items-center gap-4">
    {/* Last 7 Days */}
    <button onClick={handleLast7Days}>Last 7 Days</button>
    
    {/* Month Selector */}
    <div className="flex items-center gap-2">
      <label>Month:</label>
      <select value={selectedMonth} onChange={handleMonthChange}>
        <option value={0}>January</option>
        <option value={1}>February</option>
        {/* ... all months */}
      </select>
    </div>
    
    {/* Year Selector */}
    <div className="flex items-center gap-2">
      <label>Year:</label>
      <select value={selectedYear} onChange={handleYearChange}>
        <option value={2025}>2025</option>
        <option value={2024}>2024</option>
        {/* ... past 5 years */}
      </select>
    </div>
    
    {/* Custom Date Range */}
    <div className="flex items-center gap-2">
      <label>From:</label>
      <input type="date" value={customStart} onChange={handleStartChange} />
      <label>To:</label>
      <input type="date" value={customEnd} onChange={handleEndChange} />
      <button onClick={handleApplyCustom}>Apply</button>
    </div>
  </div>
  
  {/* Error Message */}
  {error && <div className="error">{error}</div>}
  
  {/* Current Filter Label */}
  <div className="text-sm">
    Showing data for: <strong>{currentFilter.label}</strong>
  </div>
</div>
```

### 2. Updated Date Utilities

**File**: `src/utils/dateFilters.ts`

**New Functions**:
```typescript
// Get date range for specific month and year
export function getMonthRange(month: number, year: number): DateRange {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const today = new Date();
  
  // If month is current month, end date is today
  const endDate = (year === today.getFullYear() && month === today.getMonth())
    ? today
    : lastDay;
  
  return {
    startDate: firstDay.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  };
}

// Get date range for specific year
export function getYearRange(year: number): DateRange {
  const firstDay = new Date(year, 0, 1);
  const lastDay = new Date(year, 11, 31);
  const today = new Date();
  
  // If year is current year, end date is today
  const endDate = (year === today.getFullYear())
    ? today
    : lastDay;
  
  return {
    startDate: firstDay.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  };
}

// Get available years (current year + past 5 years)
export function getAvailableYears(): number[] {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 6 }, (_, i) => currentYear - i);
}

// Get month name
export function getMonthName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month];
}
```

### 3. Filter Type Updates

**Updated FilterType**:
```typescript
export type FilterType = '7days' | 'month' | 'year' | 'custom';
```

**Removed**:
- 'today'
- 'yesterday'
- '30days'
- 'thisMonth'
- 'lastMonth'

## Data Models

### DateFilter Interface
```typescript
export interface DateFilter {
  type: FilterType;
  startDate: string;  // YYYY-MM-DD
  endDate: string;    // YYYY-MM-DD
  label: string;      // Display label
  month?: number;     // 0-11 (for month filter)
  year?: number;      // YYYY (for month/year filter)
}
```

## UI Design Specifications

### Filter Bar Layout

**Desktop (> 1024px)**:
```
┌────────────────────────────────────────────────────────────────────────┐
│ [Last 7 Days] | Month: [November ▼] | Year: [2025 ▼] |                │
│ Custom: From [📅 Nov 1] To [📅 Nov 3] [Apply]                        │
└────────────────────────────────────────────────────────────────────────┘
```

**Tablet (768px - 1024px)**:
```
┌────────────────────────────────────────────────────────────────────────┐
│ [Last 7 Days] | Month: [November ▼] | Year: [2025 ▼]                 │
│ Custom: From [📅 Nov 1] To [📅 Nov 3] [Apply]                        │
└────────────────────────────────────────────────────────────────────────┘
```

**Mobile (< 768px)**:
```
┌────────────────────────────────────────┐
│ [Last 7 Days]                          │
│ Month: [November ▼]                    │
│ Year: [2025 ▼]                         │
│ From: [📅 Nov 1]                       │
│ To: [📅 Nov 3]                         │
│ [Apply]                                │
└────────────────────────────────────────┘
```

### Visual States

**Last 7 Days Button**:
- Active: Blue background, white text
- Inactive: White background, gray text, border
- Hover: Light gray background

**Dropdowns**:
- Default: White background, border
- Focus: Blue border, ring
- Disabled: Gray background

**Date Inputs**:
- Default: White background, border
- Focus: Blue border, ring
- Error: Red border
- Disabled: Gray background

**Apply Button**:
- Enabled: Primary color, clickable
- Disabled: Gray, not clickable
- Loading: Spinner icon

### Color Scheme

```css
Active Filter: bg-primary-600 text-white
Inactive Filter: bg-white text-gray-700 border-gray-300
Hover: bg-gray-50
Error: border-red-500 text-red-600
Success: border-green-500
```

## Behavior Specifications

### Filter Interactions

**Last 7 Days**:
1. Click button
2. Calculate: today - 6 days to today
3. Load data immediately
4. Highlight button as active
5. Clear other filter selections

**Month Selector**:
1. Click dropdown
2. Select month
3. Calculate: first day of month to last day (or today if current month)
4. Load data immediately
5. Update label: "November 2025"
6. Clear other filter selections

**Year Selector**:
1. Click dropdown
2. Select year
3. Calculate: Jan 1 to Dec 31 (or today if current year)
4. Load data immediately
5. Update label: "2025"
6. Clear other filter selections

**Custom Range**:
1. Select start date
2. Select end date
3. Validate dates
4. Click Apply button
5. Load data
6. Update label: "Nov 1 - Nov 3, 2025"
7. Clear other filter selections

### Validation Rules

**Start Date**:
- Cannot be in the future
- Must be before end date
- Required for custom range

**End Date**:
- Cannot be in the future
- Must be after start date
- Required for custom range

**Date Range**:
- Maximum: 365 days
- Minimum: 1 day

**Error Messages**:
- "Start date cannot be in the future"
- "End date cannot be in the future"
- "Start date must be before end date"
- "Date range cannot exceed 365 days"
- "Please select both start and end dates"

## Error Handling

### Network Errors
```typescript
try {
  const result = await supabase.rpc('get_dashboard_stats_range', {...});
  if (result.error) throw result.error;
} catch (error) {
  toast.error('Failed to load dashboard data');
  console.error(error);
  // Keep previous data displayed
}
```

### Validation Errors
```typescript
if (startDate > endDate) {
  setError('Start date must be before end date');
  return;
}
```

## Testing Strategy

### Unit Tests
- Date range calculations
- Validation logic
- Month/year range calculations
- Label formatting

### Integration Tests
- Filter changes update dashboard
- RPC function called with correct parameters
- Cards display correct data
- Labels update correctly

### E2E Tests
- User selects Last 7 Days → Data loads
- User selects month → Data loads
- User selects year → Data loads
- User enters custom dates → Data loads
- Invalid dates → Error shown

## Performance Considerations

### Optimization Strategies
1. **Debounce Custom Dates** - Wait 500ms after user stops typing
2. **Cache Results** - Store recent filter results
3. **Lazy Load** - Only load visible data
4. **Database Indexes** - Ensure date columns are indexed

### Expected Performance
- Filter change: < 500ms
- Data load: < 2 seconds
- UI update: < 100ms
- Total: < 3 seconds

## Migration from Old System

### Removed Components
- ❌ Old DateFilter component with button grid
- ❌ Custom date modal
- ❌ Quick filter buttons (Today, Yesterday, 30 Days, etc.)

### Preserved Functionality
- ✅ Database-side filtering
- ✅ Date validation
- ✅ Filter state management
- ✅ Label display
- ✅ Performance optimization

### New Components
- ✅ EnhancedDateFilter component
- ✅ Month dropdown
- ✅ Year dropdown
- ✅ Inline date pickers
- ✅ Last 7 Days quick link

## Accessibility

- All dropdowns keyboard navigable
- Date inputs support keyboard entry
- Clear focus indicators
- Screen reader labels
- Error messages announced

## Responsive Design

### Breakpoints
- Mobile: < 768px (stack vertically)
- Tablet: 768px - 1024px (2 rows)
- Desktop: > 1024px (single row)

### Mobile Optimizations
- Full-width inputs
- Larger touch targets
- Simplified layout
- Native date pickers

## Summary

The enhanced date filter system provides:
- **Simpler UX** - Fewer clicks, more intuitive
- **Better Organization** - Clear filter options
- **Inline Editing** - No modals needed
- **Flexible Selection** - Month, year, or custom range
- **Fast Performance** - Database-side filtering
- **Responsive** - Works on all devices

This design maintains all existing functionality while significantly improving the user experience.
