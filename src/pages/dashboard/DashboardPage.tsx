import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useStoreStore } from '../../stores/storeStore';
import { TrendingUp, TrendingDown, Users, Package, AlertCircle, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

interface DashboardStats {
  today_sales: number;
  today_purchases: number;
  today_expenses: number;
  pending_payments: number;
  low_stock_count: number;
  total_customers: number;
  total_products: number;
}

export function DashboardPage() {
  const { currentStore } = useStoreStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentStore) {
      loadDashboardStats();
    }
  }, [currentStore]);

  const loadDashboardStats = async () => {
    if (!currentStore) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .rpc('get_dashboard_stats', { p_store_id: currentStore.id });

      if (error) throw error;
      setStats(data);
    } catch (error: any) {
      console.error('Error loading dashboard stats:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
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
      <div>
        <h1 className="text-2xl font-display font-bold text-secondary-900">Dashboard</h1>
        <p className="text-secondary-600 mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Today's Sales */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600">Today's Sales</p>
              <p className="text-2xl font-bold text-secondary-900 mt-1">
                ₹{stats?.today_sales.toLocaleString() || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Today's Purchases */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600">Today's Purchases</p>
              <p className="text-2xl font-bold text-secondary-900 mt-1">
                ₹{stats?.today_purchases.toLocaleString() || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Pending Payments */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600">Pending Payments</p>
              <p className="text-2xl font-bold text-secondary-900 mt-1">
                ₹{stats?.pending_payments.toLocaleString() || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Low Stock Items */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600">Low Stock Items</p>
              <p className="text-2xl font-bold text-secondary-900 mt-1">
                {stats?.low_stock_count || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-primary-800" />
            </div>
            <div>
              <p className="text-sm text-secondary-600">Total Customers</p>
              <p className="text-xl font-bold text-secondary-900">{stats?.total_customers || 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-accent-600" />
            </div>
            <div>
              <p className="text-sm text-secondary-600">Total Products</p>
              <p className="text-xl font-bold text-secondary-900">{stats?.total_products || 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
