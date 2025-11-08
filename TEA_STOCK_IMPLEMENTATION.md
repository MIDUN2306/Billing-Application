# Tea Stock Display & Validation Implementation

## Database Schema Analysis ✅

### Key Tables
1. **product_names** - Contains `tea_portion_ml` (portion size for tea products)
2. **tea_stock** - Contains `total_ml` and `total_liters` (available tea stock)
3. **products** - Links to product_names via product_template_id
4. **v_pos_products_with_stock** - Current POS view (needs enhancement)

### Tea Portion Sizes (from product_names)
- Small Tea: ~60ml
- Regular Tea: ~90ml
- Large Tea: ~120ml

## Implementation Strategy

### Step 1: Update POS Query ✅
Need to join with:
- `product_names` to get `tea_portion_ml`
- `tea_stock` to get `total_ml`

### Step 2: Calculate Availability ✅
For each tea product:
```
servings_available = floor(total_ml / tea_portion_ml)
is_out_of_stock = servings_available < 1
```

### Step 3: Update Product Card Display ✅
- Show available servings for tea products
- Gray out card if out of stock
- Show "Out of Stock" badge
- Disable click/add to cart

### Step 4: Update Add to Cart Logic ✅
- Check tea stock before adding
- Show error if insufficient
- Prevent adding out-of-stock items

## SQL Query for POS

```sql
SELECT 
  p.id,
  p.name,
  p.sku,
  p.category,
  p.mrp,
  p.unit,
  p.quantity,
  p.store_id,
  CASE 
    WHEN rm.product_type = 'ready_to_use' THEN 'in_stock'
    WHEN rm.product_type = 'making' THEN 'no_raw_material'
    ELSE 'unknown'
  END as stock_status,
  COALESCE(rm.product_type = 'ready_to_use', false) as is_ready_to_use,
  pn.tea_portion_ml,
  ts.total_ml as available_ml,
  CASE 
    WHEN pn.tea_portion_ml IS NOT NULL AND pn.tea_portion_ml > 0 
    THEN FLOOR(COALESCE(ts.total_ml, 0) / pn.tea_portion_ml)
    ELSE NULL
  END as servings_available
FROM products p
LEFT JOIN product_templates pt ON p.product_template_id = pt.id
LEFT JOIN product_names pn ON pt.product_name_id = pn.id
LEFT JOIN raw_materials rm ON p.linked_raw_material_id = rm.id
LEFT JOIN tea_stock ts ON ts.store_id = p.store_id
WHERE p.store_id = $1
  AND p.is_active = true
ORDER BY p.category, p.name;
```

## Implementation Files

1. **src/pages/pos/POSPageNew.tsx**
   - Update Product interface to include tea fields
   - Update loadProducts query
   - Update product card to show tea stock
   - Update addToCart validation

2. **src/pages/pos/CartPanelNew.tsx**
   - Already updated (Complete Payment button simplified)

## Testing Scenarios

1. **Tea with sufficient stock** (e.g., 500ml available, 120ml needed)
   - Should show "4 servings available"
   - Card should be clickable
   - Can add to cart

2. **Tea with low stock** (e.g., 100ml available, 120ml needed)
   - Should show "Out of Stock"
   - Card should be grayed out
   - Cannot add to cart
   - Error message on click

3. **Non-tea products**
   - Should work as before
   - No tea stock display
   - Normal behavior

## Next Steps

1. ✅ Update Product interface
2. ✅ Update loadProducts query
3. ✅ Update product card display
4. ✅ Update addToCart logic
5. ✅ Test with different stock levels
