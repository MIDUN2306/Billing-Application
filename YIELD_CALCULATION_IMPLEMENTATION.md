# Auto-Calculate Yield System - Implementation in Progress ✅

## Status: Phase 1 Complete, Phase 2 In Progress

### ✅ Completed:

#### 1. Database Migration
- Added `yield_type` column ('auto' or 'manual')
- Added `base_unit_size` column (for auto-calculate)
- Added `expected_yield` column (for manual reference)
- Updated views to include yield configuration
- Recreated materialized views

#### 2. Type Definitions
- Updated `ProductTemplate` interface with yield fields
- Added proper TypeScript types

#### 3. Product Template Form UI
- Added Yield Configuration section
- Radio buttons for Auto-Calculate vs Manual Entry
- Conditional fields based on selection:
  - Auto: Base Unit Size input
  - Manual: Expected Yield input
- Beautiful UI with visual indicators (🧮 and 📦)
- Proper form validation and data submission

### 🚧 Remaining Work:

#### 4. Product Form - Yield Calculation Logic
Need to add to `src/pages/products/ProductForm.tsx`:

```typescript
// Add yield calculation state
const [yieldCalculation, setYieldCalculation] = useState<{
  maxQuantity: number;
  limitingIngredient: string;
  breakdown: Array<{
    ingredient: string;
    canMake: number;
  }>;
} | null>(null);

// Calculate max yield for auto-calculate templates
const calculateMaxYield = () => {
  if (!selectedTemplate || selectedTemplate.yield_type !== 'auto' || ingredients.length === 0) {
    return null;
  }

  const breakdown = ingredients.map(ing => ({
    ingredient: ing.raw_material_name,
    canMake: Math.floor(ing.available_stock / ing.quantity_needed)
  }));
  
  const minQuantity = Math.min(...breakdown.map(b => b.canMake));
  const limiting = breakdown.find(b => b.canMake === minQuantity);
  
  return {
    maxQuantity: minQuantity,
    limitingIngredient: limiting?.ingredient || '',
    breakdown
  };
};

// Call this when template or ingredients change
useEffect(() => {
  if (selectedTemplate?.yield_type === 'auto') {
    const calc = calculateMaxYield();
    setYieldCalculation(calc);
    if (calc) {
      setFormData(prev => ({ ...prev, quantity: calc.maxQuantity.toString() }));
    }
  }
}, [selectedTemplate, ingredients]);
```

#### 5. Product Form UI - Display Yield Info
Add after template details section:

```tsx
{/* Yield Calculation Display */}
{selectedTemplate?.yield_type === 'auto' && yieldCalculation && (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
    <h3 className="text-sm font-medium text-blue-900 mb-3 flex items-center gap-2">
      🧮 Yield Calculation
    </h3>
    
    <div className="space-y-2 mb-3">
      <p className="text-xs text-blue-800 font-medium">
        Based on current stock:
      </p>
      {yieldCalculation.breakdown.map((item, index) => (
        <div key={index} className="flex justify-between text-xs">
          <span className="text-blue-700">
            • {item.ingredient}
          </span>
          <span className={item.canMake === yieldCalculation.maxQuantity ? 'text-orange-600 font-medium' : 'text-blue-600'}>
            Can make {item.canMake} {selectedTemplate.unit}
          </span>
        </div>
      ))}
    </div>
    
    <div className="bg-blue-100 rounded p-2">
      <p className="text-sm font-medium text-blue-900">
        ✓ Maximum: {yieldCalculation.maxQuantity} {selectedTemplate.unit}
      </p>
      <p className="text-xs text-blue-700">
        Limited by: {yieldCalculation.limitingIngredient}
      </p>
    </div>
  </div>
)}

{/* Quantity Input */}
<div>
  <label className="block text-sm font-medium text-secondary-700 mb-2">
    Quantity to Produce *
  </label>
  <input
    type="number"
    required
    min="1"
    max={selectedTemplate?.yield_type === 'auto' && yieldCalculation ? yieldCalculation.maxQuantity : undefined}
    step="1"
    value={formData.quantity}
    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
    placeholder="Enter quantity"
    disabled={!selectedTemplate}
  />
  {selectedTemplate?.yield_type === 'auto' && yieldCalculation && (
    <p className="text-xs text-secondary-500 mt-1">
      Maximum: {yieldCalculation.maxQuantity} {selectedTemplate.unit}
    </p>
  )}
  {selectedTemplate?.yield_type === 'manual' && selectedTemplate.expected_yield && (
    <p className="text-xs text-secondary-500 mt-1">
      Expected yield: ~{selectedTemplate.expected_yield} {selectedTemplate.unit} per batch
    </p>
  )}
</div>
```

#### 6. Product Templates List - Show Yield Type Indicator
Add icon/badge to show yield type:

```tsx
<td className="px-6 py-4">
  <div className="flex items-center gap-2">
    <span className="font-medium text-secondary-900">
      {template.product_name || template.name}
    </span>
    {template.yield_type === 'auto' && (
      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
        🧮 Auto
      </span>
    )}
  </div>
</td>
```

### 📊 How It Works:

#### For Auto-Calculate Templates:
1. User creates template with yield_type='auto'
2. User adds ingredients (e.g., 0.12L milk per cup)
3. When creating product:
   - System checks available stock
   - Calculates max quantity for each ingredient
   - Shows limiting ingredient
   - Pre-fills quantity with maximum possible
   - User can reduce quantity if needed

#### For Manual Entry Templates:
1. User creates template with yield_type='manual'
2. Optionally sets expected_yield (e.g., 100 pieces)
3. When creating product:
   - User enters actual quantity produced
   - System shows expected yield as reference
   - Validates ingredients are available
   - Deducts ingredients based on entered quantity

### 🎯 Benefits:

1. **Smart Production Planning**
   - Know exactly how much you can make
   - See which ingredient is limiting
   - Prevent starting production without enough materials

2. **Flexibility**
   - Auto-calculate for recipe-based products (tea, coffee)
   - Manual entry for batch products (biscuits, cookies)

3. **Better Inventory Management**
   - Optimize ingredient usage
   - Reduce waste
   - Accurate stock tracking

4. **User-Friendly**
   - Clear visual indicators
   - Helpful messages
   - Automatic calculations

### 📝 Next Steps:

1. Complete Product Form yield calculation logic
2. Add yield type indicators to templates list
3. Test auto-calculate with real data
4. Test manual entry workflow
5. Add validation for edge cases
6. Create user documentation

### 🧪 Testing Scenarios:

**Scenario 1: Tea (Auto-Calculate)**
- Template: Tea - Regular Cup
- Ingredients: 0.12L milk, 5g tea powder, 10g sugar
- Stock: 10L milk, 1kg tea, 2kg sugar
- Expected: Can make 83 cups (limited by milk)

**Scenario 2: Biscuits (Manual)**
- Template: Chocolate Biscuits
- Ingredients: 2kg flour, 1kg sugar, 0.5kg butter
- User enters: 500 pieces
- Expected: Deducts ingredients, creates 500 biscuits

---

**Status**: ✅ 70% Complete
**Next**: Finish Product Form yield calculation UI
**ETA**: 15-20 minutes to complete
