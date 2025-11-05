# Sales vs Expenses Combined Bar Chart - Implementation Complete ✅

## Overview
A new comprehensive chart has been added to the dashboard that shows the overall financial performance by comparing sales revenue against total expenses (petty cash + raw materials purchases) with clear profit/loss indicators.

## Chart Features

### Visual Design
- **Two-Bar Comparison**: Side-by-side bars for each day
  - **Red Bar**: Total Expenses (Petty Cash + Raw Materials)
  - **Green Bar**: Total Sales Revenue
- **Profit/Loss Badge**: Prominent badge at the top showing net profit or loss
- **Responsive Design**: Works perfectly on mobile, tablet, and desktop
- **Hover Tooltips**: Detailed breakdown on hover
- **Summary Statistics**: Four key metrics below the chart

### Data Breakdown

#### Expenses Bar (Red)
Combines:
1. **Petty Cash**: All petty cash disbursements for the day
2. **Raw Materials Purchases**: All raw material purchase costs for the day

#### Sales Bar (Green)
- Total sales revenue from completed sales

#### Profit/Loss Calculation
```
Profit/Loss = Sales - (Petty Cash + Raw Materials)
```

## Implementation Details

### 1. New Component
**File**: `src/components/charts/SalesVsExpensesBarChart.tsx`

Features:
- Grouped bar chart with two bars per day
- Responsive SVG with proper scaling
- Color-coded bars (red for expenses, green for sales)
- Profit/Loss badge with icon
- Grid lines and axis labels
- Summary statistics section

### 2. Database Function
**Function**: `get_daily_sales_vs_expenses()`

Parameters:
- `p_store_id`: Store UUID
- `p_start_date`: Start date for the range
- `p_end_date`: End date for the range

Returns:
- `date`: Date of the data point
- `sales`: Total sales for that day
- `expenses`: Combined petty cash + raw materials
- `profit_loss`: Net profit or loss

### 3. Dashboard Integration
**File**: `src/pages/dashboard/DashboardPage.tsx`

Changes:
- Added `SalesVsExpensesData` interface
- Added state for sales vs expenses data
- Integrated data fetching in parallel with other charts
- Added full-width chart section below the existing charts

## Chart Layout

```
Dashboard Layout:
├── Date Filter
├── Cost Tracking Cards (3 columns)
├── Revenue & Profit Cards (2 columns)
├── Charts Section (2 columns)
│   ├── Profit/Loss Line Chart
│   └── Payment Methods Pie Chart
└── Sales vs Expenses Chart (Full Width) ← NEW!
```

## Summary Statistics

The chart displays four key metrics:

1. **Total Expenses**
   - Sum of all expenses in the period
   - Number of days tracked

2. **Total Sales**
   - Sum of all sales in the period
   - Number of days tracked

3. **Profit Days**
   - Count of days with positive profit

4. **Loss Days**
   - Count of days with losses

## Responsive Behavior

### Desktop (1200px+)
- Full-width chart with optimal spacing
- All labels visible
- Large bars for easy comparison

### Tablet (768px - 1199px)
- Adjusted bar widths
- Maintained readability
- Summary stats in 2x2 grid

### Mobile (<768px)
- Horizontal scroll for chart
- Summary stats in 2x2 grid
- Touch-friendly tooltips

## Color Scheme

- **Expenses**: `#ef4444` (red-500)
- **Sales**: `#10b981` (green-500)
- **Profit Badge**: Green background with green text
- **Loss Badge**: Red background with red text
- **Grid Lines**: `#e5e7eb` (gray-200)
- **Text**: `#6b7280` (gray-500)

## Usage Example

The chart automatically loads when:
1. User navigates to the dashboard
2. User changes the date filter
3. User clicks the refresh button
4. User returns to the tab (visibility change)

## Data Flow

```
Dashboard Page
    ↓
Fetch Data (Parallel)
    ├── get_daily_profit_loss()
    ├── Payment methods query
    └── get_daily_sales_vs_expenses() ← NEW
    ↓
Update State
    ↓
Render Charts
    ├── ProfitLossLineChart
    ├── PaymentMethodsPieChart
    └── SalesVsExpensesBarChart ← NEW
```

## Benefits

1. **Clear Financial Overview**: See at a glance if you're making profit or loss
2. **Expense Tracking**: Understand your daily expense patterns
3. **Revenue Comparison**: Compare sales against costs directly
4. **Trend Analysis**: Identify profitable and loss-making days
5. **Decision Making**: Make informed decisions about pricing and costs

## Testing Checklist

- [x] Chart renders correctly with data
- [x] Chart shows "No data" message when empty
- [x] Loading state displays properly
- [x] Responsive on all screen sizes
- [x] Tooltips show correct information
- [x] Summary statistics calculate correctly
- [x] Profit/Loss badge shows correct value and color
- [x] Date filter updates chart data
- [x] Refresh button updates chart
- [x] Database function returns correct data

## Future Enhancements (Optional)

1. Click on bars to see detailed breakdown
2. Export chart as image
3. Add comparison with previous period
4. Show average profit/loss line
5. Add expense category breakdown in tooltip

## Files Modified

1. ✅ `src/components/charts/SalesVsExpensesBarChart.tsx` (NEW)
2. ✅ `src/pages/dashboard/DashboardPage.tsx` (UPDATED)
3. ✅ Database migration: `add_daily_sales_vs_expenses_function` (NEW)

## Conclusion

The Sales vs Expenses chart provides a comprehensive view of your business's financial health, making it easy to identify profitable days and understand the relationship between your sales and expenses. The chart is fully responsive, visually appealing, and integrates seamlessly with the existing dashboard.

---
**Status**: ✅ Complete and Ready for Use
**Date**: November 5, 2025
