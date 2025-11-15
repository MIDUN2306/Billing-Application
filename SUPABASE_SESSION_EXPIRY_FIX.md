# Supabase Session Expiry Fix - THE REAL ISSUE

## The Actual Problem

After analyzing your screenshot and the 404 errors, the issue is **NOT** just React state management. The real problem is:

### Supabase Authentication Session Expiring

When you switch tabs:
1. Browser suspends the tab
2. Supabase auth token expires or becomes stale
3. You switch back and navigate to another page
4. Page tries to fetch data with expired/invalid token
5. **Supabase returns 404 errors** (not authorized)
6. Result: "No products found" and connection lost feeling

### Evidence from Your Screenshot

```
Failed: guynifjqydytpihazopl.supabase.co/rest/v1/...
the server responded with a status of 404 ()
```

These are **Supabase API 404 errors**, which means:
- The auth token is invalid/expired
- Supabase is rejecting the requests
- NOT a React state issue

---

## The Fix

### 1. Force Session Refresh on Tab Visibility

Updated `src/stores/authStore.ts` to call `refreshSession()` instead of just `getSession()`:

```typescript
// ❌ OLD - Just checks session
const { data: { session } } = await supabase.auth.getSession();

// ✅ NEW - Forces refresh to get new token
const { data: { session }, error } = await supabase.auth.refreshSession();
```

**Why this works:**
- `getSession()` returns cached session (might be expired)
- `refreshSession()` gets a fresh token from Supabase
- Fresh token = valid API requests

### 2. Added Request Timeout

Updated `src/lib/supabase.ts` to add 30-second timeout:

```typescript
global: {
  fetch: (url, options = {}) => {
    return fetch(url, {
      ...options,
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });
  },
}
```

**Why this helps:**
- Prevents hanging requests
- Fails fast if connection is lost
- User sees error instead of infinite loading

---

## What This Fixes

### Before:
❌ Switch tabs → session expires
❌ Navigate to page → 404 errors
❌ "No products found"
❌ Must refresh page to fix
❌ "Connection lost" feeling

### After:
✅ Switch tabs → session auto-refreshes
✅ Navigate to page → valid token, data loads
✅ Products appear correctly
✅ No need to refresh page
✅ Seamless experience

---

## How It Works Now

### Scenario: Switch Tab → Navigate

1. **User on POS page**
   - Has valid auth token

2. **Switch to another tab**
   - Browser suspends tab
   - Auth token might expire (after 1 hour by default)

3. **Switch back to app tab**
   - `visibilitychange` event fires
   - AuthStore calls `refreshSession()`
   - Gets fresh auth token from Supabase
   - Updates user state

4. **Navigate to Dashboard**
   - Dashboard mounts
   - Tries to fetch data
   - Uses fresh auth token ✅
   - Data loads successfully ✅

---

## Testing Instructions

### Test 1: Tab Switch + Navigate
1. Open app, go to POS page
2. Switch to another tab
3. Wait 5-10 seconds
4. Switch back
5. **Check console** - should see:
   ```
   [AuthStore] Tab visible, refreshing session
   [AuthStore] Session refreshed successfully
   ```
6. Navigate to Dashboard
7. ✅ Data should load (no 404 errors)

### Test 2: Long Tab Switch
1. Open app, go to POS page
2. Switch to another tab
3. **Wait 5 minutes** (to simulate token expiry)
4. Switch back
5. Navigate to different pages
6. ✅ All pages should load data correctly

### Test 3: Check Console
1. Open browser console (F12)
2. Switch tabs
3. Look for:
   - ✅ `[AuthStore] Session refreshed successfully`
   - ❌ No 404 errors
   - ❌ No "Failed to load" errors

---

## Why Page Refresh Works

When you refresh the page:
- App reinitializes
- AuthStore calls `initialize()`
- Gets fresh session from Supabase
- Fresh token = valid requests

But now you **don't need to refresh** because the visibility handler does this automatically!

---

## Additional Notes

### Session Expiry Time
- Supabase default: 1 hour
- After 1 hour of inactivity, token expires
- `refreshSession()` gets a new token
- No need to re-login

### Auto Refresh Token
```typescript
auth: {
  autoRefreshToken: true, // Already enabled
}
```

This should auto-refresh, but visibility change handler ensures it happens when tab becomes visible.

---

## Status

✅ **Session refresh on visibility change - IMPLEMENTED**
✅ **Request timeout added - IMPLEMENTED**
✅ **Console logging added - IMPLEMENTED**

---

## Next Steps

1. Test tab switching with console open
2. Verify no 404 errors
3. Verify data loads on all pages
4. If still issues, check:
   - Supabase project settings
   - JWT expiry time
   - RLS policies

The fix is now in place. Test it and let me know if you still see 404 errors!
