# Tab Switching Issue - Implementation Fix Plan

## Quick Summary

The tab switching issue is caused by **race conditions** from multiple simultaneous data loads, NOT browser suspension. Here's how to fix it.

---

## Fix Strategy

### Phase 1: Add Request Deduplication (CRITICAL)

Apply the `loadingRef` pattern from `RawMaterialsPage.tsx` to all affected pages.

#### Pages to Fix:
1. ✅ `src/pages/dashboard/DashboardPage.tsx`
2. ✅ `src/pages/pos/POSPageNew.tsx`
3. ✅ `src/pages/sales/SalesPage.tsx`
4. ✅ `src/pages/purchases/PurchasesPage.tsx`
5. ✅ `src/pages/expenses/ExpensesPage.tsx`
6. ✅ Any other page with data loading

#### Pattern to Apply:

```typescript
import { useRef } from 'react';

export function YourPage() {
  const loadingRef = useRef(false);
  const isMountedRef = useRef(true);

  const loadData = useCallback(async (isRefresh = false) => {
    if (!currentStore?.id) {
      setLoading(false);
      return;
    }
    
    // ✅ Prevent multiple simultaneous loads
    if (loadingRef.current && !isRefresh) {
      console.log('[YourPage] Load already in progress, skipping');
      return;
    }
    
    loadingRef.current = true;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // ... your data loading logic ...
      
      if (isRefresh) {
        toast.success('Data refreshed');
      }
    } catch (error: any) {
      console.error('[YourPage] Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
      loadingRef.current = false; // ✅ Always reset
    }
  }, [currentStore?.id]);

  // ✅ Load on mount and when store changes
  useEffect(() => {
    isMountedRef.current = true;
    loadingRef.current = false; // Reset on mount
    
    if (currentStore?.id) {
      loadData();
    } else {
      setLoading(false);
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [currentStore?.id]); // ❌ REMOVE location.pathname

  // ✅ OPTIONAL: Reload on visibility change (with debounce)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const handleVisibilityChange = () => {
      if (!document.hidden && currentStore?.id && isMountedRef.current) {
        // Debounce: wait 500ms before reloading
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          loadingRef.current = false; // Reset lock
          loadData(true);
        }, 500);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentStore?.id, loadData]);
}
```

---

### Phase 2: Remove Problematic Dependencies

#### 1. Remove `location.pathname` from useEffect

**Why:** It causes unnecessary re-renders when navigating between pages.

```typescript
// ❌ BAD - Triggers on every route change
useEffect(() => {
  if (currentStore) {
    loadData();
  }
}, [currentStore, location.pathname, loadData]);

// ✅ GOOD - Only triggers when store changes
useEffect(() => {
  if (currentStore) {
    loadData();
  }
}, [currentStore?.id]);
```

#### 2. Remove Duplicate Event Listeners

**Current Problem:** Many pages have BOTH `visibilitychange` AND `focus` handlers:

```typescript
// ❌ BAD - Duplicate loads
const handleVisibilityChange = () => {
  if (!document.hidden && currentStore) {
    loadData(); // Load #1
  }
};
const handleFocus = () => {
  if (currentStore) {
    loadData(); // Load #2 (almost simultaneous)
  }
};
document.addEventListener('visibilitychange', handleVisibilityChange);
window.addEventListener('focus', handleFocus); // ❌ Remove this
```

**Solution:** Keep ONLY `visibilitychange`, remove `focus` handler:

```typescript
// ✅ GOOD - Single handler with debounce
const handleVisibilityChange = () => {
  if (!document.hidden && currentStore?.id) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      loadingRef.current = false;
      loadData(true);
    }, 500);
  }
};
document.addEventListener('visibilitychange', handleVisibilityChange);
// ✅ No focus handler needed
```

---

### Phase 3: Improve Error Handling

Add better error handling for Supabase connection issues:

```typescript
const loadData = useCallback(async (isRefresh = false) => {
  if (loadingRef.current && !isRefresh) {
    return;
  }
  
  loadingRef.current = true;
  
  // ✅ Add timeout protection
  const timeoutId = setTimeout(() => {
    console.warn('[YourPage] Load timeout - resetting');
    loadingRef.current = false;
    setLoading(false);
    setRefreshing(false);
    toast.error('Loading timeout - please refresh');
  }, 10000); // 10 second timeout

  try {
    // ... load data ...
  } catch (error: any) {
    console.error('[YourPage] Error:', error);
    
    // ✅ Better error messages
    if (error.message?.includes('timeout')) {
      toast.error('Request timed out. Please try again.');
    } else if (error.message?.includes('network')) {
      toast.error('Network error. Check your connection.');
    } else {
      toast.error('Failed to load data');
    }
  } finally {
    clearTimeout(timeoutId);
    setLoading(false);
    setRefreshing(false);
    loadingRef.current = false;
  }
}, [currentStore?.id]);
```

---

### Phase 4: Optional - Add Connection Status Indicator

Create a simple connection status component:

```typescript
// src/components/ConnectionStatus.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Wifi, WifiOff } from 'lucide-react';

export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    // Check browser online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check Supabase connection
    const checkConnection = async () => {
      try {
        const { error } = await supabase.from('stores').select('id').limit(1);
        setIsConnected(!error);
      } catch {
        setIsConnected(false);
      }
    };

    const interval = setInterval(checkConnection, 30000); // Check every 30s
    checkConnection();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  if (isOnline && isConnected) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50">
      <WifiOff className="w-4 h-4" />
      <span className="text-sm font-medium">
        {!isOnline ? 'No internet connection' : 'Database connection lost'}
      </span>
    </div>
  );
}
```

---

## Implementation Checklist

### Immediate Fixes (Do First):
- [ ] Add `loadingRef` to DashboardPage.tsx
- [ ] Add `loadingRef` to POSPageNew.tsx
- [ ] Add `loadingRef` to SalesPage.tsx
- [ ] Remove `location.pathname` from all useEffect dependencies
- [ ] Remove duplicate `focus` event listeners

### Secondary Fixes:
- [ ] Add debouncing to visibility change handlers
- [ ] Add timeout protection to all data loads
- [ ] Improve error messages
- [ ] Add connection status indicator (optional)

### Testing:
- [ ] Test tab switching on localhost
- [ ] Test tab switching on Vercel
- [ ] Test with slow network (Chrome DevTools throttling)
- [ ] Test with multiple rapid tab switches
- [ ] Check browser console for errors
- [ ] Check Network tab for duplicate requests

---

## Expected Results After Fix

✅ **No more 404 errors** when switching tabs
✅ **No duplicate data loads** when tab becomes visible
✅ **Faster page loads** due to request deduplication
✅ **Better error handling** with clear messages
✅ **Stable on Vercel** with no timeout issues

---

## Why This Will Work

1. **Request Deduplication**: `loadingRef` prevents multiple simultaneous loads
2. **Stable Dependencies**: Removing `location.pathname` prevents unnecessary re-renders
3. **Single Event Handler**: Removing duplicate listeners prevents race conditions
4. **Debouncing**: 500ms delay prevents rapid-fire loads
5. **Timeout Protection**: Prevents infinite loading states
6. **Better Error Handling**: Users see clear error messages instead of 404

This is the **proven pattern** already working in `RawMaterialsPage.tsx` and `ProductsPage.tsx`.
