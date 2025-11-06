# Standard Recipe Auto-Selection Fix

## Issue
The refill modal was not specifically prioritizing "Standard Recipe" draft on initial load. It was only checking for default flag or selecting the first available draft.

## Solution
Updated the auto-selection logic to follow a specific priority order:

### Priority Order:
1. **"Standard Recipe"** (case-insensitive match)
2. **Default Draft** (marked with `is_default = true`)
3. **First Available Draft** (fallback)

## Code Change

### Before:
```typescript
// Auto-select first draft (default or first available)
const defaultDraft = draftsWithCounts.find(d => d.is_default) || draftsWithCounts[0];
if (defaultDraft) {
  handleDraftSelection(defaultDraft.id);
}
```

### After:
```typescript
// Auto-select draft in priority order:
// 1. Draft named "Standard Recipe" (case-insensitive)
// 2. Draft marked as default
// 3. First available draft
const standardRecipe = draftsWithCounts.find(
  d => d.batch_name.toLowerCase() === 'standard recipe'
);
const defaultDraft = draftsWithCounts.find(d => d.is_default);
const draftToSelect = standardRecipe || defaultDraft || draftsWithCounts[0];

if (draftToSelect) {
  handleDraftSelection(draftToSelect.id);
}
```

## Behavior

### Scenario 1: "Standard Recipe" exists
- ✅ "Standard Recipe" is auto-selected
- Even if another draft is marked as default
- Case-insensitive matching ("standard recipe", "Standard Recipe", "STANDARD RECIPE")

### Scenario 2: No "Standard Recipe", but default exists
- ✅ Default draft is auto-selected
- Falls back to the draft with `is_default = true`

### Scenario 3: No "Standard Recipe" or default
- ✅ First available draft is auto-selected
- Ensures something is always selected

## Benefits

1. **Consistent UX**: Users always see "Standard Recipe" first if it exists
2. **Predictable**: Clear priority order for auto-selection
3. **Flexible**: Still supports default flag and fallback
4. **Case-Insensitive**: Works regardless of capitalization

## Testing

### Test Cases:
- [ ] Product with "Standard Recipe" draft → Auto-selects "Standard Recipe"
- [ ] Product with "standard recipe" (lowercase) → Auto-selects it
- [ ] Product with default draft but no "Standard Recipe" → Auto-selects default
- [ ] Product with multiple drafts, none default → Auto-selects first
- [ ] Product with both "Standard Recipe" and default → Auto-selects "Standard Recipe"

## Files Modified
- `src/pages/products/RefillProductModal.tsx`
- `REFILL_DRAFT_SELECTION_COMPLETE.md`

## Status: ✅ COMPLETE

"Standard Recipe" is now prioritized and auto-selected when opening the refill modal.
