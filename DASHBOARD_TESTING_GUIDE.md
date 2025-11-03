# Dashboard Testing Guide

## Pre-Testing Setup

Before testing, ensure you have:
1. ✅ Built the application successfully (`npm run build`)
2. ✅ No TypeScript errors
3. ✅ Database connection working
4. ✅ Sample data in the database (raw materials, petty cash, expenses)

## Testing Checklist

### 1. Dashboard Page Load
- [ ] Dashboard loads without errors
- [ ] All 4 primary cards display correctly
- [ ] All 4 secondary cards display correctly
- [ ] Data shows correct values from database
- [ ] Loading spinner appears briefly during data fetch
- [ ] Refresh button works

### 2. Raw Materials Card (Orange)
- [ ] Card displays correct total amount
- [ ] "Purchase Cost" label is visible
- [ ] "Click to view details →" text appears
- [ ] Hover effect works (shadow + border color change)
- [ ] Click opens Raw Materials Details Modal

#### Raw Materials Modal Tests:
- [ ] Modal opens smoothly
- [ ] Header shows "Raw Materials Purchases" with icon
- [ ] Table displays with proper columns:
  - Raw Material
  - Quantity
  - Purchase Price
  - Total Cost
  - Time
- [ ] Data loads correctly (today's purchases only)
- [ ] Numbers are right-aligned
- [ ] Text is left-aligned
- [ ] Hover effect on table rows works
- [ ] Footer shows correct total
- [ ] Close button works
- [ ] Click outside modal closes it
- [ ] Empty state shows when no data
- [ ] Loading spinner appears while fetching

### 3. Total Costs Card (Red)
- [ ] Card displays correct total (Raw Materials + Petty Cash + Expenses)
- [ ] "Money OUT" label is visible
- [ ] "Click to view breakdown →" text appears
- [ ] Hover effect works
- [ ] Click opens Total Costs Breakdown Modal

#### Total Costs Modal Tests:
- [ ] Modal opens smoothly
- [ ] Header shows "Total Costs Breakdown" with icon
- [ ] Three summary cards display at top:
  - Raw Materials (Orange)
  - Petty Cash (Purple)
  - Expenses (Blue)
- [ ] Each summary card shows correct amount and transaction count
- [ ] Detailed tables appear for each category with data
- [ ] Tables have proper columns:
  - Description
  - Amount
  - Time
- [ ] Each category has its own color theme
- [ ] Grand total card at bottom shows correct sum
- [ ] Close button works
- [ ] Empty categories don't show tables
- [ ] Loading spinner appears while fetching

### 4. Petty Cash Card (Purple)
- [ ] Card displays correct total amount
- [ ] "Today's Cost" label is visible
- [ ] "Click to view details →" text appears
- [ ] Hover effect works
- [ ] Click opens Petty Cash Details Modal

#### Petty Cash Modal Tests:
- [ ] Modal opens smoothly
- [ ] Header shows "Petty Cash Records" with icon
- [ ] Table displays with proper columns:
  - Recipient Name
  - Purpose
  - Amount
  - Notes
  - Time
- [ ] Data loads correctly (today's records only)
- [ ] Numbers are right-aligned
- [ ] Text is left-aligned
- [ ] Hover effect on table rows works
- [ ] Footer shows correct total
- [ ] Close button works
- [ ] Empty state shows when no data
- [ ] Loading spinner appears while fetching

### 5. Purchases Card (Gray)
- [ ] Card displays correct amount
- [ ] "Inventory" label is visible
- [ ] Card is NOT clickable (no hover effect)
- [ ] No "Click to view" text

### 6. Secondary Info Cards
- [ ] Today's Sales (Green) shows correct amount
- [ ] Net Today shows correct calculation (Sales - Total Costs)
- [ ] Net Today color changes based on profit/loss (green/red)
- [ ] Pending Payments shows correct amount
- [ ] Low Stock Items shows correct count

### 7. Charts Section
- [ ] Last 7 Days Sales chart displays correctly
- [ ] Top Selling Products list shows correctly
- [ ] Payment Methods breakdown displays correctly
- [ ] Quick Stats shows correct data

### 8. Performance Tests
- [ ] Dashboard loads quickly (< 2 seconds)
- [ ] Modals open instantly
- [ ] No lag when clicking cards
- [ ] Data fetching doesn't block UI
- [ ] Large datasets (100+ records) load without issues
- [ ] No memory leaks when opening/closing modals multiple times

### 9. Responsive Design Tests
- [ ] Desktop view (1920x1080): All cards in proper grid
- [ ] Tablet view (768px): Cards stack appropriately
- [ ] Mobile view (375px): Single column layout
- [ ] Modals are scrollable on small screens
- [ ] Tables are horizontally scrollable if needed

### 10. Edge Cases
- [ ] No data scenario: Empty states display correctly
- [ ] Single record: Tables display properly
- [ ] Large amounts: Numbers format with commas
- [ ] Long text: Descriptions don't break layout
- [ ] Multiple rapid clicks: Modals don't duplicate
- [ ] Network error: Error messages display

### 11. Data Accuracy Tests
- [ ] Raw Materials total matches sum of purchases
- [ ] Petty Cash total matches sum of records
- [ ] Total Costs = Raw Materials + Petty Cash + Expenses
- [ ] Net Today = Today's Sales - Total Costs
- [ ] All amounts match database values

### 12. User Experience Tests
- [ ] Visual hierarchy is clear
- [ ] Color coding is consistent
- [ ] Icons are meaningful
- [ ] Text is readable
- [ ] Buttons are clearly labeled
- [ ] Feedback on interactions (hover, click)
- [ ] No confusing elements

## Test Scenarios

### Scenario 1: Fresh Day (No Data)
1. Start with no transactions today
2. All cost cards should show ₹0
3. Clicking cards should show empty states
4. Empty states should have friendly messages

### Scenario 2: Normal Day (Some Data)
1. Add 2-3 raw material purchases
2. Add 2-3 petty cash records
3. Add 1-2 expenses
4. Verify all cards update correctly
5. Verify modals show all data

### Scenario 3: Busy Day (Lots of Data)
1. Add 50+ raw material purchases
2. Add 50+ petty cash records
3. Add 50+ expenses
4. Verify performance is still good
5. Verify tables display correctly with scrolling

### Scenario 4: Refresh Test
1. Open dashboard
2. Add new data in another tab/window
3. Click Refresh button
4. Verify new data appears

## Known Limitations

- Modals show maximum 100 records per category (performance optimization)
- Data is filtered to today only (by design)
- Purchases card is not clickable (informational only)

## Success Criteria

✅ All cards display correct data
✅ All clickable cards open modals
✅ All tables are well-formatted
✅ Performance is good with large datasets
✅ No errors in console
✅ Responsive on all screen sizes
✅ User experience is smooth and intuitive

## Reporting Issues

If you find any issues:
1. Note the exact steps to reproduce
2. Check browser console for errors
3. Verify database has correct data
4. Check network tab for failed requests
5. Document expected vs actual behavior
