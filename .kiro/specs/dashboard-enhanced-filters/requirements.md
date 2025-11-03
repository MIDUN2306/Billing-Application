# Dashboard Enhanced Date Filters - Requirements

## Introduction

This specification defines the enhanced date filtering system for the dashboard. The current implementation uses button-based quick filters with a modal for custom dates. The new system will provide more intuitive filtering options with inline date pickers and dropdown selectors for months and years.

## Glossary

- **Dashboard** - The main analytics page showing financial metrics
- **Date Filter** - UI component allowing users to select time periods
- **Quick Filter** - Predefined time period (e.g., Last 7 Days)
- **Month Selector** - Dropdown to select a specific month
- **Year Selector** - Dropdown to select a specific year
- **Custom Range** - User-defined start and end dates
- **Inline Picker** - Date input fields displayed directly on the page (not in modal)

## Requirements

### Requirement 1: Last 7 Days Quick Filter

**User Story:** As a business owner, I want to quickly view the last 7 days of data, so that I can see recent trends without selecting dates manually.

#### Acceptance Criteria

1. WHEN the dashboard loads, THE Dashboard SHALL display a "Last 7 Days" filter option
2. WHEN the user clicks "Last 7 Days", THE Dashboard SHALL load data from 7 days ago to today
3. WHEN the filter is applied, THE Dashboard SHALL highlight the "Last 7 Days" option as active
4. WHEN data is loaded, THE Dashboard SHALL display "Last 7 Days" as the current filter label
5. WHEN the filter is applied, THE Dashboard SHALL update all cards with 7-day totals within 2 seconds

### Requirement 2: Month Selector

**User Story:** As a business owner, I want to select a specific month from a dropdown, so that I can view monthly reports easily.

#### Acceptance Criteria

1. WHEN the dashboard loads, THE Dashboard SHALL display a month selector dropdown
2. WHEN the user clicks the month selector, THE Dashboard SHALL show a list of months (January to December)
3. WHEN the user selects a month, THE Dashboard SHALL load data for that entire month in the current year
4. WHEN a month is selected, THE Dashboard SHALL display the month name and year as the filter label
5. WHEN the selected month is in the future, THE Dashboard SHALL only load data up to today
6. WHEN the month selector is displayed, THE Dashboard SHALL show the current month as the default selection

### Requirement 3: Year Selector

**User Story:** As a business owner, I want to select a specific year from a dropdown, so that I can view annual reports.

#### Acceptance Criteria

1. WHEN the dashboard loads, THE Dashboard SHALL display a year selector dropdown
2. WHEN the user clicks the year selector, THE Dashboard SHALL show a list of years (current year and past 5 years)
3. WHEN the user selects a year, THE Dashboard SHALL load data for that entire year
4. WHEN a year is selected, THE Dashboard SHALL display the year as the filter label
5. WHEN the selected year is the current year, THE Dashboard SHALL only load data up to today
6. WHEN the year selector is displayed, THE Dashboard SHALL show the current year as the default selection

### Requirement 4: Inline Custom Date Range

**User Story:** As a business owner, I want to select custom start and end dates directly on the dashboard, so that I can quickly adjust date ranges without opening a modal.

#### Acceptance Criteria

1. WHEN the dashboard loads, THE Dashboard SHALL display "From" and "To" date input fields inline
2. WHEN the user clicks a date field, THE Dashboard SHALL show a native date picker
3. WHEN the user selects a start date, THE Dashboard SHALL validate that it is not in the future
4. WHEN the user selects an end date, THE Dashboard SHALL validate that it is after the start date
5. WHEN both dates are selected, THE Dashboard SHALL automatically load data for that range
6. WHEN invalid dates are entered, THE Dashboard SHALL display an error message below the fields
7. WHEN the date range exceeds 365 days, THE Dashboard SHALL display a warning message
8. WHEN dates are selected, THE Dashboard SHALL display the date range as the filter label

### Requirement 5: Filter Layout and Organization

**User Story:** As a business owner, I want all filter options organized clearly on the dashboard, so that I can easily find and use the filtering method I need.

#### Acceptance Criteria

1. WHEN the dashboard loads, THE Dashboard SHALL display all filter options in a single row
2. WHEN the screen width is less than 768px, THE Dashboard SHALL stack filter options vertically
3. WHEN a filter is active, THE Dashboard SHALL visually highlight that filter option
4. WHEN filters are displayed, THE Dashboard SHALL show them in this order: Last 7 Days, Month, Year, Custom Range
5. WHEN the user switches between filters, THE Dashboard SHALL clear the previous filter selection

### Requirement 6: Remove Old Filter System

**User Story:** As a business owner, I want a streamlined filtering experience, so that I'm not confused by multiple filtering methods.

#### Acceptance Criteria

1. WHEN the new filters are implemented, THE Dashboard SHALL remove the old button-based quick filters
2. WHEN the new filters are implemented, THE Dashboard SHALL remove the custom date modal
3. WHEN the new filters are implemented, THE Dashboard SHALL maintain all existing filter functionality
4. WHEN the new filters are implemented, THE Dashboard SHALL preserve the database-side filtering performance

### Requirement 7: Filter State and Labels

**User Story:** As a business owner, I want to see which filter is currently active, so that I know what data I'm viewing.

#### Acceptance Criteria

1. WHEN a filter is applied, THE Dashboard SHALL display "Showing data for: [Filter Description]"
2. WHEN Last 7 Days is active, THE Dashboard SHALL display "Showing data for: Last 7 Days"
3. WHEN a month is selected, THE Dashboard SHALL display "Showing data for: [Month] [Year]"
4. WHEN a year is selected, THE Dashboard SHALL display "Showing data for: [Year]"
5. WHEN custom dates are selected, THE Dashboard SHALL display "Showing data for: [Start Date] - [End Date]"

### Requirement 8: Data Accuracy and Performance

**User Story:** As a business owner, I want accurate data loaded quickly, so that I can make timely business decisions.

#### Acceptance Criteria

1. WHEN any filter is applied, THE Dashboard SHALL use the database RPC function for calculations
2. WHEN data is loading, THE Dashboard SHALL display a loading indicator
3. WHEN data is loaded, THE Dashboard SHALL update all cards with accurate totals
4. WHEN a filter is changed, THE Dashboard SHALL load new data within 2 seconds
5. WHEN an error occurs, THE Dashboard SHALL display an error message and retain previous data

## Filter Options Summary

| Filter Type | Input Method | Example |
|-------------|--------------|---------|
| Last 7 Days | Button/Link | "Last 7 Days" |
| Month | Dropdown | "November 2025" |
| Year | Dropdown | "2025" |
| Custom Range | Date Inputs | "Nov 1 - Nov 3, 2025" |

## UI Layout

```
┌────────────────────────────────────────────────────────────────┐
│ Dashboard                                        [Refresh]      │
│ Welcome back! Here's what's happening.                         │
├────────────────────────────────────────────────────────────────┤
│ Filters:                                                        │
│ [Last 7 Days] | Month: [November ▼] | Year: [2025 ▼]         │
│ Custom: From [📅 Nov 1] To [📅 Nov 3] [Apply]                │
│                                                                 │
│ Showing data for: Nov 1 - Nov 3, 2025                         │
└────────────────────────────────────────────────────────────────┘
```

## Success Criteria

✅ All 4 filter types implemented and working
✅ Inline date pickers (no modal)
✅ Month and year dropdowns functional
✅ Old filter system removed
✅ Database-side filtering maintained
✅ Performance remains excellent (< 2 seconds)
✅ Responsive on mobile devices
✅ Clear visual feedback for active filters
✅ Accurate data for all filter types

## Out of Scope

- Date range presets beyond Last 7 Days
- Comparison between two date ranges
- Saving filter preferences
- Exporting filtered data
- Multiple simultaneous filters

## Dependencies

- Existing database RPC function: `get_dashboard_stats_range`
- Existing date utility functions in `src/utils/dateFilters.ts`
- Dashboard component: `src/pages/dashboard/DashboardPage.tsx`

## Notes

- The new filter system should be more intuitive than the current button-based approach
- Inline date pickers reduce clicks and improve UX
- Month and year selectors make it easy to view specific periods
- All filtering remains database-side for performance
