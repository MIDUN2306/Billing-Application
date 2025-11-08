import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { CreateStoreModal } from './CreateStoreModal';
import { EditStoreModal } from './EditStoreModal';
import { useStoreStore } from '../../stores/storeStore';

interface Store {
  id: string;
  name: string;
  owner_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  gst_number: string | null;
  is_active: boolean;
  created_at: string;
}

export function StoresTab() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const { refreshCurrentStore } = useStoreStore();

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStores(data || []);
    } catch (error: any) {
      toast.error('Failed to load stores');
      console.error('Error loading stores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (storeId: string) => {
    if (!confirm('Are you sure you want to deactivate this store?')) return;

    try {
      const { error } = await supabase
        .from('stores')
        .update({ is_active: false })
        .eq('id', storeId);

      if (error) throw error;
      toast.success('Store deactivated successfully');
      loadStores();
    } catch (error: any) {
      toast.error('Failed to deactivate store');
      console.error('Error deactivating store:', error);
    }
  };

  const filteredStores = stores.filter(store =>
    store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    store.owner_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    store.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-800"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search stores..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Create Button */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center justify-center gap-2 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Create Store</span>
        </button>
      </div>

      {/* Stores Grid - Responsive */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredStores.map((store) => (
          <div
            key={store.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-secondary-900 truncate">
                  {store.name}
                </h3>
                <span
                  className={`inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full ${
                    store.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {store.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex gap-1 ml-2">
                <button
                  onClick={() => setEditingStore(store)}
                  className="p-2 text-secondary-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Edit store"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                {store.is_active && (
                  <button
                    onClick={() => handleDelete(store.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Deactivate store"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2 text-sm">
              {store.owner_name && (
                <div>
                  <span className="text-secondary-500">Owner:</span>{' '}
                  <span className="text-secondary-900">{store.owner_name}</span>
                </div>
              )}
              {store.phone && (
                <div>
                  <span className="text-secondary-500">Phone:</span>{' '}
                  <span className="text-secondary-900">{store.phone}</span>
                </div>
              )}
              {store.email && (
                <div>
                  <span className="text-secondary-500">Email:</span>{' '}
                  <span className="text-secondary-900 truncate block">{store.email}</span>
                </div>
              )}
              {store.gst_number && (
                <div>
                  <span className="text-secondary-500">GST:</span>{' '}
                  <span className="text-secondary-900">{store.gst_number}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredStores.length === 0 && (
        <div className="text-center py-12">
          <p className="text-secondary-500">No stores found</p>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateStoreModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadStores();
            refreshCurrentStore(); // Refresh in case this affects the current store
          }}
        />
      )}

      {editingStore && (
        <EditStoreModal
          store={editingStore}
          onClose={() => setEditingStore(null)}
          onSuccess={() => {
            setEditingStore(null);
            loadStores();
            refreshCurrentStore(); // Refresh the header store name
          }}
        />
      )}
    </div>
  );
}
