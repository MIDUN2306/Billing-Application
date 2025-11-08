# Tea Stock System - Troubleshooting Guide

## 🚨 Common Issues & Solutions

### Issue 1: "Insufficient tea stock" Error (SOLVED)

**Symptoms:**
- Error: "Insufficient tea stock. Available: 0 ml, Required: XXml"
- Tea shows as produced in Production History
- POS shows 0 servings or out of stock

**Cause:**
Tea was produced before the tea stock system was implemented, so production logs and tea_stock table are out of sync.

**Solution:**
Run the sync function:

```sql
SELECT * FROM sync_tea_stock_from_production();
```

This will sync all production data to the tea_stock table.

**Prevention:**
This is a one-time issue. All future productions automatically update tea_stock.

---

### Issue 2: POS Not Showing Tea Products

**Symptoms:**
- Tea products don't appear in POS
- Other products show fine

**Diagnosis:**
Check if tea products are configured:

```sql
SELECT id, name, tea_portion_ml 
FROM product_names 
WHERE tea_portion_ml IS NOT NULL;
```

**Expected Result:**
```
Small Tea    | 60ml
Regular Tea  | 90ml
Large Tea    | 120ml
```

**Solution:**
If missing, configure the products:

```sql
UPDATE product_names 
SET tea_portion_ml = 60
WHERE LOWER(name) = 'small tea';

UPDATE product_names 
SET tea_portion_ml = 90
WHERE LOWER(name) = 'regular tea';

UPDATE product_names 
SET tea_portion_ml = 120
WHERE LOWER(name) = 'large tea';
```

---

### Issue 3: Stock Not Deducting After Sale

**Symptoms:**
- Sale completes successfully
- But tea stock doesn't decrease

**Diagnosis:**
Check if trigger is active:

```sql
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname = 'trigger_deduct_tea_on_sale';
```

**Expected Result:**
```
trigger_deduct_tea_on_sale | O (enabled)
```

**Solution:**
If trigger is missing or disabled, recreate it:

```sql
-- See TEA_DIRECT_STOCK_CONNECTION_COMPLETE.md for trigger creation script
```

---

### Issue 4: Wrong Servings Count

**Symptoms:**
- Servings count doesn't match expected
- Math seems off

**Diagnosis:**
Check the view calculation:

```sql
SELECT 
  name,
  tea_portion_ml,
  available_ml,
  available_servings,
  FLOOR(available_ml / tea_portion_ml) as calculated_servings
FROM v_tea_products_with_stock;
```

**Solution:**
If calculated_servings doesn't match available_servings, refresh the view:

```sql
REFRESH MATERIALIZED VIEW v_tea_products_with_stock;
-- Note: This is a regular view, not materialized, so just query it again
```

---

### Issue 5: Negative Stock Error

**Symptoms:**
- Error: "Cannot have negative stock"
- Sale fails

**Diagnosis:**
Check actual stock:

```sql
SELECT total_liters, total_ml 
FROM tea_stock 
WHERE store_id = 'your-store-id';
```

**Solution:**
If stock is genuinely low, produce more tea. If stock should be higher, run sync:

```sql
SELECT * FROM sync_tea_stock_from_production();
```

---

## 🔍 Diagnostic Queries

### Check Overall System Health

```sql
-- Complete system check
SELECT 
  'Tea Products' as component,
  COUNT(*)::TEXT as status
FROM product_names 
WHERE tea_portion_ml IS NOT NULL

UNION ALL

SELECT 
  'Tea Stock Records' as component,
  COUNT(*)::TEXT as status
FROM tea_stock

UNION ALL

SELECT 
  'Production Logs' as component,
  COUNT(*)::TEXT as status
FROM production_logs 
WHERE unit = 'L'

UNION ALL

SELECT 
  'Consumption Logs' as component,
  COUNT(*)::TEXT as status
FROM tea_consumption_log;
```

### Check Stock vs Production Mismatch

```sql
SELECT 
  s.name as store_name,
  COALESCE(pl.total_produced, 0) as total_produced,
  COALESCE(ts.total_liters, 0) as current_stock,
  COALESCE(tc.total_consumed, 0) as total_consumed,
  COALESCE(pl.total_produced, 0) - COALESCE(tc.total_consumed, 0) as expected_stock,
  COALESCE(ts.total_liters, 0) - (COALESCE(pl.total_produced, 0) - COALESCE(tc.total_consumed, 0)) as difference
FROM stores s
LEFT JOIN (
  SELECT store_id, SUM(quantity_produced) as total_produced
  FROM production_logs WHERE unit = 'L'
  GROUP BY store_id
) pl ON pl.store_id = s.id
LEFT JOIN tea_stock ts ON ts.store_id = s.id
LEFT JOIN (
  SELECT store_id, SUM(total_liters_consumed) as total_consumed
  FROM tea_consumption_log
  GROUP BY store_id
) tc ON tc.store_id = s.id;
```

If `difference` is not 0, there's a sync issue.

### Check Today's Activity

```sql
-- Today's production and consumption
SELECT 
  'Produced Today' as activity,
  SUM(quantity_produced)::TEXT || 'L' as amount
FROM production_logs
WHERE DATE(produced_at) = CURRENT_DATE
  AND unit = 'L'

UNION ALL

SELECT 
  'Consumed Today' as activity,
  SUM(total_liters_consumed)::TEXT || 'L' as amount
FROM tea_consumption_log
WHERE DATE(consumed_at) = CURRENT_DATE;
```

---

## 🛠️ Maintenance Commands

### Force Sync (Safe to run anytime)

```sql
SELECT * FROM sync_tea_stock_from_production();
```

### Reset Stock to Zero (Use with caution!)

```sql
UPDATE tea_stock 
SET total_liters = 0, last_updated = now()
WHERE store_id = 'your-store-id';
```

### Manually Add Stock (Emergency)

```sql
SELECT add_tea_to_stock('your-store-id', 5.0); -- Adds 5L
```

### Manually Deduct Stock (Emergency)

```sql
SELECT deduct_tea_from_stock('your-store-id', 500); -- Deducts 500ml
```

---

## 📞 When to Contact Support

Contact support if:
1. Sync function doesn't fix the issue
2. Stock keeps resetting to zero
3. Trigger is not firing
4. Data corruption suspected
5. Multiple stores affected

---

## ✅ Quick Fix Checklist

When encountering tea stock issues:

- [ ] Check tea_stock table has data
- [ ] Verify tea products have tea_portion_ml set
- [ ] Run sync function: `sync_tea_stock_from_production()`
- [ ] Refresh POS page (F5)
- [ ] Check trigger is enabled
- [ ] Verify view returns data
- [ ] Test with a small sale
- [ ] Check consumption log after sale

---

## 🎯 Prevention Best Practices

1. **Regular Monitoring**: Check stock levels daily
2. **Sync After Migration**: Run sync after any system updates
3. **Test Before Peak Hours**: Verify system works before busy times
4. **Keep Logs**: Monitor production_logs and tea_consumption_log
5. **Backup Data**: Regular database backups

---

**Last Updated**: November 8, 2025
**Status**: All known issues documented and resolved
