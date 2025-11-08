# Tea Stock System - Quick Start Guide

## 🚀 Getting Started in 3 Steps

### Step 1: Produce Tea (2 minutes)

1. Go to **Products** page
2. Click the **"Tea Preparation Batches"** card (orange/amber colored)
3. Switch to **"Produce Tea"** tab
4. Select a batch (e.g., "2 Liter Batch")
5. Click **"Produce Tea"** button
6. ✅ Tea is now added to your general stock pool!

**Example**: Produce 6L → You now have 6000ml available

---

### Step 2: Check Stock in POS (1 minute)

1. Go to **POS** page
2. Look for your tea products:
   - **Small Tea** (60ml) - Shows servings available
   - **Regular Tea** (90ml) - Shows servings available
   - **Large Tea** (120ml) - Shows servings available

**Example**: With 6000ml available:
- Small Tea: 100 servings
- Regular Tea: 66 servings
- Large Tea: 50 servings

---

### Step 3: Sell Tea (1 minute)

1. In POS, click on **"Regular Tea"**
2. Add to cart
3. Complete payment
4. ✅ System automatically deducts 90ml from stock!

**After Sale**: Stock reduced to 5910ml (66 → 65 servings)

---

## 📊 Visual Indicators

### In POS Cards

| Status | Visual | Meaning |
|--------|--------|---------|
| **In Stock** | Green badge, normal colors | > 5 servings available |
| **Low Stock** | Yellow badge | < 5 servings available |
| **Out of Stock** | Red badge, greyed out, disabled | 0 servings available |

### Stock Display
```
┌─────────────────────────────┐
│ Regular Tea                 │
│ ₹15.00                      │
│                             │
│ Servings: 66                │
│ 90ml each                   │
└─────────────────────────────┘
```

---

## 🔄 Complete Workflow Example

### Morning: Produce Tea
```
1. Open Products → Tea Preparation
2. Produce 10L tea
3. Stock: 10,000ml available
```

### Throughout Day: Sell Tea
```
Sale 1: Small Tea (60ml)   → Stock: 9,940ml
Sale 2: Regular Tea (90ml) → Stock: 9,850ml
Sale 3: Large Tea (120ml)  → Stock: 9,730ml
Sale 4: Regular Tea (90ml) → Stock: 9,640ml
```

### Check Remaining
```
Small Tea: 160 servings (9640ml ÷ 60ml)
Regular Tea: 107 servings (9640ml ÷ 90ml)
Large Tea: 80 servings (9640ml ÷ 120ml)
```

---

## ⚠️ Important Notes

### Out of Stock Behavior
- **Cannot add to cart** when out of stock
- Card is **greyed out** and **disabled**
- Shows **"Out of Stock"** badge
- Must produce more tea to sell again

### Automatic Deduction
- Happens **automatically** when sale completes
- No manual stock adjustment needed
- Tracked in `tea_consumption_log` table

### Stock Calculation
- Stock stored in **liters** (L)
- Displayed in **milliliters** (ml) for accuracy
- Servings = FLOOR(available_ml ÷ portion_ml)

---

## 🛠️ Troubleshooting

### Problem: Tea products not showing in POS
**Solution**: 
1. Check if products have `tea_portion_ml` set
2. Run: `SELECT * FROM product_names WHERE tea_portion_ml IS NOT NULL`
3. Should show Small Tea (60ml), Regular Tea (90ml), Large Tea (120ml)

### Problem: Stock not deducting after sale
**Solution**:
1. Check `tea_consumption_log` table for entries
2. Verify trigger is enabled: `trigger_deduct_tea_on_sale`
3. Check `tea_stock` table for current stock

### Problem: "Insufficient tea stock" error
**Solution**:
1. Check available stock: `SELECT * FROM tea_stock`
2. Produce more tea in Tea Preparation
3. Verify production added to stock

---

## 📈 Monitoring Stock

### Check Current Stock
```sql
SELECT 
  total_liters,
  total_ml,
  last_updated
FROM tea_stock
WHERE store_id = 'your-store-id';
```

### Check Today's Consumption
```sql
SELECT 
  product_name,
  SUM(quantity_sold) as total_sold,
  SUM(total_ml_consumed) as total_ml
FROM tea_consumption_log
WHERE DATE(consumed_at) = CURRENT_DATE
  AND store_id = 'your-store-id'
GROUP BY product_name;
```

### Check Available Servings
```sql
SELECT 
  name,
  tea_portion_ml,
  available_servings
FROM v_tea_products_with_stock
WHERE store_id = 'your-store-id';
```

---

## ✅ Success Checklist

- [ ] Can produce tea in Tea Preparation
- [ ] Tea stock increases after production
- [ ] Tea products visible in POS
- [ ] Shows correct servings count
- [ ] Can add tea to cart when in stock
- [ ] Cannot add when out of stock
- [ ] Stock deducts automatically after sale
- [ ] Out of stock cards are greyed out
- [ ] Low stock shows yellow indicator

---

## 🎯 Best Practices

1. **Produce in Morning**: Start day with fresh tea stock
2. **Monitor Throughout Day**: Check servings count regularly
3. **Produce Before Running Out**: Don't wait for 0 stock
4. **Check Consumption Log**: Review daily sales patterns
5. **Plan Ahead**: Produce based on expected demand

---

**Need Help?** Check `TEA_DIRECT_STOCK_CONNECTION_COMPLETE.md` for detailed technical documentation.
