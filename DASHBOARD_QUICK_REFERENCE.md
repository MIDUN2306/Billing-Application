# Dashboard Quick Reference

## Card Purpose Summary

### Primary Row (Clickable Cost Cards)

| Card | Color | Purpose | Clickable | Shows |
|------|-------|---------|-----------|-------|
| 🥛 Raw Materials | Orange | Track daily raw material purchases | ✅ Yes | Purchase logs with supplier, quantity, costs |
| 📉 Total Costs | Red | See all expenses combined | ✅ Yes | Breakdown of all cost categories |
| 💰 Petty Cash | Purple | Track daily petty cash given | ✅ Yes | Records of cash given with purpose |
| 📦 Purchases | Gray | Track inventory purchases | ❌ No | Info only (not a cost) |

### Secondary Row (Info Cards)

| Card | Color | Purpose | Shows |
|------|-------|---------|-------|
| 📈 Today's Sales | Green | Revenue coming in | Total sales amount |
| 💵 Net Today | Green/Red | Profit or loss | Sales - Total Costs |
| 💳 Pending Payments | Yellow | Outstanding payments | Customer balances |
| ⚠️ Low Stock | Red | Inventory alerts | Count of low stock items |

## Modal Details

### Raw Materials Modal
**Triggered by:** Click orange Raw Materials card
**Shows:** Table with columns:
- Raw Material name
- Quantity (with unit)
- Purchase Price
- Total Cost
- Time of purchase

**Footer:** Total cost sum

### Petty Cash Modal
**Triggered by:** Click purple Petty Cash card
**Shows:** Table with columns:
- Recipient Name (person name)
- Purpose
- Amount
- Notes
- Time given

**Footer:** Total amount sum

### Total Costs Modal
**Triggered by:** Click red Total Costs card
**Shows:** 
1. Three summary cards (Raw Materials, Petty Cash, Expenses)
2. Detailed tables for each category
3. Grand total card at bottom

**Each table shows:**
- Description
- Amount
- Time

## Data Flow

```
Database Tables          Dashboard Cards          Modals
─────────────────       ─────────────────       ──────────────────
raw_material_purchases → Raw Materials Card  →  Raw Materials Modal
petty_cash            → Petty Cash Card    →  Petty Cash Modal
expenses              → (included in Total) →  Total Costs Modal
                      ↓
                      Total Costs Card     →  Total Costs Modal
```

## Performance Limits

- Dashboard stats: Aggregated (no limit needed)
- Modal queries: 100 records max per category
- Date filter: Today only
- Charts: Fixed ranges (7 days, 30 days)

## Color Coding

| Color | Hex | Usage |
|-------|-----|-------|
| Orange | #f97316 | Raw Materials |
| Red | #ef4444 | Total Costs, Alerts |
| Purple | #a855f7 | Petty Cash |
| Gray | #6b7280 | Purchases (info) |
| Green | #10b981 | Sales, Profit |
| Yellow | #eab308 | Warnings |
| Blue | #3b82f6 | Expenses |

## Key Features

✅ Only essential cards shown
✅ Clear visual hierarchy
✅ Clickable cards with hover effects
✅ Well-formatted tables
✅ Performance optimized
✅ Responsive design
✅ Loading states
✅ Empty states
✅ Consistent theming

## User Actions

1. **View Dashboard** → See all cards with today's data
2. **Click Orange Card** → See raw material purchases
3. **Click Red Card** → See complete cost breakdown
4. **Click Purple Card** → See petty cash records
5. **Click Refresh** → Reload all data

## Files Structure

```
src/pages/dashboard/
├── DashboardPage.tsx              (Main dashboard)
├── RawMaterialsDetailsModal.tsx   (Raw materials modal)
├── PettyCashDetailsModal.tsx      (Petty cash modal)
└── TotalCostsDetailsModal.tsx     (Total costs modal)
```

## Database Functions Used

- `get_dashboard_stats` - Main stats aggregation
- `get_last_7_days_sales` - Sales chart data
- `get_top_selling_products` - Top products list
- `get_payment_method_breakdown` - Payment methods

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Cards show ₹0 | Check if data exists for today |
| Modal doesn't open | Check console for errors |
| Data not loading | Verify database connection |
| Slow performance | Check if limits are applied |
| Wrong totals | Verify RPC function logic |

## Quick Test

1. Add a raw material purchase
2. Add a petty cash record
3. Refresh dashboard
4. Click orange card → Should see purchase
5. Click purple card → Should see petty cash
6. Click red card → Should see both in breakdown

## Success Indicators

✅ All cards show correct amounts
✅ Clickable cards have hover effects
✅ Modals open smoothly
✅ Tables are well-formatted
✅ Totals match database
✅ Performance is fast
✅ No console errors
