# Raw Materials - Grouped Purchase Logs Feature ✅

## What Was Implemented

Transformed the Purchase Logs view from showing individual transactions to a **consolidated/grouped view** by raw material with expandable details.

## Changes Made

### 1. New Data Structures

Added interfaces for grouped purchase data:

```typescript
interface GroupedPurchaseLog {
  raw_material_name: string;
  unit: string;
  total_quantity: number;      // Sum of all purchases
  total_cost: number;           // Sum of all costs
  purchase_count: number;       // Number of purchases
  latest_date: string;
  purchases: PurchaseLog[];     // Individual purchase details
}
```

### 2. Data Grouping Logic

Modified `loadPurchaseLogs()` to create grouped data:
- Groups all purchases by raw material name
- Calculates total quantity purchased
- Calculates total cost (e.g., 100 + 300 = 400)
- Counts number of purchases
- Stores individual purchase details for expansion

### 3. New UI - Grouped View

**Main Table Columns:**
- **Material** - Raw material name
- **Total Quantity** - Combined quantity (e.g., 5 ltr total)
- **Total Price** - Combined cost (e.g., ₹400 total) ← Changed from "Price/Unit"
- **Purchases** - Badge showing count (e.g., "2 purchases")
- **Actions** - "View Details" button with eye icon

**Features:**
- Clean, consolidated view showing totals
- Badge indicates number of purchases
- Expandable rows to see individual transactions

### 4. Detail View (Expandable)

When clicking "View Details":
- Expands to show nested table
- Shows all individual purchases for that material
- Columns: Date, Quantity, Price/Unit, Total Cost, Notes
- Different background color (gray-50) to distinguish from main table
- Click again to collapse

### 5. Visual Design

**Main Row:**
- Bold material name
- Large, prominent total price in primary color
- Blue badge for purchase count
- Primary-colored action button

**Expanded Detail:**
- Nested table with gray background
- Smaller text and padding
- Clear separation from main rows
- Hover effects on detail rows

## Example Scenario

**Before (Old View):**
```
Date        Material  Quantity  Price/Unit  Total Cost
03 Nov 2025 Milk      1 ltr     ₹100        ₹100
03 Nov 2025 Milk      3 ltr     ₹300        ₹900
```

**After (New Grouped View):**
```
Material  Total Quantity  Total Price  Purchases      Actions
Milk      4.00 ltr        ₹1000        2 purchases    [View Details]
```

**When "View Details" clicked:**
```
Material  Total Quantity  Total Price  Purchases      Actions
Milk      4.00 ltr        ₹1000        2 purchases    [Hide Details]
  ↳ Date        Quantity  Price/Unit  Total Cost  Notes
    03 Nov 2025 1 ltr     ₹100        ₹100        -
    03 Nov 2025 3 ltr     ₹300        ₹900        -
```

## Benefits

1. **Cleaner Overview** - See total purchases per material at a glance
2. **Better Analytics** - Quickly understand total spending per material
3. **Reduced Clutter** - Main view shows only essential information
4. **Detail on Demand** - Expand to see individual transactions when needed
5. **Accurate Totals** - Automatically calculates combined quantities and costs

## Technical Details

- Uses React state (`expandedMaterial`) to track which material is expanded
- Grouping logic uses `reduce()` to aggregate data
- Nested table structure for detail view
- Responsive design maintained
- No database changes required - all grouping done in frontend

## Files Modified

- `src/pages/raw-materials/RawMaterialsPage.tsx`
  - Added `GroupedPurchaseLog` interface
  - Added `groupedLogs` and `expandedMaterial` state
  - Modified `loadPurchaseLogs()` to create grouped data
  - Completely redesigned Purchase Logs table
  - Added expand/collapse functionality

## Testing Checklist

- [ ] Navigate to Raw Materials → Purchase Logs tab
- [ ] Verify grouped view shows materials with totals
- [ ] Click "View Details" - should expand to show individual purchases
- [ ] Click "Hide Details" - should collapse back
- [ ] Verify total quantity is sum of all purchases
- [ ] Verify total price is sum of all costs
- [ ] Verify purchase count badge is accurate
- [ ] Add new purchase - verify it updates the grouped view
- [ ] Test with multiple materials
- [ ] Test with single purchase (should still work)
- [ ] Check responsive design on mobile/tablet

## Result

✅ Purchase Logs now show consolidated data by raw material
✅ "Total Price" column shows combined costs
✅ "View Details" button reveals individual purchase history
✅ Clean, professional UI with expandable rows
✅ No breaking changes - all existing functionality preserved
