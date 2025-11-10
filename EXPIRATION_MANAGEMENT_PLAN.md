# Expiration Management System - Complete Implementation Plan

## Overview
A comprehensive system to track and manage expired stock for all product types including:
- **Ready-to-use products** (buns, cakes, milk, biscuits) - with SKU
- **Tea stock** (prepared tea) - calculated separately, no SKU
- **Making products** (ingredients for recipes) - no SKU

## Database Schema

### 1. Create `stock_expiration` Table
Stores all expiration records with full details.

```sql
CREATE TABLE stock_expiration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id),
  
  -- Item identification
  item_type TEXT NOT NULL CHECK (item_type IN ('raw_material', 'tea_stock', 'product')),
  item_id UUID, -- raw_material_id or product_id (NULL for tea_stock)
  item_name TEXT NOT NULL,
  sku TEXT, -- Only for ready-to-use products
  
  -- Quantity details
  quantity_expired NUMERIC NOT NULL CHECK (quantity_expired > 0),
  unit TEXT NOT NULL,
  
  -- Stock before expiration
  stock_before_expiration NUMERIC NOT NULL,
  stock_after_expiration NUMERIC NOT NULL,
  
  -- Metadata
  expired_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expired_by UUID REFERENCES profiles(id),
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_stock_expiration_store ON stock_expiration(store_id);
CREATE INDEX idx_stock_expiration_item ON stock_expiration(item_type, item_id);
CREATE INDEX idx_stock_expiration_date ON stock_expiration(expired_date);
CREATE INDEX idx_stock_expiration_item_name ON stock_expiration(item_name);

-- RLS Policies
ALTER TABLE stock_expiration ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view expiration in their store"
  ON stock_expiration FOR SELECT
  USING (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert expiration in their store"
  ON stock_expiration FOR INSERT
  WITH CHECK (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));
```

### 2. Create RPC Function for Expiring Stock
Handles stock reduction atomically across different stock types.

```sql
CREATE OR REPLACE FUNCTION expire_stock(
  p_store_id UUID,
  p_item_type TEXT,
  p_item_id UUID,
  p_item_name TEXT,
  p_sku TEXT,
  p_quantity NUMERIC,
  p_unit TEXT,
  p_notes TEXT,
  p_expired_by UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_stock NUMERIC;
  v_expiration_id UUID;
  v_result JSON;
BEGIN
  -- Validate item_type
  IF p_item_type NOT IN ('raw_material', 'tea_stock', 'product') THEN
    RAISE EXCEPTION 'Invalid item_type. Must be raw_material, tea_stock, or product';
  END IF;

  -- Get current stock and reduce based on type
  IF p_item_type = 'raw_material' THEN
    -- Get current raw material stock
    SELECT quantity INTO v_current_stock
    FROM raw_material_stock
    WHERE raw_material_id = p_item_id AND store_id = p_store_id;
    
    IF v_current_stock IS NULL THEN
      RAISE EXCEPTION 'Raw material stock not found';
    END IF;
    
    IF v_current_stock < p_quantity THEN
      RAISE EXCEPTION 'Insufficient stock. Available: %, Requested: %', v_current_stock, p_quantity;
    END IF;
    
    -- Reduce raw material stock
    UPDATE raw_material_stock
    SET quantity = quantity - p_quantity,
        updated_at = NOW()
    WHERE raw_material_id = p_item_id AND store_id = p_store_id;
    
    -- Log usage
    INSERT INTO raw_material_usage_log (
      raw_material_id, store_id, quantity_used, unit,
      usage_type, reference_type, notes, used_at
    ) VALUES (
      p_item_id, p_store_id, p_quantity, p_unit,
      'wastage', 'expiration', p_notes, NOW()
    );
    
  ELSIF p_item_type = 'tea_stock' THEN
    -- Get current tea stock (in liters)
    SELECT total_liters INTO v_current_stock
    FROM tea_stock
    WHERE store_id = p_store_id;
    
    IF v_current_stock IS NULL THEN
      RAISE EXCEPTION 'Tea stock not found';
    END IF;
    
    -- Convert quantity to liters if needed
    DECLARE
      v_quantity_liters NUMERIC;
    BEGIN
      IF p_unit = 'ml' THEN
        v_quantity_liters := p_quantity / 1000;
      ELSIF p_unit = 'liters' OR p_unit = 'L' THEN
        v_quantity_liters := p_quantity;
      ELSE
        RAISE EXCEPTION 'Invalid unit for tea stock. Use ml or liters';
      END IF;
      
      IF v_current_stock < v_quantity_liters THEN
        RAISE EXCEPTION 'Insufficient tea stock. Available: % L, Requested: % L', v_current_stock, v_quantity_liters;
      END IF;
      
      -- Reduce tea stock
      UPDATE tea_stock
      SET total_liters = total_liters - v_quantity_liters,
          last_updated = NOW()
      WHERE store_id = p_store_id;
    END;
    
  ELSIF p_item_type = 'product' THEN
    -- Get current product stock
    SELECT quantity INTO v_current_stock
    FROM products
    WHERE id = p_item_id AND store_id = p_store_id;
    
    IF v_current_stock IS NULL THEN
      RAISE EXCEPTION 'Product not found';
    END IF;
    
    IF v_current_stock < p_quantity THEN
      RAISE EXCEPTION 'Insufficient product stock. Available: %, Requested: %', v_current_stock, p_quantity;
    END IF;
    
    -- Reduce product stock
    UPDATE products
    SET quantity = quantity - p_quantity::INTEGER,
        updated_at = NOW()
    WHERE id = p_item_id AND store_id = p_store_id;
    
  END IF;

  -- Record expiration
  INSERT INTO stock_expiration (
    store_id, item_type, item_id, item_name, sku,
    quantity_expired, unit,
    stock_before_expiration, stock_after_expiration,
    expired_date, expired_by, notes
  ) VALUES (
    p_store_id, p_item_type, p_item_id, p_item_name, p_sku,
    p_quantity, p_unit,
    v_current_stock, v_current_stock - p_quantity,
    CURRENT_DATE, p_expired_by, p_notes
  )
  RETURNING id INTO v_expiration_id;

  -- Return success result
  v_result := json_build_object(
    'success', true,
    'expiration_id', v_expiration_id,
    'stock_before', v_current_stock,
    'stock_after', v_current_stock - p_quantity,
    'message', 'Stock expired successfully'
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error expiring stock: %', SQLERRM;
END;
$$;
```

### 3. Create View for Consolidated Expiration History

```sql
CREATE OR REPLACE VIEW expiration_summary AS
SELECT 
  store_id,
  item_name,
  item_type,
  sku,
  unit,
  COUNT(*) as expiration_count,
  SUM(quantity_expired) as total_quantity_expired,
  MIN(expired_date) as first_expiration_date,
  MAX(expired_date) as last_expiration_date,
  MAX(created_at) as last_updated
FROM stock_expiration
GROUP BY store_id, item_name, item_type, sku, unit
ORDER BY last_updated DESC;
```

### 4. Create RPC for Fetching Expiration Details

```sql
CREATE OR REPLACE FUNCTION get_expiration_details(
  p_store_id UUID,
  p_item_name TEXT
)
RETURNS TABLE (
  id UUID,
  item_type TEXT,
  item_name TEXT,
  sku TEXT,
  quantity_expired NUMERIC,
  unit TEXT,
  stock_before_expiration NUMERIC,
  stock_after_expiration NUMERIC,
  expired_date DATE,
  expired_by_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    se.id,
    se.item_type,
    se.item_name,
    se.sku,
    se.quantity_expired,
    se.unit,
    se.stock_before_expiration,
    se.stock_after_expiration,
    se.expired_date,
    p.full_name as expired_by_name,
    se.notes,
    se.created_at
  FROM stock_expiration se
  LEFT JOIN profiles p ON se.expired_by = p.id
  WHERE se.store_id = p_store_id
    AND se.item_name = p_item_name
  ORDER BY se.expired_date DESC, se.created_at DESC;
END;
$$;
```

## Frontend Implementation

### 1. Create Expiration Page (`src/pages/expiration/ExpirationPage.tsx`)

**Features:**
- Item selection dropdown (all stock types)
- Auto-fetch SKU if present
- Display current quantity
- Auto-fetch and display unit (non-editable)
- Quantity input for expiration
- Expire button
- Expiration history table (consolidated)
- Full details modal

### 2. Create Expiration Store (`src/stores/expirationStore.ts`)

**State Management:**
- Available items list
- Selected item details
- Expiration history
- Loading states

### 3. Components Structure

```
src/pages/expiration/
├── ExpirationPage.tsx          # Main page
├── ExpireStockForm.tsx         # Form to expire stock
├── ExpirationHistoryTable.tsx  # Consolidated history
└── ExpirationDetailsModal.tsx  # Full details view
```

## UI/UX Flow

### Expire Stock Form:
1. **Select Item** → Dropdown with all items (raw materials, tea stock, products)
2. **Auto-display:**
   - SKU (if available)
   - Current stock quantity
   - Unit (non-editable)
3. **Enter quantity** to expire
4. **Add notes** (optional)
5. **Click "Expire Stock"** button
6. **Confirmation** → Stock reduced, record created

### History Table (Consolidated):
- Item Name
- Type (Raw Material / Tea Stock / Product)
- SKU (if applicable)
- Total Expired Quantity
- Unit
- Expiration Count
- Last Expiration Date
- **Actions:** View Full Details button

### Details Modal:
- All expiration records for selected item
- Date, Quantity, Stock Before/After
- Expired By (user name)
- Notes

## Implementation Steps

### Phase 1: Database Setup
1. ✅ Create `stock_expiration` table
2. ✅ Create `expire_stock()` RPC function
3. ✅ Create `expiration_summary` view
4. ✅ Create `get_expiration_details()` RPC function
5. ✅ Set up RLS policies

### Phase 2: Backend Types
1. Update `database.types.ts` with new types
2. Create TypeScript interfaces

### Phase 3: Store & API
1. Create `expirationStore.ts`
2. Implement API calls for:
   - Fetching available items
   - Expiring stock
   - Fetching history
   - Fetching details

### Phase 4: UI Components
1. Create `ExpirationPage.tsx`
2. Create `ExpireStockForm.tsx`
3. Create `ExpirationHistoryTable.tsx`
4. Create `ExpirationDetailsModal.tsx`

### Phase 5: Integration
1. Add route to app
2. Add menu item to sidebar
3. Test all flows
4. Handle edge cases

## Key Features

✅ **Multi-type Support:** Raw materials, tea stock, products
✅ **SKU Detection:** Auto-fetch for ready-to-use products
✅ **Current Stock Display:** Real-time quantity
✅ **Unit Auto-fetch:** Non-editable, from stock records
✅ **Atomic Operations:** RPC ensures data consistency
✅ **Consolidated History:** Group by item name
✅ **Detailed View:** Full expiration log per item
✅ **Stock Validation:** Prevents over-expiration
✅ **Multi-tenant:** Store-specific data
✅ **Audit Trail:** Track who expired what and when

## Next Steps

1. Run database migrations
2. Generate TypeScript types
3. Implement frontend components
4. Test thoroughly
5. Deploy

---

**Status:** Ready for implementation
**Estimated Time:** 4-6 hours
**Priority:** High
