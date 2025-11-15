# Complete POS System - Master Implementation Plan

## Project Overview
A full-featured Point of Sale (POS) system with inventory management, billing with QR codes, petty cash tracking, and comprehensive dashboard analytics. Built with React + Vite, Supabase backend, Tailwind CSS v3, and burgundy theme.

## Technology Stack
- **Frontend**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS v3 (Burgundy theme)
- **State Management**: Zustand
- **Backend**: Supabase (PostgreSQL + Auth + RPC)
- **Authentication**: Supabase Auth with JWT
- **Database**: PostgreSQL with Row Level Security (RLS)

## Color Scheme - Burgundy Theme
```css
Primary Burgundy: #800020
Light Burgundy: #A0153E
Dark Burgundy: #5D0E1F
Accent Gold: #D4AF37
Background: #F8F5F2
Text Dark: #2D1B1B
```

---

## PHASE 1: FOUNDATION & AUTHENTICATION

### 1.1 Database Schema - Multi-Tenant Structure

#### Core Tables

**stores** (Main tenant table)
```sql
- id (uuid, primary key)
- name (text, not null)
- address (text)
- phone (text)
- email (text)
- gstin (text)
- logo_url (text)
- created_at (timestamp)
- updated_at (timestamp)
- is_active (boolean, default true)
```

**roles** (Role definitions)
```sql
- id (uuid, primary key)
- name (text, unique) -- 'admin', 'manager', 'staff'
- description (text)
- permissions (jsonb) -- {can_view_reports, can_manage_users, etc}
- created_at (timestamp)
```

**users** (Extended from auth.users)
```sql
- id (uuid, primary key, references auth.users)
- store_id (uuid, references stores, nullable for admin)
- role_id (uuid, references roles)
- full_name (text, not null)
- phone (text)
- is_active (boolean, default true)
- created_at (timestamp)
- updated_at (timestamp)
- created_by (uuid, references users)
```

### 1.2 RLS Policies

**Global Admin Access** (can access all stores)
```sql
-- Admin can see everything
CREATE POLICY "admin_all_access" ON {table_name}
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = auth.uid()
    AND r.name = 'admin'
  )
);
```

**Manager Access** (can access their store)
```sql
-- Manager can access their store data
CREATE POLICY "manager_store_access" ON {table_name}
FOR ALL
TO authenticated
USING (
  store_id IN (
    SELECT store_id FROM users
    WHERE id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM roles r
      WHERE r.id = users.role_id
      AND r.name IN ('manager', 'admin')
    )
  )
);
```

**Staff Access** (read-only for most, write for POS)
```sql
-- Staff can read their store data
CREATE POLICY "staff_read_access" ON {table_name}
FOR SELECT
TO authenticated
USING (
  store_id = (SELECT store_id FROM users WHERE id = auth.uid())
);
```

### 1.3 Authentication Pages

**Login Page** (`/login`)
- Email/Password authentication
- Store selection (for multi-store users)
- Remember me functionality
- Burgundy themed form
- Error handling

**Components**:
- `LoginPage.tsx`
- `authStore.ts` (Zustand store for auth state)
- `auth.ts` (Auth helper functions)

---

## PHASE 2: CATEGORIES & PRODUCT MANAGEMENT

### 2.1 Database Tables

**categories**
```sql
- id (uuid, primary key)
- store_id (uuid, references stores)
- name (text, not null)
- description (text)
- is_active (boolean, default true)
- created_at (timestamp)
- created_by (uuid, references users)
```

**products**
```sql
- id (uuid, primary key)
- store_id (uuid, references stores)
- category_id (uuid, references categories)
- name (text, not null)
- sku (text, unique per store)
- description (text)
- price (decimal, not null)
- cost_price (decimal)
- stock_quantity (decimal, default 0)
- unit (text) -- 'kg', 'liter', 'piece', etc
- min_stock_level (decimal)
- is_active (boolean, default true)
- has_variants (boolean, default false)
- image_url (text)
- created_at (timestamp)
- updated_at (timestamp)
- created_by (uuid, references users)
```

**product_variants** (for size/flavor variations)
```sql
- id (uuid, primary key)
- product_id (uuid, references products)
- store_id (uuid, references stores)
- variant_name (text) -- 'Small', 'Medium', 'Large'
- sku (text, unique per store)
- price (decimal, not null)
- stock_quantity (decimal, default 0)
- is_active (boolean, default true)
- created_at (timestamp)
```

### 2.2 Pages & Forms

**Categories Page** (`/categories`)
- List all categories
- Add/Edit/Delete category
- Search and filter
- Active/Inactive toggle

**Products Page** (`/products`)
- Card/Grid view of products
- Add/Edit/Delete product
- Stock level indicators
- Low stock warnings
- Variant management
- Image upload
- SKU auto-generation

**Components**:
- `CategoriesPage.tsx`
- `CategoryForm.tsx`
- `ProductsPage.tsx`
- `ProductForm.tsx`
- `ProductCard.tsx`
- `VariantManager.tsx`

---

## PHASE 3: RAW MATERIALS & INVENTORY

### 3.1 Database Tables

**raw_materials**
```sql
- id (uuid, primary key)
- store_id (uuid, references stores)
- name (text, not null)
- sku (text, unique per store)
- unit (text) -- 'kg', 'liter', 'piece'
- current_stock (decimal, default 0)
- min_stock_level (decimal)
- cost_per_unit (decimal)
- supplier_name (text)
- supplier_contact (text)
- is_active (boolean, default true)
- created_at (timestamp)
- updated_at (timestamp)
```

**raw_material_purchases**
```sql
- id (uuid, primary key)
- store_id (uuid, references stores)
- raw_material_id (uuid, references raw_materials)
- quantity (decimal, not null)
- unit_price (decimal, not null)
- total_amount (decimal, not null)
- supplier_name (text)
- invoice_number (text)
- purchase_date (date, not null)
- notes (text)
- created_at (timestamp)
- created_by (uuid, references users)
```

**stock_adjustments**
```sql
- id (uuid, primary key)
- store_id (uuid, references stores)
- item_type (text) -- 'product' or 'raw_material'
- item_id (uuid)
- adjustment_type (text) -- 'add', 'remove', 'expire', 'damage'
- quantity (decimal, not null)
- reason (text)
- notes (text)
- adjusted_at (timestamp)
- adjusted_by (uuid, references users)
```

### 3.2 Pages

**Raw Materials Page** (`/raw-materials`)
- List all raw materials
- Stock levels with visual indicators
- Add/Edit/Delete raw material
- Record purchases
- Stock adjustments
- Purchase history

**Inventory Overview** (`/inventory`)
- Combined view of products and raw materials
- Low stock alerts
- Stock value calculations
- Expiration tracking

---

## PHASE 4: POINT OF SALE (POS)

### 4.1 Database Tables

**customers**
```sql
- id (uuid, primary key)
- store_id (uuid, references stores)
- name (text, not null)
- phone (text, unique per store)
- email (text)
- address (text)
- loyalty_points (integer, default 0)
- total_purchases (decimal, default 0)
- created_at (timestamp)
```

**sales**
```sql
- id (uuid, primary key)
- store_id (uuid, references stores)
- sale_number (text, unique per store) -- Auto-generated
- customer_id (uuid, references customers, nullable)
- subtotal (decimal, not null)
- tax_amount (decimal, default 0)
- discount_amount (decimal, default 0)
- total_amount (decimal, not null)
- payment_status (text) -- 'paid', 'partial', 'pending'
- sale_date (timestamp, not null)
- notes (text)
- created_by (uuid, references users)
- created_at (timestamp)
```

**sale_items**
```sql
- id (uuid, primary key)
- sale_id (uuid, references sales)
- store_id (uuid, references stores)
- product_id (uuid, references products, nullable)
- variant_id (uuid, references product_variants, nullable)
- product_name (text, not null) -- Snapshot
- quantity (decimal, not null)
- unit_price (decimal, not null)
- discount (decimal, default 0)
- tax_rate (decimal, default 0)
- total (decimal, not null)
```

**payments**
```sql
- id (uuid, primary key)
- store_id (uuid, references stores)
- sale_id (uuid, references sales)
- payment_method (text) -- 'cash', 'card', 'upi', 'wallet'
- amount (decimal, not null)
- reference_number (text) -- For digital payments
- payment_date (timestamp, not null)
- notes (text)
- created_by (uuid, references users)
```

### 4.2 POS Page (`/pos`)

**Features**:
- Product search and selection
- Shopping cart with quantity adjustment
- Customer selection (optional)
- Multiple payment methods
- Split payments
- Discount application
- Real-time stock validation
- Quick product access (favorites)
- Keyboard shortcuts

**Components**:
- `POSPage.tsx` (Main container)
- `ProductGrid.tsx` (Product selection)
- `CartPanel.tsx` (Shopping cart)
- `PaymentModal.tsx` (Payment processing)
- `CustomerSelector.tsx`
- `QuickAccessBar.tsx`

**Layout**:
- Left: Product grid with search and category filter
- Right: Cart panel with totals
- Bottom: Action buttons (Clear, Hold, Pay)

---

## PHASE 5: BILLING WITH QR CODE

### 5.1 Database Tables

**bills**
```sql
- id (uuid, primary key)
- store_id (uuid, references stores)
- sale_id (uuid, references sales)
- bill_number (text, unique per store)
- bill_data (jsonb) -- Complete bill information
- qr_code_url (text) -- URL to view bill
- generated_at (timestamp)
```

### 5.2 QR Code System

**Bill Viewer Page** (`/bill/:billId`)
- Public page (no auth required)
- Displays complete bill details
- Store information
- Itemized list
- Payment details
- GST breakdown
- Printable format

**QR Code Generation**:
- Generate unique URL for each bill
- Encode bill ID in QR code
- Display QR on receipt
- Customer scans to view digital bill

**Components**:
- `BillViewer.tsx` (Public bill display)
- `QRCodeGenerator.tsx`
- `ReceiptPrinter.tsx` (Thermal printer format)
- `billGenerator.ts` (Utility)

---

## PHASE 6: PETTY CASH MANAGEMENT

### 6.1 Database Tables

**petty_cash_accounts**
```sql
- id (uuid, primary key)
- store_id (uuid, references stores)
- account_name (text, not null)
- current_balance (decimal, default 0)
- opening_balance (decimal, not null)
- is_active (boolean, default true)
- created_at (timestamp)
```

**petty_cash_transactions**
```sql
- id (uuid, primary key)
- store_id (uuid, references stores)
- account_id (uuid, references petty_cash_accounts)
- transaction_type (text) -- 'deposit', 'withdrawal', 'expense'
- amount (decimal, not null)
- category (text) -- 'office_supplies', 'utilities', 'misc'
- description (text, not null)
- reference_number (text)
- transaction_date (date, not null)
- created_by (uuid, references users)
- created_at (timestamp)
```

### 6.2 Petty Cash Page (`/petty-cash`)

**Features**:
- Multiple petty cash accounts
- Record deposits/withdrawals
- Expense categorization
- Balance tracking
- Transaction history
- Date range filtering
- Export to Excel

**Components**:
- `PettyCashPage.tsx`
- `TransactionForm.tsx`
- `AccountSelector.tsx`
- `TransactionHistory.tsx`

---

## PHASE 7: EXPENSES MANAGEMENT

### 7.1 Database Tables

**expense_categories**
```sql
- id (uuid, primary key)
- store_id (uuid, references stores)
- name (text, not null)
- description (text)
- is_active (boolean, default true)
```

**expenses**
```sql
- id (uuid, primary key)
- store_id (uuid, references stores)
- category_id (uuid, references expense_categories)
- expense_number (text, unique per store)
- description (text, not null)
- amount (decimal, not null)
- payment_method (text)
- vendor_name (text)
- invoice_number (text)
- expense_date (date, not null)
- notes (text)
- created_by (uuid, references users)
- created_at (timestamp)
```

### 7.2 Expenses Page (`/expenses`)

**Features**:
- Record expenses
- Categorization
- Vendor management
- Invoice tracking
- Date filtering
- Monthly summaries

---

## PHASE 8: DASHBOARD & ANALYTICS

### 8.1 Database Views & RPC Functions

**RPC: get_dashboard_stats**
```sql
Parameters: store_id, start_date, end_date
Returns:
- total_sales
- total_expenses
- net_profit
- total_orders
- average_order_value
- top_selling_products
- low_stock_items
- pending_payments
```

**RPC: get_sales_trend**
```sql
Parameters: store_id, period ('daily', 'weekly', 'monthly')
Returns: Array of {date, sales, expenses, profit}
```

**RPC: get_payment_methods_breakdown**
```sql
Parameters: store_id, start_date, end_date
Returns: Array of {method, amount, count}
```

### 8.2 Dashboard Page (`/dashboard`)

**Sections**:

1. **Summary Cards** (Top row)
   - Today's Sales
   - Total Expenses
   - Net Profit
   - Orders Count
   - Petty Cash Balance
   - Low Stock Alerts

2. **Charts** (Middle section)
   - Sales vs Expenses Line Chart (Daily/Weekly/Monthly)
   - Payment Methods Pie Chart
   - Top Products Bar Chart
   - Category-wise Sales Donut Chart

3. **Quick Actions** (Right sidebar)
   - New Sale
   - Record Expense
   - Add Stock
   - View Reports

4. **Recent Transactions** (Bottom)
   - Latest sales
   - Recent expenses
   - Pending payments

**Date Filters**:
- Today
- Yesterday
- Last 7 days
- Last 30 days
- This Month
- Last Month
- Custom Range

**Components**:
- `DashboardPage.tsx`
- `SummaryCard.tsx`
- `SalesLineChart.tsx`
- `PaymentPieChart.tsx`
- `TopProductsChart.tsx`
- `RecentTransactions.tsx`
- `DateFilter.tsx`

---

## PHASE 9: ADMIN PANEL

### 9.1 Admin Page (`/admin`)

**Tabs**:

1. **Stores Management**
   - Create/Edit/Delete stores
   - Store settings
   - Activate/Deactivate

2. **Users Management**
   - Create users
   - Assign roles
   - Assign to stores
   - Reset passwords
   - Activate/Deactivate

3. **Roles & Permissions**
   - View roles
   - Edit permissions
   - Create custom roles

4. **System Settings**
   - Tax rates
   - Currency settings
   - Receipt templates
   - Backup & restore

**Components**:
- `AdminPage.tsx`
- `StoresTab.tsx`
- `UsersTab.tsx`
- `RolesTab.tsx`
- `CreateStoreModal.tsx`
- `CreateUserModal.tsx`
- `EditPermissionsModal.tsx`

---

## PHASE 10: REPORTS & EXPORTS

### 10.1 Reports Page (`/reports`)

**Report Types**:

1. **Sales Reports**
   - Daily sales summary
   - Product-wise sales
   - Category-wise sales
   - Customer-wise sales
   - Payment method breakdown

2. **Inventory Reports**
   - Current stock levels
   - Stock movement
   - Low stock report
   - Expiration report
   - Stock valuation

3. **Financial Reports**
   - Profit & Loss statement
   - Expense breakdown
   - Petty cash report
   - Tax summary

4. **Export Options**
   - PDF
   - Excel
   - CSV

---

## IMPLEMENTATION ORDER

### Week 1: Foundation
1. Setup Vite + React + TypeScript project
2. Configure Tailwind CSS v3 with burgundy theme
3. Setup Supabase project
4. Create database schema (all tables)
5. Implement RLS policies
6. Create authentication system
7. Build layout components (Header, Sidebar, AppLayout)

### Week 2: Core Features
8. Categories management
9. Products management
10. Raw materials management
11. Customers management

### Week 3: POS System
12. Build POS interface
13. Implement cart functionality
14. Payment processing
15. Stock deduction logic
16. Receipt generation

### Week 4: Billing & QR
17. QR code generation
18. Bill viewer page
19. Thermal receipt format
20. PDF generation

### Week 5: Financial Management
21. Petty cash system
22. Expenses management
23. Payment tracking

### Week 6: Dashboard & Analytics
24. Dashboard layout
25. Summary cards with RPC functions
26. Charts implementation
27. Date filtering
28. Real-time updates

### Week 7: Admin & Reports
29. Admin panel
30. User management
31. Store management
32. Reports generation
33. Export functionality

### Week 8: Polish & Testing
34. Responsive design
35. Error handling
36. Loading states
37. Validation
38. Testing
39. Documentation

---

## KEY RPC FUNCTIONS TO CREATE

```sql
-- 1. Get Dashboard Statistics
CREATE OR REPLACE FUNCTION get_dashboard_stats(
  p_store_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS JSON;

-- 2. Process Sale (with stock deduction)
CREATE OR REPLACE FUNCTION process_sale(
  p_sale_data JSON
)
RETURNS JSON;

-- 3. Get Sales Trend
CREATE OR REPLACE FUNCTION get_sales_trend(
  p_store_id UUID,
  p_period TEXT
)
RETURNS TABLE(...);

-- 4. Get Low Stock Items
CREATE OR REPLACE FUNCTION get_low_stock_items(
  p_store_id UUID
)
RETURNS TABLE(...);

-- 5. Get Payment Methods Breakdown
CREATE OR REPLACE FUNCTION get_payment_breakdown(
  p_store_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE(...);

-- 6. Create User with Role
CREATE OR REPLACE FUNCTION create_user_with_role(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT,
  p_store_id UUID,
  p_role_id UUID
)
RETURNS JSON;

-- 7. Transfer User to Another Store
CREATE OR REPLACE FUNCTION transfer_user_store(
  p_user_id UUID,
  p_new_store_id UUID
)
RETURNS BOOLEAN;

-- 8. Get Profit Loss Report
CREATE OR REPLACE FUNCTION get_profit_loss(
  p_store_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS JSON;
```

---

## FOLDER STRUCTURE

```
src/
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── Footer.tsx
│   ├── charts/
│   │   ├── SalesLineChart.tsx
│   │   ├── PaymentPieChart.tsx
│   │   ├── TopProductsChart.tsx
│   │   └── CategoryDonutChart.tsx
│   ├── forms/
│   │   ├── FormInput.tsx
│   │   ├── FormSelect.tsx
│   │   ├── FormTextarea.tsx
│   │   └── DatePicker.tsx
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Table.tsx
│   │   ├── Badge.tsx
│   │   └── Alert.tsx
│   ├── QRCodeGenerator.tsx
│   ├── ReceiptPrinter.tsx
│   └── SearchableSelect.tsx
├── pages/
│   ├── auth/
│   │   └── LoginPage.tsx
│   ├── dashboard/
│   │   └── DashboardPage.tsx
│   ├── pos/
│   │   ├── POSPage.tsx
│   │   ├── CartPanel.tsx
│   │   ├── PaymentModal.tsx
│   │   └── CustomerSelector.tsx
│   ├── products/
│   │   ├── ProductsPage.tsx
│   │   ├── ProductForm.tsx
│   │   └── ProductCard.tsx
│   ├── categories/
│   │   ├── CategoriesPage.tsx
│   │   └── CategoryForm.tsx
│   ├── raw-materials/
│   │   ├── RawMaterialsPage.tsx
│   │   └── RawMaterialForm.tsx
│   ├── customers/
│   │   ├── CustomersPage.tsx
│   │   └── CustomerForm.tsx
│   ├── sales/
│   │   ├── SalesPage.tsx
│   │   └── SaleDetails.tsx
│   ├── expenses/
│   │   ├── ExpensesPage.tsx
│   │   └── ExpenseForm.tsx
│   ├── petty-cash/
│   │   ├── PettyCashPage.tsx
│   │   └── TransactionForm.tsx
│   ├── inventory/
│   │   └── InventoryPage.tsx
│   ├── reports/
│   │   └── ReportsPage.tsx
│   ├── admin/
│   │   ├── AdminPage.tsx
│   │   ├── StoresTab.tsx
│   │   ├── UsersTab.tsx
│   │   └── RolesTab.tsx
│   └── bill/
│       └── BillViewer.tsx
├── stores/
│   ├── authStore.ts
│   ├── storeStore.ts
│   ├── cartStore.ts
│   ├── productsStore.ts
│   └── dashboardStore.ts
├── lib/
│   ├── supabase.ts
│   └── auth.ts
├── utils/
│   ├── billGenerator.ts
│   ├── qrCodeGenerator.ts
│   ├── dateHelpers.ts
│   ├── formatters.ts
│   └── validators.ts
├── types/
│   ├── database.types.ts
│   └── index.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useStore.ts
│   └── useDebounce.ts
├── styles/
│   └── globals.css
├── App.tsx
└── main.tsx
```

---

## BURGUNDY THEME CONFIGURATION

**tailwind.config.js**
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        burgundy: {
          50: '#FDF2F4',
          100: '#FCE7EB',
          200: '#F9CFD8',
          300: '#F4A7B8',
          400: '#EC7591',
          500: '#E0446E',
          600: '#CC2654',
          700: '#A0153E',
          800: '#800020',
          900: '#5D0E1F',
          950: '#2D0710',
        },
        gold: {
          400: '#E5C158',
          500: '#D4AF37',
          600: '#B8941F',
        }
      }
    }
  }
}
```

---

## SECURITY CHECKLIST

- [ ] All tables have RLS enabled
- [ ] Admin policies allow full access
- [ ] Manager policies restrict to their store
- [ ] Staff policies are read-only except POS
- [ ] Sensitive data is encrypted
- [ ] API keys are in environment variables
- [ ] Password reset functionality
- [ ] Session timeout handling
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF tokens for forms

---

## TESTING CHECKLIST

- [ ] Login with different roles
- [ ] Create store as admin
- [ ] Create user and assign to store
- [ ] Add products and categories
- [ ] Process sale in POS
- [ ] Generate bill with QR code
- [ ] Scan QR and view bill
- [ ] Record petty cash transaction
- [ ] Add expense
- [ ] View dashboard with filters
- [ ] Generate reports
- [ ] Test RLS policies
- [ ] Test on mobile devices
- [ ] Test thermal printer

---

## DEPLOYMENT CHECKLIST

- [ ] Environment variables configured
- [ ] Supabase project created
- [ ] Database migrations run
- [ ] RLS policies applied
- [ ] RPC functions created
- [ ] Build production bundle
- [ ] Deploy to Vercel/Netlify
- [ ] Configure custom domain
- [ ] SSL certificate
- [ ] Setup backups
- [ ] Monitor error logs
- [ ] Performance optimization

---

## NEXT STEPS

1. Review this plan thoroughly
2. Setup development environment
3. Create Supabase project
4. Initialize React + Vite project
5. Start with Phase 1 (Authentication)
6. Implement features phase by phase
7. Test each phase before moving forward
8. Deploy and iterate

---

**Total Estimated Time**: 8 weeks
**Complexity**: High
**Priority**: Multi-tenancy and RLS are critical foundations
