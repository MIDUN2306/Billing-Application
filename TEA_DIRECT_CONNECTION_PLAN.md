# Tea Production ↔ POS Direct Connection Plan

## 🎯 Goal
Connect tea production directly to POS **without** requiring products to be created in the Products page. Tea should exist only in the production system and be automatically available in POS based on what's produced.

## 📊 Current System Analysis

### Current Flow (PROBLEM):
```
1. Produce tea in Preparation page → production_logs table
2. Create products manually in Products page → products table
3. Products appear in POS → v_pos_products_with_stock view
4. Sell in POS → deduct from products table
5. Log consumption → tea_consumption_log table
```

**Issues:**
- ❌ Requires manual product creation
- ❌ Two separate stock systems (production vs products)
- ❌ No direct connection between production and POS
- ❌ Confusing for users

### Desired Flow (SOLUTION):
```
1. Produce tea in Preparation page → production_logs table
2. Tea automatically appears in POS (no product creation needed)
3. Sell in POS → deduct from production stock
4. Log consumption → tea_consumption_log table
5. Stock = Total Produced - Total Consumed
```

**Benefits:**
- ✅ No manual product creation needed
- ✅ Single source of truth (production_logs)
- ✅ Direct connection between production and POS
- ✅ Simple and intuitive

## 🏗️ Architecture Design

### Database Layer

#### 1. Create Virtual Tea Products View
```sql
CREATE OR REPLACE VIEW v_tea_products_for_pos AS
SELECT 
  'tea_small'::text as id,
  'Small Tea'::text as name,
  'TEA-S'::text as sku,
  'Tea'::text as category,
  60 as ml_per_unit,
  0.060 as liters_per_unit,
  -- Calculate available stock
  (
    SELECT COALESCE(SUM(quantity_produced), 0) - COALESCE(
      (SELECT SUM(total_liters_consumed) 
       FROM tea_consumption_log 
       WHERE LOWER(TRIM(product_name)) = 'small tea' 
       AND store_id = pl.store_id), 0
    )
    FROM production_logs pl
    WHERE unit = 'L' AND store_id = pl.store_id
  ) as available_liters,
  -- Convert to servings
  FLOOR(
    (
      SELECT COALESCE(SUM(quantity_produced), 0) - COALESCE(
        (SELECT SUM(total_liters_consumed) 
         FROM tea_consumption_log 
         WHERE LOWER(TRIM(product_name)) = 'small tea' 
         AND store_id = pl.store_id), 0
      )
      FROM production_logs pl
      WHERE unit = 'L' AND store_id = pl.store_id
    ) / 0.060
  ) as available_servings,
  store_id
FROM production_logs
WHERE unit = 'L'
GROUP BY store_id

UNION ALL

SELECT 
  'tea_regular'::text as id,
  'Regular Tea'::text as name,
  'TEA-R'::text as sku,
  'Tea'::text as category,
  90 as ml_per_unit,
  0.090 as liters_per_unit,
  -- Calculate available stock for Regular Tea
  (
    SELECT COALESCE(SUM(quantity_produced), 0) - COALESCE(
      (SELECT SUM(total_liters_consumed) 
       FROM tea_consumption_log 
       WHERE LOWER(TRIM(product_name)) = 'regular tea' 
       AND store_id = pl.store_id), 0
    )
    FROM production_logs pl
    WHERE unit = 'L' AND store_id = pl.store_id
  ) as available_liters,
  FLOOR(
    (
      SELECT COALESCE(SUM(quantity_produced), 0) - COALESCE(
        (SELECT SUM(total_liters_consumed) 
         FROM tea_consumption_log 
         WHERE LOWER(TRIM(product_name)) = 'regular tea' 
         AND store_id = pl.store_id), 0
      )
      FROM production_logs pl
      WHERE unit = 'L' AND store_id = pl.store_id
    ) / 0.090
  ) as available_servings,
  store_id
FROM production_logs
WHERE unit = 'L'
GROUP BY store_id

UNION ALL

SELECT 
  'tea_large'::text as id,
  'Large Tea'::text as name,
  'TEA-L'::text as sku,
  'Tea'::text as category,
  120 as ml_per_unit,
  0.120 as liters_per_unit,
  -- Calculate available stock for Large Tea
  (
    SELECT COALESCE(SUM(quantity_produced), 0) - COALESCE(
      (SELECT SUM(total_liters_consumed) 
       FROM tea_consumption_log 
       WHERE LOWER(TRIM(product_name)) = 'large tea' 
       AND store_id = pl.store_id), 0
    )
    FROM production_logs pl
    WHERE unit = 'L' AND store_id = pl.store_id
  ) as available_liters,
  FLOOR(
    (
      SELECT COALESCE(SUM(quantity_produced), 0) - COALESCE(
        (SELECT SUM(total_liters_consumed) 
         FROM tea_consumption_log 
         WHERE LOWER(TRIM(product_name)) = 'large tea' 
         AND store_id = pl.store_id), 0
      )
      FROM production_logs pl
      WHERE unit = 'L' AND store_id = pl.store_id
    ) / 0.120
  ) as available_servings,
  store_id
FROM production_logs
WHERE unit = 'L'
GROUP BY store_id;
```

#### 2. Create Tea Pricing Table
```sql
CREATE TABLE tea_pricing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  tea_size TEXT NOT NULL CHECK (tea_size IN ('small', 'regular', 'large')),
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, tea_size)
);

-- Default prices
INSERT INTO tea_pricing (store_id, tea_size, price)
SELECT id, 'small', 10.00 FROM stores
UNION ALL
SELECT id, 'regular', 15.00 FROM stores
UNION ALL
SELECT id, 'large', 20.00 FROM stores
ON CONFLICT (store_id, tea_size) DO NOTHING;
```

#### 3. Create Combined POS Products View
```sql
CREATE OR REPLACE VIEW v_pos_products_combined AS
-- Regular products from products table
SELECT 
  p.id,
  p.name,
  p.sku,
  COALESCE(c.name, 'Uncategorized') as category,
  p.mrp as price,
  COALESCE(i.quantity, 0) as stock_quantity,
  'product' as source_type,
  p.store_id
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN inventory i ON p.id = i.product_id AND p.store_id = i.store_id
WHERE p.is_active = true

UNION ALL

-- Virtual tea products from production
SELECT 
  t.id,
  t.name,
  t.sku,
  t.category,
  COALESCE(tp.price, 0) as price,
  t.available_servings as stock_quantity,
  'tea' as source_type,
  t.store_id
FROM v_tea_products_for_pos t
LEFT JOIN tea_pricing tp ON t.store_id = tp.store_id 
  AND LOWER(REPLACE(t.name, ' Tea', '')) = tp.tea_size
WHERE t.available_servings > 0;
```

### Frontend Layer

#### 1. Update POS to Load Combined Products
```typescript
// In POSPageNew.tsx
const loadProducts = async () => {
  const { data, error } = await supabase
    .from('v_pos_products_combined')
    .select('*')
    .eq('store_id', currentStore.id)
    .order('category')
    .order('name');
    
  if (error) throw error;
  setProducts(data || []);
};
```

#### 2. Update Payment Modal to Handle Tea Sales
```typescript
// In PaymentModalNew.tsx - completeSale function
const completeSale = async () => {
  // ... existing sale creation code ...
  
  // Separate handling for tea vs regular products
  const teaItems = cart.filter(item => item.source_type === 'tea');
  const regularItems = cart.filter(item => item.source_type === 'product');
  
  // Handle regular products (existing logic)
  if (regularItems.length > 0) {
    // ... existing stock deduction ...
  }
  
  // Handle tea items (new logic)
  if (teaItems.length > 0) {
    const { error: teaError } = await supabase
      .rpc('log_tea_consumption_from_sale', {
        p_sale_id: sale.id,
        p_store_id: currentStore.id
      });
    
    if (teaError) {
      console.error('Tea consumption error:', teaError);
      toast.error('Tea stock update failed');
    }
  }
};
```

#### 3. Add Tea Pricing Management in Preparation Page
```typescript
// New component: TeaPricingModal.tsx
export function TeaPricingModal() {
  const [prices, setPrices] = useState({
    small: 10.00,
    regular: 15.00,
    large: 20.00
  });
  
  const savePrices = async () => {
    // Update tea_pricing table
    for (const [size, price] of Object.entries(prices)) {
      await supabase
        .from('tea_pricing')
        .upsert({
          store_id: currentStore.id,
          tea_size: size,
          price: price
        });
    }
  };
  
  return (
    // Modal UI for setting tea prices
  );
}
```

## 📝 Implementation Steps

### Phase 1: Database Setup
1. ✅ Create `tea_pricing` table
2. ✅ Create `v_tea_products_for_pos` view
3. ✅ Create `v_pos_products_combined` view
4. ✅ Insert default tea prices

### Phase 2: POS Integration
1. ✅ Update POSPageNew to load from `v_pos_products_combined`
2. ✅ Add `source_type` field to cart items
3. ✅ Update PaymentModalNew to handle tea vs regular products
4. ✅ Test tea products appear in POS after production

### Phase 3: Preparation Page Enhancement
1. ✅ Add Tea Pricing section in PreparationPage
2. ✅ Create TeaPricingModal component
3. ✅ Allow users to set prices for Small/Regular/Large tea
4. ✅ Show current prices in Tea Stock Summary card

### Phase 4: Testing & Validation
1. ✅ Test production → POS flow
2. ✅ Test sales → consumption logging
3. ✅ Test stock calculation accuracy
4. ✅ Test multi-store isolation

## 🎨 UI/UX Design

### Preparation Page Updates

#### Tea Stock Summary Card (Enhanced)
```
┌─────────────────────────────────────────────────────────┐
│ 🍵 Tea Stock Summary                    [Refresh] [⚙️]  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  📊 Total Produced    📉 Total Consumed   💧 Available  │
│     12.50 L              2.30 L             10.20 L     │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Available Servings:                                     │
│  • Small Tea (60ml):    170 servings    ₹10.00 each    │
│  • Regular Tea (90ml):  113 servings    ₹15.00 each    │
│  • Large Tea (120ml):   85 servings     ₹20.00 each    │
│                                                          │
│                              [Set Prices] [View Sales]  │
└─────────────────────────────────────────────────────────┘
```

#### Tea Pricing Modal
```
┌─────────────────────────────────────────┐
│ Set Tea Prices                    [×]   │
├─────────────────────────────────────────┤
│                                         │
│  Small Tea (60ml)                       │
│  ₹ [10.00]                              │
│                                         │
│  Regular Tea (90ml)                     │
│  ₹ [15.00]                              │
│                                         │
│  Large Tea (120ml)                      │
│  ₹ [20.00]                              │
│                                         │
│           [Cancel]  [Save Prices]       │
└─────────────────────────────────────────┘
```

### POS Page Updates

#### Tea Products Display
```
┌──────────────────────────────────────┐
│ 🍵 Small Tea              [In Cart: 2]│
│                                       │
│ Category: Tea                         │
│ SKU: TEA-S                            │
│                                       │
│ ₹10.00          Stock: 170 servings  │
└──────────────────────────────────────┘
```

## 🔄 Data Flow Diagram

```
┌─────────────────┐
│  Preparation    │
│     Page        │
└────────┬────────┘
         │
         │ 1. Produce Tea
         ↓
┌─────────────────┐
│ production_logs │
│   (12L tea)     │
└────────┬────────┘
         │
         │ 2. Calculate Stock
         ↓
┌──────────────────────┐
│ v_tea_products_for_  │
│        pos           │
│ (Small: 200 servings)│
│ (Regular: 133)       │
│ (Large: 100)         │
└────────┬─────────────┘
         │
         │ 3. Join with Pricing
         ↓
┌──────────────────────┐
│ v_pos_products_      │
│     combined         │
│ (Small: ₹10, 200)    │
│ (Regular: ₹15, 133)  │
│ (Large: ₹20, 100)    │
└────────┬─────────────┘
         │
         │ 4. Display in POS
         ↓
┌─────────────────┐
│   POS Page      │
│  (Tea Products) │
└────────┬────────┘
         │
         │ 5. Sell Tea
         ↓
┌─────────────────┐
│  sale_items     │
└────────┬────────┘
         │
         │ 6. Log Consumption
         ↓
┌──────────────────────┐
│ tea_consumption_log  │
│   (0.06L consumed)   │
└──────────────────────┘
         │
         │ 7. Update Stock
         ↓
┌──────────────────────┐
│ Available Stock      │
│ 12L - 0.06L = 11.94L │
└──────────────────────┘
```

## ✅ Success Criteria

1. ✅ Tea products appear in POS automatically after production
2. ✅ No need to create products in Products page
3. ✅ Stock shows available servings (not liters)
4. ✅ Prices can be set per store
5. ✅ Sales deduct from production stock
6. ✅ Stock calculation is accurate (Produced - Consumed)
7. ✅ Multi-store support works correctly
8. ✅ Real-time stock updates in POS

## 🚀 Benefits

### For Users:
- **Simpler workflow**: Produce → Sell (no product creation)
- **Single source of truth**: Production logs drive everything
- **Real-time accuracy**: Stock always reflects production minus sales
- **Flexible pricing**: Set prices per store

### For System:
- **Less data duplication**: No need for products table entries
- **Automatic sync**: Production and POS always in sync
- **Scalable**: Easy to add more tea types
- **Maintainable**: Clear separation of concerns

## 📌 Important Notes

1. **Tea products are virtual**: They don't exist in the products table
2. **Stock is calculated**: Based on production_logs and tea_consumption_log
3. **Prices are configurable**: Stored in tea_pricing table
4. **Multi-store support**: Each store has independent stock and pricing
5. **Backward compatible**: Regular products still work as before

---

**Status**: 📋 PLAN READY FOR IMPLEMENTATION
**Next Step**: Begin Phase 1 - Database Setup
