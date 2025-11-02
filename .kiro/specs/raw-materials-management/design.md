# Raw Materials Management - Design Document

## Overview

The Raw Materials Management feature provides a comprehensive solution for tracking ingredients and supplies in a multi-tenant POS system. The design follows the existing application patterns and integrates seamlessly with the current architecture.

## Architecture

### Database Schema

#### Table: `raw_materials`
Master table for raw material types (e.g., Milk, Tea Powder, Sugar).

```sql
CREATE TABLE raw_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  store_id UUID NOT NULL REFERENCES stores(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(name, store_id)
);
```

#### Table: `raw_material_stock`
Store-specific stock records with quantity and pricing.

```sql
CREATE TABLE raw_material_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_material_id UUID NOT NULL REFERENCES raw_materials(id),
  store_id UUID NOT NULL REFERENCES stores(id),
  unit TEXT NOT NULL DEFAULT 'kg',
  quantity NUMERIC DEFAULT 0,
  purchase_price NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### View: `v_raw_material_stock_status`
Consolidated view for displaying stock with material names.

```sql
CREATE VIEW v_raw_material_stock_status AS
SELECT 
  rms.id,
  rms.store_id,
  rm.name as raw_material_name,
  rms.unit,
  rms.quantity,
  rms.purchase_price,
  CASE 
    WHEN rms.quantity <= 0 THEN 'out_of_stock'
    WHEN rms.quantity <= 10 THEN 'low_stock'
    ELSE 'in_stock'
  END as stock_status,
  rms.created_at,
  rms.updated_at
FROM raw_material_stock rms
INNER JOIN raw_materials rm ON rms.raw_material_id = rm.id
WHERE rms.is_active = true AND rm.is_active = true;
```

### Row Level Security (RLS)

Both tables will have RLS policies to ensure data isolation:

```sql
-- raw_materials policies
CREATE POLICY "Users can view their store's raw materials"
  ON raw_materials FOR SELECT
  USING (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert raw materials for their store"
  ON raw_materials FOR INSERT
  WITH CHECK (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update their store's raw materials"
  ON raw_materials FOR UPDATE
  USING (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

-- raw_material_stock policies
CREATE POLICY "Users can view their store's stock"
  ON raw_material_stock FOR SELECT
  USING (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert stock for their store"
  ON raw_material_stock FOR INSERT
  WITH CHECK (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update their store's stock"
  ON raw_material_stock FOR UPDATE
  USING (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete their store's stock"
  ON raw_material_stock FOR DELETE
  USING (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));
```

## Components and Interfaces

### 1. RawMaterialsPage Component

**Location:** `src/pages/raw-materials/RawMaterialsPage.tsx`

**Responsibilities:**
- Display list of raw material stock entries
- Provide search/filter functionality
- Handle add/edit/delete operations
- Show stock status indicators

**State:**
```typescript
interface RawMaterialStock {
  id: string;
  raw_material_name: string;
  unit: string;
  quantity: number;
  purchase_price: number;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock';
}

const [stocks, setStocks] = useState<RawMaterialStock[]>([]);
const [loading, setLoading] = useState(true);
const [searchQuery, setSearchQuery] = useState('');
const [showForm, setShowForm] = useState(false);
const [editingStock, setEditingStock] = useState<RawMaterialStock | null>(null);
```

**Key Functions:**
- `loadStocks()` - Fetch stock from v_raw_material_stock_status view
- `handleDelete(id)` - Delete stock entry
- `handleEdit(stock)` - Open form for editing
- `handleFormClose()` - Close form and refresh data

### 2. RawMaterialStockForm Component

**Location:** `src/pages/raw-materials/RawMaterialStockForm.tsx`

**Responsibilities:**
- Form for adding/editing stock entries
- Raw material dropdown with "Add New" button
- Unit selection dropdown
- Quantity and price inputs
- Trigger AddRawMaterialModal

**Props:**
```typescript
interface RawMaterialStockFormProps {
  stock?: RawMaterialStock | null;
  onClose: () => void;
}
```

**State:**
```typescript
const [formData, setFormData] = useState({
  raw_material_id: '',
  unit: 'kg',
  quantity: '0',
  purchase_price: '0',
});
const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
```

**Unit Options:**
- liter (ltr)
- milliliter (ml)
- kilogram (kg)
- gram (g)
- cups
- pieces (pcs)
- boxes
- packets

### 3. AddRawMaterialModal Component

**Location:** `src/pages/raw-materials/AddRawMaterialModal.tsx`

**Responsibilities:**
- Quick modal for adding new raw material types
- Single input field for material name
- Validation for duplicate names
- Return newly created material to parent

**Props:**
```typescript
interface AddRawMaterialModalProps {
  onClose: () => void;
  onSuccess: (material: RawMaterial) => void;
}
```

**State:**
```typescript
const [materialName, setMaterialName] = useState('');
const [loading, setLoading] = useState(false);
```

### 4. Sidebar Navigation Update

**Location:** `src/components/layout/Sidebar.tsx`

Add new menu item:
```typescript
{
  name: 'Raw Materials',
  icon: Package2, // or appropriate icon
  path: '/raw-materials',
}
```

### 5. Routing Update

**Location:** `src/App.tsx`

Add route:
```typescript
<Route path="/raw-materials" element={<RawMaterialsPage />} />
```

## Data Models

### TypeScript Interfaces

```typescript
// Raw Material Type
interface RawMaterial {
  id: string;
  name: string;
  store_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Raw Material Stock
interface RawMaterialStock {
  id: string;
  raw_material_id: string;
  raw_material_name?: string; // From view
  store_id: string;
  unit: string;
  quantity: number;
  purchase_price: number;
  stock_status?: string; // From view
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Form Data
interface RawMaterialStockFormData {
  raw_material_id: string;
  unit: string;
  quantity: string;
  purchase_price: string;
}
```

## Error Handling

### Validation Rules

1. **Raw Material Name:**
   - Required
   - Must be unique per store
   - Trim whitespace

2. **Quantity:**
   - Required
   - Must be >= 0
   - Numeric validation

3. **Purchase Price:**
   - Required
   - Must be >= 0
   - Numeric validation with 2 decimal places

4. **Unit:**
   - Required
   - Must be from predefined list

### Error Messages

- "Please enter a raw material name"
- "This raw material already exists"
- "Please select a raw material"
- "Quantity must be zero or greater"
- "Purchase price must be zero or greater"
- "Failed to load raw materials"
- "Failed to save stock entry"
- "Failed to delete stock entry"

## Testing Strategy

### Unit Tests (Optional)

1. **Form Validation:**
   - Test required field validation
   - Test numeric validation
   - Test duplicate name detection

2. **Data Transformation:**
   - Test form data to database format conversion
   - Test view data to display format conversion

### Integration Tests (Optional)

1. **CRUD Operations:**
   - Create raw material type
   - Create stock entry
   - Update stock entry
   - Delete stock entry
   - List stock entries with search

2. **Multi-tenancy:**
   - Verify data isolation between stores
   - Verify RLS policies work correctly

### Manual Testing Checklist

1. ✓ Add new raw material type
2. ✓ Add stock entry with existing material
3. ✓ Add stock entry with inline material creation
4. ✓ Edit stock entry
5. ✓ Delete stock entry
6. ✓ Search/filter stock entries
7. ✓ Verify stock status indicators
8. ✓ Test with multiple stores (data isolation)
9. ✓ Test form validation
10. ✓ Test error handling

## UI/UX Considerations

### Layout

- Follow existing page patterns (Products, Categories)
- Use card-based layout for main content
- Modal forms for add/edit operations
- Responsive design for mobile devices

### Visual Indicators

- **Stock Status Colors:**
  - Green: In Stock (quantity > 10)
  - Yellow: Low Stock (quantity 1-10)
  - Red: Out of Stock (quantity = 0)

### User Flow

1. User clicks "Raw Materials" in sidebar
2. System displays stock listing page
3. User clicks "Add Stock" button
4. System displays stock form modal
5. User selects raw material from dropdown OR clicks "Add New"
6. If "Add New": System shows quick add modal
7. User enters material name and saves
8. System returns to stock form with new material selected
9. User enters unit, quantity, and price
10. User saves stock entry
11. System refreshes listing and shows success message

## Performance Considerations

- Use view for efficient querying (joins pre-computed)
- Index on store_id for both tables
- Index on raw_material_id in stock table
- Limit search results to reasonable number (e.g., 100)
- Debounce search input to reduce queries

## Security Considerations

- RLS policies enforce store-level isolation
- All queries filtered by authenticated user's store
- Validate all inputs on both client and server
- Prevent SQL injection through parameterized queries
- Use Supabase's built-in authentication

## Future Enhancements

1. **Stock Movements:** Track additions/deductions with audit trail
2. **Low Stock Alerts:** Notify when materials run low
3. **Supplier Integration:** Link raw materials to suppliers
4. **Recipe Management:** Track raw material usage in products
5. **Batch Tracking:** Track different batches with expiry dates
6. **Cost Analysis:** Calculate cost per unit over time
7. **Bulk Import:** Import raw materials from CSV/Excel
