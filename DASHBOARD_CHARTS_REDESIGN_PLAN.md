# Dashboard Charts Redesign - Implementation Plan

## Requirements

### Charts Needed
1. **Line Graph** - Profit/Loss over time
2. **Pie Chart** - Payment method distribution

### Key Requirements
- ✅ Both charts must follow the applied date filter
- ✅ Responsive design for all screen sizes (mobile, tablet, desktop)
- ✅ Clean, professional appearance
- ✅ Real-time data from database

---

## Chart 1: Profit/Loss Line Graph

### Purpose
Show daily profit/loss trend over the selected date range

### Data Source
```typescript
// For each day in the date range:
Profit/Loss = Sales - Total Costs
Total Costs = Raw Materials + Petty Cash
```

### Database Query
```sql
-- Get daily sales
SELECT DATE(sale_date) as date, SUM(total_amount) as sales
FROM sales
WHERE store_id = ? 
  AND sale_date >= start_date 
  AND sale_date <= end_date
  AND status = 'completed'
GROUP BY DATE(sale_date)

-- Get daily costs (raw materials)
SELECT DATE(purchase_date) as date, SUM(total_cost) as costs
FROM raw_material_purchases
WHERE store_id = ?
  AND purchase_date >= start_date
  AND purchase_date <= end_date
GROUP BY DATE(purchase_date)

-- Get daily costs (petty cash)
SELECT given_date as date, SUM(amount) as costs
FROM petty_cash
WHERE store_id = ?
  AND given_date >= start_date
  AND given_date <= end_date
GROUP BY given_date
```

### Visual Design
```
┌────────────────────────────────────────────────────────────┐
│ Profit/Loss Trend                                          │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ₹500 ┤                                    ●               │
│       │                          ●                         │
│  ₹0   ┼─────────●────────────────────────────────────────  │
│       │                                                    │
│ -₹500 ┤    ●                                               │
│       │                                                    │
│       └────┬────┬────┬────┬────┬────┬────┬────┬────┬────  │
│          Oct28 Oct29 Oct30 Oct31 Nov1 Nov2 Nov3           │
│                                                            │
│  ● Profit: ₹1,200  ● Loss: -₹800  ● Break-even: 2 days   │
└────────────────────────────────────────────────────────────┘
```

### Features
- Green line for profit days
- Red line for loss days
- Dotted line at ₹0 (break-even)
- Hover to see exact values
- Summary stats below chart

---

## Chart 2: Payment Methods Pie Chart

### Purpose
Show distribution of payment methods used

### Data Source
```typescript
// Payment method breakdown
{
  cash: amount,
  upi: amount,
  card: amount,
  credit: amount
}
```

### Database Query
```sql
SELECT 
  payment_method,
  SUM(total_amount) as total,
  COUNT(*) as count
FROM sales
WHERE store_id = ?
  AND sale_date >= start_date
  AND sale_date <= end_date
  AND status = 'completed'
GROUP BY payment_method
```

### Visual Design
```
┌────────────────────────────────────────────────────────────┐
│ Payment Methods Distribution                               │
├────────────────────────────────────────────────────────────┤
│                                                            │
│              ╭─────────╮                                   │
│          ╭───┤  Cash   ├───╮                               │
│      ╭───┤   │  65%    │   ├───╮                           │
│  ╭───┤UPI│   ╰─────────╯   │Card├───╮                      │
│  │20%│   ╰───────────────────╯  15%│                       │
│  ╰───────────────────────────────────╯                     │
│                                                            │
│  ■ Cash: ₹1,950 (65%)  ■ UPI: ₹600 (20%)                 │
│  ■ Card: ₹450 (15%)    ■ Credit: ₹0 (0%)                 │
└────────────────────────────────────────────────────────────┘
```

### Features
- Color-coded segments
- Percentage labels
- Legend with amounts
- Hover to see details

---

## Layout Structure

### Desktop (1200px+)
```
┌──────────────────────────────────────────────────────────────┐
│ [Filter Controls]                                            │
├──────────────────────────────────────────────────────────────┤
│ [Cost Cards Row]                                             │
├──────────────────────────────────────────────────────────────┤
│ [Revenue & Net Row]                                          │
├──────────────────────────────────────────────────────────────┤
│ ┌────────────────────────┐ ┌────────────────────────────┐   │
│ │                        │ │                            │   │
│ │  Profit/Loss Line      │ │  Payment Methods Pie       │   │
│ │  Graph                 │ │  Chart                     │   │
│ │                        │ │                            │   │
│ └────────────────────────┘ └────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### Tablet (768px - 1199px)
```
┌──────────────────────────────────────────────────────────────┐
│ [Filter Controls]                                            │
├──────────────────────────────────────────────────────────────┤
│ [Cost Cards - 2 columns]                                     │
├──────────────────────────────────────────────────────────────┤
│ [Revenue & Net - 2 columns]                                  │
├──────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────┐   │
│ │  Profit/Loss Line Graph                                │   │
│ └────────────────────────────────────────────────────────┘   │
├──────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────┐   │
│ │  Payment Methods Pie Chart                             │   │
│ └────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### Mobile (< 768px)
```
┌──────────────────────────────────────────────────────────────┐
│ [Filter Controls - Stacked]                                  │
├──────────────────────────────────────────────────────────────┤
│ [Cost Cards - 1 column]                                      │
├──────────────────────────────────────────────────────────────┤
│ [Revenue & Net - 1 column]                                   │
├──────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────┐   │
│ │  Profit/Loss Line Graph                                │   │
│ └────────────────────────────────────────────────────────┘   │
├──────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────┐   │
│ │  Payment Methods Pie Chart                             │   │
│ └────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Step 1: Create RPC Function for Daily Profit/Loss
```sql
CREATE OR REPLACE FUNCTION get_daily_profit_loss(
  p_store_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  date DATE,
  sales NUMERIC,
  costs NUMERIC,
  profit_loss NUMERIC
)
```

### Step 2: Create Line Graph Component
- File: `src/components/charts/ProfitLossLineChart.tsx`
- Use SVG for custom rendering
- Responsive scaling
- Interactive tooltips

### Step 3: Create Pie Chart Component
- File: `src/components/charts/PaymentMethodsPieChart.tsx`
- Use SVG for custom rendering
- Animated segments
- Interactive legend

### Step 4: Update Dashboard
- Remove old charts
- Add new chart components
- Pass date filter to charts
- Update layout grid

### Step 5: Add Chart Utilities
- File: `src/utils/chartHelpers.ts`
- Color schemes
- Data formatting
- Responsive calculations

---

## Color Scheme

### Profit/Loss Line
- **Profit**: `#10b981` (green-500)
- **Loss**: `#ef4444` (red-500)
- **Break-even**: `#6b7280` (gray-500, dotted)
- **Grid**: `#e5e7eb` (gray-200)

### Payment Methods Pie
- **Cash**: `#3b82f6` (blue-500)
- **UPI**: `#8b5cf6` (purple-500)
- **Card**: `#f59e0b` (amber-500)
- **Credit**: `#ec4899` (pink-500)

---

## Data Flow

```
Dashboard Component
    ↓
[Apply Date Filter]
    ↓
Load Chart Data (parallel)
    ├→ get_daily_profit_loss RPC
    └→ get_payment_method_breakdown RPC
    ↓
Update Charts
    ├→ ProfitLossLineChart
    └→ PaymentMethodsPieChart
```

---

## Responsive Breakpoints

```typescript
const breakpoints = {
  mobile: '< 768px',
  tablet: '768px - 1199px',
  desktop: '≥ 1200px'
};

// Chart heights
const chartHeights = {
  mobile: '250px',
  tablet: '300px',
  desktop: '350px'
};
```

---

## Performance Considerations

1. **Data Caching**: Cache chart data for 30 seconds
2. **Lazy Loading**: Load charts after cards
3. **Debouncing**: Debounce filter changes
4. **Pagination**: Limit to 30 days of data points max
5. **Aggregation**: Use database-side aggregation

---

## Success Criteria

✅ Line graph shows daily profit/loss
✅ Pie chart shows payment distribution
✅ Both charts follow date filter
✅ Responsive on all devices
✅ Fast loading (< 1 second)
✅ Interactive tooltips
✅ Professional appearance
✅ Accurate calculations

---

## Files to Create

1. `src/components/charts/ProfitLossLineChart.tsx`
2. `src/components/charts/PaymentMethodsPieChart.tsx`
3. `src/utils/chartHelpers.ts`
4. Database migration for RPC function

## Files to Modify

1. `src/pages/dashboard/DashboardPage.tsx`

## Files to Remove

- None (keep old code commented for reference)

---

**Status**: PLAN READY
**Complexity**: Medium
**Estimated Time**: 2-3 hours
**Impact**: High (Better data visualization)
