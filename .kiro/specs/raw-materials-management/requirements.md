# Raw Materials Management - Requirements Document

## Introduction

This feature adds comprehensive raw materials inventory management to the POS system, allowing shops to track ingredients and supplies like milk, tea powder, spices, etc. The system supports multi-tenancy where each store maintains its own raw materials catalog and stock levels.

## Glossary

- **System**: The POS application
- **Raw Material**: A base ingredient or supply item (e.g., milk, tea powder, spices)
- **Raw Material Stock**: Store-specific inventory record with quantity and pricing
- **Store**: A tenant in the multi-tenant system
- **User**: An authenticated person using the system
- **Unit**: Measurement unit for raw materials (liter, gram, milliliter, cups, kg, etc.)

## Requirements

### Requirement 1: Raw Materials Master Data Management

**User Story:** As a store manager, I want to maintain a list of raw material types, so that I can track different ingredients used in my shop.

#### Acceptance Criteria

1. WHEN a User views the raw materials page, THE System SHALL display all raw material types for the current Store
2. WHEN a User creates a new raw material type, THE System SHALL ensure the name is unique within the Store
3. WHEN a User creates a raw material type, THE System SHALL associate it with the current Store
4. WHERE a raw material type exists, THE System SHALL allow the User to mark it as inactive
5. THE System SHALL prevent deletion of raw material types that have associated stock records

### Requirement 2: Raw Material Stock Management

**User Story:** As a store manager, I want to record stock quantities and purchase prices for raw materials, so that I can track inventory and costs.

#### Acceptance Criteria

1. WHEN a User adds raw material stock, THE System SHALL require selection of a raw material type
2. WHEN a User adds raw material stock, THE System SHALL require a unit of measurement
3. WHEN a User adds raw material stock, THE System SHALL require a purchase price greater than or equal to zero
4. WHEN a User adds raw material stock, THE System SHALL require a quantity greater than or equal to zero
5. THE System SHALL allow multiple stock entries for the same raw material with different units
6. THE System SHALL associate all stock entries with the current Store

### Requirement 3: Inline Raw Material Creation

**User Story:** As a store manager, I want to quickly add new raw material types while creating stock entries, so that I don't have to navigate away from the form.

#### Acceptance Criteria

1. WHEN a User is on the stock entry form, THE System SHALL provide an "Add New" option in the raw material dropdown
2. WHEN a User clicks "Add New", THE System SHALL display a modal dialog for creating a raw material type
3. WHEN a User creates a raw material via the modal, THE System SHALL automatically select it in the dropdown
4. WHEN a User cancels the modal, THE System SHALL return to the stock entry form without changes

### Requirement 4: Raw Materials Listing and Search

**User Story:** As a store manager, I want to view and search my raw material stock, so that I can quickly find specific items.

#### Acceptance Criteria

1. THE System SHALL display a table showing all raw material stock entries for the current Store
2. THE System SHALL display raw material name, unit, quantity, and purchase price in the table
3. WHEN a User enters text in the search field, THE System SHALL filter results by raw material name
4. THE System SHALL provide edit and delete actions for each stock entry
5. THE System SHALL display a stock status indicator based on quantity levels

### Requirement 5: Multi-Tenancy and Data Isolation

**User Story:** As a system administrator, I want each store to have isolated raw materials data, so that stores cannot access each other's information.

#### Acceptance Criteria

1. THE System SHALL enforce Row Level Security on raw_materials table
2. THE System SHALL enforce Row Level Security on raw_material_stock table
3. WHEN a User queries raw materials, THE System SHALL return only records where store_id matches the User's Store
4. WHEN a User creates raw material records, THE System SHALL automatically set store_id to the User's Store
5. THE System SHALL prevent Users from accessing raw materials belonging to other Stores

### Requirement 6: Unit of Measurement Options

**User Story:** As a store manager, I want to select from common measurement units, so that I can accurately track different types of raw materials.

#### Acceptance Criteria

1. THE System SHALL provide a dropdown with predefined units: liter, milliliter, kilogram, gram, cups, pieces, boxes, packets
2. THE System SHALL allow the User to select one unit per stock entry
3. THE System SHALL display the selected unit alongside quantity in all views
4. THE System SHALL default to "kilogram" if no unit is selected

### Requirement 7: Navigation and User Interface

**User Story:** As a store user, I want easy access to raw materials management, so that I can efficiently manage inventory.

#### Acceptance Criteria

1. THE System SHALL display a "Raw Materials" menu item in the sidebar navigation
2. WHEN a User clicks "Raw Materials", THE System SHALL navigate to the raw materials listing page
3. THE System SHALL display an "Add Stock" button on the raw materials page
4. WHEN a User clicks "Add Stock", THE System SHALL display the stock entry form
5. THE System SHALL provide clear visual feedback for all user actions

### Requirement 8: Data Validation and Error Handling

**User Story:** As a store manager, I want the system to validate my input, so that I don't enter incorrect data.

#### Acceptance Criteria

1. WHEN a User submits a form with missing required fields, THE System SHALL display an error message
2. WHEN a User enters a negative quantity, THE System SHALL display an error message
3. WHEN a User enters a negative purchase price, THE System SHALL display an error message
4. WHEN a database operation fails, THE System SHALL display a user-friendly error message
5. THE System SHALL prevent duplicate raw material names within the same Store
