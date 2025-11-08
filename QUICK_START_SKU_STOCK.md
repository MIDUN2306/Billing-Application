# 🚀 Quick Start: SKU-Based Stock Connection

## How to Use the New System

### Step 1: Add Ready-to-Use Raw Material

1. Go to **Raw Materials** page
2. Click **"Add New Material"**
3. Fill in:
   - Name: `Banana Cake`
   - Product Type: **Ready to Use** ⚠️ Important!
   - SKU: `BC001`
   - Unit: `pieces`
   - Quantity: `25`
   - Purchase Price: `₹30`
4. Click **Save**

### Step 2: Create POS Product

1. Go to **Products** page
2. Click **"Add Product"**
3. Fill in:
   - Name: `Banana Cake`
   - SKU: `BC001` ⚠️ Must match raw material SKU!
   - Unit: `pieces`
   - MRP: `₹50`
4. Click **Save**

### Step 3: Verify Auto-Linking

1. Refresh the **Products** page
2. Look for the product you just created
3. You should see a **purple badge**: `🔗 Linked to Stock`
4. This means it's connected to the raw material!

### Step 4: Check POS

1. Go to **POS** page
2. Find "Banana Cake"
3. It should show:
   - Stock: `25 pieces` (from raw material)
   - Price: `₹50`
   - Available for sale

### Step 5: Make a Sale

1. Click on "Banana Cake" to add to cart
2. Add quantity: `2`
3. Click **"Proceed to Payment"**
4. Select payment method
5. Click **"Complete Sale"**

### Step 6: Verify Stock Deduction

1. Go back to **Raw Materials** page
2. Find "Banana Cake"
3. Stock should now be: `23 pieces` (was 25, sold 2)
4. Go to **POS** page
5. "Banana Cake" should show: `23 pieces`

---

## 🎯 What Happens Automatically

### ✅ Auto-Linking
- When SKUs match, products link to raw materials
- No manual configuration needed
- Works immediately

### ✅ Real-Time Stock
- POS always shows raw material quantity
- Changes reflect instantly
- No sync delays

### ✅ Auto-Deduction
- When you sell in POS
- Raw material stock reduces automatically
- Usage is logged for tracking

### ✅ Out of Stock
- When stock reaches 0
- Product grays out in POS
- Shows "OUT OF STOCK" badge
- Cannot be added to cart

---

## 🔍 Visual Indicators

### In POS (Out of Stock)
```
┌─────────────────────────────┐
│  OUT OF STOCK    [Red Badge]│
│                             │
│  Banana Cake                │
│  SKU: BC001                 │
│                             │
│  ₹50.00        0 pieces     │
│  [Grayed Out]               │
└─────────────────────────────┘
```

### In POS (In Stock)
```
┌─────────────────────────────┐
│  Banana Cake                │
│  [Beverages]                │
│  SKU: BC001                 │
│                             │
│  ₹50.00        25 pieces    │
│  [Available - Green]        │
└─────────────────────────────┘
```

### In Products Page
```
┌─────────────────────────────┐
│  Banana Cake                │
│  SKU: BC001                 │
│                             │
│  [Beverages] [🔗 Linked]    │
│                             │
│  ₹50.00        25 pieces    │
└─────────────────────────────┘
```

---

## ⚠️ Important Rules

### 1. SKU Must Match
- Raw material SKU: `BC001`
- Product SKU: `BC001`
- ✅ Will link automatically

### 2. Must Be "Ready to Use"
- Only raw materials with type **"Ready to Use"** link
- "Making" type (like tea powder) won't link
- This is by design

### 3. One SKU = One Link
- Each SKU should be unique
- One product links to one raw material
- Don't reuse SKUs

### 4. Stock Source
- Linked products: Stock from raw material
- Non-linked products: Stock from product table
- Both work in POS

---

## 🧪 Testing Your Setup

### Test 1: Basic Flow
1. ✅ Add raw material (ready-to-use, with SKU)
2. ✅ Add product (same SKU)
3. ✅ Check Products page for "🔗 Linked" badge
4. ✅ Check POS shows correct stock
5. ✅ Sell 1 item
6. ✅ Verify stock reduced in raw materials

### Test 2: Out of Stock
1. ✅ Set raw material quantity to 0
2. ✅ Check POS shows "OUT OF STOCK"
3. ✅ Try to add to cart (should fail)
4. ✅ Refill raw material
5. ✅ Check POS shows available again

### Test 3: Multiple Products
1. ✅ Add 3 different raw materials (different SKUs)
2. ✅ Add 3 matching products
3. ✅ All should link automatically
4. ✅ All should work in POS

---

## 🔧 Troubleshooting

### Product Not Linking?

**Check:**
1. SKUs match exactly (case-sensitive)
2. Raw material type is "Ready to Use"
3. Both in same store
4. Product doesn't already have a link

**Fix:**
- Refresh the page
- Or run: `SELECT * FROM auto_link_products_by_sku();` in SQL

### Stock Not Updating?

**Check:**
1. Sale completed successfully
2. No error messages during payment
3. Check raw material usage log

**Fix:**
- Check browser console for errors
- Verify database function exists

### Out of Stock Not Showing?

**Check:**
1. Raw material quantity is actually 0
2. Product is linked (has purple badge)
3. POS page refreshed

**Fix:**
- Click refresh button in POS
- Check `v_pos_product_stock` view

---

## 📊 Monitoring Usage

### View Usage Log (SQL)
```sql
SELECT 
  rm.name,
  rul.quantity_used,
  rul.total_cost,
  rul.used_at
FROM raw_material_usage_log rul
JOIN raw_materials rm ON rul.raw_material_id = rm.id
WHERE rul.usage_type = 'sale'
ORDER BY rul.used_at DESC
LIMIT 10;
```

### Check Linked Products (SQL)
```sql
SELECT 
  p.name AS product,
  p.sku,
  rm.name AS raw_material,
  rms.quantity AS stock
FROM products p
JOIN raw_materials rm ON p.linked_raw_material_id = rm.id
JOIN raw_material_stock rms ON rm.id = rms.raw_material_id;
```

---

## ✅ Success Checklist

After setup, you should have:

- [ ] Raw material added (ready-to-use, with SKU)
- [ ] Product added (matching SKU)
- [ ] Product shows "🔗 Linked to Stock" badge
- [ ] POS shows correct stock from raw material
- [ ] Can sell product in POS
- [ ] Stock deducts from raw material after sale
- [ ] Out-of-stock products gray out in POS
- [ ] Usage logged in database

---

## 🎉 You're All Set!

The system is now managing your ready-to-use products automatically. Every sale will:
1. Deduct from raw material stock
2. Log the usage
3. Update POS display
4. Prevent overselling

No manual stock updates needed! 🚀
