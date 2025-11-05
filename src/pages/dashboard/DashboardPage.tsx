import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useStoreStore } from '../../stores/storeStore';
import { TrendingUp, TrendingDown, DollarSign, RotateCw, Wallet, Milk, History } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLocation } from 'react-router-dom';
import { RawMaterialsStockModal } from './RawMaterialsStockModal';
import { RawMaterialsDetailsModal } from './RawMaterialsDetailsModal';
import { PettyCashDetailsModal } from './PettyCashDetailsModal';
import { TotalCostsDetailsModal } from './TotalCostsDetailsModal';
import { PaymentMethodDetailsModal } from './PaymentMethodDetailsModal';
import { EnhancedDateFilter } from '../../components/EnhancedDateFilter';
import { EnhancedDateFilter as EnhancedDateFilterType, getDefaultEnhancedFilter } from '../../utils/enhancedDateFilters';
import { PaymentMethodsPieChart } from '../../components/charts/PaymentMethodsPieChart';
import { SalesVsExpensesBarChart } from '../../components/charts/SalesVsExpensesBarChart';
import { DailySalesExpensesComboChart } from '../../components/charts/DailySalesExpensesComboChart';

interface DashboardStats {
  today_sales: number;
  today_purchases: number;
  today_expenses: number;
  today_raw_materials: number;
  today_petty_cash: number;
  total_costs_today: number;
  pending_payments: number;
  low_stock_count: number;
  total_customers: number;
  total_products: number;
}

interface PaymentBreakdown {
  payment_method: string;
  total_amount: number;
  transaction_count: number;
}

interface SalesVsExpensesData {
  date: string;
  sales: number;
  expenses: number;
  profit_loss: number;
}

export function DashboardPage() {
  const { currentStore } = useStoreStore();
  const location = useLocation();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [paymentBreakdown, setPaymentBreakdown] = useState<PaymentBreakdown[]>([]);
  const [salesVsExpensesData, setSalesVsExpensesData] = useState<SalesVsExpensesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal states
  const [showRawMaterialsStockModal, setShowRawMaterialsStockModal] = useState(false);
  const [showRawMaterialsModal, setShowRawMaterialsModal] = useState(false);
  const [showPettyCashModal, setShowPettyCashModal] = useState(false);
  const [showTotalCostsModal, setShowTotalCostsModal] = useState(false);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  
  // Date filter state
  const [dateFilter, setDateFilter] = useState<EnhancedDateFilterType>(getDefaultEnhancedFilter());

  const loadDashboardStats = useCallback(async (isRefresh = false, filter = dateFilter) => {
    if (!currentStore) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // Load dashboard stats
      const statsRes = await supabase.rpc('get_dashboard_stats_range', { 
        p_store_id: currentStore.id,
        p_start_date: filter.startDate,
        p_end_date: filter.endDate
      });

      if (statsRes.error) throw statsRes.error;
      setStats(statsRes.data);
      
      // Load chart data in parallel
      setChartsLoading(true);
      const [paymentsRes, salesVsExpensesRes] = await Promise.all([
        supabase
          .from('sales')
          .select('payment_method, total_amount')
          .eq('store_id', currentStore.id)
          .gte('sale_date', filter.startDate)
          .lte('sale_date', filter.endDate + 'T23:59:59')
          .eq('status', 'completed'),
        supabase.rpc('get_daily_sales_vs_expenses', {
          p_store_id: currentStore.id,
          p_start_date: filter.startDate,
          p_end_date: filter.endDate
        })
      ]);

      if (paymentsRes.error) throw paymentsRes.error;
      if (salesVsExpensesRes.error) throw salesVsExpensesRes.error;

      setSalesVsExpensesData(salesVsExpensesRes.data || []);
      
      // Aggregate payment data
      const paymentMap = new Map<string, { total: number; count: number }>();
      (paymentsRes.data || []).forEach((sale: any) => {
        const method = sale.payment_method;
        const existing = paymentMap.get(method) || { total: 0, count: 0 };
        paymentMap.set(method, {
          total: existing.total + Number(sale.total_amount),
          count: existing.count + 1
        });
      });
      
      const paymentData = Array.from(paymentMap.entries()).map(([method, data]) => ({
        payment_method: method,
        total_amount: data.total,
        transaction_count: data.count
      }));
      
      setPaymentBreakdown(paymentData);
      setChartsLoading(false);
      
      if (isRefresh) {
        toast.success('Dashboard refreshed');
      }
    } catch (error: any) {
      console.error('Error loading dashboard stats:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentStore, dateFilter]);

  useEffect(() => {
    if (currentStore) {
      loadDashboardStats();
    }
  }, [currentStore, location.pathname, loadDashboardStats]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && currentStore) {
        loadDashboardStats();
      }
    };
    const handleFocus = () => {
      if (currentStore) {
        loadDashboardStats();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [currentStore, loadDashboardStats]);

  const handleRefresh = () => {
    loadDashboardStats(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-800"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-secondary-900">Dashboard</h1>
          <p className="text-secondary-600 mt-1">Welcome back! Here's what's happening.</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn-secondary flex items-center justify-center gap-2 w-full sm:w-auto"
          title="Refresh dashboard"
        >
          <RotateCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="sm:inline">Refresh</span>
        </button>
      </div>

      {/* Enhanced Date Filter */}
      <EnhancedDateFilter 
        currentFilter={dateFilter}
        onFilterChange={(filter) => {
          setDateFilter(filter);
          loadDashboardStats(false, filter);
        }}
      />

      {/* Main Stats Cards - Cost Tracking (Clickable) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Raw Materials Stock - CLICKABLE */}
        <button
          onClick={() => setShowRawMaterialsStockModal(true)}
          className="card bg-orange-50 border-orange-200 hover:shadow-lg hover:border-orange-300 transition-all cursor-pointer text-left"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-700 font-medium">Raw Materials Stock</p>
              <p className="text-2xl font-bold text-orange-900 mt-1">
                ₹{stats?.today_raw_materials.toLocaleString() || 0}
              </p>
              <p className="text-xs text-orange-600 mt-1">Track Stock Levels</p>
            </div>
            <div className="w-12 h-12 bg-orange-200 rounded-lg flex items-center justify-center">
              <Milk className="w-6 h-6 text-orange-700" />
            </div>
          </div>
          <div className="mt-3 text-xs text-orange-600 font-medium">
            Click to view stock →
          </div>
        </button>

        {/* Raw Materials Cost Log - CLICKABLE */}
        <button
          onClick={() => setShowRawMaterialsModal(true)}
          className="card bg-amber-50 border-amber-200 hover:shadow-lg hover:border-amber-300 transition-all cursor-pointer text-left"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-700 font-medium">Raw Materials Cost Log</p>
              <p className="text-2xl font-bold text-amber-900 mt-1">
                ₹{stats?.today_raw_materials.toLocaleString() || 0}
              </p>
              <p className="text-xs text-amber-600 mt-1">Purchase History</p>
            </div>
            <div className="w-12 h-12 bg-amber-200 rounded-lg flex items-center justify-center">
              <History className="w-6 h-6 text-amber-700" />
            </div>
          </div>
          <div className="mt-3 text-xs text-amber-600 font-medium">
            Click to view log →
          </div>
        </button>

        {/* Petty Cash - CLICKABLE */}
        <button
          onClick={() => setShowPettyCashModal(true)}
          className="card bg-purple-50 border-purple-200 hover:shadow-lg hover:border-purple-300 transition-all cursor-pointer text-left"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700 font-medium">Petty Cash</p>
              <p className="text-2xl font-bold text-purple-900 mt-1">
                ₹{stats?.today_petty_cash.toLocaleString() || 0}
              </p>
              <p className="text-xs text-purple-600 mt-1">Today's Cost</p>
            </div>
            <div className="w-12 h-12 bg-purple-200 rounded-lg flex items-center justify-center">
              <Wallet className="w-6 h-6 text-purple-700" />
            </div>
          </div>
          <div className="mt-3 text-xs text-purple-600 font-medium">
            Click to view details →
          </div>
        </button>

        {/* Total Costs Today - CLICKABLE */}
        <button
          onClick={() => setShowTotalCostsModal(true)}
          className="card bg-red-50 border-red-200 hover:shadow-lg hover:border-red-300 transition-all cursor-pointer text-left"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700 font-medium">Total Costs</p>
              <p className="text-2xl font-bold text-red-900 mt-1">
                ₹{stats?.total_costs_today.toLocaleString() || 0}
              </p>
              <p className="text-xs text-red-600 mt-1">Money OUT</p>
            </div>
            <div className="w-12 h-12 bg-red-200 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-700" />
            </div>
          </div>
          <div className="mt-3 text-xs text-red-600 font-medium">
            Click to view breakdown →
          </div>
        </button>
      </div>

      {/* Revenue & Profit Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Today's Sales - Revenue IN */}
        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium">Today's Sales</p>
              <p className="text-2xl font-bold text-green-900 mt-1">
                ₹{stats?.today_sales.toLocaleString() || 0}
              </p>
              <p className="text-xs text-green-600 mt-1">Revenue IN</p>
            </div>
            <div className="w-12 h-12 bg-green-200 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-700" />
            </div>
          </div>
        </div>

        {/* Net Today */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600">Net Today</p>
              <p className={`text-2xl font-bold mt-1 ${(stats?.today_sales || 0) - (stats?.total_costs_today || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{((stats?.today_sales || 0) - (stats?.total_costs_today || 0)).toLocaleString()}
              </p>
              <p className="text-xs text-secondary-600 mt-1">Profit/Loss</p>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${(stats?.today_sales || 0) - (stats?.total_costs_today || 0) >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <DollarSign className={`w-6 h-6 ${(stats?.today_sales || 0) - (stats?.total_costs_today || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales vs Expenses Overview Chart */}
        <SalesVsExpensesBarChart 
          data={salesVsExpensesData}
          loading={chartsLoading}
        />

        {/* Payment Methods Pie Chart */}
        <PaymentMethodsPieChart 
          data={paymentBreakdown}
          loading={chartsLoading}
          onSegmentClick={(paymentMethod) => {
            setSelectedPaymentMethod(paymentMethod);
            setShowPaymentMethodModal(true);
          }}
        />
      </div>

      {/* Daily Trend Chart - Full Width */}
      <div className="w-full">
        <DailySalesExpensesComboChart 
          data={salesVsExpensesData}
          loading={chartsLoading}
        />
      </div>

      {/* Modals */}
      <RawMaterialsStockModal 
        isOpen={showRawMaterialsStockModal}
        onClose={() => setShowRawMaterialsStockModal(false)}
      />
      <RawMaterialsDetailsModal 
        isOpen={showRawMaterialsModal}
        onClose={() => setShowRawMaterialsModal(false)}
        startDate={dateFilter.startDate}
        endDate={dateFilter.endDate}
        filterLabel={dateFilter.label}
      />
      <PettyCashDetailsModal 
        isOpen={showPettyCashModal}
        onClose={() => setShowPettyCashModal(false)}
        startDate={dateFilter.startDate}
        endDate={dateFilter.endDate}
        filterLabel={dateFilter.label}
      />
      <TotalCostsDetailsModal 
        isOpen={showTotalCostsModal}
        onClose={() => setShowTotalCostsModal(false)}
        startDate={dateFilter.startDate}
        endDate={dateFilter.endDate}
        filterLabel={dateFilter.label}
      />
      <PaymentMethodDetailsModal 
        isOpen={showPaymentMethodModal}
        onClose={() => setShowPaymentMethodModal(false)}
        paymentMethod={selectedPaymentMethod}
        startDate={dateFilter.startDate}
        endDate={dateFilter.endDate}
        filterLabel={dateFilter.label}
      />
    </div>
  );
}
