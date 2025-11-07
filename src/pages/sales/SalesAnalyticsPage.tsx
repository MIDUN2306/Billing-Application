import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useStoreStore } from '../../stores/storeStore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Receipt, RotateCw, ArrowRight } from 'lucide-react';
import { SalesVsExpensesBarChart } from '../../components/charts/SalesVsExpensesBarChart';
import { PaymentMethodsPieChart } from '../../components/charts/PaymentMethodsPieChart';
import { DailySalesExpensesComboChart } from '../../components/charts/DailySalesExpensesComboChart';
import { PaymentMethodDetailsModal } from '../dashboard/PaymentMethodDetailsModal';
import { EnhancedDateFilter } from '../../components/EnhancedDateFilter';
import { 
  EnhancedDateFilter as EnhancedDateFilterType,
  getDefaultEnhancedFilter 
} from '../../utils/enhancedDateFilters';

interface DailyData {
  date: string;
  sales: number;
  expenses: number;
  profit_loss: number;
}

interface PaymentData {
  payment_method: string;
  total_amount: number;
  transaction_count: number;
}

export function SalesAnalyticsPage() {
  const { currentStore } = useStoreStore();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateFilter, setDateFilter] = useState<EnhancedDateFilterType>(getDefaultEnhancedFilter());
  
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [paymentData, setPaymentData] = useState<PaymentData[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);

  const loadAnalyticsData = useCallback(async (isRefresh = false) => {
    if (!currentStore) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const startDate = dateFilter.startDate;
      const endDate = dateFilter.endDate;

      // Load daily sales data
      const salesQuery = supabase
        .from('sales')
        .select('sale_date, total_amount')
        .eq('store_id', currentStore.id)
        .eq('status', 'completed')
        .gte('sale_date', startDate)
        .lte('sale_date', endDate + 'T23:59:59')
        .order('sale_date');

      // Load daily expenses (petty cash + raw materials)
      const pettyCashQuery = supabase
        .from('petty_cash')
        .select('given_date, amount')
        .eq('store_id', currentStore.id)
        .gte('given_date', startDate)
        .lte('given_date', endDate);

      const rawMaterialsQuery = supabase
        .from('raw_material_purchases')
        .select('purchase_date, total_cost')
        .eq('store_id', currentStore.id)
        .gte('purchase_date', startDate)
        .lte('purchase_date', endDate);

      // Load payment methods summary
      const paymentQuery = supabase
        .from('sales')
        .select('payment_method, total_amount')
        .eq('store_id', currentStore.id)
        .eq('status', 'completed')
        .gte('sale_date', startDate)
        .lte('sale_date', endDate + 'T23:59:59');

      const [salesRes, pettyCashRes, rawMaterialsRes, paymentRes] = await Promise.all([
        salesQuery,
        pettyCashQuery,
        rawMaterialsQuery,
        paymentQuery,
      ]);

      if (salesRes.error) throw salesRes.error;
      if (pettyCashRes.error) throw pettyCashRes.error;
      if (rawMaterialsRes.error) throw rawMaterialsRes.error;
      if (paymentRes.error) throw paymentRes.error;

      // Process daily data
      const dailyMap = new Map<string, { sales: number; expenses: number }>();
      
      // Aggregate sales by date
      salesRes.data?.forEach(sale => {
        const date = sale.sale_date.split('T')[0];
        const current = dailyMap.get(date) || { sales: 0, expenses: 0 };
        current.sales += Number(sale.total_amount);
        dailyMap.set(date, current);
      });

      // Aggregate petty cash by date
      pettyCashRes.data?.forEach(pc => {
        const date = pc.given_date;
        const current = dailyMap.get(date) || { sales: 0, expenses: 0 };
        current.expenses += Number(pc.amount);
        dailyMap.set(date, current);
      });

      // Aggregate raw materials by date
      rawMaterialsRes.data?.forEach(rm => {
        const date = new Date(rm.purchase_date).toISOString().split('T')[0];
        const current = dailyMap.get(date) || { sales: 0, expenses: 0 };
        current.expenses += Number(rm.total_cost);
        dailyMap.set(date, current);
      });

      // Convert to array and calculate profit/loss
      const dailyArray: DailyData[] = Array.from(dailyMap.entries())
        .map(([date, data]) => ({
          date,
          sales: data.sales,
          expenses: data.expenses,
          profit_loss: data.sales - data.expenses,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setDailyData(dailyArray);

      // Process payment methods data
      const paymentMap = new Map<string, { total: number; count: number }>();
      
      paymentRes.data?.forEach(sale => {
        const method = sale.payment_method || 'cash';
        const current = paymentMap.get(method) || { total: 0, count: 0 };
        current.total += Number(sale.total_amount);
        current.count += 1;
        paymentMap.set(method, current);
      });

      const paymentArray: PaymentData[] = Array.from(paymentMap.entries())
        .map(([method, data]) => ({
          payment_method: method,
          total_amount: data.total,
          transaction_count: data.count,
        }))
        .sort((a, b) => b.total_amount - a.total_amount);

      setPaymentData(paymentArray);

      if (isRefresh) {
        toast.success('Analytics refreshed');
      }
    } catch (error: any) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentStore, dateFilter]);

  useEffect(() => {
    if (currentStore) {
      loadAnalyticsData();
    }
  }, [currentStore, dateFilter, loadAnalyticsData]);

  const handleRefresh = () => {
    loadAnalyticsData(true);
  };

  const handlePaymentMethodClick = (paymentMethod: string) => {
    setSelectedPaymentMethod(paymentMethod);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-secondary-900">Sales Analytics</h1>
          <p className="text-sm text-secondary-600 mt-1">Comprehensive sales and profit analysis</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn-secondary flex items-center justify-center gap-2"
          title="Refresh analytics"
        >
          <RotateCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Date Filter */}
      <div className="card">
        <EnhancedDateFilter
          currentFilter={dateFilter}
          onFilterChange={setDateFilter}
        />
      </div>

      {/* Sales History Card */}
      <button
        onClick={() => navigate('/sales/history')}
        className="group relative bg-white rounded-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 text-left p-6 overflow-hidden border-4 border-primary-200 hover:border-primary-700 active:scale-95 w-full"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-md">
              <Receipt className="w-7 h-7 text-primary-700" />
            </div>
            <ArrowRight className="w-6 h-6 text-secondary-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300" />
          </div>
          <h3 className="text-lg font-semibold text-secondary-900 mb-2 group-hover:text-primary-700 transition-colors duration-300">
            Sales History
          </h3>
          <p className="text-sm text-secondary-600">
            View detailed sales records, invoices, and transaction history
          </p>
        </div>
      </button>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-800"></div>
        </div>
      ) : (
        <>
          {/* Graph 1: Profit & Loss Overview (Sales vs Expenses) */}
          <SalesVsExpensesBarChart data={dailyData} loading={false} />

          {/* Graph 2: Payment Methods Distribution */}
          <PaymentMethodsPieChart 
            data={paymentData} 
            loading={false}
            onSegmentClick={handlePaymentMethodClick}
          />

          {/* Graph 3: Daily Profit & Loss Trend */}
          <DailySalesExpensesComboChart data={dailyData} loading={false} />
        </>
      )}

      {/* Payment Method Details Modal */}
      {selectedPaymentMethod && (
        <PaymentMethodDetailsModal
          isOpen={true}
          paymentMethod={selectedPaymentMethod}
          startDate={dateFilter.startDate}
          endDate={dateFilter.endDate}
          filterLabel={dateFilter.label}
          onClose={() => setSelectedPaymentMethod(null)}
        />
      )}
    </div>
  );
}
