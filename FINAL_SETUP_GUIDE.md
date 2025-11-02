# 🚀 FINAL SETUP GUIDE - Create Admin & Start Using

## ⚡ Quick Path to Success

You're getting "Invalid login credentials" because **no user account exists yet**. Let's fix that now!

---

## 🎯 OPTION 1: Supabase Dashboard (Most Reliable - 2 minutes)

### Step 1: Go to Supabase Dashboard

1. Open https://supabase.com/dashboard
2. Login to your Supabase account
3. Select your project: **guynifjqydytpihazopl**

### Step 2: Disable Email Confirmation (Temporarily)

1. Click **Authentication** in the left sidebar
2. Click **Settings** (or **Providers** → **Email**)
3. Scroll down to find **"Confirm email"** or **"Enable email confirmations"**
4. **Toggle it OFF** (uncheck it)
5. Click **Save**

### Step 3: Create User

1. Still in **Authentication**, click **Users** in the left sidebar
2. Click **"Add user"** button (top right)
3. Select **"Create new user"**
4. Fill in:
   - **Email**: `admin@teaboys.com`
   - **Password**: `admin123`
   - **Auto Confirm User**: ✅ **CHECK THIS BOX!** (Very important!)
5. Click **"Create user"**
6. You should see the new user in the list

### Step 4: Update Profile (Set Role & Store)

1. In Supabase Dashboard, click **SQL Editor** in the left sidebar
2. Click **"New query"**
3. Copy and paste this SQL:

```sql
-- First, get the user ID
SELECT id, email FROM auth.users WHERE email = 'admin@teaboys.com';
```

4. Click **"Run"** (or press Ctrl+Enter)
5. **Copy the user ID** from the result
6. Now run this query (replace `YOUR_USER_ID` with the actual ID):

```sql
-- Update or create profile
INSERT INTO profiles (id, full_name, role, store_id, is_active)
VALUES (
  'YOUR_USER_ID_HERE',  -- Paste the user ID here
  'Admin User',
  'admin',
  'fcb79a3d-ea99-4d4d-84ad-03dcc01718b2',
  true
)
ON CONFLICT (id) DO UPDATE SET
  full_name = 'Admin User',
  role = 'admin',
  store_id = 'fcb79a3d-ea99-4d4d-84ad-03dcc01718b2',
  is_active = true;
```

7. Click **"Run"**
8. You should see "Success. No rows returned"

### Step 5: Verify Setup

Run this query to verify everything is correct:

```sql
SELECT 
  au.email,
  p.full_name,
  p.role,
  p.is_active,
  s.name as store_name
FROM auth.users au
JOIN profiles p ON p.id = au.id
LEFT JOIN stores s ON s.id = p.store_id
WHERE au.email = 'admin@teaboys.com';
```

You should see:
- Email: `admin@teaboys.com`
- Full Name: `Admin User`
- Role: `admin`
- Is Active: `true`
- Store Name: `Tea Boys Main Store`

### Step 6: Login! 🎉

1. Go to http://localhost:5174
2. Enter:
   - **Email**: `admin@teaboys.com`
   - **Password**: `admin123`
3. Click **"Sign In"**
4. **SUCCESS!** You should see the Dashboard!

---

## 🎯 OPTION 2: Using HTML File (If Dashboard Method Fails)

### Prerequisites
- Email confirmation must be disabled (see Option 1, Step 2)

### Steps

1. Open `test-connection.html` in your browser
2. Click buttons in order:
   - **"1. Test Connection"** - Should show ✅ SUCCESS
   - **"2. Check Store"** - Should show store details
   - **"3. Check Users"** - Should show "No users found"
   - **"4. Create Admin Account"** - Creates the account!
3. Wait for success message
4. Login at http://localhost:5174

---

## 🎯 OPTION 3: Alternative Credentials

If you want to use different credentials, modify the SQL in Option 1, Step 4:

```sql
-- Use your own email and details
INSERT INTO profiles (id, full_name, role, store_id, is_active)
VALUES (
  'YOUR_USER_ID_HERE',
  'Your Name',  -- Change this
  'admin',
  'fcb79a3d-ea99-4d4d-84ad-03dcc01718b2',
  true
);
```

And create the user in Dashboard with your chosen email/password.

---

## ✅ After Successful Login

### First Steps in the Application

1. **Dashboard** - You'll see this first (currently empty)

2. **Add Categories** (Products → Categories)
   - Click "Add Category"
   - Add: Tea, Coffee, Snacks, Beverages, Supplies

3. **Add Products** (Products)
   - Click "Add Product"
   - Example:
     - Name: Masala Tea
     - Category: Tea
     - SKU: TEA001
     - Purchase Price: 10
     - Selling Price: 20
     - MRP: 25
     - Tax Rate: 5
     - Min Stock: 10
     - Max Stock: 100
     - Reorder Point: 20

4. **Add Customers** (Customers)
   - Click "Add Customer"
   - Example:
     - Name: John Doe
     - Phone: +91-9876543210
     - Email: john@example.com
     - Credit Limit: 5000

5. **Create Purchase Order** (Purchases)
   - Click "New Purchase"
   - Select supplier (or add one first)
   - Add products
   - Create PO
   - Mark as "Received" to update inventory

6. **Make First Sale** (POS)
   - Search for product
   - Add to cart
   - Select customer or walk-in
   - Choose payment method
   - Complete sale!

7. **Check Dashboard**
   - View today's metrics
   - See sales, purchases, expenses
   - Monitor low stock

---

## 🐛 Troubleshooting

### "Invalid login credentials" after creating account
**Solution**: 
- Verify user exists in Supabase Dashboard → Authentication → Users
- Check if profile exists with correct role
- Try resetting password in Supabase Dashboard

### "Email not confirmed"
**Solution**: 
- Disable email confirmation (Option 1, Step 2)
- Or check "Auto Confirm User" when creating

### Profile not found / Role issues
**Solution**: 
- Run the profile creation SQL again (Option 1, Step 4)
- Verify store_id is correct

### Can't see any data after login
**Solution**: 
- Check browser console (F12) for errors
- Verify RLS policies are enabled
- Check if profile has correct store_id

### Dashboard shows all zeros
**Solution**: 
- This is normal for new installation
- Add some test data (products, sales, etc.)

---

## 📊 Test Data Quick Setup

After login, run these in order:

### 1. Categories
```
Tea, Coffee, Snacks, Beverages, Supplies
```

### 2. Products
```
Masala Tea - ₹20 (Tea)
Coffee - ₹25 (Coffee)
Samosa - ₹15 (Snacks)
Cold Drink - ₹30 (Beverages)
```

### 3. Customers
```
John Doe - +91-9876543210
Jane Smith - +91-9876543211
```

### 4. Make a Test Sale
- Go to POS
- Add products to cart
- Select customer
- Complete payment
- Check dashboard!

---

## 🎉 You're All Set!

Once you login successfully, you have a **fully functional billing system** with:

✅ Point of Sale  
✅ Sales Management  
✅ Purchase Orders  
✅ Inventory Tracking  
✅ Customer Management  
✅ Expense Tracking  
✅ Real-time Dashboard  
✅ Multi-tenant Support  
✅ Secure with RLS  

**Enjoy your new system!** 🚀

---

## 📞 Quick Reference

**Default Credentials:**
- Email: `admin@teaboys.com`
- Password: `admin123`

**Application URL:**
- http://localhost:5174

**Supabase Dashboard:**
- https://supabase.com/dashboard

**Documentation:**
- `README.md` - Project overview
- `QUICK_START.md` - Detailed guide
- `PROJECT_COMPLETE.md` - Complete features list

---

**Last Updated**: November 2, 2025  
**Status**: Ready to Use! ✅
