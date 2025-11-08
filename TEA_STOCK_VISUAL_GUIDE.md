# Tea Stock System - Visual Guide

## 🎨 Before & After Comparison

### BEFORE (Old System)
```
❌ Tea Preparation → Create Products → Add to Inventory → Sell in POS
   (Multiple steps, manual stock management)
```

### AFTER (New System)
```
✅ Tea Preparation → General Pool → Sell in POS
   (Direct connection, automatic deduction)
```

---

## 📱 POS Screen Examples

### Example 1: In Stock (Normal)
```
┌─────────────────────────────────────┐
│  Regular Tea                        │
│  ₹15.00                             │
│                                     │
│  Price: ₹15.00    Servings: 66 ✓   │
│                   90ml each         │
│  [Beverages]                        │
│                                     │
│  [Add to Cart] ← Clickable          │
└─────────────────────────────────────┘
   Green badge, normal colors
```

### Example 2: Low Stock (Warning)
```
┌─────────────────────────────────────┐
│  Small Tea                          │
│  ₹10.00                             │
│                                     │
│  Price: ₹10.00    Servings: 4 ⚠️    │
│                   60ml each         │
│  [Beverages]                        │
│                                     │
│  [Add to Cart] ← Still clickable    │
└─────────────────────────────────────┘
   Yellow badge, warning colors
```

### Example 3: Out of Stock (Disabled)
```
┌─────────────────────────────────────┐
│  Large Tea          [OUT OF STOCK]  │
│  ₹20.00                             │
│                                     │
│  Price: ₹20.00    Out of Stock ❌   │
│                   120ml each        │
│  [Beverages]                        │
│                                     │
│  [Cannot Add] ← Greyed out          │
└─────────────────────────────────────┘
   Red badge, greyed out, disabled
```

---

## 🔄 Stock Flow Diagram

### Production Flow
```
┌─────────────────┐
│ Tea Preparation │
│   Produce 6L    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Tea Stock     │
│  Pool: 6000ml   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  POS Display    │
│ Small: 100 srv  │
│ Regular: 66 srv │
│ Large: 50 srv   │
└─────────────────┘
```

### Sales Flow
```
┌─────────────────┐
│  Customer buys  │
│  Regular Tea    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Auto Deduct    │
│    -90ml        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Updated Stock  │
│  Pool: 5910ml   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  POS Updates    │
│ Small: 98 srv   │
│ Regular: 65 srv │
│ Large: 49 srv   │
└─────────────────┘
```

---

## 📊 Stock Calculation Examples

### Scenario 1: Fresh Production
```
Production: 10L tea
Stock Pool: 10,000ml

Available Servings:
├─ Small Tea (60ml):   166 servings
├─ Regular Tea (90ml): 111 servings
└─ Large Tea (120ml):  83 servings
```

### Scenario 2: After Some Sales
```
Starting: 10,000ml
Sales:
  - 5x Small Tea:   -300ml
  - 3x Regular Tea: -270ml
  - 2x Large Tea:   -240ml
  
Remaining: 9,190ml

Available Servings:
├─ Small Tea (60ml):   153 servings
├─ Regular Tea (90ml): 102 servings
└─ Large Tea (120ml):  76 servings
```

### Scenario 3: Low Stock Warning
```
Remaining: 450ml

Available Servings:
├─ Small Tea (60ml):   7 servings ✓
├─ Regular Tea (90ml): 5 servings ⚠️ (Low Stock)
└─ Large Tea (120ml):  3 servings ⚠️ (Low Stock)

Action: Produce more tea soon!
```

### Scenario 4: Out of Stock
```
Remaining: 50ml

Available Servings:
├─ Small Tea (60ml):   0 servings ❌ (Out of Stock)
├─ Regular Tea (90ml): 0 servings ❌ (Out of Stock)
└─ Large Tea (120ml):  0 servings ❌ (Out of Stock)

Action: Must produce tea to continue sales!
```

---

## 🎯 Color Coding System

### Stock Status Colors

| Servings | Badge Color | Background | Status | Action |
|----------|-------------|------------|--------|--------|
| > 10 | 🟢 Green | Normal | In Stock | None |
| 5-10 | 🟡 Yellow | Warning | Low Stock | Consider producing |
| 1-4 | 🟡 Yellow | Warning | Very Low | Produce soon |
| 0 | 🔴 Red | Greyed | Out of Stock | Must produce |

---

## 📱 Mobile vs Desktop View

### Desktop POS
```
┌────────────────────────────────────────────────────────┐
│  [Search] [Customer] [Refresh]                         │
├────────────────────────────────────────────────────────┤
│  [All] [Beverages] [Snacks] [Food]                     │
├────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐              │
│  │Small │  │Reg.  │  │Large │  │Coffee│              │
│  │Tea   │  │Tea   │  │Tea   │  │      │              │
│  │100srv│  │66srv │  │50srv │  │25srv │              │
│  └──────┘  └──────┘  └──────┘  └──────┘              │
│                                                         │
└────────────────────────────────────────────────────────┘
```

### Mobile POS
```
┌──────────────────┐
│  [Search]        │
│  [🔄] [👤]       │
├──────────────────┤
│  [All] [Bev...   │
├──────────────────┤
│  ┌────────────┐  │
│  │ Small Tea  │  │
│  │ 100 srv    │  │
│  └────────────┘  │
│  ┌────────────┐  │
│  │ Regular Tea│  │
│  │ 66 srv     │  │
│  └────────────┘  │
│  ┌────────────┐  │
│  │ Large Tea  │  │
│  │ 50 srv     │  │
│  └────────────┘  │
└──────────────────┘
```

---

## 🔔 Notification Examples

### Success Messages
```
✅ "Successfully produced 6L of tea!"
✅ "Added Regular Tea to cart"
✅ "Sale completed successfully!"
```

### Warning Messages
```
⚠️ "Low stock: Regular Tea (5 servings)"
⚠️ "Consider producing more tea soon"
```

### Error Messages
```
❌ "Small Tea is out of stock"
❌ "Insufficient tea stock. Available: 50ml, Required: 60ml"
❌ "Cannot add out of stock items to cart"
```

---

## 📈 Dashboard Widget (Future)

### Proposed Tea Stock Widget
```
┌─────────────────────────────────────┐
│  ☕ Tea Stock Overview              │
├─────────────────────────────────────┤
│  Total Available: 6.5L (6500ml)    │
│                                     │
│  Servings Available:                │
│  ├─ Small Tea:   108 🟢            │
│  ├─ Regular Tea: 72 🟢             │
│  └─ Large Tea:   54 🟢             │
│                                     │
│  Today's Consumption: 3.5L          │
│  [Produce More] [View History]     │
└─────────────────────────────────────┘
```

---

## 🎬 Animation States

### Adding to Cart (In Stock)
```
1. Normal State → Hover → Highlight
2. Click → Add animation
3. Badge appears: "1 in cart"
4. Toast: "Added Regular Tea"
```

### Attempting Out of Stock
```
1. Greyed State → Hover (no effect)
2. Click → Shake animation
3. Toast: "Regular Tea is out of stock"
4. Remains disabled
```

### Stock Running Low
```
1. Green badge → Yellow badge
2. Subtle pulse animation
3. Warning icon appears
4. Still functional
```

---

## 🔍 Inspection Tools

### Check Stock in Browser Console
```javascript
// Get tea stock
const { data } = await supabase
  .from('tea_stock')
  .select('*')
  .single();

console.log('Tea Stock:', data.total_liters, 'L');
```

### Check Available Servings
```javascript
// Get servings
const { data } = await supabase
  .from('v_tea_products_with_stock')
  .select('*');

console.table(data);
```

---

## ✨ Key Visual Features

1. **Real-time Updates**: Stock updates immediately after sale
2. **Clear Indicators**: Color-coded status (green/yellow/red)
3. **Portion Display**: Shows ml per serving
4. **Servings Count**: Easy to understand quantity
5. **Disabled State**: Cannot interact when out of stock
6. **Responsive Design**: Works on mobile and desktop
7. **Smooth Animations**: Professional user experience

---

**Pro Tip**: Keep the POS page open on a second screen to monitor stock levels throughout the day!
