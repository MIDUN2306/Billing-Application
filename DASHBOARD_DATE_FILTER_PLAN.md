# Dashboard Date Filter Implementation Plan

## Current State Analysis

### Current Dashboard
- Shows **TODAY's data only**
- No date filtering options
- Fixed to current date
- All cards show today's metrics

### Current Data Queries
```typescript
// All queries filter by today
.eq('given_date', new Date().toISOString().split('T')[0])
.gte('purchase_date', today)
.lte('purchase_date', today + 'T23:59:59')
```

## Requirements

### Filter Options Needed
1. **Quick Filters** (Buttons)
   - Today
   - Yesterday
   - Last 7 Days
   - Last 30 Days
   - This Month
   - Last Month

2. **Custom Date Range** (Date Pickers)
   - From Date
   - To Date
   - Apply button

## Implementation Plan

### Phase 1: UI Components

#### 1.1 Filter Bar Design
```
┌────────────────────────────────────────────────────────────────┐
│ Dashboard                                        [Refresh]      │
│ Welcome back! Here's what's happening.                         │
├────────────────────────────────────────────────────────────────┤
│ [Today] [Yesterday] [7 Days] [30 Days] [This Month] [Custom▼] │
│                                                                 │
│ Custom Range: [From: ____] [To: ____] [Apply]                 │
└────────────────────────────────────────────────────────────────┘
```

#### 1.2 Filter State Management
```typescript
interface DateFilter {
  type: 'today' | 'yesterday' | '7days' | '30days' | 'thisMonth' | 'lastMonth' | 'custom';
  startDate: string;
  endDate: string;
  label: string;
}
```

### Phase 2: Date Calculation Functions

#### 2.1 Helper Functions
```typescript
// Get date range based on filter type
function getDateRange(filterType: string): { start: string, end: string }

// Calculate dates
- Today: start = today, end = today
- Yesterday: start = yesterday, end = yesterday
- 7 Days: start = today - 7, end = today
- 30 Days: start = today - 30, end = today
- This Month: start = first day of month, end = today
- Last Month: start = first day of last month, end = last day of last month
- Custom: user selected dates
```

### Phase 3: Query Updates

#### 3.1 Update All Data Queries
```typescript
// Before (hardcoded today)
.eq('given_date', today)

// After (dynamic date range)
.gte('given_date', startDate)
.lte('given_date', endDate)
```

#### 3.2 Affected Queries
- Dashboard stats RPC
- Raw materials purchases
- Petty cash records
- Expenses
- Sales data
- Charts (7 days sales)
- Top products
- Payment methods

### Phase 4: UI Updates

#### 4.1 Card Labels
```typescript
// Before
"Today's Sales"
"Today's Cost"

// After (dynamic)
"Sales (Nov 1-3)"
"Cost (Last 7 Days)"
"Sales (This Month)"
```

#### 4.2 Modal Titles
```typescript
// Before
"Today's purchases"

// After
"Purchases (Nov 1-3, 2025)"
"Purchases (Last 7 Days)"
```

### Phase 5: Performance Optimization

#### 5.1 Caching Strategy
- Cache filter results
- Avoid redundant queries
- Debounce custom date changes

#### 5.2 Loading States
- Show loading during filter change
- Smooth transitions
- Preserve scroll position

## Detailed Implementation Steps

### Step 1: Create Date Filter Component
**File**: `src/components/DateFilter.tsx`

**Features**:
- Quick filter buttons
- Custom date range picker
- Active state highlighting
- Responsive design

### Step 2: Create Date Utility Functions
**File**: `src/utils/dateFilters.ts`

**Functions**:
```typescript
export function getDateRange(filterType: FilterType): DateRange
export function formatDateLabel(filterType: FilterType, start: string, end: string): string
export function isToday(date: string): boolean
export function getMonthRange(monthOffset: number): DateRange
```

### Step 3: Update Dashboard State
**File**: `src/pages/dashboard/DashboardPage.tsx`

**New State**:
```typescript
const [dateFilter, setDateFilter] = useState<DateFilter>({
  type: 'today',
  startDate: getTodayDate(),
  endDate: getTodayDate(),
  label: 'Today'
});
```

### Step 4: Update All Queries
**Files**:
- `src/pages/dashboard/DashboardPage.tsx`
- `src/pages/dashboard/RawMaterialsDetailsModal.tsx`
- `src/pages/dashboard/PettyCashDetailsModal.tsx`
- `src/pages/dashboard/TotalCostsDetailsModal.tsx`

**Changes**:
- Replace hardcoded `today` with `dateFilter.startDate` and `dateFilter.endDate`
- Update all date comparisons
- Pass date filter to modals

### Step 5: Update RPC Functions (if needed)
**Database**: Check if RPC functions need date range parameters

**Functions to check**:
- `get_dashboard_stats`
- `get_last_7_days_sales`
- `get_top_selling_products`
- `get_payment_method_breakdown`

### Step 6: Update UI Labels
**Dynamic Labels**:
```typescript
// Card titles
{dateFilter.label} Sales
{dateFilter.label} Costs

// Modal titles
Purchases ({dateFilter.label})
Petty Cash ({dateFilter.label})
```

### Step 7: Add Filter Persistence
**LocalStorage**:
```typescript
// Save filter preference
localStorage.setItem('dashboardFilter', JSON.stringify(dateFilter));

// Load on mount
const savedFilter = localStorage.getItem('dashboardFilter');
```

## UI Design Specifications

### Filter Buttons
```css
Active: bg-primary-600 text-white
Inactive: bg-white text-gray-700 border
Hover: bg-gray-50
```

### Custom Date Picker
```
┌─────────────────────────────────────┐
│ Custom Date Range                   │
├─────────────────────────────────────┤
│ From: [📅 Nov 1, 2025]             │
│ To:   [📅 Nov 3, 2025]             │
│                                     │
│           [Cancel] [Apply]          │
└─────────────────────────────────────┘
```

### Responsive Behavior
- **Desktop**: All filters in one row
- **Tablet**: Wrap to 2 rows
- **Mobile**: Stack vertically

## Data Flow

### Filter Change Flow
```
User clicks filter
      ↓
Update dateFilter state
      ↓
Trigger loadDashboardStats(dateFilter)
      ↓
Update all queries with new date range
      ↓
Fetch new data
      ↓
Update UI with new data
      ↓
Update labels with filter info
```

### Custom Date Flow
```
User clicks "Custom"
      ↓
Show date picker modal
      ↓
User selects dates
      ↓
User clicks "Apply"
      ↓
Validate date range
      ↓
Update dateFilter state
      ↓
Fetch new data
```

## Validation Rules

### Date Range Validation
1. Start date cannot be after end date
2. Date range cannot exceed 1 year
3. Dates cannot be in the future
4. Both dates must be selected

### Error Messages
```typescript
"Start date must be before end date"
"Date range cannot exceed 365 days"
"Future dates are not allowed"
"Please select both dates"
```

## Performance Considerations

### Query Optimization
- Use indexed date columns
- Limit data fetch to necessary fields
- Implement pagination for large ranges
- Cache frequently used ranges

### UI Performance
- Debounce custom date input (500ms)
- Show loading states
- Prevent multiple simultaneous queries
- Smooth transitions

## Testing Checklist

### Functional Tests
- [ ] Today filter works
- [ ] Yesterday filter works
- [ ] 7 days filter works
- [ ] 30 days filter works
- [ ] This month filter works
- [ ] Last month filter works
- [ ] Custom date range works
- [ ] Date validation works
- [ ] All cards update correctly
- [ ] All modals update correctly
- [ ] Charts update correctly

### Edge Cases
- [ ] No data for selected range
- [ ] Very large date range (1 year)
- [ ] Single day range
- [ ] Month boundaries
- [ ] Year boundaries
- [ ] Leap year dates

### UI Tests
- [ ] Responsive on mobile
- [ ] Responsive on tablet
- [ ] Active state highlighting
- [ ] Loading states
- [ ] Error messages
- [ ] Date picker functionality

## Implementation Priority

### Phase 1 (Essential) - Day 1
1. Create DateFilter component
2. Add quick filters (Today, 7 Days, 30 Days)
3. Update dashboard queries
4. Update card labels

### Phase 2 (Important) - Day 2
5. Add custom date range
6. Update modal queries
7. Add date validation
8. Update chart queries

### Phase 3 (Nice to Have) - Day 3
9. Add filter persistence
10. Add loading states
11. Optimize performance
12. Add animations

## Files to Create

1. `src/components/DateFilter.tsx` - Filter UI component
2. `src/utils/dateFilters.ts` - Date calculation utilities
3. `src/components/CustomDateRangeModal.tsx` - Custom date picker

## Files to Modify

1. `src/pages/dashboard/DashboardPage.tsx` - Add filter state and logic
2. `src/pages/dashboard/RawMaterialsDetailsModal.tsx` - Accept date filter
3. `src/pages/dashboard/PettyCashDetailsModal.tsx` - Accept date filter
4. `src/pages/dashboard/TotalCostsDetailsModal.tsx` - Accept date filter

## Expected Outcome

### Before
```
Dashboard (Today Only)
- Shows only today's data
- No flexibility
- Limited insights
```

### After
```
Dashboard (Flexible Date Filtering)
- View any date range
- Compare periods
- Better insights
- Historical analysis
```

## Success Criteria

✅ Users can filter by predefined ranges
✅ Users can select custom date ranges
✅ All data updates correctly
✅ Performance remains excellent
✅ UI is intuitive and responsive
✅ Date validation works properly
✅ Labels update dynamically

## Next Steps

1. Review and approve plan
2. Create date filter component
3. Implement date utilities
4. Update dashboard queries
5. Test thoroughly
6. Deploy

---

**Status**: PLAN READY FOR IMPLEMENTATION
**Estimated Time**: 2-3 days
**Complexity**: Medium
**Impact**: High (Better insights and flexibility)
