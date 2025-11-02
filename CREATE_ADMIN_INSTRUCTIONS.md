# 🔐 Create Admin Account - Step by Step

## ⚠️ Important: You're getting "Invalid login credentials" because no account exists yet!

You need to **create the account first** before you can login.

---

## 🎯 Method 1: Using create-admin.html (Recommended)

### Step 1: Check Email Confirmation Settings

**IMPORTANT**: Supabase might have email confirmation enabled by default.

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `guynifjqydytpihazopl`
3. Navigate to: **Authentication** → **Settings** → **Auth Settings**
4. Find: **"Enable email confirmations"**
5. **Toggle it OFF** (temporarily)
6. Click **Save**

### Step 2: Create Account

1. Open `create-admin.html` in your web browser (double-click the file)
2. You'll see a form with pre-filled values:
   - Email: `admin@teaboys.com`
   - Password: `admin123`
   - Full Name: `Admin User`
3. Click **"Create Admin Account"**
4. Wait for the success message (should take 2-3 seconds)
5. You should see: "Admin account created successfully!"

### Step 3: Login

1. Go to http://localhost:5174
2. Enter credentials:
   - Email: `admin@teaboys.com`
   - Password: `admin123`
3. Click **"Sign In"**
4. You should now see the Dashboard! 🎉

### Step 4: Re-enable Email Confirmation (Optional)

After creating your admin account:
1. Go back to Supabase Dashboard
2. Authentication → Settings
3. Toggle **"Enable email confirmations"** back ON
4. Save

---

## 🎯 Method 2: Using Supabase Dashboard

If the HTML method doesn't work, create the account directly in Supabase:

### Step 1: Create User in Supabase Dashboard

1. Go to your Supabase Dashboard
2. Navigate to: **Authentication** → **Users**
3. Click **"Add user"** or **"Invite user"**
4. Fill in:
   - Email: `admin@teaboys.com`
   - Password: `admin123`
   - Auto Confirm User: **YES** (check this box!)
5. Click **"Create user"** or **"Send invitation"**

### Step 2: Create Profile via SQL

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **"New query"**
3. Copy and paste this SQL:

```sql
-- Get the user ID first
SELECT id, email FROM auth.users WHERE email = 'admin@teaboys.com';

-- Copy the ID from the result, then run this (replace YOUR_USER_ID):
INSERT INTO profiles (id, full_name, role, store_id, is_active)
VALUES (
  'YOUR_USER_ID_HERE',  -- Replace with actual user ID from above
  'Admin User',
  'admin',
  'fcb79a3d-ea99-4d4d-84ad-03dcc01718b2',  -- Tea Boys Main Store
  true
)
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  store_id = 'fcb79a3d-ea99-4d4d-84ad-03dcc01718b2',
  is_active = true;
```

4. Click **"Run"**

### Step 3: Login

Now try logging in at http://localhost:5174 with:
- Email: `admin@teaboys.com`
- Password: `admin123`

---

## 🎯 Method 3: Quick SQL Script (Advanced)

If you have access to run SQL directly, you can use this script:

```sql
-- This creates a user directly (requires service role access)
-- Note: This won't work with anon key, needs service role key

-- First, check if user exists
SELECT id, email FROM auth.users WHERE email = 'admin@teaboys.com';

-- If user exists but profile is missing, create profile:
INSERT INTO profiles (id, full_name, role, store_id, is_active)
SELECT 
  id,
  'Admin User',
  'admin',
  'fcb79a3d-ea99-4d4d-84ad-03dcc01718b2',
  true
FROM auth.users 
WHERE email = 'admin@teaboys.com'
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  store_id = 'fcb79a3d-ea99-4d4d-84ad-03dcc01718b2',
  is_active = true;
```

---

## 🔍 Troubleshooting

### Error: "Invalid login credentials"
**Cause**: Account doesn't exist yet  
**Solution**: Create account using Method 1 or 2 above

### Error: "Email not confirmed"
**Cause**: Email confirmation is enabled  
**Solution**: 
- Disable email confirmation in Supabase Dashboard (Method 1, Step 1)
- Or check your email for confirmation link
- Or use "Auto Confirm User" when creating in dashboard

### Error: "User already registered"
**Cause**: Account exists but profile is missing  
**Solution**: Run the profile creation SQL from Method 2, Step 2

### Can't access Supabase Dashboard
**Cause**: Not logged in to Supabase  
**Solution**: Go to https://supabase.com and login with your Supabase account

### Profile not created automatically
**Cause**: Trigger might not have fired  
**Solution**: Manually create profile using SQL from Method 2, Step 2

---

## ✅ Verify Account Creation

After creating the account, verify it worked:

```sql
-- Run this in Supabase SQL Editor
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

---

## 🎉 Success!

Once you can login successfully:

1. ✅ You'll see the Dashboard
2. ✅ Navigate to Products → Categories to add categories
3. ✅ Navigate to Products to add products
4. ✅ Navigate to Customers to add customers
5. ✅ Navigate to POS to make your first sale!

---

## 📞 Still Having Issues?

If you're still having trouble:

1. **Check browser console** (F12) for detailed error messages
2. **Check Supabase logs** in Dashboard → Logs
3. **Verify environment variables** in `.env` file
4. **Restart dev server** (`npm run dev`)
5. **Clear browser cache** and try again

---

**Default Test Credentials:**
- Email: `admin@teaboys.com`
- Password: `admin123`
- Role: Admin
- Store: Tea Boys Main Store

**Good luck!** 🚀
