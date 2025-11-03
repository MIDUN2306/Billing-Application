# Dashboard Raw Materials Table Structure Fix

## Issue
The raw materials modal was querying non-existent columns and relationships.

## Errors
1. **Supplier relationship error**: `Could not find a relationship between 'raw_material_purchases' and 'suppliers'`
2. **Column name error**: Table uses `purchase_price` not `unit_cost`

## Root Cause
The `raw_material_purchases` table structure was different from what the modal expected.

## Actual Table Structure
```sql
raw_material_purchases table columns:
- id (uuid)
- raw_material_id (uuid) → FK to raw_materials
- store_id (uuid)
- quantity (numeric)
- unit (text)
- purchase_price (numeric)  ← Not unit_cost
- total_cost (numeric)
- purchase_date (timestamp)
- notes (text)
- created_at (timestamp)
- updated_at (timestamp)

Note: NO supplier_id or relationship to suppliers table
```

## Changes Made

### 1. RawMaterialsDetailsModal.tsx

**Removed:**
- `suppliers` relationship query
- `supplier_name` from interface and display
- "Supplier" column from table

**Changed:**
- `unit_cost` → `purchase_price`
- Query now gets `unit` from the purchases table directly (not from raw_materials)
- Simplified query to only fetch existing columns

**New Table Columns:**
1. Raw Material (name)
2. Quantity (with unit)
3. Purchase Price
4. Total Cost
5. Time

### 2. Interface Update
```typescript
// Before
interface RawMaterialPurchase {
  id: string;
  raw_material_name: string;
  quantity: number;
  unit: string;
  unit_cost: number;  // ❌ Wrong
  total_cost: number;
  purchase_date: string;
  supplier_name: string | null;  // ❌ Doesn't exist
}

// After
interface RawMaterialPurchase {
  id: string;
  raw_material_name: string;
  quantity: number;
  unit: string;
  purchase_price: number;  // ✅ Correct
  total_cost: number;
  purchase_date: string;
  // supplier_name removed
}
```

### 3. Query Update
```typescript
// Before
.select(`
  id,
  quantity,
  unit_cost,  // ❌ Wrong column
  total_cost,
  purchase_date,
  raw_materials (
    name,
    unit
  ),
  suppliers (  // ❌ No relationship
    name
  )
`)

// After
.select(`
  id,
  quantity,
  unit,  // ✅ From purchases table
  purchase_price,  // ✅ Correct column
  total_cost,
  purchase_date,
  raw_materials (
    name
  )
`)
```

### 4. Documentation Updates
Updated all references in:
- DASHBOARD_VISUAL_GUIDE.md
- DASHBOARD_QUICK_REFERENCE.md
- DASHBOARD_TESTING_GUIDE.md

Changed table structure from:
- ~~Raw Material | Supplier | Quantity | Unit Cost | Total Cost | Time~~

To:
- **Raw Material | Quantity | Purchase Price | Total Cost | Time**

## Testing
✅ TypeScript compilation: SUCCESS
✅ Build: SUCCESS
✅ No diagnostics errors
✅ Query matches actual table structure

## Status
**FIXED** ✅

The modal now correctly queries the `raw_material_purchases` table without trying to access non-existent columns or relationships.

## Note
The raw materials system doesn't track suppliers at the purchase level. If supplier tracking is needed, the database schema would need to be updated to add a `supplier_id` column to the `raw_material_purchases` table.
