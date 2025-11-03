import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores/authStore';
import { useStoreStore } from './stores/storeStore';

// Layout
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

// Pages
import { LoginPage } from './pages/auth/LoginPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { POSPage } from './pages/pos/POSPage';
import { SalesPage } from './pages/sales/SalesPage';
import { SalesHistoryPage } from './pages/sales/SalesHistoryPage';
import { BillDownloadPage } from './pages/BillDownloadPage';
import { PurchasesPage } from './pages/purchases/PurchasesPage';
import { ExpensesPage } from './pages/expenses/ExpensesPage';
import { PettyCashPage } from './pages/petty-cash/PettyCashPage';
import { ProductsPage } from './pages/products/ProductsPage';
import { CategoriesPage } from './pages/categories/CategoriesPage';
import { RawMaterialsPage } from './pages/raw-materials/RawMaterialsPage';
import { AdminPage } from './pages/admin/AdminPage';

function App() {
  const { initialize, initialized } = useAuthStore();
  const { loadStores } = useStoreStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (initialized) {
      loadStores();
    }
  }, [initialized, loadStores]);

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-800 mx-auto"></div>
          <p className="mt-4 text-secondary-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/bill/:invoiceNumber" element={<BillDownloadPage />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/pos" element={<POSPage />} />
            <Route path="/sales" element={<SalesPage />} />
            <Route path="/sales/history" element={<SalesHistoryPage />} />
            <Route path="/purchases" element={<PurchasesPage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/petty-cash" element={<PettyCashPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/categories" element={<CategoriesPage />} />
            <Route path="/raw-materials" element={<RawMaterialsPage />} />
            
            {/* Manager+ Routes */}
            <Route element={<ProtectedRoute requiredRole="manager" />}>
              <Route path="/reports" element={<div>Reports Page - Coming Soon</div>} />
              <Route path="/tea-boys" element={<div>Tea Boys Page - Coming Soon</div>} />
            </Route>

            {/* Admin Routes */}
            <Route element={<ProtectedRoute requiredRole="admin" />}>
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/settings" element={<div>Settings Page - Coming Soon</div>} />
            </Route>
          </Route>
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Toast Notifications */}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#1a1a1a',
          },
          success: {
            iconTheme: {
              primary: '#8b1a39',
              secondary: '#fff',
            },
          },
        }}
      />
    </BrowserRouter>
  );
}

export default App;
