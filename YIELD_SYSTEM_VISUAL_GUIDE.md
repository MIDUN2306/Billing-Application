# 🎨 Auto-Calculate Yield System - Visual Guide

## What You'll See in the UI

### 1️⃣ Product Template Form - Yield Configuration

When creating/editing a product template, you'll see this beautiful section:

```
╔═══════════════════════════════════════════════════════════╗
║                  Yield Configuration                      ║
║                                                           ║
║  How should the quantity be determined when creating      ║
║  products?                                                ║
║                                                           ║
║  ┌─────────────────────────────────────────────────┐    ║
║  │ ○ 🧮 Auto-Calculate from Ingredients            │    ║
║  │   System calculates maximum quantity based on   │    ║
║  │   available ingredients                         │    ║
║  │                                                  │    ║
║  │   Base Unit Size (per 1 cup)                    │    ║
║  │   [150                                    ] ml   │    ║
║  │   Optional: Used for portion size calculations  │    ║
║  └─────────────────────────────────────────────────┘    ║
║                                                           ║
║  ┌─────────────────────────────────────────────────┐    ║
║  │ ● 📦 Manual Entry                    [SELECTED] │    ║
║  │   You'll enter the actual quantity produced     │    ║
║  │   each time                                     │    ║
║  │                                                  │    ║
║  │   Expected Yield (optional, for reference)      │    ║
║  │   [100                                    ] pcs  │    ║
║  │   Typical quantity produced per batch           │    ║
║  └─────────────────────────────────────────────────┘    ║
╚═══════════════════════════════════════════════════════════╝
```

**Visual Features:**
- Selected option has maroon border (#8b1a39)
- Selected option has light red background (#fef2f2)
- Unselected has gray border
- Hover effect on both options
- Conditional fields appear only when option is selected

---

### 2️⃣ Product Templates List - Yield Type Badges

In the templates list, each product shows its yield type:

```
╔═══════════════════════════════════════════════════════════════════╗
║  Product Name              │ SKU     │ Unit │ MRP    │ Ingredients ║
╠═══════════════════════════════════════════════════════════════════╣
║  Masala Tea 🧮 Auto       │ TEA-001 │ cup  │ ₹15.00 │ 3 ingredients║
║  Coffee 🧮 Auto           │ COF-001 │ cup  │ ₹20.00 │ 2 ingredients║
║  Cookies 📦 Manual        │ COO-001 │ pcs  │ ₹5.00  │ 4 ingredients║
║  Biscuits 📦 Manual       │ BIS-001 │ pack │ ₹25.00 │ 5 ingredients║
╚═══════════════════════════════════════════════════════════════════╝
```

**Badge Colors:**
- 🧮 Auto: Blue background (#dbeafe), blue text (#1e40af)
- 📦 Manual: Gray background (#f3f4f6), gray text (#1f2937)

---

### 3️⃣ Product Form - Auto-Calculate Display

When creating a product with auto-calculate template:

```
╔═══════════════════════════════════════════════════════════╗
║  Product Template: [Masala Tea ▼]                        ║
║                                                           ║
║  ┌─────────────────────────────────────────────────┐    ║
║  │ Template Details              🧮 Auto-Calculate │    ║
║  │                                                  │    ║
║  │ SKU: TEA-001    Category: Beverages             │    ║
║  │ Unit: cup       Template MRP: ₹15.00            │    ║
║  │                                                  │    ║
║  │ Ingredients per unit:                           │    ║
║  │ • Milk           0.12 ltr  (Stock: 10.00 ltr)   │    ║
║  │ • Tea Powder     0.005 kg  (Stock: 1.00 kg)     │    ║
║  │ • Sugar          0.01 kg   (Stock: 2.00 kg)     │    ║
║  └─────────────────────────────────────────────────┘    ║
║                                                           ║
║  ┌─────────────────────────────────────────────────┐    ║
║  │ 🧮 Yield Calculation                            │    ║
║  │                                                  │    ║
║  │ Based on current stock, you can make:           │    ║
║  │ • Milk: 83 cups                                 │    ║
║  │ • Tea Powder: 200 cups                          │    ║
║  │ • Sugar: 200 cups ⚠️                            │    ║
║  │                                                  │    ║
║  │ ┌─────────────────────────────────────────┐    │    ║
║  │ │ ✓ Maximum: 83 cups                      │    │    ║
║  │ │ Limited by: Milk                        │    │    ║
║  │ └─────────────────────────────────────────┘    │    ║
║  └─────────────────────────────────────────────────┘    ║
║                                                           ║
║  Quantity to Produce: [83                          ]     ║
║  This will create 83 cup of Masala Tea                   ║
║                                                           ║
║  MRP: [15.00                                       ]     ║
║                                                           ║
║  [Cancel]                          [Create Product]      ║
╚═══════════════════════════════════════════════════════════╝
```

**Visual Features:**
- Blue background for yield calculation box (#eff6ff)
- Blue border (#bfdbfe)
- Limiting ingredient marked with ⚠️
- Maximum shown in highlighted box (#dbeafe)
- Quantity auto-filled with maximum

---

### 4️⃣ Product Form - Manual Entry Display

When creating a product with manual entry template:

```
╔═══════════════════════════════════════════════════════════╗
║  Product Template: [Chocolate Cookies ▼]                 ║
║                                                           ║
║  ┌─────────────────────────────────────────────────┐    ║
║  │ Template Details              📦 Manual Entry   │    ║
║  │                                                  │    ║
║  │ SKU: COO-001    Category: Bakery                │    ║
║  │ Unit: pcs       Template MRP: ₹5.00             │    ║
║  │                                                  │    ║
║  │ Ingredients per unit:                           │    ║
║  │ • Flour          2.00 kg   (Stock: 10.00 kg)    │    ║
║  │ • Sugar          1.00 kg   (Stock: 5.00 kg)     │    ║
║  │ • Butter         0.50 kg   (Stock: 3.00 kg)     │    ║
║  │ • Chocolate      0.30 kg   (Stock: 2.00 kg)     │    ║
║  └─────────────────────────────────────────────────┘    ║
║                                                           ║
║  Quantity to Produce: [                            ]     ║
║  Expected yield: ~100 pieces per batch                   ║
║                                                           ║
║  MRP: [5.00                                        ]     ║
║                                                           ║
║  [Cancel]                          [Create Product]      ║
╚═══════════════════════════════════════════════════════════╝
```

**Visual Features:**
- Gray badge for manual entry
- Shows expected yield as reference
- User enters actual quantity
- Simple, clean interface

---

### 5️⃣ Stock Validation Error Display

When insufficient stock:

```
╔═══════════════════════════════════════════════════════════╗
║  Quantity to Produce: [150                         ]     ║
║                                                           ║
║  ┌─────────────────────────────────────────────────┐    ║
║  │ ⚠️ Insufficient Stock                           │    ║
║  │                                                  │    ║
║  │ • Milk: need 18.00 ltr, have 10.00 ltr         │    ║
║  │ • Tea Powder: need 0.75 kg, have 1.00 kg       │    ║
║  │ • Sugar: need 1.50 kg, have 2.00 kg            │    ║
║  └─────────────────────────────────────────────────┘    ║
║                                                           ║
║  [Cancel]                    [Create Product] (disabled) ║
╚═══════════════════════════════════════════════════════════╝
```

**Visual Features:**
- Red background (#fef2f2)
- Red border (#fecaca)
- Warning icon (⚠️)
- Clear error messages
- Create button disabled

---

## 🎨 Color Palette

### Primary Colors
- **Maroon (Brand):** #8b1a39
- **Light Red:** #fef2f2
- **Blue (Auto):** #3b82f6
- **Light Blue:** #eff6ff
- **Gray (Manual):** #6b7280
- **Light Gray:** #f3f4f6

### Status Colors
- **Success:** #10b981 (green)
- **Warning:** #f59e0b (orange)
- **Error:** #ef4444 (red)
- **Info:** #3b82f6 (blue)

### Text Colors
- **Primary:** #111827 (secondary-900)
- **Secondary:** #6b7280 (secondary-600)
- **Muted:** #9ca3af (secondary-500)

---

## 🎯 Interactive Elements

### Hover Effects
- Buttons: Slight background color change
- Radio options: Background turns white
- Table rows: Light gray background
- Icons: Color intensifies

### Focus States
- Inputs: 2px ring in primary color
- Buttons: Outline in primary color
- Radio buttons: Ring around selected

### Disabled States
- Reduced opacity (0.5)
- Cursor: not-allowed
- Gray background

---

## 📱 Responsive Behavior

### Desktop (>768px)
- Two-column layouts for forms
- Full table display
- Side-by-side radio options

### Mobile (<768px)
- Single-column layouts
- Stacked form fields
- Scrollable tables
- Touch-friendly buttons (min 44px)

---

## ✨ Animations

### Smooth Transitions
- Color changes: 200ms ease
- Background changes: 150ms ease
- Border changes: 200ms ease

### Loading States
- Spinner animation
- Button text changes
- Disabled state during loading

---

## 🎭 Icons Used

- 🧮 Calculator (Auto-calculate)
- 📦 Package (Manual entry)
- ✓ Checkmark (Success/Maximum)
- ⚠️ Warning (Limiting ingredient/Error)
- ➕ Plus (Add new)
- ✏️ Edit (Edit action)
- 🗑️ Trash (Delete action)
- 📋 List (Manage ingredients)

---

## 🚀 User Experience Flow

### Creating Auto-Calculate Product
1. Select template → See 🧮 Auto badge
2. View template details
3. See yield calculation automatically
4. Quantity pre-filled with maximum
5. Adjust if needed
6. Click create → Success!

### Creating Manual Entry Product
1. Select template → See 📦 Manual badge
2. View template details
3. See expected yield reference
4. Enter actual quantity
5. Click create → Success!

---

**This visual guide shows exactly what users will see and experience!** 🎨✨
