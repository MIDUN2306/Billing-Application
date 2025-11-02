# Create Admin Account - SQL Method

If the HTML method doesn't work (due to email confirmation requirements), you can create an admin account directly using SQL.

## Option 1: Using the HTML File (Recommended)

1. Open `create-admin.html` in your browser
2. Fill in the form:
   - Email: `admin@teaboys.com`
   - Password: `admin123` (or your choice)
   - Full Name: `Admin User`
3. Click "Create Admin Account"
4. Wait for success message
5. Login at http://localhost:5174

## Option 2: Direct SQL (If email confirmation is blocking)

If Supabase has email confirmation enabled and you can't access the confirmation email, you'll need to:

### Step 1: Disable Email Confirmation (Temporarily)

Go to your Supabase Dashboard:
1. Navigate to Authentication → Settings
2. Find "Enable email confirmations"
3. Toggle it OFF temporarily
4. Save changes

### Step 2: Use the HTML File

Now use the `create-admin.html` file as described in Option 1.

### Step 3: Re-enable Email Confirmation

After creating your admin account:
1. Go back to Authentication → Settings
2. Toggle "Enable email confirmations" back ON
3. Save changes

## Option 3: Manual Profile Creation (Advanced)

If you already created a user through Supabase Dashboard or the HTML file but it doesn't have the right role/store:

```sql
-- Find your user ID from auth.users
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Update the profile with admin role and store
UPDATE profiles 
SET 
  role = 'admin',
  store_id = 'fcb79a3d-ea99-4d4d-84ad-03dcc01718b2',
  is_active = true
WHERE id = 'your-user-id-here';
```

## Verify Your Account

After creating the account, verify it worked:

```sql
-- Check the profile
SELECT 
  p.id,
  p.full_name,
  p.role,
  p.is_active,
  s.name as store_name,
  au.email
FROM profiles p
JOIN auth.users au ON au.id = p.id
LEFT JOIN stores s ON s.id = p.store_id
WHERE au.email = 'admin@teaboys.com';
```

You should see:
- Role: `admin`
- Is Active: `true`
- Store Name: `Tea Boys Main Store`

## Default Test Credentials

**Email**: `admin@teaboys.com`  
**Password**: `admin123`  
**Role**: Admin  
**Store**: Tea Boys Main Store

## Troubleshooting

### "Email not confirmed" error
- Disable email confirmation in Supabase Dashboard (see Step 1 above)
- Or check your email for confirmation link

### "Profile not found" error
- The profile trigger might not have fired
- Manually create profile using Option 3 SQL

### "Store not found" error
- Verify store exists: `SELECT * FROM stores;`
- If no store, create one:
  ```sql
  INSERT INTO stores (name, address, phone, is_active)
  VALUES ('Tea Boys Main Store', '123 Main St', '+91-1234567890', true);
  ```

### Can't login after creating account
- Check if user exists: `SELECT * FROM auth.users WHERE email = 'admin@teaboys.com';`
- Check if profile exists: `SELECT * FROM profiles WHERE id = 'user-id';`
- Verify RLS policies are enabled: `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true;`

## Next Steps After Login

1. **Add Categories**: Go to Products → Categories
2. **Add Products**: Go to Products → Add products with pricing
3. **Add Customers**: Go to Customers → Add customer details
4. **Add Suppliers**: Use Customers page (suppliers use same table)
5. **Test POS**: Go to POS → Make a test sale
6. **Check Dashboard**: View real-time metrics

Enjoy your new billing system! 🎉
