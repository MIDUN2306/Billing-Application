# Dashboard Financial Flow Update

## Overview
Updated the dashboard to accurately reflect the complete financial flow of the business, including all costs (money OUT) and revenue (money IN).

## Financial Flow Analysis

### MONEY IN (Revenue) 💰
1. **Sales** - Revenue from selling products (tea, coffee, etc.)

### MONEY OUT (Costs) 💸
1. **Raw Materials** - Purchases of milk, tea powder, sugar, etc. (from `raw_material_purchases` table)
2. **Petty Cash** - Small cash disbursements to employees/vendors (from `petty_cash` table)
3. **Expenses** - Business expenses like rent, utilities, salaries, maintenance (from `expenses` table)

### NEUTRAL (Inventory) 📦
1. **Purchases** - Finished product inventory purchases (not a direct cost, but inventory investment)

## Dashboard Changes

### Top Row - Main Metrics
1. **Today's Sales** (Green) - Total revenue IN
2. **Total Costs Today** (Red) - Sum of all costs OUT (Raw Materials + Petty Cash + Expenses)
3. **Pending Payments** (Yellow) - Outstanding customer payments
4. **Low Stock Items** (Red) - Products with low inventory

### Second Row - Cost Breakdown
Shows detailed breakdown of where money is going:

1. **Raw Materials** (Orange)
   - Today's raw material purchases
   - Milk, tea powder, sugar, etc.
   - Icon: Milk bottle

2. **Petty Cash** (Purple)
   - Today's petty cash disbursements
   - Small cash given to employees/vendors
   - Icon: Wallet

3. **Expenses** (Blue)
   - Today's business expenses
   - Rent, utilities, salaries, etc.
   - Icon: Dollar sign

4. **Purchases** (Gray)
   - Today's finished product purchases
   - Inventory investment (not direct cost)
   - Icon: Package

### Quick Stats Section
- **Total Products** - Count of active products
- **Net Today** - Profit/Loss calculation
  - Formula: Today's Sales - Total Costs Today
  - Green if positive (profit)
  - Red if negative (loss)

## Database Updates

### Updated Function: `get_dashboard_stats`
Added new fields to the dashboard stats function:

```sql
- today_raw_materials: Sum of raw material purchases today
- today_petty_cash: Sum of petty cash given today
- total_costs_today: Sum of all costs (expenses + raw materials + petty cash)
```

## Visual Indicators

### Color Coding
- **Green** - Revenue/Income (Sales)
- **Red** - Total Costs/Expenses
- **Orange** - Raw Materials Cost
- **Purple** - Petty Cash Cost
- **Blue** - Business Expenses
- **Gray** - Inventory Purchases
- **Yellow** - Pending Payments

### Icons
- 📈 TrendingUp - Sales (money coming in)
- 📉 TrendingDown - Costs (money going out)
- 🥛 Milk - Raw Materials
- 👛 Wallet - Petty Cash
- 💵 DollarSign - Expenses
- 📦 Package - Inventory

## Benefits

1. **Complete Financial Picture** - See all money flows at a glance
2. **Cost Breakdown** - Understand where money is being spent
3. **Net Profit Visibility** - Quickly see if the day is profitable
4. **Better Decision Making** - Identify high-cost areas
5. **Accurate Tracking** - All cost categories properly tracked

## Example Dashboard View

```
Top Row:
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│ Today's Sales   │ Total Costs     │ Pending         │ Low Stock       │
│ ₹5,000 (Green)  │ ₹3,200 (Red)    │ ₹1,500          │ 3 items         │
│ Revenue IN      │ Money OUT       │                 │                 │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘

Cost Breakdown:
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│ Raw Materials   │ Petty Cash      │ Expenses        │ Purchases       │
│ ₹2,000 (Orange) │ ₹500 (Purple)   │ ₹700 (Blue)     │ ₹0 (Gray)       │
│ Today's Cost    │ Today's Cost    │ Today's Cost    │ Inventory       │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘

Quick Stats:
- Total Products: 15
- Net Today: ₹1,800 (Green - Profit!)
```

## Technical Implementation

### Files Modified
1. **Database Migration**: `update_dashboard_stats_with_raw_materials_and_petty_cash`
2. **Frontend**: `src/pages/dashboard/DashboardPage.tsx`

### New Data Points
- `today_raw_materials` - Raw material purchases for today
- `today_petty_cash` - Petty cash disbursements for today
- `total_costs_today` - Sum of all costs (expenses + raw materials + petty cash)

### Calculation Logic
```typescript
Total Costs Today = Raw Materials + Petty Cash + Expenses
Net Today = Today's Sales - Total Costs Today
```

## Future Enhancements (Optional)
- Add weekly/monthly cost trends
- Cost category percentage breakdown
- Profit margin calculations
- Cost vs Revenue charts
- Budget vs Actual comparisons
- Cost alerts when exceeding thresholds
