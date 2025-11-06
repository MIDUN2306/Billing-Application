# Flexible Pricing Input System - Complete

## Overview
Implemented a flexible pricing input system that allows users to enter either **price per unit** OR **total price**, with automatic calculation of the per-unit cost for storage.

## Problem Solved
Previously, users could only enter price per unit. This was inconvenient when:
- Buying in bulk with a total price (e.g., "₹1000 for 10 kg")
- Receiving invoices showing only total amounts
- Calculating unit costs manually was error-prone

## Solution Implemented

### Dual Input Modes
Users can toggle between two pricing modes:

#### 1. Per Unit Mode (Default)
- Enter: Price per unit (e.g., ₹100/kg)
- System calculates: Total cost automatically
- **Example:** 10 kg × ₹100/kg = ₹1,000 total

#### 2. Total Price Mode
- Enter: Total price for the quantity (e.g., ₹1,000 for 10 kg)
- System calculates: Per unit cost automatically
- **Example:** ₹1,000 ÷ 10 kg = ₹100/kg

### Where Implemented
1. ✅ **Add Stock Form** (RawMaterialStockForm.tsx)
2. ✅ **Edit Stock Form** (RawMaterialStockForm.tsx)
3. ✅ **Refill Stock Modal** (RefillRawMaterialModal.tsx)

## User Interface

### Mode Toggle
```
┌─────────────────────────────────┐
│ Purchase Price *  [Per Unit|Total Price] │
└─────────────────────────────────┘
```

### Per Unit Mode
```
┌─────────────────────────────────┐
│ Purchase Price *  [Per Unit|Total Price] │
│                                  │
│ ₹ [100.00]                      │
│ Price per kg                     │
│                                  │
│ ┌─────────────────────────────┐ │
│ │ Total Cost: ₹1,000.00       │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### Total Price Mode
```
┌─────────────────────────────────┐
│ Purchase Price *  [Per Unit|Total Price] │
│                                  │
│ ₹ [1000.00]                     │
│ Total price for 10 kg            │
│                                  │
│ ┌─────────────────────────────┐ │
│ │ Per Unit Cost: ₹100.00/kg   │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

## Technical Implementation

### State Management
```typescript
const [priceMode, setPriceMode] = useState<'per_unit' | 'total'>('per_unit');
const [totalPrice, setTotalPrice] = useState('0');
const [formData, setFormData] = useState({
  quantity: '0',
  purchase_price: '0', // Always stores per-unit price
  // ...
});
```

### Calculation Logic

#### Per Unit Mode → Total Price
```typescript
const qty = parseFloat(formData.quantity) || 0;
const price = parseFloat(formData.purchase_price) || 0;
const total = (qty * price).toFixed(2);
```

#### Total Price → Per Unit
```typescript
const qty = parseFloat(formData.quantity) || 1;
const total = parseFloat(totalPrice) || 0;
const perUnit = qty > 0 ? (total / qty).toFixed(2) : '0.00';
```

### Real-time Updates
- Changing quantity recalculates prices
- Changing price recalculates totals
- Switching modes preserves calculations
- All calculations happen instantly

## Use Cases

### Scenario 1: Bulk Purchase with Total Price
**Situation:** Bought 50 kg of flour for ₹2,500

**Steps:**
1. Select "Total Price" mode
2. Enter quantity: 50 kg
3. Enter total price: ₹2,500
4. System calculates: ₹50/kg
5. Saves ₹50/kg to database

### Scenario 2: Unit Price Known
**Situation:** Milk costs ₹60 per liter

**Steps:**
1. Keep "Per Unit" mode (default)
2. Enter quantity: 10 ltr
3. Enter price: ₹60
4. System shows: Total ₹600
5. Saves ₹60/ltr to database

### Scenario 3: Invoice with Total Amount
**Situation:** Invoice shows "10 boxes of eggs - ₹1,200"

**Steps:**
1. Switch to "Total Price" mode
2. Enter quantity: 10 boxes
3. Enter total: ₹1,200
4. System calculates: ₹120/box
5. Saves ₹120/box to database

## Benefits

### For Users:
- ✅ **Flexibility**: Enter data as it appears on invoices
- ✅ **No Manual Calculation**: System does the math
- ✅ **Error Reduction**: Eliminates calculation mistakes
- ✅ **Time Saving**: Faster data entry
- ✅ **Convenience**: Works with any pricing format

### For Business:
- ✅ **Accurate Costing**: Correct per-unit costs always stored
- ✅ **Better Analytics**: Consistent data for reporting
- ✅ **Inventory Valuation**: Precise cost tracking
- ✅ **Profit Margins**: Accurate cost basis for pricing

### For System:
- ✅ **Data Consistency**: Always stores per-unit price
- ✅ **Database Integrity**: No schema changes needed
- ✅ **Backward Compatible**: Works with existing data
- ✅ **Calculation Accuracy**: 2 decimal precision

## Examples

### Example 1: Tea Powder
- **Quantity:** 5 kg
- **Total Price:** ₹2,500
- **Calculated:** ₹500/kg
- **Stored:** purchase_price = 500.00

### Example 2: Milk
- **Quantity:** 20 ltr
- **Per Unit:** ₹60/ltr
- **Calculated:** ₹1,200 total
- **Stored:** purchase_price = 60.00

### Example 3: Eggs
- **Quantity:** 100 pcs
- **Total Price:** ₹600
- **Calculated:** ₹6/pcs
- **Stored:** purchase_price = 6.00

## Edge Cases Handled

### Division by Zero
```typescript
const perUnit = qty > 0 ? (total / qty).toFixed(2) : '0.00';
```
- If quantity is 0, per-unit price defaults to 0
- Prevents NaN or Infinity errors

### Decimal Precision
```typescript
.toFixed(2)
```
- All prices rounded to 2 decimal places
- Consistent with currency standards

### Real-time Sync
- Quantity changes update both modes
- Mode switching preserves current values
- No data loss when toggling

## Database Storage

### What Gets Stored
```sql
INSERT INTO raw_material_stock (
  purchase_price  -- Always per-unit price (₹/unit)
);

INSERT INTO raw_material_purchases (
  purchase_price,  -- Per-unit price (₹/unit)
  total_cost       -- Calculated: quantity × purchase_price
);
```

### Calculation Example
```
User Input (Total Mode):
- Quantity: 10 kg
- Total Price: ₹1,000

Stored in Database:
- purchase_price: 100.00  (₹1,000 ÷ 10)
- quantity: 10
- total_cost: 1000.00     (10 × 100)
```

## Visual Feedback

### Active Mode Indicator
- Selected mode: White background, primary color text, shadow
- Inactive mode: Gray background, gray text
- Smooth transitions

### Calculation Display
- Blue background box
- Shows complementary calculation
- Updates in real-time
- Clear labeling

### Helper Text
- "Price per kg" in per-unit mode
- "Total price for 10 kg" in total mode
- Dynamic unit display

## Files Modified
1. `src/pages/raw-materials/RawMaterialStockForm.tsx`
2. `src/pages/raw-materials/RefillRawMaterialModal.tsx`

## Testing Checklist
- [x] Per unit mode calculates total correctly
- [x] Total mode calculates per-unit correctly
- [x] Quantity changes update calculations
- [x] Mode toggle preserves values
- [x] Edge cases handled (zero, decimals)
- [x] Database stores per-unit price
- [x] UI is intuitive and clear
- [x] No TypeScript errors

## Status: ✅ COMPLETE

Users can now enter pricing data in whichever format is most convenient, and the system automatically calculates and stores the per-unit cost accurately.
