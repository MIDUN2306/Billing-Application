# 🚀 Quick Start Guide - Tea Boys Management System

## 📋 Prerequisites

✅ Node.js installed  
✅ npm installed  
✅ Supabase project created  
✅ Environment variables configured (`.env` file)  
✅ Dev server running (`npm run dev`)

---

## 🎯 Step-by-Step Setup

### Step 1: Create Admin Account

**Option A: Using HTML File (Easiest)**

1. Open `create-admin.html` in your web browser
2. Fill in the form:
   - **Email**: `admin@teaboys.com`
   - **Password**: `admin123` (or choose your own)
   - **Full Name**: `Admin User`
3. Click **"Create Admin Account"**
4. Wait for success message
5. Note down your credentials!

**Option B: If Email Confirmation is Required**

See `create-admin-sql.md` for detailed instructions on handling email confirmation.

### Step 2: Login

1. Open http://localhost:5174 in your browser
2. Enter your credentials:
   - Email: `admin@teaboys.com`
   - Password: `admin123`
3. Click **"Sign In"**
4. You should see the Dashboard!

### Step 3: Add Categories

1. Navigate to **Products → Categories**
2. Click **"Add Category"**
3. Add some categories:
   - Tea
   - Coffee
   - Snacks
   - Beverages
   - Supplies

### Step 4: Add Products

1. Navigate to **Products**
2. Click **"Add Product"**
3. Fill in product details:
   - Name: `Masala Tea`
   - Category: `Tea`
   - SKU: `TEA001`
   - Purchase Price: `10.00`
   - Selling Price: `20.00`
   - MRP: `25.00`
   - Tax Rate: `5`
   - Min Stock: `10`
   - Max Stock: `100`
   - Reorder Point: `20`
4. Click **"Save"**
5. Add more products as needed

### Step 5: Add Customers

1. Navigate to **Customers**
2. Click **"Add Customer"**
3. Fill in customer details:
   - Name: `John Doe`
   - Phone: `+91-9876543210`
   - Email: `john@example.com`
   - Credit Limit: `5000`
4. Click **"Save"**
5. Add more customers as needed

### Step 6: Add Suppliers

1. Navigate to **Customers** (suppliers use same page)
2. Click **"Add Customer"**
3. Fill in supplier details:
   - Name: `Tea Supplier Ltd`
   - Phone: `+91-9876543211`
   - Email: `supplier@example.com`
4. Click **"Save"**

### Step 7: Create a Purchase Order

1. Navigate to **Purchases**
2. Click **"New Purchase"**
3. Select supplier
4. Add products to purchase
5. Adjust quantities and prices
6. Click **"Create Purchase Order"**
7. View the PO details
8. Click **"Mark as Received"** to update inventory

### Step 8: Make Your First Sale

1. Navigate to **POS**
2. Search for a product
3. Click to add to cart
4. Adjust quantity if needed
5. Select customer (or use Walk-in)
6. Click **"Proceed to Payment"**
7. Select payment method
8. Click **"Complete Sale"**
9. Success! 🎉

### Step 9: Record an Expense

1. Navigate to **Expenses**
2. Click **"Add Expense"**
3. Fill in details:
   - Date: Today
   - Category: `Utilities`
   - Description: `Electricity bill`
   - Amount: `500`
   - Payment Method: `Cash`
4. Click **"Add Expense"**

### Step 10: Check Dashboard

1. Navigate to **Dashboard**
2. View your metrics:
   - Today's sales
   - Today's purchases
   - Today's expenses
   - Pending payments
   - Low stock alerts

---

## 🎮 Common Operations

### Making a Sale
1. **POS** → Search product → Add to cart → Select customer → Payment → Complete

### Viewing Sales
1. **Sales** → Filter/search → Click eye icon for details

### Recording Payment
1. **Sales** → Click sale → **"Record Payment"** → Enter amount → Save

### Creating Purchase Order
1. **Purchases** → **"New Purchase"** → Select supplier → Add products → Create

### Receiving Inventory
1. **Purchases** → Click purchase → **"Mark as Received"** → Inventory auto-updates!

### Adding Expense
1. **Expenses** → **"Add Expense"** → Fill form → Save

### Checking Stock
1. **Products** → View stock status column → Filter by low stock

---

## 🔑 Default Credentials

**Email**: `admin@teaboys.com`  
**Password**: `admin123`  
**Role**: Admin  
**Store**: Tea Boys Main Store

---

## 📱 Navigation Guide

### Main Menu
- **Dashboard** - Overview and metrics
- **POS** - Point of sale for making sales
- **Sales** - View and manage all sales
- **Purchases** - Create and manage purchase orders
- **Expenses** - Track business expenses
- **Products** - Manage product catalog
- **Customers** - Manage customer database
- **Categories** - Organize products

### User Roles
- **Admin** - Full access to everything
- **Manager** - Can manage tea boys and payments
- **Staff** - Can perform daily operations

---

## 💡 Tips & Tricks

### Quick Sale
- Use search in POS to quickly find products
- Press Enter after typing to search
- Click product cards to add to cart

### Keyboard Shortcuts
- Search boxes auto-focus for quick typing
- Tab to navigate between fields
- Enter to submit forms

### Filters
- Use date range filters for reports
- Combine multiple filters for precise results
- Clear filters to see all data

### Stock Management
- Products turn red when low stock
- Dashboard shows low stock count
- Create purchase orders when stock is low

### Customer Credit
- Set credit limits for customers
- Track outstanding balances
- Record payments to clear balances

---

## 🐛 Troubleshooting

### Can't Login
- Check email and password
- Verify account was created successfully
- Check browser console for errors

### Products Not Showing in POS
- Verify products are active
- Check if products have stock > 0
- Refresh the page

### Inventory Not Updating
- Verify purchase status is "Received"
- Check if triggers are enabled
- View stock movements table

### Payment Not Recording
- Check amount is valid
- Verify payment method selected
- Check network connection

### Dashboard Shows Zero
- Make some test transactions
- Check date filters
- Verify store is selected

---

## 📊 Sample Data

### Sample Products
```
1. Masala Tea - ₹20 (Tea)
2. Coffee - ₹25 (Coffee)
3. Samosa - ₹15 (Snacks)
4. Cold Drink - ₹30 (Beverages)
5. Sugar - ₹50 (Supplies)
```

### Sample Customers
```
1. John Doe - +91-9876543210
2. Jane Smith - +91-9876543211
3. Bob Wilson - +91-9876543212
```

### Sample Expenses
```
1. Rent - ₹10,000 (Monthly)
2. Electricity - ₹500 (Utilities)
3. Staff Salary - ₹15,000 (Salaries)
```

---

## 🎯 Next Steps

After completing the quick start:

1. **Customize**: Add your actual products and prices
2. **Import Data**: If you have existing data, import it
3. **Train Staff**: Show your team how to use the system
4. **Go Live**: Start using for real transactions
5. **Monitor**: Check dashboard daily
6. **Backup**: Set up regular backups
7. **Support**: Document any issues or questions

---

## 📞 Support

### Documentation
- `PROJECT_COMPLETE.md` - Complete project overview
- `PHASE_*_COMPLETE.md` - Detailed feature documentation
- `IMPLEMENTATION_ANALYSIS.md` - Technical details

### Common Issues
- See `create-admin-sql.md` for account creation issues
- Check browser console for JavaScript errors
- Verify Supabase connection in Network tab

---

## 🎉 You're Ready!

Your Tea Boys Management System is now set up and ready to use!

**Happy Selling!** 🚀☕

---

**Last Updated**: November 2, 2025  
**Version**: 1.0.0  
**Status**: Production Ready ✅
