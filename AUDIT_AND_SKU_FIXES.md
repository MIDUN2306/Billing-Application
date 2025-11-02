# Audit Logs and SKU Constraint Fixes

## Issues Fixed

### 1. Audit Logs Action Case Mismatch (Error 400)
**Problem:**
- The `audit_logs` table has a check constraint expecting lowercase values: 'insert', 'update', 'delete'
- The trigger function `create_audit_log_optimized()` was inserting uppercase values from `TG_OP`: 'INSERT', 'UPDATE', 'DELETE'
- This caused: `new row for relation "audit_logs" violates check constraint "audit_logs_action_check"`

**Solution:**
- Updated the `create_audit_log_optimized()` function to convert `TG_OP` to lowercase using `LOWER(TG_OP)`
- Now the action values match the constraint requirements

**Migration:** `fix_audit_logs_action_case`

### 2. Products Table SKU Unique Constraint (Error 409)
**Problem:**
- The `products` table had a unique constraint on SKU that didn't allow multiple NULL values
- When creating products without SKUs, the second product would fail with a 409 conflict

**Solution:**
- Dropped the old unique constraint `products_sku_key`
- Created a partial unique index `products_sku_unique_idx` that only enforces uniqueness for non-NULL SKU values
- Multiple products can now have NULL SKUs without conflicts

**Migration:** `fix_products_sku_unique_constraint`

### 3. Product Templates SKU Unique Constraint (Previously Fixed)
**Problem:**
- Same issue as products table - couldn't have multiple NULL SKUs

**Solution:**
- Already fixed in previous migration: `fix_product_template_sku_unique_constraint`
- Uses partial unique index to allow multiple NULL values

## Constraint Summary

### Product Names
- **Unique Constraint:** `(name, store_id)` - Each product name must be unique per store
- **SKU Constraint:** Partial unique index on `(sku, store_id)` - SKU must be unique per store when provided

### Product Templates
- **SKU Constraint:** Partial unique index - SKU must be unique when provided, allows multiple NULLs

### Products
- **SKU Constraint:** Partial unique index - SKU must be unique when provided, allows multiple NULLs

## Testing
After these fixes, you should be able to:
1. ✅ Create products without SKUs (multiple NULL SKUs allowed)
2. ✅ Create products with SKUs (must be unique)
3. ✅ Create product names with or without SKUs
4. ✅ Audit logs will properly record insert/update/delete actions

## Error Codes Resolved
- **409 Conflict:** Fixed by allowing multiple NULL SKUs
- **400 Bad Request:** Fixed by using lowercase action values in audit logs
- **23514 Check Constraint:** Fixed by matching case in audit function
