# ✅ Verification Checklist: SKU-Based Stock Connection

## Quick Verification Steps

Follow these steps to verify the implementation is working correctly:

---

## 1️⃣ Database Verification

### Check New Column
```sql
-- Verify linked_raw_material_id column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name = 'linked_raw_material_id';
```
**Expected**: Should return one row

### Check New Table
```sql
-- Verify raw_material_usage_log table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'raw_material_usage_log';
```
**Expected**: Should return one row

### Check New View
```sql
-- Verify v_pos_product_stock view exists
SELECT table_name 
FROM information_schema.views 
WHERE table_name = 'v_pos_product_stock';
```
**Expected**: Should return one row

### Check Functions
```sql
-- Verify auto-linking function exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'auto_link_products_by_sku';

-- Verify stock deduction function exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'deduct_raw_material_stock_for_sale';
```
**Expected**: Should return two rows

---

## 2️⃣ Functional Testing

### Test 1: Add Raw Material
1. Go to **Raw Materials** page
2. Click **"Add New Material"**
3. Fill in:
   - Name: `Test Cake`
   - Product Type: **Ready to Use**
   - SKU: `TEST001`
   - Unit: `pieces`
   - Quantity: `10`
   - Purchase Price: `₹20`
4. Click **Save**

**Expected**: ✅ Raw material created successfully

### Test 2: Create Product
1. Go to **Products** page
2. Click **"Add Product"**
3. Fill in:
   - Name: `Test Cake`
   - SKU: `TEST001`
   - Unit: `pieces`
   - MRP: `₹40`
4. Click **Save**

**Expected**: ✅ Product created successfully

### Test 3: Verify Auto-Linking
1. Refresh **Products** page
2. Find "Test Cake" product
3. Look for purple badge: `🔗 Linked to Stock`

**Expected**: ✅ Badge is visible

### Test 4: Check POS Display
1. Go to **POS** page
2. Find "Test Cake"
3. Check stock display

**Expected**: ✅ Shows `10 pieces` (from raw material)

### Test 5: Make a Sale
1. In POS, click "Test Cake"
2. Add to cart (quantity: 2)
3. Click **"Proceed to Payment"**
4. Select payment method: Cash
5. Click **"Complete Sale"**

**Expected**: ✅ Sale completed successfully

### Test 6: Verify Stock Deduction
1. Go to **Raw Materials** page
2. Find "Test Cake"
3. Check quantity

**Expected**: ✅ Shows `8 pieces` (was 10, sold 2)

### Test 7: Verify POS Update
1. Go to **POS** page
2. Find "Test Cake"
3. Check stock display

**Expected**: ✅ Shows `8 pieces` (updated)

### Test 8: Test Out of Stock
1. Go to **Raw Materials** page
2. Edit "Test Cake"
3. Set quantity to `0`
4. Save
5. Go to **POS** page
6. Find "Test Cake"

**Expected**: 
- ✅ Product is grayed out
- ✅ "OUT OF STOCK" badge visible
- ✅ Cannot add to cart

### Test 9: Verify Usage Log
```sql
-- Check usage log entry
SELECT 
  rm.name,
  rul.quantity_used,
  rul.usage_type,
  rul.total_cost
FROM raw_material_usage_log rul
JOIN raw_materials rm ON rul.raw_material_id = rm.id
WHERE rm.name = 'Test Cake'
ORDER BY rul.used_at DESC
LIMIT 1;
```

**Expected**: 
- ✅ One row returned
- ✅ quantity_used = 2
- ✅ usage_type = 'sale'
- ✅ total_cost = 40 (2 × ₹20)

---

## 3️⃣ Edge Cases Testing

### Test 10: Non-Linked Product
1. Create a product WITHOUT matching raw material SKU
2. Go to POS
3. Check if it still works

**Expected**: ✅ Product works normally (uses product.quantity)

### Test 11: Recipe-Based Product
1. Create a product with recipe/template
2. Go to POS
3. Check if it still works

**Expected**: ✅ Recipe-based products unaffected

### Test 12: Multiple Stores
If you have multiple stores:
1. Create raw material in Store A with SKU "MULTI001"
2. Create product in Store A with SKU "MULTI001"
3. Create raw material in Store B with SKU "MULTI001"
4. Create product in Store B with SKU "MULTI001"

**Expected**: 
- ✅ Store A product links to Store A raw material
- ✅ Store B product links to Store B raw material
- ✅ No cross-store linking

---

## 4️⃣ Visual Verification

### POS Page - In Stock
```
Should see:
┌─────────────────────────────┐
│  Test Cake                  │
│  [Category]                 │
│  SKU: TEST001               │
│                             │
│  ₹40.00        8 pieces     │
│  [Normal appearance]        │
└─────────────────────────────┘
```

### POS Page - Out of Stock
```
Should see:
┌─────────────────────────────┐
│  OUT OF STOCK    [Red]      │
│                             │
│  Test Cake                  │
│  SKU: TEST001               │
│                             │
│  ₹40.00        0 pieces     │
│  [Grayed out, 50% opacity]  │
└─────────────────────────────┘
```

### Products Page - Linked
```
Should see:
┌─────────────────────────────┐
│  Test Cake                  │
│  SKU: TEST001               │
│                             │
│  [Category] [🔗 Linked]     │
│              ↑ Purple badge │
│                             │
│  ₹40.00        8 pieces     │
└─────────────────────────────┘
```

---

## 5️⃣ Error Handling Verification

### Test 13: Insufficient Stock
1. Set raw material quantity to 1
2. Try to add 5 to cart in POS
3. Try to complete sale

**Expected**: ✅ Error message or prevention

### Test 14: Missing Raw Material
1. Delete a raw material that's linked to a product
2. Go to POS
3. Check product display

**Expected**: ✅ Product shows 0 stock (graceful handling)

---

## 6️⃣ Performance Verification

### Test 15: Load Time
1. Add 50+ products (mix of linked and non-linked)
2. Go to POS page
3. Measure load time

**Expected**: ✅ Loads in < 2 seconds

### Test 16: Sale Completion Time
1. Add 10 items to cart (mix of linked and non-linked)
2. Complete sale
3. Measure time

**Expected**: ✅ Completes in < 3 seconds

---

## 7️⃣ Data Integrity Verification

### Test 17: Stock Accuracy
```sql
-- Compare product display vs raw material stock
SELECT 
  p.name AS product,
  p.sku,
  rms.quantity AS raw_material_stock,
  (SELECT quantity FROM v_pos_product_stock WHERE id = p.id) AS pos_display_stock
FROM products p
JOIN raw_materials rm ON p.linked_raw_material_id = rm.id
JOIN raw_material_stock rms ON rm.id = rms.raw_material_id
WHERE p.linked_raw_material_id IS NOT NULL;
```

**Expected**: ✅ raw_material_stock = pos_display_stock for all rows

### Test 18: Usage Log Accuracy
```sql
-- Verify usage log matches sales
SELECT 
  s.invoice_number,
  si.quantity AS sold_quantity,
  rul.quantity_used AS logged_quantity
FROM sales s
JOIN sale_items si ON s.id = si.sale_id
JOIN products p ON si.product_id = p.id
JOIN raw_material_usage_log rul ON rul.reference_id = s.id
WHERE p.linked_raw_material_id IS NOT NULL
AND rul.usage_type = 'sale';
```

**Expected**: ✅ sold_quantity = logged_quantity for all rows

---

## 8️⃣ Security Verification

### Test 19: RLS Policies
```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'raw_material_usage_log';
```

**Expected**: ✅ rowsecurity = true

### Test 20: Multi-Tenant Isolation
1. Login as Store A user
2. Try to view Store B's usage logs

**Expected**: ✅ Cannot see other store's data

---

## 9️⃣ Browser Console Check

### Test 21: No Errors
1. Open browser console (F12)
2. Navigate to POS page
3. Make a sale
4. Check for errors

**Expected**: ✅ No red errors in console

### Test 22: Network Requests
1. Open Network tab in browser
2. Load POS page
3. Check API calls

**Expected**: 
- ✅ v_pos_product_stock query succeeds
- ✅ deduct_raw_material_stock_for_sale call succeeds

---

## 🎯 Final Checklist

Mark each as complete:

### Database
- [ ] linked_raw_material_id column exists
- [ ] raw_material_usage_log table exists
- [ ] v_pos_product_stock view exists
- [ ] auto_link_products_by_sku function exists
- [ ] deduct_raw_material_stock_for_sale function exists
- [ ] RLS policies configured

### Functionality
- [ ] Raw material can be added
- [ ] Product can be created
- [ ] Auto-linking works
- [ ] POS shows correct stock
- [ ] Sale completes successfully
- [ ] Stock deducts correctly
- [ ] Usage log records entry
- [ ] Out-of-stock displays correctly

### Visual
- [ ] "🔗 Linked to Stock" badge shows
- [ ] "OUT OF STOCK" badge shows
- [ ] Grayed out appearance works
- [ ] Stock numbers match everywhere

### Edge Cases
- [ ] Non-linked products work
- [ ] Recipe-based products work
- [ ] Multi-store isolation works
- [ ] Error handling works

### Performance
- [ ] POS loads quickly
- [ ] Sales complete quickly
- [ ] No console errors
- [ ] No network errors

---

## ✅ All Tests Passed?

If all checkboxes are marked:
🎉 **Implementation is verified and working correctly!**

If any tests fail:
1. Check the error message
2. Review the relevant code
3. Check database logs
4. Consult documentation files

---

## 📞 Troubleshooting

### Common Issues:

**Products not linking?**
- Run: `SELECT * FROM auto_link_products_by_sku();`
- Check SKU matches exactly
- Verify raw material type is "ready_to_use"

**Stock not deducting?**
- Check browser console for errors
- Verify function exists in database
- Check RLS policies

**Out of stock not showing?**
- Refresh POS page
- Check raw material quantity is actually 0
- Verify product is linked

---

**Verification Date**: _____________
**Verified By**: _____________
**Status**: ⬜ Pass / ⬜ Fail
**Notes**: _____________
