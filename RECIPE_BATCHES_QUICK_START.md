# Recipe Batches - Quick Start Guide

## What is a Recipe Batch?
A recipe batch is a specific combination of ingredients and quantities that can be used to produce a product. For example, your tea product can have:
- **Small Batch**: 2L milk + 50g tea powder → Makes 50 cups
- **Large Batch**: 4L milk + 100g tea powder → Makes 100 cups

## How to Use Recipe Batches

### Step 1: Create Recipe Batches
1. Go to **Product Templates** page
2. Find a product template with ingredients
3. Click the **purple Layers icon** (🔷) next to the template
4. Click **"Add Batch"**
5. Fill in:
   - **Batch Name**: e.g., "Small Batch", "2L Milk Recipe"
   - **Producible Quantity**: How many units this recipe makes (e.g., 50)
   - **Ingredients**: Add raw materials and their quantities
6. Click **"Create Batch"**
7. Repeat to create multiple batches for the same product

### Step 2: Produce Products Using Batches
1. Go to **Products** page
2. Click **"Add Product"**
3. Select **Product Name** (e.g., Tea)
4. A **"Select Recipe Batch"** dropdown will appear
5. Choose which batch to use:
   - "Small Batch - Makes 50 cups"
   - "Large Batch - Makes 100 cups"
6. Ingredients will auto-populate from the selected batch
7. Enter **Quantity to Produce** (e.g., 100)
   - System will calculate: "2× the recipe" if batch makes 50
8. System validates if you have enough stock
9. Click **"Produce Product"**

### Step 3: Manage Batches
**View Batches:**
- Product Templates → Click Layers icon → See all batches

**Edit a Batch:**
- Click the blue Edit icon next to a batch
- Modify name, quantity, or ingredients
- Click "Update Batch"

**Delete a Batch:**
- Click the red Trash icon
- Confirm deletion
- Note: Cannot delete the last batch

**Set Default Batch:**
- Click the purple Check icon next to a batch
- This batch will be pre-selected when producing

## Visual Flow

```
Product Templates Page
    ↓
Click Layers Icon (🔷)
    ↓
Manage Recipe Batches Modal
    ↓
[Batch 1: Small - 50 cups]  ← Default
[Batch 2: Large - 100 cups]
[Batch 3: Premium - 75 cups]
    ↓
Add/Edit/Delete Batches
```

```
Products Page
    ↓
Add Product
    ↓
Select Product Name: "Tea"
    ↓
Select Recipe Batch: "Large Batch - Makes 100 cups"
    ↓
Ingredients Auto-Populate:
  • Milk: 4L
  • Tea Powder: 100g
    ↓
Enter Quantity: 200 cups
    ↓
System Calculates: 2× recipe needed
  • Milk needed: 8L
  • Tea Powder needed: 200g
    ↓
Stock Validation ✅
    ↓
Produce Product
```

## Benefits

### 1. Flexibility
- Create different recipes for different batch sizes
- Adjust ingredients based on availability
- Seasonal variations (summer recipe vs winter recipe)

### 2. Accuracy
- Precise ingredient tracking per batch
- Automatic stock deduction based on batch ratios
- No manual calculations needed

### 3. Efficiency
- Quick batch selection during production
- Default batch for common recipes
- Reusable recipes across production runs

### 4. Cost Management
- Track ingredient costs per batch
- Compare batch efficiency
- Optimize production based on ingredient prices

## Example Scenarios

### Scenario 1: Tea Shop
**Product:** Tea
- **Morning Batch**: 2L milk, 40g tea → 40 cups (lighter tea)
- **Evening Batch**: 2L milk, 60g tea → 40 cups (stronger tea)
- **Bulk Batch**: 10L milk, 200g tea → 200 cups (for events)

### Scenario 2: Juice Bar
**Product:** Orange Juice
- **Small Batch**: 5kg oranges → 2L juice
- **Large Batch**: 20kg oranges → 8L juice
- **Premium Batch**: 10kg oranges + 1kg sugar → 4L sweetened juice

### Scenario 3: Bakery
**Product:** Bread
- **Standard Batch**: 5kg flour, 3L water → 20 loaves
- **Whole Wheat Batch**: 5kg wheat flour, 3.5L water → 18 loaves
- **Artisan Batch**: 4kg flour, 2.5L water, 500g seeds → 15 loaves

## Tips & Best Practices

### Naming Batches
✅ Good names:
- "Small Batch (2L)"
- "Large Batch (4L)"
- "Premium Recipe"
- "Standard Recipe"
- "Summer Blend"

❌ Avoid:
- "Batch 1", "Batch 2" (not descriptive)
- Very long names

### Setting Defaults
- Set your most commonly used batch as default
- Default batch is pre-selected during production
- Saves time for routine production

### Stock Management
- System warns if stock is insufficient
- Cannot produce if any ingredient is short
- Add stock before attempting production

### Batch Organization
- Keep 2-4 batches per product (avoid too many)
- Delete unused batches to keep list clean
- Update batches when recipes change

## Troubleshooting

**Q: I don't see the batch selector when adding a product**
A: Make sure you've created at least one recipe batch for that product template first.

**Q: Can I change ingredients after selecting a batch?**
A: No, ingredients are read-only when a batch is selected. Edit the batch itself if you need to change ingredients.

**Q: What happens to old products when I create new batches?**
A: Existing products are not affected. New batches only apply to future production.

**Q: Can I delete all batches?**
A: No, at least one batch must exist for products with ingredients.

**Q: How do I know which batch was used for a product?**
A: The system tracks this internally. Future updates may show batch history.

## Migration Note
If you had products with ingredients before this feature:
- All existing ingredients were automatically migrated to a "Standard Recipe" batch
- This batch is set as the default
- You can now create additional batches or edit the standard one
- No data was lost during migration

---

**Need Help?**
- Check the main implementation document for technical details
- Test with a simple product first
- Create batches before attempting production
- Verify stock levels before producing

**Happy Batch Cooking! 🍵☕🥤**
