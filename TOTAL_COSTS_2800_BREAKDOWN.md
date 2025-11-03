# Total Costs ₹2,800 - Complete Breakdown

## Overview
The "Total Costs" card shows ₹2,800, which represents all money spent (Money OUT) during the selected date range.

## Date Range
**Last 7 Days**: October 28 - November 3, 2025

## Complete Breakdown

### Total Costs = ₹2,800

This is calculated as:
```
Total Costs = Raw Materials + Petty Cash
Total Costs = ₹2,700 + ₹100 = ₹2,800
```

---

## 1. Raw Materials: ₹2,700 (96.4%)

### Milk Purchases (3 transactions)

| Date | Material | Quantity | Unit Price | Total Cost |
|------|----------|----------|------------|------------|
| Nov 3, 2025 | Milk | 4 liters | ₹300/L | ₹1,200 |
| Nov 3, 2025 | Milk | 2 liters | ₹300/L | ₹600 |
| Nov 2, 2025 | Milk | 3 liters | ₹300/L | ₹900 |
| **Subtotal** | | **9 liters** | | **₹2,700** |

**Purpose**: Raw materials purchased for production

---

## 2. Petty Cash: ₹100 (3.6%)

### Petty Cash Transactions (1 transaction)

| Date | Recipient | Amount | Purpose | Notes |
|------|-----------|--------|---------|-------|
| Nov 3, 2025 | Midun | ₹100 | Office | - |
| **Subtotal** | | **₹100** | | |

**Purpose**: Small cash expenses for office needs

---

## Visual Breakdown

```
Total Costs: ₹2,800
├── Raw Materials: ₹2,700 (96.4%)
│   ├── Nov 3: Milk 4L = ₹1,200
│   ├── Nov 3: Milk 2L = ₹600
│   └── Nov 2: Milk 3L = ₹900
│
└── Petty Cash: ₹100 (3.6%)
    └── Nov 3: Midun (Office) = ₹100
```

## Percentage Distribution

```
┌────────────────────────────────────────────────────────┐
│ Raw Materials (96.4%)  ████████████████████████████▓░  │
│ Petty Cash (3.6%)      █░                              │
└────────────────────────────────────────────────────────┘
```

## Daily Breakdown

### November 3, 2025
- Raw Materials: ₹1,800 (Milk: 4L + 2L)
- Petty Cash: ₹100 (Midun - Office)
- **Daily Total: ₹1,900**

### November 2, 2025
- Raw Materials: ₹900 (Milk: 3L)
- Petty Cash: ₹0
- **Daily Total: ₹900**

### October 28 - November 1, 2025
- No transactions
- **Daily Total: ₹0**

## Summary by Category

| Category | Amount | Transactions | Percentage |
|----------|--------|--------------|------------|
| Raw Materials | ₹2,700 | 3 | 96.4% |
| Petty Cash | ₹100 | 1 | 3.6% |
| **TOTAL** | **₹2,800** | **4** | **100%** |

## What This Means

### Money OUT (Costs)
You spent a total of **₹2,800** in the last 7 days on:
1. **Milk purchases** for production (₹2,700)
2. **Office expenses** via petty cash (₹100)

### Cost Structure
- **96.4%** of your costs went to raw materials (milk)
- **3.6%** of your costs went to petty cash (office expenses)

## Important Notes

### What's Included in Total Costs
✅ Raw Materials purchases
✅ Petty Cash given out

### What's NOT Included in Total Costs
❌ Expenses (tracked separately)
❌ Purchases from suppliers (different category)
❌ Salaries or wages
❌ Rent or utilities

## How to View Details

### Option 1: Click the Total Costs Card
1. Click on the "Total Costs" card (₹2,800)
2. A modal will open showing the complete breakdown
3. You'll see all raw materials and petty cash transactions

### Option 2: Click Individual Cards
1. Click "Raw Materials" card to see ₹2,700 breakdown
2. Click "Petty Cash" card to see ₹100 breakdown

### Option 3: Navigate to Pages
1. Go to "Raw Materials" page to see all milk purchases
2. Go to "Petty Cash" page to see all cash given out

## Verification

### Calculation Check
```
Raw Materials:
  Nov 3: ₹1,200 + ₹600 = ₹1,800
  Nov 2: ₹900
  Total: ₹2,700 ✅

Petty Cash:
  Nov 3: ₹100
  Total: ₹100 ✅

Grand Total:
  ₹2,700 + ₹100 = ₹2,800 ✅
```

### Database Verification
```sql
-- Raw Materials
SELECT SUM(total_cost) FROM raw_material_purchases
WHERE DATE(purchase_date) BETWEEN '2025-10-28' AND '2025-11-03'
-- Result: ₹2,700 ✅

-- Petty Cash
SELECT SUM(amount) FROM petty_cash
WHERE given_date BETWEEN '2025-10-28' AND '2025-11-03'
-- Result: ₹100 ✅

-- Total
-- Result: ₹2,800 ✅
```

## Your Spending Pattern

### Last 7 Days Activity
- **Active Days**: 2 out of 7 days (Nov 2 & Nov 3)
- **Inactive Days**: 5 days (Oct 28-Nov 1)
- **Average Daily Spend**: ₹400/day (₹2,800 ÷ 7 days)
- **Average Active Day Spend**: ₹1,400/day (₹2,800 ÷ 2 active days)

### Spending Focus
- **Primary Expense**: Raw materials (milk) - 96.4%
- **Secondary Expense**: Office petty cash - 3.6%

## Comparison with Revenue

Based on your dashboard:
- **Total Costs**: ₹2,800 (Money OUT)
- **Today's Sales**: ₹300 (Money IN)
- **Net Today**: -₹2,500 (Loss)

**Note**: This shows costs for 7 days vs sales for 1 day, so direct comparison isn't accurate.

## Action Items

### To Reduce Costs
1. Monitor milk usage and wastage
2. Track petty cash more carefully
3. Look for better milk supplier prices
4. Optimize production to reduce raw material needs

### To Increase Profitability
1. Increase sales volume
2. Optimize pricing
3. Reduce waste
4. Improve production efficiency

## Quick Reference

**Where did the ₹2,800 go?**
- ₹2,700 → Milk purchases (9 liters)
- ₹100 → Office petty cash (Midun)

**When was it spent?**
- Nov 3: ₹1,900
- Nov 2: ₹900

**Who received it?**
- Milk supplier: ₹2,700
- Midun (petty cash): ₹100

**What was it for?**
- Production raw materials: ₹2,700
- Office expenses: ₹100

---

**Status**: VERIFIED ✅
**Calculation**: CORRECT ✅
**Date**: November 3, 2025
**Total Costs**: ₹2,800
**Breakdown**: Raw Materials (₹2,700) + Petty Cash (₹100)
