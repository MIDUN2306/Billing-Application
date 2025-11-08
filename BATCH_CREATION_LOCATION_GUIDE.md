# 📍 Batch Creation & Editing - Complete Location Guide

## Where is the Batch Creation/Editing?

### Main File: `src/pages/preparation/BatchManagementView.tsx`

This file contains **ALL** the batch creation and editing functionality.

---

## 🎯 Key Sections Breakdown

### 1️⃣ **Ingredient Selection Dropdown** (Lines 620-630)

```tsx
<select
  value={row.raw_material_id}
  onChange={(e) => handleRawMaterialChange(index, e.target.value)}
  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg"
>
  <option value="">Select Raw Material</option>
  {rawMaterials.map((material) => (
    <option key={material.id} value={material.id}>
      {material.name} ({material.quantity} {material.unit})
    </option>
  ))}
</select>
```

**📌 This is where you select ingredients from raw materials!**

---

### 2️⃣ **Handler Function for Ingredient Selection** (Lines 250-258)

```tsx
const handleRawMaterialChange = (index: number, rawMaterialId: string) => {
  const material = rawMaterials.find(m => m.id === rawMaterialId);
  const newRows = [...ingredientRows];
  newRows[index] = {
    ...newRows[index],
    raw_material_id: rawMaterialId,
    unit: material?.unit || '',  // ← Auto-fills unit from raw material
  };
  setIngredientRows(newRows);
};
```

**📌 This function handles when you select an ingredient!**

---

### 3️⃣ **Raw Materials Loading** (Lines 120-150)

```tsx
const loadRawMaterials = async () => {
  if (!currentStore) return;

  try {
    const { data, error } = await supabase
      .from('raw_material_stock')
      .select(`
        id,
        raw_material_id,
        unit,
        quantity,
        raw_materials (
          id,
          name
        )
      `)
      .eq('store_id', currentStore.id)
      .eq('is_active', true);

    if (error) throw error;

    const materials: RawMaterialWithStock[] = (data || []).map((item: any) => ({
      id: item.raw_materials.id,
      name: item.raw_materials.name,
      unit: item.unit,
      quantity: item.quantity,
    }));

    setRawMaterials(materials);
  } catch (error) {
    console.error('Error loading raw materials:', error);
  }
};
```

**📌 This loads all available raw materials from the database!**

---

### 4️⃣ **Add Ingredient Button** (Lines 605-615)

```tsx
<button
  type="button"
  onClick={addIngredientRow}
  className="text-sm px-3 py-1 bg-primary-600 text-white rounded-lg"
>
  <Plus className="w-4 h-4" />
  Add Ingredient
</button>
```

**📌 This button adds a new ingredient row!**

---

### 5️⃣ **Save Batch Function** (Lines 310-380)

```tsx
const handleSaveBatch = async () => {
  if (!currentStore || !selectedProduct) return;
  if (!validateBatchForm()) return;

  setLoading(true);
  try {
    if (editingBatchId) {
      // UPDATE EXISTING BATCH
      const { error: updateError } = await supabase
        .from('recipe_batches')
        .update({
          batch_name: formData.batch_name.trim(),
          producible_quantity: parseFloat(formData.producible_quantity),
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingBatchId);

      if (updateError) throw updateError;

      // Delete old ingredients
      await supabase
        .from('recipe_batch_ingredients')
        .delete()
        .eq('recipe_batch_id', editingBatchId);

      // Insert new ingredients
      const ingredientsToInsert = ingredientRows.map(row => ({
        recipe_batch_id: editingBatchId,
        raw_material_id: row.raw_material_id,
        quantity_needed: parseFloat(row.quantity_needed),
        unit: row.unit,
        store_id: currentStore.id,
      }));

      const { error: ingredientsError } = await supabase
        .from('recipe_batch_ingredients')
        .insert(ingredientsToInsert);

      if (ingredientsError) throw ingredientsError;

      toast.success('Batch updated successfully');
    } else {
      // CREATE NEW BATCH
      const { data: newBatch, error: batchError } = await supabase
        .from('recipe_batches')
        .insert([{
          product_template_id: selectedProduct.id,
          batch_name: formData.batch_name.trim(),
          producible_quantity: parseFloat(formData.producible_quantity),
          is_default: selectedProduct.batches.length === 0,
          store_id: currentStore.id,
        }])
        .select()
        .single();

      if (batchError) throw batchError;

      // Insert ingredients
      const ingredientsToInsert = ingredientRows.map(row => ({
        recipe_batch_id: newBatch.id,
        raw_material_id: row.raw_material_id,
        quantity_needed: parseFloat(row.quantity_needed),
        unit: row.unit,
        store_id: currentStore.id,
      }));

      const { error: ingredientsError } = await supabase
        .from('recipe_batch_ingredients')
        .insert(ingredientsToInsert);

      if (ingredientsError) throw ingredientsError;

      toast.success('Batch created successfully');
    }

    setShowBatchForm(false);
    setFormData({ batch_name: '', producible_quantity: '' });
    setIngredientRows([]);
    loadProductsWithBatches();
  } catch (error: any) {
    console.error('Error saving batch:', error);
    toast.error(error.message || 'Failed to save batch');
  } finally {
    setLoading(false);
  }
};
```

**📌 This function saves the batch to the database!**

---

## 🔄 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                  BatchManagementView.tsx                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  1. Component Loads                                         │
│     ├─ useEffect() runs                                     │
│     ├─ loadProductsWithBatches()                            │
│     └─ loadRawMaterials() ← LOADS INGREDIENTS FROM DB       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  2. User Clicks "Add Batch"                                 │
│     ├─ handleAddBatch()                                     │
│     ├─ setShowBatchForm(true)                               │
│     └─ Shows batch form                                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  3. User Fills Form                                         │
│     ├─ Batch Name: "Large Batch"                            │
│     ├─ Producible Quantity: 2 (liters)                      │
│     └─ Clicks "Add Ingredient"                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Add Ingredient Row                                      │
│     ├─ addIngredientRow()                                   │
│     └─ Adds empty row to ingredientRows[]                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  5. Select Raw Material (INGREDIENT SELECTION)              │
│     ├─ Dropdown shows: rawMaterials[]                       │
│     │   • Milk (10 L)                                       │
│     │   • Tea Powder (500 g)                                │
│     │   • Sugar (1000 g)                                    │
│     ├─ User selects "Milk"                                  │
│     ├─ handleRawMaterialChange(0, 'milk-id')                │
│     └─ Auto-fills unit: "L"                                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  6. Enter Quantity                                          │
│     ├─ User types: "2"                                      │
│     ├─ handleQuantityChange(0, "2")                         │
│     └─ Updates ingredientRows[0].quantity_needed = "2"      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  7. Repeat for More Ingredients                             │
│     ├─ Click "Add Ingredient" again                         │
│     ├─ Select "Tea Powder" → 100 g                          │
│     └─ Select "Sugar" → 200 g                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  8. Click "Create Batch"                                    │
│     ├─ handleSaveBatch()                                    │
│     ├─ validateBatchForm() ← Checks all fields              │
│     └─ If valid, proceed to save                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  9. Save to Database                                        │
│     ├─ INSERT into recipe_batches                           │
│     │   • batch_name: "Large Batch"                         │
│     │   • producible_quantity: 2                            │
│     │   • product_template_id: tea-id                       │
│     │                                                        │
│     └─ INSERT into recipe_batch_ingredients (3 rows)        │
│         • Milk: 2 L                                         │
│         • Tea Powder: 100 g                                 │
│         • Sugar: 200 g                                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  10. Success!                                               │
│      ├─ toast.success("Batch created successfully")         │
│      ├─ setShowBatchForm(false)                             │
│      ├─ loadProductsWithBatches() ← Refresh list            │
│      └─ Batch now appears in list                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Structure

### State Variables

```tsx
// Form data
const [formData, setFormData] = useState({
  batch_name: '',
  producible_quantity: '',
});

// Ingredient rows (array of ingredients)
const [ingredientRows, setIngredientRows] = useState<IngredientRow[]>([]);

// Available raw materials (loaded from database)
const [rawMaterials, setRawMaterials] = useState<RawMaterialWithStock[]>([]);
```

### IngredientRow Interface

```tsx
interface IngredientRow {
  raw_material_id: string;  // ← Selected ingredient ID
  quantity_needed: string;  // ← How much needed
  unit: string;             // ← Auto-filled from raw material
}
```

### RawMaterialWithStock Interface

```tsx
interface RawMaterialWithStock {
  id: string;        // ← Raw material ID
  name: string;      // ← Display name (e.g., "Milk")
  unit: string;      // ← Unit (e.g., "L", "g")
  quantity: number;  // ← Available stock
}
```

---

## 🔗 Database Connection

### Tables Involved

1. **`raw_material_stock`** ← Source of ingredients
   - Loaded in `loadRawMaterials()`
   - Shows available stock

2. **`recipe_batches`** ← Batch header
   - Created/Updated in `handleSaveBatch()`
   - Stores batch name and producible quantity

3. **`recipe_batch_ingredients`** ← Batch ingredients
   - Created in `handleSaveBatch()`
   - Links raw materials to batch

---

## 🎯 Where to Connect Your Custom Logic

### Option 1: Modify Ingredient Dropdown
**Location:** Lines 620-630 in `BatchManagementView.tsx`

```tsx
<select
  value={row.raw_material_id}
  onChange={(e) => handleRawMaterialChange(index, e.target.value)}
>
  <option value="">Select Raw Material</option>
  {rawMaterials.map((material) => (
    <option key={material.id} value={material.id}>
      {/* YOU CAN CUSTOMIZE THIS DISPLAY */}
      {material.name} ({material.quantity} {material.unit})
    </option>
  ))}
</select>
```

### Option 2: Modify Raw Material Loading
**Location:** Lines 120-150 in `BatchManagementView.tsx`

```tsx
const loadRawMaterials = async () => {
  // YOU CAN ADD FILTERS HERE
  // Example: Only load specific categories
  const { data, error } = await supabase
    .from('raw_material_stock')
    .select(`...`)
    .eq('store_id', currentStore.id)
    .eq('is_active', true)
    // .eq('category', 'beverages')  ← ADD CUSTOM FILTERS
    ;
}
```

### Option 3: Add Custom Validation
**Location:** Lines 280-310 in `BatchManagementView.tsx`

```tsx
const validateBatchForm = (): boolean => {
  // EXISTING VALIDATION
  if (!formData.batch_name.trim()) {
    toast.error('Please enter batch name');
    return false;
  }

  // ADD YOUR CUSTOM VALIDATION HERE
  // Example: Check minimum quantity
  if (parseFloat(formData.producible_quantity) < 0.5) {
    toast.error('Minimum producible quantity is 0.5L');
    return false;
  }

  return true;
};
```

---

## 📝 Summary

### ✅ Batch Creation Location
**File:** `src/pages/preparation/BatchManagementView.tsx`

### ✅ Key Functions
1. **`loadRawMaterials()`** - Loads ingredients from database
2. **`handleRawMaterialChange()`** - Handles ingredient selection
3. **`addIngredientRow()`** - Adds new ingredient row
4. **`handleSaveBatch()`** - Saves batch to database
5. **`validateBatchForm()`** - Validates form before saving

### ✅ Ingredient Selection
- **Dropdown:** Lines 620-630
- **Handler:** Lines 250-258
- **Data Source:** `rawMaterials` state (loaded from `raw_material_stock` table)

### ✅ Database Tables
- `raw_material_stock` → Source of ingredients
- `recipe_batches` → Batch header
- `recipe_batch_ingredients` → Batch ingredients

---

**Now you know exactly where everything is! Tell me what you want to connect or modify, and I'll help you implement it! 🚀**
