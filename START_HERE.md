# 🎯 START HERE - Tea Boys Management System

## 🚨 YOU ARE HERE BECAUSE YOU CAN'T LOGIN

**Error**: "Invalid login credentials"  
**Reason**: No user account exists yet  
**Solution**: Create admin account (2 minutes)

---

## ⚡ FASTEST PATH TO SUCCESS

### 1️⃣ Open Supabase Dashboard

Go to: https://supabase.com/dashboard/project/guynifjqydytpihazopl

### 2️⃣ Disable Email Confirmation

- Click **Authentication** → **Settings**
- Find **"Confirm email"** or **"Enable email confirmations"**
- **Turn it OFF**
- Click **Save**

### 3️⃣ Create User

- Click **Authentication** → **Users**
- Click **"Add user"**
- Email: `admin@teaboys.com`
- Password: `admin123`
- ✅ Check **"Auto Confirm User"**
- Click **"Create user"**

### 4️⃣ Set Role & Store

- Click **SQL Editor** → **New query**
- Run this to get user ID:
  ```sql
  SELECT id FROM auth.users WHERE email = 'admin@teaboys.com';
  ```
- Copy the ID, then run this (replace YOUR_USER_ID):
  ```sql
  INSERT INTO profiles (id, full_name, role, store_id, is_active)
  VALUES (
    'YOUR_USER_ID_HERE',
    'Admin User',
    'admin',
    'fcb79a3d-ea99-4d4d-84ad-03dcc01718b2',
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    store_id = 'fcb79a3d-ea99-4d4d-84ad-03dcc01718b2',
    is_active = true;
  ```

### 5️⃣ Login!

- Go to: http://localhost:5174
- Email: `admin@teaboys.com`
- Password: `admin123`
- Click **"Sign In"**
- **DONE!** 🎉

---

## 📚 Detailed Guides

If you need more help:

1. **FINAL_SETUP_GUIDE.md** - Complete step-by-step with screenshots
2. **test-connection.html** - Interactive testing tool
3. **CREATE_ADMIN_INSTRUCTIONS.md** - Troubleshooting guide
4. **QUICK_START.md** - What to do after login

---

## 🎯 After Login

1. Add Categories (Tea, Coffee, Snacks)
2. Add Products with prices
3. Add Customers
4. Go to POS and make a sale!
5. Check Dashboard

---

## ✅ Your System Includes

- ✅ Point of Sale (POS)
- ✅ Sales Management
- ✅ Purchase Orders
- ✅ Inventory Tracking
- ✅ Customer Management
- ✅ Expense Tracking
- ✅ Real-time Dashboard
- ✅ Multi-store Support
- ✅ Secure (RLS enabled)

---

## 🆘 Still Having Issues?

1. Check `FINAL_SETUP_GUIDE.md` for detailed instructions
2. Use `test-connection.html` to diagnose issues
3. Verify `.env` file has correct Supabase credentials
4. Make sure dev server is running (`npm run dev`)

---

**Default Credentials:**
- Email: `admin@teaboys.com`
- Password: `admin123`

**Application:** http://localhost:5174  
**Supabase:** https://supabase.com/dashboard

---

**You're 5 minutes away from a fully working system!** 🚀
