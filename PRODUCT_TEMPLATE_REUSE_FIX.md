# Product Template Reuse Fix

## Problem
When adding products, the system was **always creating a new product_template** every time, even if an identical template already existed. This caused:

1. **Duplicate SKU errors (409)**: If you tried to add the same product twice with the same SKU
2. **Database bloat**: Multiple identical templates for the same product
3. **Inconsistent data**: Same product could have different template IDs

### Error Message
```
duplicate key value violates unique constraint "product_templates_sku_unique_idx"
```

## Root Cause
The `ProductFormSimplified.tsx` component was directly inserting a new template without checking if one already exists:

```typescript
// OLD CODE - Always creates new template
const { data: template } = await supabase
  .from('product_templates')
  .insert([templateData])
  .select()
  .single();
```

## Solution
Implemented a **template reuse logic** that:

1. **Checks for existing templates** before creating new ones
2. **Matches templates** based on:
   - Product name ID
   - Unit
   - Product type (manufactured vs simple)
   - For manufactured products: ingredients and recipe yield must match exactly

3. **Reuses existing templates** when found
4. **Creates new templates** only when no match exists

### New Flow

#### For Simple Products:
1. Search for existing template with same product_name_id, unit, and has_ingredients=false
2. If found, reuse it
3. If not found, create new template

#### For Manufactured Products:
1. Search for existing templates with same product_name_id, unit, and has_ingredients=true
2. For each candidate template, check if:
   - Ingredients match (same raw materials, quantities, and units)
   - Recipe yield (producible_quantity) matches
3. If exact match found, reuse it
4. If not found, create new template

### Code Changes

**Template Lookup Logic:**
```typescript
// Try to find existing template by product_name_id
if (formData.product_name_id) {
  const { data: existingTemplates } = await supabase
    .from('product_templates')
    .select('*')
    .eq('product_name_id', formData.product_name_id)
    .eq('store_id', currentStore.id)
    .eq('unit', formData.unit)
    .eq('has_ingredients', isManufactured)
    .eq('is_active', true);

  // Find matching template...
}
```

**Ingredient Matching:**
```typescript
// Check if ingredients match exactly
const ingredientsMatch = ingredientRows.every(row => {
  return existingIngredients.some(existing => 
    existing.raw_material_id === row.raw_material_id &&
    parseFloat(existing.quantity_needed) === parseFloat(row.quantity_needed) &&
    existing.unit === row.unit
  );
});
```

**Conditional Ingredient Insert:**
```typescript
// Only insert ingredients if they don't exist
if (!existingIngredients || existingIngredients.length === 0) {
  // Insert ingredients...
}
```

## Benefits

1. **No more duplicate SKU errors**: Templates are reused instead of recreated
2. **Consistent data**: Same product always uses the same template
3. **Better performance**: Fewer database inserts
4. **Cleaner database**: No duplicate templates

## User Experience

### Before Fix:
- ❌ Add "Masala Tea" → Creates template #1
- ❌ Add "Masala Tea" again → Tries to create template #2 → **ERROR 409**

### After Fix:
- ✅ Add "Masala Tea" → Creates template #1
- ✅ Add "Masala Tea" again → Reuses template #1 → **SUCCESS**
- ✅ Add "Masala Tea" with different recipe → Creates template #2 → **SUCCESS**

## Edge Cases Handled

1. **Same product, different recipes**: Creates separate templates
2. **Same product, same recipe**: Reuses existing template
3. **Simple products**: Always reuses template for same product name
4. **Manufactured products**: Only reuses if ingredients AND yield match exactly

## Testing Scenarios

### Test 1: Add Same Simple Product Twice
1. Add "Biscuits" (simple product) with SKU "BIS-001"
2. Add "Biscuits" again with same SKU
3. **Expected**: Second product reuses first template, no error

### Test 2: Add Same Manufactured Product Twice
1. Add "Masala Tea" with recipe: 2L milk + 100g tea powder → 50 cups
2. Add "Masala Tea" again with same recipe
3. **Expected**: Second product reuses first template, no error

### Test 3: Add Same Product with Different Recipe
1. Add "Masala Tea" with recipe: 2L milk + 100g tea powder → 50 cups
2. Add "Masala Tea" with recipe: 3L milk + 150g tea powder → 75 cups
3. **Expected**: Creates two separate templates, both succeed

## Technical Notes

- Template matching is done before any inserts
- Ingredient comparison uses exact matching (raw_material_id, quantity, unit)
- Recipe yield must match exactly for manufactured products
- Only active templates are considered for reuse
- Store isolation is maintained (templates are store-specific)
