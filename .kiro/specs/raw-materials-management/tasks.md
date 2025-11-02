# Raw Materials Management - Implementation Tasks

## Database Setup

- [x] 1. Create database tables and views


  - Create `raw_materials` table with store_id and unique constraint
  - Create `raw_material_stock` table with foreign keys
  - Create `v_raw_material_stock_status` view for listing
  - Add indexes for performance optimization
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.6, 5.1, 5.2_



- [ ] 2. Set up Row Level Security policies
  - Enable RLS on `raw_materials` table
  - Enable RLS on `raw_material_stock` table
  - Create SELECT, INSERT, UPDATE, DELETE policies for both tables


  - Test policies with different store users
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 3. Create database triggers
  - Add `updated_at` trigger for `raw_materials` table




  - Add `updated_at` trigger for `raw_material_stock` table
  - _Requirements: 1.1, 2.1_

## Frontend Components


- [ ] 4. Create RawMaterialsPage component
  - [ ] 4.1 Set up page structure with header and search
    - Create page component with layout
    - Add search input with icon
    - Add "Add Stock" button
    - Implement loading state

    - _Requirements: 4.1, 4.2, 7.1, 7.2, 7.3_

  - [ ] 4.2 Implement stock listing table
    - Create table with columns: Name, Unit, Quantity, Price, Status, Actions
    - Fetch data from `v_raw_material_stock_status` view

    - Display stock status badges with colors
    - Add edit and delete action buttons
    - _Requirements: 4.1, 4.2, 4.4, 4.5_

  - [x] 4.3 Implement search functionality



    - Add search state and filter logic
    - Filter by raw material name
    - Update table on search input change
    - _Requirements: 4.3_

  - [x] 4.4 Implement delete functionality

    - Add confirmation dialog
    - Call Supabase delete API
    - Refresh list after deletion
    - Show success/error toast messages
    - _Requirements: 4.4, 7.5, 8.4_


- [ ] 5. Create RawMaterialStockForm component
  - [ ] 5.1 Set up form structure and state
    - Create modal form component
    - Define form state for all fields
    - Add form validation state

    - Implement loading state
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 7.4_

  - [ ] 5.2 Implement raw material dropdown
    - Fetch raw materials from database
    - Create dropdown with material options

    - Add "Add New" button next to dropdown
    - Handle material selection
    - _Requirements: 2.1, 3.1, 3.2_

  - [ ] 5.3 Implement unit selection dropdown
    - Create dropdown with predefined units
    - Options: liter, milliliter, kilogram, gram, cups, pieces, boxes, packets
    - Set default to kilogram
    - _Requirements: 2.2, 6.1, 6.2, 6.4_

  - [ ] 5.4 Implement quantity and price inputs
    - Add numeric input for quantity
    - Add numeric input for purchase price



    - Set step="0.01" for price input
    - Add min="0" validation
    - _Requirements: 2.3, 2.4_

  - [ ] 5.5 Implement form submission
    - Validate all required fields

    - Convert form data to database format
    - Call Supabase insert/update API
    - Handle success and error cases
    - Close form and refresh parent on success
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 7.5, 8.1, 8.2, 8.3, 8.4_


- [x] 6. Create AddRawMaterialModal component


  - [ ] 6.1 Set up modal structure
    - Create modal component with overlay
    - Add header with title and close button
    - Add form with single input field



    - Add cancel and save buttons
    - _Requirements: 3.2, 3.4_

  - [ ] 6.2 Implement material name input and validation
    - Add text input for material name
    - Validate required field
    - Trim whitespace
    - Check for duplicate names
    - _Requirements: 1.2, 8.1, 8.5_

  - [ ] 6.3 Implement save functionality
    - Call Supabase insert API
    - Associate with current store
    - Return created material to parent
    - Close modal on success
    - Show error toast on failure
    - _Requirements: 1.1, 1.2, 1.3, 3.3, 7.5, 8.4_

## Navigation and Routing

- [ ] 7. Update Sidebar navigation
  - Add "Raw Materials" menu item with icon
  - Set path to "/raw-materials"
  - Position appropriately in menu order
  - _Requirements: 7.1, 7.2_

- [ ] 8. Update App routing
  - Import RawMaterialsPage component
  - Add route for "/raw-materials"
  - Ensure route is protected (requires authentication)
  - _Requirements: 7.2_

## Integration and Testing

- [ ] 9. Test complete user flow
  - Test adding new raw material type
  - Test adding stock with existing material
  - Test inline material creation from stock form
  - Test editing stock entry
  - Test deleting stock entry
  - Test search functionality
  - Verify stock status indicators display correctly
  - _Requirements: All_

- [ ] 10. Test multi-tenancy
  - Create test data for multiple stores
  - Verify data isolation between stores
  - Test RLS policies prevent cross-store access
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 11. Test error handling
  - Test form validation errors
  - Test duplicate material name error
  - Test network error handling
  - Test database constraint violations
  - Verify user-friendly error messages
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

## Documentation

- [ ] 12. Update user documentation
  - Document how to add raw materials
  - Document how to manage stock
  - Add screenshots of key features
  - _Requirements: All_
