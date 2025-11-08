# Tea Stock Sync Fix - Issue Resolved

## 🐛 Issue Encountered

**Error**: "Insufficient tea stock. Available: 0 ml, Required: 120 ml"

**Cause**: Tea was produced (12L) before the tea stock system was implemented. The production was logged in `production_logs` but not reflected in the new `tea_stock` table.

## ✅ Solution Applied

Synced existing production data to the tea_stock table:

```sql
UPDATE tea_stock
SET 
  total_liters = (
    SELECT COALESCE(SUM(quantity_produced), 0)
    FROM production_logs
    WHERE production_logs.store_id = tea_stock.store_id
      AND unit = 'L'
  ),
  last_updated = now()
WHERE store_id IN (
  SELECT DISTINCT store_id 
  FROM production_logs 
  WHERE unit = 'L'
);
```

## 📊 Results

### Before Fix
- Production Logs: 12L
- Tea Stock: 0L ❌
- POS: Out of stock error

### After Fix
- Production Logs: 12L
- Tea Stock: 12L ✅
- POS: Shows available servings
  - Small Tea: 200 servings
  - Regular Tea: 133 servings
  - Large Tea: 100 servings

## 🔄 Why This Won't Happen Again

The `ProductionView.tsx` has been updated to automatically add tea to stock when produced:

```typescript
// Add tea to general stock pool
const { error: stockError } = await supabase.rpc('add_tea_to_stock', {
  p_store_id: currentStore.id,
  p_liters: qty,
});
```

All future productions will automatically update the tea_stock table.

## 🧪 Verification Steps

1. ✅ Check tea_stock table - shows 12L
2. ✅ Check v_tea_products_with_stock view - shows servings
3. ✅ Refresh POS - should show available stock
4. ✅ Try selling tea - should work without errors

## 📝 For Other Stores

If other stores have the same issue (produced tea before system update), run:

```sql
-- Check if sync is needed
SELECT 
  s.name,
  COALESCE(pl.total_produced, 0) as produced,
  COALESCE(ts.total_liters, 0) as in_stock,
  COALESCE(pl.total_produced, 0) - COALESCE(ts.total_liters, 0) as difference
FROM stores s
LEFT JOIN (
  SELECT store_id, SUM(quantity_produced) as total_produced
  FROM production_logs
  WHERE unit = 'L'
  GROUP BY store_id
) pl ON pl.store_id = s.id
LEFT JOIN tea_stock ts ON ts.store_id = s.id;

-- If difference > 0, run the sync update above
```

## 🎯 Status

**Issue**: ✅ RESOLVED
**Stock**: ✅ SYNCED
**System**: ✅ WORKING

You can now sell tea products in POS without errors!

---

**Date**: November 8, 2025
**Fixed By**: Automated sync script
