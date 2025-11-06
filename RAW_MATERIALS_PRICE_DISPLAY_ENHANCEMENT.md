# Raw Materials Price Display Enhancement

## Overview
Enhanced the raw materials stock cards to show both **price per unit** and **total cost** for better inventory value tracking.

## What Was Added

### Before:
```
PURCHASE PRICE
₹10.00
```

### After:
```
PURCHASE PRICE
₹10.00/pcs

TOTAL COST
₹100.00
```

## Implementation Details

### 1. Price Per Unit Display
Shows the purchase price with the unit appended:
- **₹10.00/pcs** - For pieces
- **₹300.00/ltr** - For liters
- **₹500.00/g** - For grams
- **₹50.00/kg** - For kilograms

```typescript
<p className="text-xl font-bold text-secondary-900">
  ₹{stock.purchase_price.toFixed(2)}
  <span className="text-sm font-medium text-secondary-600">/{stock.unit}</span>
</p>
```

### 2. Total Cost Calculation
Displays the total inventory value for that material:
- **Formula:** `quantity × purchase_price`
- **Color:** Primary color (₹) to highlight total value
- **Format:** 2 decimal places

```typescript
<p className="text-xl font-bold text-primary-700">
  ₹{(stock.quantity * stock.purchase_price).toFixed(2)}
</p>
```

## Card Layout

### Complete Card Structure:
```
┌─────────────────────────────────┐
│  EGG PUFF          [Low Stock]  │
│                                  │
│  QUANTITY                        │
│  10 pcs                          │
│                                  │
│  PURCHASE PRICE                  │
│  ₹10.00/pcs                      │
│                                  │
│  TOTAL COST                      │
│  ₹100.00                         │
│                                  │
│  [Edit]  [Refill]  [Delete]     │
└─────────────────────────────────┘
```

## Examples

### Example 1: Egg Puff
- Quantity: 10 pcs
- Purchase Price: ₹10.00/pcs
- **Total Cost: ₹100.00**

### Example 2: Milk
- Quantity: 2 ltr
- Purchase Price: ₹300.00/ltr
- **Total Cost: ₹600.00**

### Example 3: Tea Powder
- Quantity: 280 g
- Purchase Price: ₹500.00/g
- **Total Cost: ₹140,000.00**

## Benefits

### For Business Owners:
- ✅ **Quick Inventory Value**: See total cost at a glance
- ✅ **Unit Price Clarity**: Know the cost per unit for pricing decisions
- ✅ **Better Planning**: Understand which materials tie up most capital
- ✅ **Cost Analysis**: Compare unit prices across purchases

### For Inventory Management:
- ✅ **Value Tracking**: Monitor total inventory value per material
- ✅ **Reorder Decisions**: Factor in total cost when reordering
- ✅ **Budget Planning**: Know how much capital is in each material
- ✅ **Waste Calculation**: Calculate loss value when materials expire

### For Financial Analysis:
- ✅ **Capital Allocation**: See where money is invested
- ✅ **Cost Optimization**: Identify high-value materials
- ✅ **Profitability**: Better understand material costs vs product prices
- ✅ **Cash Flow**: Track inventory value changes

## Visual Hierarchy

### Typography:
- **Material Name**: 20px, Bold, Dark
- **Quantity**: 30px, Bold, Primary
- **Unit**: 18px, Medium, Gray
- **Price Label**: 10px, Bold, Uppercase, Gray
- **Price Value**: 20px, Bold, Dark
- **Unit Suffix**: 14px, Medium, Gray
- **Total Cost**: 20px, Bold, Primary (highlighted)

### Color Coding:
- **Quantity**: Primary color (emphasize stock level)
- **Purchase Price**: Dark gray (neutral information)
- **Total Cost**: Primary color (emphasize value)
- **Status Badge**: Conditional (red/yellow/green)

## Calculation Logic

### Total Cost Formula:
```typescript
const totalCost = stock.quantity * stock.purchase_price;
```

### Edge Cases Handled:
- ✅ Zero quantity: Shows ₹0.00
- ✅ Decimal quantities: Properly calculated (e.g., 2.5 kg × ₹100/kg = ₹250.00)
- ✅ Large numbers: Formatted with 2 decimals
- ✅ Different units: Unit suffix adapts automatically

## Use Cases

### Scenario 1: Stock Valuation
**Question:** "How much money do I have tied up in Milk?"
**Answer:** Look at Total Cost: ₹600.00

### Scenario 2: Pricing Products
**Question:** "What's my cost per liter of Milk?"
**Answer:** Look at Purchase Price: ₹300.00/ltr

### Scenario 3: Reorder Planning
**Question:** "Should I buy more Tea Powder?"
**Answer:** Check Total Cost (₹140,000) - maybe too much capital tied up

### Scenario 4: Waste Impact
**Question:** "If 50g of Tea Powder expires, what's the loss?"
**Answer:** 50g × ₹500/g = ₹25,000 loss

## Future Enhancements

### Potential Additions:
1. **Average Price**: Show average purchase price across all purchases
2. **Price Trends**: Show if price is increasing/decreasing
3. **Total Inventory Value**: Sum of all material costs
4. **Low Value Alert**: Warn when total cost is too high
5. **Price History**: Graph showing price changes over time

## Files Modified
- `src/pages/raw-materials/RawMaterialsPage.tsx`

## Testing Checklist
- [x] Price per unit displays correctly with unit suffix
- [x] Total cost calculates accurately (quantity × price)
- [x] Formatting shows 2 decimal places
- [x] Works with different units (pcs, ltr, g, kg)
- [x] Works with decimal quantities
- [x] Visual hierarchy is clear
- [x] No TypeScript errors

## Status: ✅ COMPLETE

Raw materials cards now display both price per unit and total cost, providing complete inventory value information at a glance.
