# Ingredient Drafts - Corrected Implementation Plan

## Problem Statement
The current implementation is missing the **ingredient input section** in the product form. Users need to:
1. Add ingredients manually when producing a product
2. Save ingredient combinations as "drafts" for reuse
3. Load existing drafts to quickly populate ingredients
4. Produce products with or without saving the draft

## Current vs Required Flow

### Current Flow (Incorrect):
```
1. Go to Product Templates → Manage Batches → Create batch
2. Go to Products → Add Product → Select pre-created batch
3. Produce (ingredients are read-only)
```

### Required Flow (Correct):
```
1. Go to Products → Add Product
2. Select Product Name
3. Choose one of:
   a) Load existing ingredient draft
   b) Create new ingredients manually
4. Add/Edit ingredients in the form
5. Option to save as draft for future use
6. Enter quantity and produce
```

## Database Schema (Already Created ✅)

Tables exist and are correct:
- `recipe_batches` - Stores ingredient drafts
- `recipe_batch_ingredients` - Stores ingredients per draft

## Required UI Changes

### 1. Product Form Layout

```
┌─────────────────────────────────────────────────────────┐
│ Add New Product                                    [X]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Product Name: [Select Product Name ▼] [+ Add Product]  │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐│
│ │ 📦 Ingredient Draft (Optional)                      ││
│ │                                                     ││
│ │ [Load Existing Draft ▼]  or  [+ Create New]        ││
│ │                                                     ││
│ │ Drafts:                                             ││
│ │ • Small Batch (2L milk) - Makes 50 cups            ││
│ │ • Large Batch (4L milk) - Makes 100 cups           ││
│ │ • [None - Enter ingredients manually]              ││
│ └─────────────────────────────────────────────────────┘│
│                                                         │
│ ┌─────────────────────────────────────────────────────┐│
│ │ 🥛 Recipe Ingredients                               ││
│ │                                                     ││
│ │ [Raw Material ▼] [Quantity] [Unit] [Remove]        ││
│ │ [Raw Material ▼] [Quantity] [Unit] [Remove]        ││
│ │                                                     ││
│ │ [+ Add Ingredient]                                  ││
│ │                                                     ││
│ │ Recipe Yield: [50] cups                             ││
│ │ (How many units can be made with these ingredients) ││
│ │                                                     ││
│ │ ☑ Save as draft: [Draft Name_______]               ││
│ └─────────────────────────────────────────────────────┘│
│                                                         │
│ Quantity to Produce: [100] cups                         │
│ (This will use 2× the recipe)                           │
│                                                         │
│ Unit: [Pieces ▼]                                        │
│ SKU: [TEA-001] [Generate]                               │
│ Price: [10.00]                                          │
│                                                         │
│                          [Cancel] [Produce Product]     │
└─────────────────────────────────────────────────────────┘
```

### 2. Ingredient Draft Selector Component

**Features:**
- Dropdown to select existing drafts
- "None" option to enter ingredients manually
- Shows draft details (name, yield, ingredients)
- Auto-populates ingredients when draft is selected
- Allows editing even after loading a draft

### 3. Ingredient Input Section (Always Visible)

**Features:**
- Add/remove ingredient rows
- Select raw material from dropdown
- Enter quantity needed
- Unit auto-fills from raw material
- Real-time stock validation
- Shows warnings for insufficient stock

### 4. Save Draft Option

**Features:**
- Checkbox: "Save as draft for future use"
- Text input for draft name
- Only appears if ingredients are entered
- Optional - can produce without saving

## Component Structure

```typescript
ProductFormWithInlineDrafts.tsx
├─ State Management
│  ├─ ingredientRows (editable)
│  ├─ availableDrafts (loaded from DB)
│  ├─ selectedDraftId (optional)
│  ├─ saveDraft (boolean)
│  └─ draftName (string)
│
├─ Draft Selector Section
│  ├─ Load existing draft dropdown
│  ├─ "Create New" button
│  └─ Draft preview
│
├─ Ingredients Section (Always Editable)
│  ├─ Ingredient rows (add/remove)
│  ├─ Raw material selector
│  ├─ Quantity input
│  ├─ Stock validation
│  └─ Recipe yield input
│
├─ Save Draft Option
│  ├─ Checkbox to save
│  └─ Draft name input
│
└─ Production Section
   ├─ Quantity to produce
   ├─ SKU, Price, Unit
   └─ Submit button
```

## User Workflows

### Workflow 1: Use Existing Draft
```
1. Select Product Name: "Tea"
2. Click "Load Existing Draft"
3. Select "Small Batch (2L milk)"
4. Ingredients auto-populate (editable)
5. Modify if needed
6. Enter quantity: 100
7. Click "Produce Product"
```

### Workflow 2: Create New Draft
```
1. Select Product Name: "Tea"
2. Leave draft selector as "None"
3. Click "+ Add Ingredient"
4. Add: Milk 2L, Tea Powder 50g
5. Enter recipe yield: 50 cups
6. Check "Save as draft"
7. Enter draft name: "Small Batch"
8. Enter quantity: 50
9. Click "Produce Product"
   → Product produced
   → Draft saved for future use
```

### Workflow 3: One-Time Production (No Draft)
```
1. Select Product Name: "Tea"
2. Add ingredients manually
3. Enter recipe yield: 50
4. Leave "Save as draft" unchecked
5. Enter quantity: 50
6. Click "Produce Product"
   → Product produced
   → Ingredients NOT saved as draft
```

### Workflow 4: Modify Existing Draft
```
1. Select Product Name: "Tea"
2. Load "Small Batch" draft
3. Modify: Change milk from 2L to 2.5L
4. Check "Save as draft"
5. Enter new name: "Small Batch v2"
6. Produce product
   → New draft created
   → Original draft unchanged
```

## Implementation Steps

### Step 1: Update ProductFormWithBatches Component
- Add ingredient input section (always visible)
- Add draft selector (optional)
- Add "Save as draft" checkbox
- Make ingredients editable even when draft is loaded

### Step 2: Draft Management Functions
```typescript
// Load available drafts
loadDrafts(productNameId)

// Load draft ingredients
loadDraftIngredients(draftId)

// Save new draft
saveDraft(name, ingredients, yield)

// Produce without saving draft
produceProduct(ingredients, quantity)

// Produce and save draft
produceAndSaveDraft(ingredients, quantity, draftName)
```

### Step 3: Validation Logic
- Validate ingredients before production
- Check stock availability
- Validate draft name if saving
- Prevent duplicate draft names

### Step 4: Stock Deduction
- Calculate requirements based on batch ratio
- Deduct raw materials
- Create product record

## Key Differences from Current Implementation

| Current | Required |
|---------|----------|
| Batches created separately | Drafts created inline |
| Ingredients read-only | Ingredients always editable |
| Must use existing batch | Can produce without draft |
| Batch selection required | Draft selection optional |
| No inline draft creation | Create drafts during production |

## Benefits of This Approach

1. **Flexibility**: Users can produce with or without saving drafts
2. **Speed**: Quick one-time production without creating drafts
3. **Reusability**: Save commonly used ingredient combinations
4. **Editability**: Modify drafts on-the-fly without affecting originals
5. **Simplicity**: Single form for all production scenarios

## Migration Strategy

**Existing Data:**
- Keep `recipe_batches` and `recipe_batch_ingredients` tables
- Existing batches become "drafts"
- No data loss

**New Behavior:**
- Drafts are optional, not required
- Users can produce without selecting a draft
- Drafts can be created during production

## Next Steps

1. ✅ Review this plan
2. Create updated ProductFormWithInlineDrafts component
3. Test all workflows
4. Update documentation

---

**This is the correct implementation that matches your requirements!**
