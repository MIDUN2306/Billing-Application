# Refill Modal Database Fix

## Issue
When trying to produce products using the refill modal, the system was throwing 400 errors:
```
Failed to load resource: the server responded with a status of 400
Error refilling product: Object
```

## Root Cause
The `last_recipe_batch_id` column didn't exist in the `products` table, causing the update query to fail.

## Solution

### 1. Added Missing Column
Created migration to add the `last_recipe_batch_id` column:

```sql
-- Add last_recipe_batch_id column to products table
ALTER TABLE products 
ADD COLUMN last_recipe_batch_id uuid REFERENCES recipe_batches(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX idx_products_last_recipe_batch_id ON products(last_recipe_batch_id);

-- Add comment
COMMENT ON COLUMN products.last_recipe_batch_id IS 'Tracks which recipe batch/draft was used for the last production of this product';
```

### 2. Improved Error Handling
Updated error handling to show more detailed error messages:

```typescript
catch (error: any) {
  console.error('Error refilling product:', error);
  const errorMessage = error?.message || error?.error_description || 'Failed to refill product';
  toast.error(errorMessage);
}
```

## Database Schema Update

### products Table - New Column:
- **last_recipe_batch_id** (uuid, nullable)
  - Foreign key to `recipe_batches(id)`
  - ON DELETE SET NULL (if recipe batch is deleted, this becomes null)
  - Tracks which recipe draft was used for last production
  - Indexed for performance

## Benefits

### For Tracking:
- ✅ Know which recipe was used for each production
- ✅ Analyze recipe usage patterns
- ✅ Compare costs between different recipes
- ✅ Quality control and consistency tracking

### For Analytics:
- Which recipes are most popular?
- Which recipes are most cost-effective?
- Recipe usage trends over time
- A/B testing results

### For Users:
- See which recipe was last used
- Quickly repeat successful productions
- Track recipe performance

## Migration Applied
- **Migration Name:** `add_last_recipe_batch_id_to_products`
- **Status:** ✅ Successfully applied
- **Timestamp:** Current

## Testing

### Test Scenarios:
1. ✅ Produce product with Standard Recipe
2. ✅ Produce product with custom draft
3. ✅ Produce product without ingredients (simple product)
4. ✅ Switch between drafts and produce
5. ✅ Check that last_recipe_batch_id is saved correctly

### Expected Behavior:
- Products with ingredients save the recipe batch ID
- Simple products (no ingredients) have NULL for last_recipe_batch_id
- Switching drafts updates the saved ID on next production
- Deleting a recipe batch sets the field to NULL (not an error)

## Files Modified
- `src/pages/products/RefillProductModal.tsx` (error handling)
- Database: `products` table (new column)

## Status: ✅ COMPLETE

The refill modal now successfully saves which recipe draft was used for each production, and the 400 errors are resolved.
