import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';
import type { 
  AvailableStockItem, 
  ExpirationSummary, 
  ExpirationDetail 
} from '../types/database.types';

interface ExpirationStore {
  // State
  availableItems: AvailableStockItem[];
  expirationHistory: ExpirationSummary[];
  selectedItemDetails: ExpirationDetail[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchAvailableItems: () => Promise<void>;
  fetchExpirationHistory: () => Promise<void>;
  fetchExpirationDetails: (itemName: string) => Promise<void>;
  expireStock: (params: {
    itemType: 'raw_material' | 'tea_stock' | 'product';
    itemId: string | null;
    itemName: string;
    sku: string | null;
    quantity: number;
    unit: string;
    notes: string | null;
  }) => Promise<{ success: boolean; message: string }>;
  clearError: () => void;
}

export const useExpirationStore = create<ExpirationStore>((set, get) => ({
  // Initial state
  availableItems: [],
  expirationHistory: [],
  selectedItemDetails: [],
  loading: false,
  error: null,

  // Fetch all available items (raw materials, tea stock, products)
  fetchAvailableItems: async () => {
    try {
      set({ loading: true, error: null });
      const storeId = useAuthStore.getState().profile?.store_id;
      
      if (!storeId) {
        throw new Error('Store ID not found');
      }

      const items: AvailableStockItem[] = [];

      // Fetch raw materials with stock
      const { data: rawMaterials, error: rmError } = await supabase
        .from('raw_material_stock')
        .select(`
          raw_material_id,
          quantity,
          unit,
          raw_materials!inner (
            id,
            name,
            sku,
            product_type
          )
        `)
        .eq('store_id', storeId)
        .eq('is_active', true)
        .gt('quantity', 0);

      if (rmError) throw rmError;

      if (rawMaterials) {
        rawMaterials.forEach((rm: any) => {
          items.push({
            id: rm.raw_materials.id,
            name: rm.raw_materials.name,
            type: 'raw_material',
            sku: rm.raw_materials.sku,
            current_stock: rm.quantity,
            unit: rm.unit,
          });
        });
      }

      // Fetch tea stock
      const { data: teaStock, error: tsError } = await supabase
        .from('tea_stock')
        .select('total_liters')
        .eq('store_id', storeId)
        .single();

      if (tsError && tsError.code !== 'PGRST116') throw tsError;

      if (teaStock && teaStock.total_liters > 0) {
        items.push({
          id: 'tea_stock',
          name: 'Tea Stock (Prepared)',
          type: 'tea_stock',
          sku: null,
          current_stock: teaStock.total_liters,
          unit: 'liters',
        });
      }

      // Fetch products with stock
      const { data: products, error: pError } = await supabase
        .from('products')
        .select('id, name, sku, quantity, unit')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .gt('quantity', 0);

      if (pError) throw pError;

      if (products) {
        products.forEach((p: any) => {
          items.push({
            id: p.id,
            name: p.name,
            type: 'product',
            sku: p.sku,
            current_stock: p.quantity,
            unit: p.unit,
          });
        });
      }

      set({ availableItems: items, loading: false });
    } catch (error: any) {
      console.error('Error fetching available items:', error);
      set({ error: error.message, availableItems: [], loading: false });
    }
  },

  // Fetch expiration history (consolidated)
  fetchExpirationHistory: async () => {
    try {
      set({ loading: true, error: null });
      const storeId = useAuthStore.getState().profile?.store_id;
      
      if (!storeId) {
        throw new Error('Store ID not found');
      }

      const { data, error } = await supabase
        .from('expiration_summary')
        .select('*')
        .eq('store_id', storeId)
        .order('last_updated', { ascending: false });

      if (error) throw error;

      set({ expirationHistory: data || [], loading: false });
    } catch (error: any) {
      console.error('Error fetching expiration history:', error);
      set({ error: error.message, expirationHistory: [], loading: false });
    }
  },

  // Fetch detailed expiration records for a specific item
  fetchExpirationDetails: async (itemName: string) => {
    try {
      set({ loading: true, error: null });
      const storeId = useAuthStore.getState().profile?.store_id;
      
      if (!storeId) {
        throw new Error('Store ID not found');
      }

      const { data, error } = await supabase
        .rpc('get_expiration_details', {
          p_store_id: storeId,
          p_item_name: itemName,
        });

      if (error) throw error;

      set({ selectedItemDetails: data || [], loading: false });
    } catch (error: any) {
      console.error('Error fetching expiration details:', error);
      set({ error: error.message, selectedItemDetails: [], loading: false });
    }
  },

  // Expire stock
  expireStock: async (params) => {
    try {
      set({ loading: true, error: null });
      const profile = useAuthStore.getState().profile;
      
      if (!profile?.store_id) {
        throw new Error('Store ID not found');
      }

      const { data, error } = await supabase.rpc('expire_stock', {
        p_store_id: profile.store_id,
        p_item_type: params.itemType,
        p_item_id: params.itemId,
        p_item_name: params.itemName,
        p_sku: params.sku,
        p_quantity: params.quantity,
        p_unit: params.unit,
        p_notes: params.notes,
        p_expired_by: profile.id,
      });

      if (error) throw error;

      // Refresh data
      await get().fetchAvailableItems();
      await get().fetchExpirationHistory();

      set({ loading: false });
      return { success: true, message: data.message || 'Stock expired successfully' };
    } catch (error: any) {
      console.error('Error expiring stock:', error);
      set({ error: error.message, loading: false });
      return { success: false, message: error.message };
    }
  },

  clearError: () => set({ error: null }),
}));
