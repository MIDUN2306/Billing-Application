# Auto-Select Draft Fix - FINAL

## Root Cause Analysis

### The Problem
The quantity field was empty even though "Standard Recipe (Default)" appeared in the dropdown. This indicated that `handleDraftSelection()` was NOT being executed on initial load.

### Why It Failed
```typescript
// BEFORE (BROKEN):
setAvailableDrafts(draftsWithCounts);  // State update is async
setHasIngredients(true);

const draftToSelect = standardRecipe || defaultDraft || draftsWithCounts[0];
if (draftToSelect) {
  handleDraftSelection(draftToSelect.id);  // ❌ Tries to find draft in state
}

// Inside handleDraftSelection:
const draft = availableDrafts.find(d => d.id === draftId);  // ❌ availableDrafts is still []
if (!draft) return;  // ❌ Returns early, nothing happens!
```

**The Issue:** React state updates are asynchronous. When `handleDraftSelection` runs, `availableDrafts` is still an empty array because `setAvailableDrafts` hasn't completed yet. The function returns early and never loads the ingredients or quantity.

## The Solution

Pass the draft data directly to avoid relying on state that hasn't updated yet:

```typescript
// AFTER (FIXED):
setAvailableDrafts(draftsWithCounts);
setHasIngredients(true);

const draftToSelect = standardRecipe || defaultDraft || draftsWithCounts[0];
if (draftToSelect) {
  // ✅ Pass the draft object directly
  handleDraftSelection(draftToSelect.id, draftToSelect);
}

// Updated function signature:
const handleDraftSelection = async (draftId: string, draftData?: DraftOption) => {
  if (!currentStore || !draftId) return;

  // ✅ Use provided draft data OR find it in state (for manual selection)
  const draft = draftData || availableDrafts.find(d => d.id === draftId);
  if (!draft) return;

  // ✅ Now this executes properly!
  setSelectedDraftId(draftId);
  setProducibleQuantity(draft.producible_quantity);
  setQuantityToAdd(draft.producible_quantity.toString());
  // ... load ingredients ...
}
```

## How It Works Now

### Initial Load (Auto-Selection):
1. `loadDrafts()` fetches all recipe batches
2. Finds "Standard Recipe" (or default/first)
3. Calls `handleDraftSelection(id, draftObject)` with the actual draft data
4. Function uses the provided `draftData` parameter
5. ✅ Quantity field is populated immediately
6. ✅ Ingredients are loaded and displayed

### Manual Selection (User Changes Dropdown):
1. User selects different draft from dropdown
2. Calls `handleDraftSelection(id)` without second parameter
3. Function finds draft in `availableDrafts` state (which is now populated)
4. ✅ Updates quantity and ingredients

## Priority Order (Unchanged)

The auto-selection still follows the correct priority:
1. **"Standard Recipe"** (case-insensitive)
2. **Default Draft** (is_default = true)
3. **First Available Draft**

## Visual Confirmation

### Before Fix:
```
Select Recipe Draft: [Standard Recipe (Default) • 1 ingredient • Yields 5 pcs]
Quantity to Produce: [                    ]  ❌ EMPTY
```

### After Fix:
```
Select Recipe Draft: [Standard Recipe (Default) • 1 ingredient • Yields 5 pcs]
Quantity to Produce: [5                   ]  ✅ AUTO-FILLED
Recipe Ingredients: [Egg - 1 pcs per batch]  ✅ DISPLAYED
```

## Key Takeaway

**React State Timing Issue:** When you set state and immediately try to use it, the state hasn't updated yet. Solution: Pass data directly when you have it, don't rely on state that's being set in the same execution context.

## Files Modified
- `src/pages/products/RefillProductModal.tsx`

## Testing Checklist
- [x] Quantity auto-fills when modal opens
- [x] Ingredients display immediately
- [x] "Standard Recipe" is selected by default
- [x] Manual draft selection still works
- [x] Stock validation runs automatically
- [x] No TypeScript errors

## Status: ✅ COMPLETE

The Standard Recipe is now properly auto-selected with quantity and ingredients loaded immediately when the refill modal opens.
