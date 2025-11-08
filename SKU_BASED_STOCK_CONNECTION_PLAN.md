# SKU-Based Stock Connection: Raw Materials to POS Products

## 📋 CURRENT IMPLEMENTATION ANALYSIS

### Raw Materials System
- **Table**: `raw_materials`
  - Has `product_type` field: `'making'` or `'ready_to_use'`
  - Has `sku` field (nullable) for ready-to-use products
  - Example: "Banana Cake" with SKU "BC001"

- **Table**: `raw_material_stock`
  - Tracks quantity and purchase price
  - Connected to `raw_materials` via `raw_material_id`

- **View**: `v_raw_material_stock_status`
  - Shows: id, raw_material_name, product_type, sku, quantity, stock_status

### Products System
- **Table**: `products`
  - Has `sku` field (nullable)
  - Has `quantity` field for stock
  - Has `product_template_id` (nullable) - links to recipes

- **View**: `v_product_stock_status`
  - Shows: id, name, sku, quantity, stock_status
  - Used by POS to display available products

### Current POS Behavior
- POS loads products from `v_product_stock_status`
- Filters: `gt('quantity', 0)` - only shows products with stock
- Products are displayed as cards with stock quantity
- Users can add to cart if stock is available

## 🎯 WHAT WE WANT TO ACHIEVE

### Goal
Connect ready-to-use raw materials (with SKU) to POS products via SKU matching, so:
1. **If raw material has stock** → Product shows as "In Stock" in POS
2. **If raw material has no stock** → Product shows as "Out of Stock" (grayed out)
3. **Stock deduction** → When sold in POS, deduct from raw material stock

### Use Case Example
```
Raw Material: "Banana Cake" (ready_to_use)
├─ SKU: "BC001"
├─ Quantity: 25 pieces
└─ Purchase Price: ₹30/piece

POS Product: "Banana Cake"
├─ SKU: "BC001" (matches raw material)
├─ MRP: ₹50/piece
└─ Stock: Linked to raw material quantity (25 pieces)

When customer buys 2 pieces:
├─ Sale recorded: 2 × ₹50 = ₹100
└─ Raw material stock reduced: 25 → 23 pieces
```

## 🔍 KEY QUESTIONS & CLARIFICATIONS NEEDED

### Question 1: Product Creation Workflow
**How should products be created for ready-to-use raw materials?**

**Option A**: Automatic Product Creation
- When adding a ready-to-use raw material with SKU, automatically create a matching product
- Product inherits: name, SKU, unit from raw material
- User sets: MRP (selling price)

**Option B**: Manual Linking
- User creates product separately
- System matches products to raw materials by SKU
- Warns if SKU doesn't match any raw material

**Option C**: Hybrid Approach
- User can create product from raw material page (quick action)
- Or create product manually and link via SKU

**RECOMMENDATION**: Option C (Hybrid) - Most flexible

---

### Question 2: Stock Management
**How should stock be managed for SKU-linked products?**

**Option A**: Single Source of Truth (Raw Material)
- Product `quantity` field is always calculated from raw material
- Product table doesn't store quantity for SKU-linked items
- View/query joins raw material stock in real-time

**Option B**: Synchronized Stock
- Both product and raw material have quantity fields
- When raw material stock changes, update product quantity
- When product is sold, update raw material quantity

**Option C**: Product as Proxy
- Product `quantity` field references raw material
- Database trigger keeps them in sync

**RECOMMENDATION**: Option A (Single Source) - Prevents sync issues

---

### Question 3: Mixed Product Types
**Can a product have BOTH recipe-based AND ready-to-use variants?**

Example: "Tea" could be:
- Recipe-based: Made from tea powder + milk + sugar
- Ready-to-use: Pre-packaged tea bottles with SKU

**Answer Needed**: Should these be separate products or same product with different modes?

**RECOMMENDATION**: Separate products with different SKUs

---

### Question 4: Stock Deduction in POS
**When a SKU-linked product is sold, what should happen?**

**Current Flow** (Recipe-based products):
1. Sale recorded in `sales` and `sale_items`
2. Product quantity reduced
3. Raw material stock NOT automatically reduced (only during production)

**New Flow** (Ready-to-use products):
1. Sale recorded in `sales` and `sale_items`
2. Product quantity should reflect raw material quantity
3. Raw material stock reduced directly
4. Log the deduction in `raw_material_purchases` (negative entry) or new table?

**RECOMMENDATION**: 
- Reduce raw material stock directly
- Create new table `raw_material_usage_log` to track sales usage

---

### Question 5: Price Management
**How to handle purchase price vs selling price?**

- Raw Material: Has `purchase_price` (cost)
- Product: Has `mrp` (selling price)
- Profit = MRP - Purchase Price

**Should we show profit margin in POS or reports?**

**RECOMMENDATION**: Yes, add profit tracking

---

## 📐 PROPOSED SOLUTION ARCHITECTURE

### Database Changes

#### 1. Add SKU Linking Field to Products (Optional)
```sql
-- Add a flag to indicate if product is linked to raw material
ALTER TABLE products 
ADD COLUMN linked_raw_material_id UUID REFERENCES raw_materials(id);

-- Add index for performance
CREATE INDEX idx_products_linked_raw_material 
ON products(linked_raw_material_id);
```

#### 2. Create View for SKU-Linked Products
```sql
CREATE OR REPLACE VIEW v_pos_product_stock AS
SELECT 
  p.id,
  p.store_id,
  p.name,
  p.sku,
  p.unit,
  p.mrp,
  p.category_id,
  c.name AS category_name,
  p.product_template_id,
  p.linked_raw_material_id,
  
  -- Stock quantity logic
  CASE 
    -- If linked to raw material, use raw material stock
    WHEN p.linked_raw_material_id IS NOT NULL THEN 
      COALESCE(rms.quantity, 0)
    -- Otherwise use product's own quantity
    ELSE 
      p.quantity
  END AS quantity,
  
  -- Stock status
  CASE
    WHEN (CASE 
            WHEN p.linked_raw_material_id IS NOT NULL THEN COALESCE(rms.quantity, 0)
            ELSE p.quantity
          END) <= 0 THEN 'out_of_stock'
    WHEN (CASE 
            WHEN p.linked_raw_material_id IS NOT NULL THEN COALESCE(rms.quantity, 0)
            ELSE p.quantity
          END) <= 10 THEN 'low_stock'
    ELSE 'in_stock'
  END AS stock_status,
  
  -- Additional info
  rm.product_type AS raw_material_type,
  rms.purchase_price AS cost_price,
  (p.mrp - COALESCE(rms.purchase_price, 0)) AS profit_per_unit
  
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN raw_materials rm ON p.linked_raw_material_id = rm.id
LEFT JOIN raw_material_stock rms ON rm.id = rms.raw_material_id AND p.store_id = rms.store_id
WHERE p.is_active = true;
```

#### 3. Create Raw Material Usage Log Table
```sql
CREATE TABLE raw_material_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_material_id UUID NOT NULL REFERENCES raw_materials(id),
  store_id UUID NOT NULL REFERENCES stores(id),
  quantity_used NUMERIC NOT NULL CHECK (quantity_used > 0),
  unit TEXT NOT NULL,
  usage_type TEXT NOT NULL CHECK (usage_type IN ('sale', 'production', 'wastage', 'adjustment')),
  reference_type TEXT, -- 'sale', 'production_log', etc.
  reference_id UUID, -- sale_id, production_log_id, etc.
  unit_cost NUMERIC,
  total_cost NUMERIC,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_raw_material_usage_log_material ON raw_material_usage_log(raw_material_id);
CREATE INDEX idx_raw_material_usage_log_store ON raw_material_usage_log(store_id);
CREATE INDEX idx_raw_material_usage_log_reference ON raw_material_usage_log(reference_type, reference_id);
```

#### 4. Create Database Function for Stock Deduction
```sql
CREATE OR REPLACE FUNCTION deduct_raw_material_stock_for_sale(
  p_sale_id UUID,
  p_store_id UUID
) RETURNS void AS $$
DECLARE
  v_item RECORD;
  v_raw_material_id UUID;
  v_current_stock NUMERIC;
  v_unit_cost NUMERIC;
BEGIN
  -- Loop through all sale items
  FOR v_item IN 
    SELECT si.product_id, si.quantity, p.linked_raw_material_id, p.unit
    FROM sale_items si
    JOIN products p ON si.product_id = p.id
    WHERE si.sale_id = p_sale_id
      AND p.linked_raw_material_id IS NOT NULL
  LOOP
    -- Get current stock and cost
    SELECT rms.quantity, rms.purchase_price, rms.raw_material_id
    INTO v_current_stock, v_unit_cost, v_raw_material_id
    FROM raw_material_stock rms
    WHERE rms.raw_material_id = v_item.linked_raw_material_id
      AND rms.store_id = p_store_id;
    
    -- Check if enough stock
    IF v_current_stock < v_item.quantity THEN
      RAISE EXCEPTION 'Insufficient stock for raw material. Available: %, Required: %', 
        v_current_stock, v_item.quantity;
    END IF;
    
    -- Deduct stock
    UPDATE raw_material_stock
    SET 
      quantity = quantity - v_item.quantity,
      updated_at = NOW()
    WHERE raw_material_id = v_raw_material_id
      AND store_id = p_store_id;
    
    -- Log the usage
    INSERT INTO raw_material_usage_log (
      raw_material_id,
      store_id,
      quantity_used,
      unit,
      usage_type,
      reference_type,
      reference_id,
      unit_cost,
      total_cost
    ) VALUES (
      v_raw_material_id,
      p_store_id,
      v_item.quantity,
      v_item.unit,
      'sale',
      'sale',
      p_sale_id,
      v_unit_cost,
      v_unit_cost * v_item.quantity
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;
```

### Frontend Changes

#### 1. Raw Materials Page Enhancement
- Add "Create POS Product" button for ready-to-use items
- Show if raw material is linked to a product
- Display linked product's MRP and profit margin

#### 2. Products Page Enhancement
- Show if product is linked to raw material
- Display real-time stock from raw material
- Add "Link to Raw Material" option (by SKU)

#### 3. POS Page Changes
- Use new `v_pos_product_stock` view
- Show "Ready-to-Use" badge for SKU-linked products
- Display cost price and profit margin (optional)
- Gray out products with zero stock

#### 4. Payment Modal Changes
- Call stock deduction function after successful sale
- Handle insufficient stock errors gracefully

---

## 🚀 IMPLEMENTATION PLAN

### Phase 1: Database Setup ✅
1. Add `linked_raw_material_id` column to products table
2. Create `v_pos_product_stock` view
3. Create `raw_material_usage_log` table
4. Create `deduct_raw_material_stock_for_sale` function
5. Add RLS policies for new table

### Phase 2: Backend Integration ✅
1. Update TypeScript types for new fields
2. Create helper functions for SKU matching
3. Add stock validation before sale

### Phase 3: Raw Materials Page ✅
1. Add "Create Product" button for ready-to-use items
2. Show linked product status
3. Add SKU-based product creation modal

### Phase 4: Products Page ✅
1. Show raw material link status
2. Display real-time stock for linked products
3. Add manual SKU linking feature

### Phase 5: POS Integration ✅
1. Update POS to use new view
2. Add stock validation
3. Integrate stock deduction on sale
4. Handle errors gracefully

### Phase 6: Testing & Validation ✅
1. Test stock deduction flow
2. Test insufficient stock scenarios
3. Test profit margin calculations
4. Test multi-store scenarios

---

## ⚠️ IMPORTANT CONSIDERATIONS

### 1. Data Integrity
- Ensure SKU uniqueness within store
- Prevent duplicate SKU assignments
- Handle orphaned links (deleted raw materials)

### 2. Performance
- Index on SKU fields
- Optimize view queries
- Cache stock status where possible

### 3. User Experience
- Clear visual indicators for linked products
- Helpful error messages
- Easy unlinking/relinking process

### 4. Backward Compatibility
- Existing products without links continue to work
- Recipe-based products unaffected
- Gradual migration path

---

## 📊 EXPECTED OUTCOMES

### Benefits
✅ Real-time stock visibility for ready-to-use products
✅ Automatic stock deduction on sales
✅ Profit margin tracking
✅ Simplified inventory management
✅ Reduced manual errors
✅ Better cost control

### Metrics to Track
- Stock accuracy improvement
- Time saved in inventory management
- Profit margin visibility
- Out-of-stock incidents reduction

---

## 🤔 QUESTIONS FOR YOU

Before I proceed with implementation, please confirm:

1. **Product Creation**: Should we auto-create products for ready-to-use raw materials, or manual linking only?

2. **Stock Source**: Should product quantity always come from raw material (single source), or keep them synchronized?

3. **Mixed Products**: Can same product name have both recipe and ready-to-use variants?

4. **Profit Display**: Should POS show cost price and profit margin to staff?

5. **Existing Products**: Should we migrate existing products to link with raw materials by SKU?

6. **Stock Validation**: Should we prevent adding raw materials to cart if stock is insufficient, or allow and show error at checkout?

Please review and let me know your preferences, or if you want me to proceed with the recommended approach!
