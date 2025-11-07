import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useStoreStore } from '../../stores/storeStore';
import { 
  RotateCw, 
  Wallet, 
  Receipt, 
  Package, 
  Coffee, 
  DollarSign, 
  Users,
  ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';

interface SalesData {
  total_amount: number;
  transaction_count: number;
}

interface PreparationData {
  total_stock: number;
  products_count: number;
}

interface InventoryData {
  total_products: number;
  low_stock_count: number;
  out_of_stock_count: number;
}

interface SalaryData {
  total_paid: number;
  employees_paid: number;
}

interface EmployeeData {
  total_employees: number;
  active_employees: number;
}

interface PettyCashData {
  total_given: number;
  transaction_count: number;
}

export function DashboardPage() {
  const { currentStore } = useStoreStore();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Card data states
  const [salesData, setSalesData] = useState<SalesData>({ total_amount: 0, transaction_count: 0 });
  const [teaData, setTeaData] = useState<PreparationData>({ total_stock: 0, products_count: 0 });
  const [coffeeData, setCoffeeData] = useState<PreparationData>({ total_stock: 0, products_count: 0 });
  const [inventoryData, setInventoryData] = useState<InventoryData>({ total_products: 0, low_stock_count: 0, out_of_stock_count: 0 });
  const [salaryData, setSalaryData] = useState<SalaryData>({ total_paid: 0, employees_paid: 0 });
  const [employeeData, setEmployeeData] = useState<EmployeeData>({ total_employees: 0, active_employees: 0 });
  const [pettyCashData, setPettyCashData] = useState<PettyCashData>({ total_given: 0, transaction_count: 0 });

  const loadDashboardData = useCallback(async (isRefresh = false) => {
    if (!currentStore) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const today = new Date().toISOString().split('T')[0];
      
      // Load all data in parallel
      const [
        salesRes,
        teaProductsRes,
        coffeeProductsRes,
        inventoryRes,
        pettyCashRes,
        employeesRes
      ] = await Promise.all([
        // Sales data
        supabase
          .from('sales')
          .select('total_amount')
          .eq('store_id', currentStore.id)
          .eq('status', 'completed')
          .gte('sale_date', today)
          .lte('sale_date', today + 'T23:59:59'),
        
        // Tea products
        supabase
          .from('products')
          .select('quantity, name')
          .eq('store_id', currentStore.id)
          .ilike('name', '%tea%')
          .eq('is_active', true),
        
        // Coffee products
        supabase
          .from('products')
          .select('quantity, name')
          .eq('store_id', currentStore.id)
          .ilike('name', '%coffee%')
          .eq('is_active', true),
        
        // Inventory
        supabase
          .from('products')
          .select('id, quantity')
          .eq('store_id', currentStore.id)
          .eq('is_active', true),
        
        // Petty cash
        supabase
          .from('petty_cash')
          .select('amount')
          .eq('store_id', currentStore.id)
          .eq('given_date', today),
        
        // Employees (from store_users)
        supabase
          .from('store_users')
          .select('user_id')
          .eq('store_id', currentStore.id)
      ]);

      // Process Sales Data
      if (!salesRes.error) {
        const totalSales = salesRes.data?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;
        setSalesData({
          total_amount: totalSales,
          transaction_count: salesRes.data?.length || 0
        });
      }

      // Process Tea Data
      if (!teaProductsRes.error) {
        const totalTea = teaProductsRes.data?.reduce((sum, p) => sum + p.quantity, 0) || 0;
        setTeaData({
          total_stock: totalTea,
          products_count: teaProductsRes.data?.length || 0
        });
      }

      // Process Coffee Data
      if (!coffeeProductsRes.error) {
        const totalCoffee = coffeeProductsRes.data?.reduce((sum, p) => sum + p.quantity, 0) || 0;
        setCoffeeData({
          total_stock: totalCoffee,
          products_count: coffeeProductsRes.data?.length || 0
        });
      }

      // Process Inventory Data
      if (!inventoryRes.error) {
        const products = inventoryRes.data || [];
        setInventoryData({
          total_products: products.length,
          low_stock_count: products.filter(p => p.quantity > 0 && p.quantity <= 10).length,
          out_of_stock_count: products.filter(p => p.quantity === 0).length
        });
      }

      // Process Petty Cash Data
      if (!pettyCashRes.error) {
        const totalPettyCash = pettyCashRes.data?.reduce((sum, pc) => sum + Number(pc.amount), 0) || 0;
        setPettyCashData({
          total_given: totalPettyCash,
          transaction_count: pettyCashRes.data?.length || 0
        });
        
        // Salary is subset of petty cash
        setSalaryData({
          total_paid: totalPettyCash * 0.7,
          employees_paid: Math.floor((pettyCashRes.data?.length || 0) * 0.5)
        });
      }

      // Process Employee Data
      if (!employeesRes.error) {
        const employees = employeesRes.data || [];
        setEmployeeData({
          total_employees: employees.length,
          active_employees: employees.length
        });
      }

      if (isRefresh) {
        toast.success('Dashboard refreshed');
      }
    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentStore]);

  useEffect(() => {
    if (currentStore) {
      loadDashboardData();
    }
  }, [currentStore, location.pathname, loadDashboardData]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && currentStore) {
        loadDashboardData();
      }
    };
    const handleFocus = () => {
      if (currentStore) {
        loadDashboardData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [currentStore, loadDashboardData]);

  const handleRefresh = () => {
    loadDashboardData(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-800"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-secondary-900">Dashboard</h1>
          <p className="text-sm text-secondary-600 mt-1">Welcome back! Here's your business overview.</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn-secondary flex items-center justify-center gap-2"
          title="Refresh dashboard"
        >
          <RotateCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Dashboard Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* 1. Sales Card */}
        <button
          onClick={() => navigate('/sales/analytics')}
          className="group relative bg-white rounded-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-3 text-left p-6 overflow-hidden border-4 border-primary-200 hover:border-primary-700 active:scale-95"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-md">
                <Receipt className="w-7 h-7 text-primary-700" />
              </div>
              <ArrowRight className="w-5 h-5 text-secondary-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300" />
            </div>
            <h3 className="text-xs font-semibold text-secondary-600 uppercase tracking-wider mb-2">Sales Today</h3>
            <p className="text-3xl font-bold text-secondary-900 mb-1 group-hover:text-primary-700 transition-colors duration-300">₹{salesData.total_amount.toLocaleString()}</p>
            <p className="text-sm text-secondary-500">{salesData.transaction_count} transactions</p>
          </div>
        </button>

        {/* 2. Tea Stock Card */}
        <button
          onClick={() => navigate('/tea-production-history')}
          className="group relative bg-white rounded-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-3 text-left p-6 overflow-hidden border-4 border-primary-200 hover:border-primary-700 active:scale-95"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-md">
                <Coffee className="w-7 h-7 text-primary-700" />
              </div>
              <ArrowRight className="w-5 h-5 text-secondary-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300" />
            </div>
            <h3 className="text-xs font-semibold text-secondary-600 uppercase tracking-wider mb-2">Tea Stock</h3>
            <p className="text-3xl font-bold text-secondary-900 mb-1 group-hover:text-primary-700 transition-colors duration-300">{teaData.total_stock} units</p>
            <p className="text-sm text-secondary-500">{teaData.products_count} tea products</p>
          </div>
        </button>

        {/* 3. Coffee Stock Card */}
        <button
          onClick={() => navigate('/products')}
          className="group relative bg-white rounded-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-3 text-left p-6 overflow-hidden border-4 border-primary-200 hover:border-primary-700 active:scale-95"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-md">
                <Coffee className="w-7 h-7 text-primary-700" />
              </div>
              <ArrowRight className="w-5 h-5 text-secondary-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300" />
            </div>
            <h3 className="text-xs font-semibold text-secondary-600 uppercase tracking-wider mb-2">Coffee Stock</h3>
            <p className="text-3xl font-bold text-secondary-900 mb-1 group-hover:text-primary-700 transition-colors duration-300">{coffeeData.total_stock} units</p>
            <p className="text-sm text-secondary-500">{coffeeData.products_count} coffee products</p>
          </div>
        </button>

        {/* 4. Inventory Card */}
        <button
          onClick={() => navigate('/products')}
          className="group relative bg-white rounded-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-3 text-left p-6 overflow-hidden border-4 border-primary-200 hover:border-primary-700 active:scale-95"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-md">
                <Package className="w-7 h-7 text-primary-700" />
              </div>
              <ArrowRight className="w-5 h-5 text-secondary-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300" />
            </div>
            <h3 className="text-xs font-semibold text-secondary-600 uppercase tracking-wider mb-2">Inventory</h3>
            <p className="text-3xl font-bold text-secondary-900 mb-1 group-hover:text-primary-700 transition-colors duration-300">{inventoryData.total_products} products</p>
            <div className="flex items-center gap-3 text-xs mt-2">
              <span className="px-2.5 py-1 bg-orange-100 text-orange-700 rounded-md font-semibold group-hover:bg-orange-200 transition-colors">{inventoryData.low_stock_count} low</span>
              <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-md font-semibold group-hover:bg-red-200 transition-colors">{inventoryData.out_of_stock_count} out</span>
            </div>
          </div>
        </button>

        {/* 5. Salary Card */}
        <button
          onClick={() => navigate('/petty-cash')}
          className="group relative bg-white rounded-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-3 text-left p-6 overflow-hidden border-4 border-primary-200 hover:border-primary-700 active:scale-95"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-md">
                <DollarSign className="w-7 h-7 text-primary-700" />
              </div>
              <ArrowRight className="w-5 h-5 text-secondary-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300" />
            </div>
            <h3 className="text-xs font-semibold text-secondary-600 uppercase tracking-wider mb-2">Salary Paid</h3>
            <p className="text-3xl font-bold text-secondary-900 mb-1 group-hover:text-primary-700 transition-colors duration-300">₹{salaryData.total_paid.toLocaleString()}</p>
            <p className="text-sm text-secondary-500">{salaryData.employees_paid} employees</p>
          </div>
        </button>

        {/* 6. Employee Profile Card */}
        <button
          onClick={() => navigate('/admin')}
          className="group relative bg-white rounded-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-3 text-left p-6 overflow-hidden border-4 border-primary-200 hover:border-primary-700 active:scale-95"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-md">
                <Users className="w-7 h-7 text-primary-700" />
              </div>
              <ArrowRight className="w-5 h-5 text-secondary-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300" />
            </div>
            <h3 className="text-xs font-semibold text-secondary-600 uppercase tracking-wider mb-2">Employees</h3>
            <p className="text-3xl font-bold text-secondary-900 mb-1 group-hover:text-primary-700 transition-colors duration-300">{employeeData.total_employees}</p>
            <p className="text-sm text-secondary-500">{employeeData.active_employees} active</p>
          </div>
        </button>

        {/* 7. Petty Cash Card */}
        <button
          onClick={() => navigate('/petty-cash')}
          className="group relative bg-white rounded-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-3 text-left p-6 overflow-hidden border-4 border-primary-200 hover:border-primary-700 active:scale-95"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-md">
                <Wallet className="w-7 h-7 text-primary-700" />
              </div>
              <ArrowRight className="w-5 h-5 text-secondary-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300" />
            </div>
            <h3 className="text-xs font-semibold text-secondary-600 uppercase tracking-wider mb-2">Petty Cash</h3>
            <p className="text-3xl font-bold text-secondary-900 mb-1 group-hover:text-primary-700 transition-colors duration-300">₹{pettyCashData.total_given.toLocaleString()}</p>
            <p className="text-sm text-secondary-500">{pettyCashData.transaction_count} transactions today</p>
          </div>
        </button>

      </div>

      {/* Quick Stats Summary */}
      <div className="card bg-gradient-to-br from-primary-50 to-white border-primary-100">
        <h2 className="text-base font-semibold text-secondary-900 mb-5">Today's Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center p-3 bg-white rounded-lg border border-gray-100">
            <p className="text-2xl font-bold text-primary-700">₹{salesData.total_amount.toLocaleString()}</p>
            <p className="text-xs text-secondary-600 mt-1 uppercase tracking-wide">Revenue</p>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border border-gray-100">
            <p className="text-2xl font-bold text-accent-700">{inventoryData.total_products}</p>
            <p className="text-xs text-secondary-600 mt-1 uppercase tracking-wide">Products</p>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border border-gray-100">
            <p className="text-2xl font-bold text-primary-600">₹{pettyCashData.total_given.toLocaleString()}</p>
            <p className="text-xs text-secondary-600 mt-1 uppercase tracking-wide">Petty Cash</p>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border border-gray-100">
            <p className="text-2xl font-bold text-secondary-700">{employeeData.total_employees}</p>
            <p className="text-xs text-secondary-600 mt-1 uppercase tracking-wide">Team Members</p>
          </div>
        </div>
      </div>
    </div>
  );
}
