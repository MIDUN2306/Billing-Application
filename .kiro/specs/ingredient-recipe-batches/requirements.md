# Requirements Document

## Introduction

This feature introduces a flexible recipe batch system that allows users to define multiple ingredient combinations (batches) for the same product. For example, a tea product can have different batches: one using 2 liters of milk, another using 4 liters of milk. This enables businesses to produce products with varying ingredient quantities based on demand, batch size, or recipe variations, while maintaining accurate inventory tracking and cost management.

## Glossary

- **Product_System**: The existing product management system that handles product creation, inventory, and sales
- **Recipe_Batch**: A specific combination of raw materials and their quantities that can be used to produce a product
- **Product_Template**: An existing entity that defines the base characteristics of a product (name, unit, MRP, etc.)
- **Raw_Material**: Ingredients used to manufacture products (milk, tea powder, sugar, etc.)
- **Batch_Selector**: The UI component that allows users to choose which recipe batch to use when producing a product
- **Multi_Tenant_System**: The store-based isolation system ensuring data separation between different stores
- **RLS_Policy**: Row Level Security policy that enforces multi-tenant data access control

## Requirements

### Requirement 1: Recipe Batch Management

**User Story:** As a store manager, I want to define multiple recipe batches for the same product, so that I can produce products with different ingredient quantities based on my needs

#### Acceptance Criteria

1. WHEN creating a product template, THE Product_System SHALL allow the user to create multiple recipe batches
2. WHEN defining a recipe batch, THE Product_System SHALL require the user to specify a batch name, ingredient list, and producible quantity
3. WHEN a recipe batch is created, THE Product_System SHALL store the batch with a unique identifier linked to the product template
4. WHERE a product template has multiple batches, THE Product_System SHALL display all batches in a list view
5. WHEN a user views recipe batches, THE Product_System SHALL show the batch name, ingredient details, and producible quantity for each batch

### Requirement 2: Batch Selection During Production

**User Story:** As a production staff member, I want to select which recipe batch to use when producing a product, so that I can use the appropriate ingredient quantities for my current production run

#### Acceptance Criteria

1. WHEN producing a manufactured product, THE Batch_Selector SHALL display all available recipe batches for that product
2. WHEN a user selects a recipe batch, THE Product_System SHALL auto-populate the ingredient list with quantities from the selected batch
3. WHEN a batch is selected, THE Product_System SHALL display the producible quantity associated with that batch
4. WHEN switching between batches, THE Product_System SHALL update the ingredient quantities and stock validation accordingly
5. WHERE no batch is selected, THE Product_System SHALL require the user to select a batch before proceeding with production

### Requirement 3: Stock Validation Per Batch

**User Story:** As a production staff member, I want to see if I have sufficient stock for the selected recipe batch, so that I can determine if I can proceed with production

#### Acceptance Criteria

1. WHEN a recipe batch is selected, THE Product_System SHALL validate available stock against the batch's ingredient requirements
2. WHEN stock is insufficient for any ingredient, THE Product_System SHALL display a warning message indicating the shortage
3. WHEN all ingredients have sufficient stock, THE Product_System SHALL allow the user to proceed with production
4. WHEN the user changes the quantity to produce, THE Product_System SHALL recalculate stock requirements based on the batch ratio
5. WHERE stock validation fails, THE Product_System SHALL prevent the user from submitting the production form

### Requirement 4: Database Schema for Recipe Batches

**User Story:** As a system administrator, I want recipe batches to be stored in a dedicated table with proper relationships, so that data integrity and multi-tenancy are maintained

#### Acceptance Criteria

1. THE Multi_Tenant_System SHALL create a new table named "recipe_batches" with columns for id, product_template_id, batch_name, producible_quantity, store_id, is_active, created_at, and updated_at
2. THE Multi_Tenant_System SHALL create a new table named "recipe_batch_ingredients" with columns for id, recipe_batch_id, raw_material_id, quantity_needed, unit, store_id, created_at, and updated_at
3. WHEN a recipe batch is created, THE Multi_Tenant_System SHALL enforce a foreign key relationship to the product_templates table
4. WHEN a batch ingredient is created, THE Multi_Tenant_System SHALL enforce foreign key relationships to recipe_batches and raw_materials tables
5. WHERE a product template is deleted, THE Multi_Tenant_System SHALL cascade delete all associated recipe batches and their ingredients

### Requirement 5: Row Level Security for Recipe Batches

**User Story:** As a system administrator, I want recipe batches to respect multi-tenant boundaries, so that stores can only access their own recipe data

#### Acceptance Criteria

1. THE RLS_Policy SHALL enable row level security on the recipe_batches table
2. THE RLS_Policy SHALL enable row level security on the recipe_batch_ingredients table
3. WHEN a user queries recipe_batches, THE RLS_Policy SHALL filter results to only show batches belonging to the user's store
4. WHEN a user queries recipe_batch_ingredients, THE RLS_Policy SHALL filter results to only show ingredients belonging to the user's store
5. WHERE a user attempts to access another store's recipe batch data, THE RLS_Policy SHALL deny access

### Requirement 6: Batch CRUD Operations

**User Story:** As a store manager, I want to create, edit, and delete recipe batches, so that I can maintain accurate recipe information

#### Acceptance Criteria

1. WHEN creating a new batch, THE Product_System SHALL validate that the batch name is unique within the product template
2. WHEN editing a batch, THE Product_System SHALL allow modification of batch name, ingredients, and producible quantity
3. WHEN deleting a batch, THE Product_System SHALL soft-delete the batch by setting is_active to false
4. WHERE a product template has only one batch, THE Product_System SHALL prevent deletion of that batch
5. WHEN a batch is modified, THE Product_System SHALL update the updated_at timestamp

### Requirement 7: Default Batch Behavior

**User Story:** As a production staff member, I want the system to suggest a default batch when producing a product, so that I can quickly proceed with the most common recipe

#### Acceptance Criteria

1. WHERE a product template has only one recipe batch, THE Batch_Selector SHALL auto-select that batch
2. WHERE a product template has multiple batches, THE Batch_Selector SHALL display a dropdown with all available batches
3. WHEN a batch is marked as default, THE Batch_Selector SHALL pre-select that batch in the production form
4. WHERE no default batch is set, THE Batch_Selector SHALL require manual selection
5. WHEN a user produces a product, THE Product_System SHALL remember the last used batch for that product template

### Requirement 8: Batch Migration for Existing Products

**User Story:** As a system administrator, I want existing product ingredients to be migrated to the new batch system, so that current products continue to work without disruption

#### Acceptance Criteria

1. WHEN the migration runs, THE Multi_Tenant_System SHALL create a default recipe batch for each product template that has ingredients
2. WHEN creating a default batch, THE Multi_Tenant_System SHALL name it "Default Batch" or "Standard Recipe"
3. WHEN migrating ingredients, THE Multi_Tenant_System SHALL copy all product_ingredients records to recipe_batch_ingredients
4. WHEN migration is complete, THE Multi_Tenant_System SHALL maintain backward compatibility with existing production workflows
5. WHERE a product template has no ingredients, THE Multi_Tenant_System SHALL skip batch creation for that template

### Requirement 9: Batch Cost Calculation

**User Story:** As a store manager, I want to see the total cost of ingredients for each recipe batch, so that I can understand the production cost per batch

#### Acceptance Criteria

1. WHEN viewing a recipe batch, THE Product_System SHALL calculate the total ingredient cost based on current raw material prices
2. WHEN ingredient prices change, THE Product_System SHALL reflect updated costs in batch calculations
3. WHEN displaying batch information, THE Product_System SHALL show cost per producible unit
4. WHERE raw material prices are not available, THE Product_System SHALL display "Cost not available"
5. WHEN comparing batches, THE Product_System SHALL allow sorting by total cost

### Requirement 10: Batch Usage Analytics

**User Story:** As a store manager, I want to track which recipe batches are used most frequently, so that I can optimize my inventory and production planning

#### Acceptance Criteria

1. WHEN a product is produced using a batch, THE Product_System SHALL record the batch_id in the production log
2. WHEN viewing batch analytics, THE Product_System SHALL display usage count for each batch
3. WHEN analyzing batch usage, THE Product_System SHALL show date range filters for usage statistics
4. WHERE a batch has never been used, THE Product_System SHALL display "Not yet used"
5. WHEN generating reports, THE Product_System SHALL include batch usage data in production reports
