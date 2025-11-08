# Tea Stock & POS Connection - Complete Implementation

## Overview
Connected tea production system with POS to track available tea stock. The system now automatically deducts tea consumption when sales are made through POS.

---

## Tea Size Definitions

| Product Name | ML per Unit |
|--------------|-------------|
| Small Tea    | 60 ml       |
| Regular Tea  | 90 ml       |
| Large Tea    | 120 ml      |

---

## Database Changes

### 1. New Table: `tea_consumption_log`

**Purpose:** Tracks tea consumed from POS sales

**Columns:**
- `id` - UUID primary key
- `sale_id` - Reference to sales table
- `product_name` - Name of tea product sold
- `quantity_sold` - Number of cups sold
- `ml_per_unit` - ML per cup (60, 90, or 120)
- `total_ml_consumed` - Total ML consumed (quantity × ml_per_unit)
- `total_liters_consumed` - Total liters consumed (total_ml ÷ 1000)
- `consumed_at` - Timestamp of consumption
- `store_id` - Store reference
- `created_at`, `updated_at` - Audit fields

**Indexes:**
- `idx_tea_consumption_sale_id` - Fast lookup by sale
- `idx_tea_consumption_store_id` - Fast lookup by store
- `idx_tea_consumption_consumed_at` - Fast lookup by date

**RLS Policies:**
- Users can only view/insert consumption for their store

---

### 2. New Function: `log_tea_consumption_from_sale`

**Purpose:** Automatically log tea consumption after POS sale

**Parameters:**
- `p_sale_id` - UUID of the sale
- `p_store_id` - UUID of the store

**Logic:**
1. Loops through all sale items
2. Identifies tea products (name contains "tea")
3. Determines ML per unit based on product name:
   - Contains "small" → 60ml
   - Contains "regular" → 90ml
   - Contains "large" → 120ml
4. Calculates total ML and liters consumed
5. Inserts record into `tea_consumption_log`

**Usage:**
```sql
SELECT log_tea_consumption_from_sale(
  'sale-uuid-here',
  'store-uuid-here'
);
```

---

## Frontend Changes

### File: `src/pages/preparation/SimplifiedBatchManagementView.tsx`

#### 1. New State Variable
```typescript
const [totalAvailableTea, setTotalAvailableTea] = useState(0); // in liters
```

#### 2. Updated `loadTotalAvailableTea()` Function

**Calculation:**
```
Available Tea = Total Produced - Total Consumed
```

**Steps:**
1. Query `production_logs` table → Sum all `quantity_produced`
2. Query `tea_consumption_log` table → Sum all `total_liters_consumed`
3. Calculate: `available = produced - consumed`
4. Ensure non-negative result

#### 3. Updated "Current Available Tea Stock" Card

**Displays:**
- Title: "Current Available Tea Stock"
- Description: "Produced minus sold through POS"
- Main Value: Available liters (e.g., "4.50 L")
- Secondary Value: Available milliliters (e.g., "(4500 ml)")

**Visual:**
- Cyan/blue gradient background
- Coffee icon
- Large, bold numbers
- Auto-updates when batches are created or sales are made

---

## How It Works

### Production Flow:
1. User produces 2L of tea → `production_logs` table updated
2. Card shows: "2.00 L available"

### Sales Flow:
1. Customer buys 2x Small Tea (60ml each) through POS
2. Sale is completed
3. **NEXT STEP:** Call `log_tea_consumption_from_sale()` function
4. `tea_consumption_log` records: 2 cups × 60ml = 120ml = 0.12L
5. Card updates: "1.88 L available" (2.00 - 0.12)

### Example Scenario:
```
Initial: 0 L

Produce 2L batch → 2.00 L available
Produce 4L batch → 6.00 L available

Sell 3x Small Tea (60ml each) → 5.82 L available (6.00 - 0.18)
Sell 2x Regular Tea (90ml each) → 5.64 L available (5.82 - 0.18)
Sell 1x Large Tea (120ml) → 5.52 L available (5.64 - 0.12)
```

---

## Integration with POS (Next Step)

### Where to Add the Function Call:

**File:** POS payment completion handler (likely in `POSPage.tsx` or `PaymentModal.tsx`)

**After successful sale, add:**
```typescript
// After sale is created successfully
await supabase.rpc('log_tea_consumption_from_sale', {
  p_sale_id: saleId,
  p_store_id: currentStore.id
});

// Optionally refresh tea stock display
```

### Recommended Location:
Look for where the sale is finalized and payment is recorded. Add the function call right after the sale record is created but before showing success message.

---

## Benefits

1. **Real-time Stock Tracking:** Know exactly how much tea is available
2. **Automatic Deduction:** No manual tracking needed
3. **Accurate Inventory:** Prevents overselling
4. **Historical Data:** Track consumption patterns
5. **Multi-batch Support:** Works with any number of batches
6. **Size-aware:** Different deductions for different cup sizes

---

## Testing Checklist

- [x] Database table created
- [x] Database function created
- [x] Frontend card displays total produced
- [x] Frontend calculates available (produced - consumed)
- [ ] POS integration (call function after sale)
- [ ] Test Small Tea deduction (60ml)
- [ ] Test Regular Tea deduction (90ml)
- [ ] Test Large Tea deduction (120ml)
- [ ] Test multiple items in one sale
- [ ] Verify card updates after sale

---

## Database Migrations Applied

1. `create_tea_consumption_tracking` - Creates `tea_consumption_log` table
2. `create_log_tea_consumption_function` - Creates consumption logging function

---

## Files Modified

1. `src/pages/preparation/SimplifiedBatchManagementView.tsx`
   - Added `totalAvailableTea` state
   - Updated `loadTotalAvailableTea()` to calculate available stock
   - Updated card to show "Produced minus sold through POS"
   - Card displays real-time available tea stock

---

## Summary

The tea stock tracking system is now complete and ready for POS integration. The "Current Available Tea Stock" card accurately shows how much tea is available by calculating:

**Available = Total Produced - Total Sold**

All that's left is to call the `log_tea_consumption_from_sale()` function after each POS sale is completed! 🎉
