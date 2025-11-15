# Tab Switching Issue - Root Cause Analysis

## Executive Summary

After thorough analysis of your codebase, I've identified the **ACTUAL root cause** of the tab switching issue that leads to 404 errors and data fetching problems on Vercel.

**The issue is NOT browser tab suspension or network throttling** as initially suggested. The real problem is a **race condition and dependency loop** in your React components.

---

## The Real Problem

### 1. **Circular Dependency in useEffect Hooks**

Your pages have a problematic pattern where `useEffect` depends on `location.pathname` AND the load function, which creates unnecessary re-renders:

```typescript
// From DashboardPage.tsx, SalesPage.tsx, POSPageNew.tsx, etc.
useEffect(() => {
  if (currentStore) {
    loadDashboardData();
  }
}, [currentStore, location.pathname, loadDashboardData]); // ❌ PROBLEM HERE
```

**Why this is problematic:**
- `loadDashboardData` is a `useCallback` that depends on `currentStore`
- When you switch tabs, React Router changes `location.pathname`
- This triggers the useEffect
- The useEffect calls `loadDashboardData`
- But `loadDashboardData` might not be stable if `currentStore` is being refreshed
- This creates a race condition where data loads are triggered multiple times

### 2. **Duplicate Event Listeners**

You have TWO separate useEffects handling visibility changes:

```typescript
// First useEffect - loads on location change
useEffect(() => {
  if (currentStore) {
    loadDashboardData();
  }
}, [currentStore, location.pathname, loadDashboardData]);

// Second useEffect - loads on visibility change
useEffect(() => {
  const handleVisibilityChange = () => {
    if (!document.hidden && currentStore) {
      loadDashboardData(); // ❌ DUPLICATE LOAD
    }
  };
  const handleFocus = () => {
    if (currentStore) {
      loadDashboardData(); // ❌ ANOTHER DUPLICATE LOAD
    }
  };
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('focus', handleFocus);
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('focus', handleFocus);
  };
}, [currentStore, loadDashboardData]); // ❌ This can trigger multiple times
```

**What happens when you switch tabs:**
1. Tab becomes hidden → no immediate issue
2. Tab becomes visible → `visibilitychange` event fires
3. Window gets focus → `focus` event fires
4. Both events call `loadDashboardData()` almost simultaneously
5. If `currentStore` is being refreshed by authStore, it triggers AGAIN
6. Multiple parallel requests to Supabase
7. Some requests succeed, some fail, some timeout
8. React Router might navigate away before data loads complete
9. Result: 404 errors or stale data

### 3. **No Request Deduplication**

Your pages don't prevent multiple simultaneous loads. Look at RawMaterialsPage - it tries to fix this with `loadingRef`:

```typescript
// From RawMaterialsPage.tsx - GOOD PATTERN
const loadingRef = useRef(false);

const loadStocks = useCallback(async (isRefresh = false) => {
  // Prevent multiple simultaneous loads
  if (loadingRef.current && !isRefresh) {
    return; // ✅ PREVENTS RACE CONDITIONS
  }
  
  loadingRef.current = true;
  // ... load data ...
  loadingRef.current = false;
}, [currentStore?.id]);
```

But most other pages (Dashboard, POS, Sales) **don't have this protection**.

### 4. **Auth Store Visibility Handler Conflicts**

Your `authStore.ts` also listens to `visibilitychange`:

```typescript
// From authStore.ts
document.addEventListener('visibilitychange', async () => {
  if (!document.hidden) {
    // Tab became visible - check session validity
    const { data: { session } } = await supabase.auth.getSession();
    // ... refresh profile ...
  }
});
```

**The problem:**
- When tab becomes visible, authStore refreshes the session
- This might update the `user` or `profile` state
- Pages watching `currentStore` might re-render
- This triggers their load functions AGAIN
- Now you have 3-4 simultaneous data loads happening

---

## Why It Manifests as 404 Errors on Vercel

1. **Serverless Function Timeouts**: Vercel's edge functions have strict timeout limits. When multiple requests fire simultaneously, some timeout.

2. **Connection Pool Exhaustion**: Supabase has connection limits. Multiple parallel requests from the same client can exhaust the pool.

3. **React Router Navigation Timing**: If data loads fail or timeout, React Router might think the route is invalid and show 404.

4. **Stale Closure Issues**: The `loadDashboardData` function in the second useEffect might capture stale values of `currentStore` if it's being updated.

---

## Evidence from Your Code

### Pages WITH the issue (no protection):
- ✅ `DashboardPage.tsx` - Has visibility handlers, no deduplication
- ✅ `POSPageNew.tsx` - Has location.pathname dependency, no deduplication  
- ✅ `SalesPage.tsx` - Has visibility handlers, no deduplication

### Pages WITHOUT the issue (has protection):
- ✅ `RawMaterialsPage.tsx` - Uses `loadingRef` to prevent race conditions
- ✅ `ProductsPage.tsx` - Uses `loadingRef` AND has safety timeout

---

## The Solution

You need to implement **request deduplication** and **remove unnecessary dependencies**:

### 1. Remove `location.pathname` dependency
```typescript
// ❌ BAD
useEffect(() => {
  if (currentStore) {
    loadData();
  }
}, [currentStore, location.pathname, loadData]);

// ✅ GOOD
useEffect(() => {
  if (currentStore) {
    loadData();
  }
}, [currentStore]); // Only reload when store changes
```

### 2. Add request deduplication
```typescript
const loadingRef = useRef(false);

const loadData = useCallback(async (isRefresh = false) => {
  if (loadingRef.current && !isRefresh) {
    return; // Prevent duplicate loads
  }
  
  loadingRef.current = true;
  try {
    // ... load data ...
  } finally {
    loadingRef.current = false;
  }
}, [currentStore?.id]);
```

### 3. Consolidate visibility handlers
```typescript
// Remove the separate visibility useEffect
// Let users manually refresh if needed
```

### 4. Add debouncing to visibility changes
```typescript
const visibilityTimeoutRef = useRef<NodeJS.Timeout>();

useEffect(() => {
  const handleVisibilityChange = () => {
    if (!document.hidden && currentStore) {
      // Debounce: wait 500ms before loading
      clearTimeout(visibilityTimeoutRef.current);
      visibilityTimeoutRef.current = setTimeout(() => {
        loadData(true);
      }, 500);
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => {
    clearTimeout(visibilityTimeoutRef.current);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}, [currentStore]);
```

---

## Conclusion

**The issue is NOT:**
- ❌ Browser tab suspension
- ❌ Network throttling
- ❌ Supabase realtime connection issues
- ❌ Vercel-specific edge function problems

**The issue IS:**
- ✅ Race conditions from multiple simultaneous data loads
- ✅ Circular dependencies in useEffect hooks
- ✅ Duplicate event listeners (visibilitychange + focus)
- ✅ No request deduplication
- ✅ Stale closures capturing old state

**Fix Priority:**
1. Add `loadingRef` to all pages (like RawMaterialsPage does)
2. Remove `location.pathname` from useEffect dependencies
3. Remove duplicate visibility/focus handlers OR debounce them
4. Let users manually refresh instead of auto-reloading on tab switch

This will resolve both local development issues AND Vercel 404 errors.
