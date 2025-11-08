# POS Improvements Implementation Plan

## Task 1: Simplify Complete Payment Button ✓

### Current State
- Button shows: Icon + "Complete Payment" + Amount badge
- Takes up unnecessary space
- Redundant (amount already shown in summary)

### Required Changes
- Remove CreditCard icon
- Remove amount badge
- Keep only "Complete Payment" text
- Center-align text
- Maintain full width and styling

### Implementation
Update `CartPanelNew.tsx` checkout button

---

## Task 2: Tea Stock Display & Validation ✓

### Current State
- Tea products don't show available stock
- No validation for insufficient tea stock
- Users can add tea to cart even when out of stock

### Requirements Analysis

#### Tea Products & Portion Sizes
Based on tea system documentation:
- **Small Tea**: Requires specific ml per serving
- **Regular Tea**: Requires specific ml per serving  
- **Large Tea**: Requires specific ml per serving (e.g., 120ml)

#### Database Schema
Products table has:
- `is_tea_product`: boolean flag
- `tea_portion_ml`: required ml per serving
- Need to join with tea stock to get `available_ml`

### Implementation Steps

1. **Update Product Query**
   - Add `is_tea_product` field
   - Add `tea_portion_ml` field
   - Add `available_ml` from tea stock
   - Calculate if product can be made

2. **Update Product Card Display**
   - Show available stock for tea products
   - Calculate servings available
   - Gray out card if insufficient stock
   - Show "Out of Stock" badge

3. **Update Add to Cart Logic**
   - Check tea stock before adding
   - Show error message if insufficient
   - Prevent adding out-of-stock tea

### Database View Check
Need to verify `v_pos_products_with_stock` includes:
- `is_tea_product`
- `tea_portion_ml`
- `available_ml`

If not, need to update the view or create new query.

---

## Implementation Order

1. ✅ Simplify Complete Payment button (Quick fix)
2. ✅ Check database view for tea fields
3. ✅ Update product query to include tea data
4. ✅ Update product card to show tea stock
5. ✅ Add out-of-stock logic for tea products
6. ✅ Test with different tea stock levels

---

## Testing Checklist

### Complete Payment Button
- [ ] Button shows only "Complete Payment" text
- [ ] Text is center-aligned
- [ ] No icon visible
- [ ] No amount badge visible
- [ ] Button maintains full width
- [ ] Hover/active states work

### Tea Stock Display
- [ ] Tea products show available ml
- [ ] Servings calculation is correct
- [ ] Out-of-stock badge appears when needed
- [ ] Card is grayed out when out of stock
- [ ] Cannot add out-of-stock tea to cart
- [ ] Error message shows for out-of-stock
- [ ] Regular products unaffected

---

## Files to Modify

1. `src/pages/pos/CartPanelNew.tsx` - Simplify button
2. `src/pages/pos/POSPageNew.tsx` - Update query & logic
3. Database view (if needed) - Add tea fields

---

## Notes

- Don't break existing functionality
- Maintain responsive design
- Keep theme colors consistent
- Test on all screen sizes
