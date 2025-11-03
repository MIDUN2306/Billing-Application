# Total Costs Today - Calculation Breakdown

## Overview
This document explains exactly how "Total Costs Today" (Money OUT) is calculated in the dashboard.

## The Calculation Formula

```
Total Costs Today = Raw Materials + Petty Cash + Expenses
```

## Detailed Breakdown

### 1. Raw Materials Cost (today_raw_materials)
**Source Table:** `raw_material_purchases`  
**Column Used:** `total_cost`  
**Filter:** `DATE(purchase_date) = CURRENT_DATE`

**SQL Query:**
```sql
SELECT SUM(total_cost)
FROM raw_material_purchases
WHERE store_id = p_store_id
  AND DATE(purchase_date) = CURRENT_DATE
```

**What it includes:**
- Milk purchases
- Tea powder purchases
- Sugar purchases
- Any other raw material purchases made TODAY

**Example:**
```
Raw Material Purchase 1: Milk 10L @ ₹50/L = ₹500
Raw Material Purchase 2: Tea Powder 2kg @ ₹400/kg = ₹800
Raw Material Purchase 3: Sugar 5kg @ ₹40/kg = ₹200
-----------------------------------------------------------
Total Raw Materials Cost = ₹1,500
```

---

### 2. Petty Cash (today_petty_cash)
**Source Table:** `petty_cash`  
**Column Used:** `amount`  
**Filter:** `given_date = CURRENT_DATE`

**SQL Query:**
```sql
SELECT SUM(amount)
FROM petty_cash
WHERE store_id = p_store_id
  AND given_date = CURRENT_DATE
```

**What it includes:**
- Small cash given to employees
- Vendor payments
- Miscellaneous small expenses
- All petty cash disbursements made TODAY

**Example:**
```
Petty Cash 1: Transportation - ₹200
Petty Cash 2: Office supplies - ₹150
Petty Cash 3: Delivery boy - ₹100
-----------------------------------------------------------
Total Petty Cash = ₹450
```

---

### 3. Expenses (today_expenses)
**Source Table:** `expenses`  
**Column Used:** `amount`  
**Filter:** `expense_date = CURRENT_DATE`

**SQL Query:**
```sql
SELECT SUM(amount)
FROM expenses
WHERE store_id = p_store_id
  AND expense_date = CURRENT_DATE
```

**What it includes:**
- Rent payments
- Utility bills (electricity, water)
- Salaries
- Maintenance costs
- Marketing expenses
- Insurance payments
- Taxes
- Any other business expenses recorded TODAY

**Example:**
```
Expense 1: Electricity bill - ₹500
Expense 2: Staff salary advance - ₹1,000
Expense 3: Shop maintenance - ₹300
-----------------------------------------------------------
Total Expenses = ₹1,800
```

---

## Complete Calculation Example

### Scenario: Today's Business Activity

**MONEY OUT (Costs):**

1. **Raw Materials:**
   - Milk: ₹500
   - Tea Powder: ₹800
   - Sugar: ₹200
   - **Subtotal: ₹1,500**

2. **Petty Cash:**
   - Transportation: ₹200
   - Office supplies: ₹150
   - Delivery boy: ₹100
   - **Subtotal: ₹450**

3. **Expenses:**
   - Electricity: ₹500
   - Salary advance: ₹1,000
   - Maintenance: ₹300
   - **Subtotal: ₹1,800**

### Final Calculation:
```
Total Costs Today = ₹1,500 + ₹450 + ₹1,800
Total Costs Today = ₹3,750
```

**MONEY IN (Revenue):**
- Today's Sales: ₹5,000

**NET PROFIT/LOSS:**
```
Net Today = Sales - Total Costs
Net Today = ₹5,000 - ₹3,750
Net Today = ₹1,250 (Profit) ✅
```

---

## Database Function Code

The actual SQL function that performs this calculation:

```sql
'total_costs_today', COALESCE((
  SELECT 
    COALESCE(SUM(e.amount), 0) +           -- Expenses
    COALESCE(SUM(rm.total_cost), 0) +      -- Raw Materials
    COALESCE(SUM(pc.amount), 0)            -- Petty Cash
  FROM (SELECT 1) AS dummy
  LEFT JOIN expenses e 
    ON e.store_id = p_store_id 
    AND e.expense_date = CURRENT_DATE
  LEFT JOIN raw_material_purchases rm 
    ON rm.store_id = p_store_id 
    AND DATE(rm.purchase_date) = CURRENT_DATE
  LEFT JOIN petty_cash pc 
    ON pc.store_id = p_store_id 
    AND pc.given_date = CURRENT_DATE
), 0)
```

---

## Dashboard Display

### Top Row - Main Card
```
┌─────────────────────────────┐
│ Total Costs Today           │
│ ₹3,750                      │
│ Money OUT                   │
└─────────────────────────────┘
```

### Second Row - Breakdown Cards
```
┌──────────────┬──────────────┬──────────────┐
│ Raw Materials│ Petty Cash   │ Expenses     │
│ ₹1,500       │ ₹450         │ ₹1,800       │
│ Today's Cost │ Today's Cost │ Today's Cost │
└──────────────┴──────────────┴──────────────┘
```

---

## Important Notes

### What is INCLUDED in Total Costs:
✅ Raw Materials purchases (milk, tea, sugar, etc.)  
✅ Petty Cash disbursements  
✅ Business Expenses (rent, utilities, salaries, etc.)

### What is NOT INCLUDED in Total Costs:
❌ **Purchases** (finished product inventory) - This is shown separately as "Inventory"  
❌ Sales revenue  
❌ Pending payments  

### Why Purchases are NOT included:
- Purchases represent inventory investment, not direct costs
- They become costs only when products are sold (Cost of Goods Sold)
- Including them would double-count costs

---

## Verification Steps

To verify the calculation is correct, you can:

1. **Check Raw Materials:**
   ```sql
   SELECT SUM(total_cost) as raw_materials_cost
   FROM raw_material_purchases
   WHERE store_id = 'your-store-id'
     AND DATE(purchase_date) = CURRENT_DATE;
   ```

2. **Check Petty Cash:**
   ```sql
   SELECT SUM(amount) as petty_cash_cost
   FROM petty_cash
   WHERE store_id = 'your-store-id'
     AND given_date = CURRENT_DATE;
   ```

3. **Check Expenses:**
   ```sql
   SELECT SUM(amount) as expenses_cost
   FROM expenses
   WHERE store_id = 'your-store-id'
     AND expense_date = CURRENT_DATE;
   ```

4. **Verify Total:**
   ```
   Total = raw_materials_cost + petty_cash_cost + expenses_cost
   ```

---

## Summary

**Total Costs Today** is the sum of three components:

1. **Raw Materials** (₹1,500) - What you buy to make products
2. **Petty Cash** (₹450) - Small cash disbursements
3. **Expenses** (₹1,800) - Business operating costs

**Total = ₹3,750**

This represents all the money going OUT of your business TODAY.
