# Store Name Header Update Fix

## Problem
When updating a store name in the Admin Panel (e.g., changing "Tea Boys Main Store" to "Skywalk"), the change was saved to the database but the header navbar still showed the old store name.

## Root Cause
The `StoresTab` component was updating the database and reloading the stores list, but it wasn't refreshing the `currentStore` object in the `storeStore` that the Header component uses to display the store name.

## Solution
Added calls to `refreshCurrentStore()` after store updates in the Admin Panel:

### Changes Made to `src/pages/admin/StoresTab.tsx`:

1. **Imported the store hook**:
   ```typescript
   import { useStoreStore } from '../../stores/storeStore';
   ```

2. **Added the refresh function**:
   ```typescript
   const { refreshCurrentStore } = useStoreStore();
   ```

3. **Called refresh after editing a store**:
   ```typescript
   onSuccess={() => {
     setEditingStore(null);
     loadStores();
     refreshCurrentStore(); // Refresh the header store name
   }}
   ```

4. **Called refresh after creating a store**:
   ```typescript
   onSuccess={() => {
     setShowCreateModal(false);
     loadStores();
     refreshCurrentStore(); // Refresh in case this affects the current store
   }}
   ```

## How It Works
- The `refreshCurrentStore()` function fetches the latest data for the current store from the database
- It updates the `currentStore` object in the store state
- The Header component reactively updates to show the new store name
- The store name is also persisted in localStorage via Zustand's persist middleware

## Testing
1. Go to Admin Panel → Stores tab
2. Edit a store and change its name
3. Save the changes
4. The header should immediately show the updated store name

## Technical Details
- The fix uses the existing `refreshCurrentStore()` function from `storeStore.ts`
- No database schema changes required
- No breaking changes to existing functionality
- The store state is properly synchronized between the admin panel and the header
