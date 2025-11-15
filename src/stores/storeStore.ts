import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

interface Store {
  id: string;
  name: string;
  owner_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  gst_number: string | null;
  logo_url: string | null;
  is_active: boolean;
}

interface StoreState {
  currentStore: Store | null;
  stores: Store[];
  loading: boolean;
  hydrated: boolean;
  
  // Actions
  setCurrentStore: (store: Store) => void;
  loadStores: () => Promise<void>;
  refreshCurrentStore: () => Promise<void>;
  setHydrated: (hydrated: boolean) => void;
}

export const useStoreStore = create<StoreState>()(
  persist(
    (set, get) => ({
      currentStore: null,
      stores: [],
      loading: false,
      hydrated: false,

      setCurrentStore: (store) => {
        set({ currentStore: store });
      },

      setHydrated: (hydrated) => {
        set({ hydrated });
      },

      loadStores: async () => {
        try {
          set({ loading: true });
          
          const { data, error } = await supabase
            .from('stores')
            .select('*')
            .eq('is_active', true)
            .order('name');

          if (error) throw error;

          set({ stores: data || [] });
          
          // Set first store as current if none selected
          if (!get().currentStore && data && data.length > 0) {
            set({ currentStore: data[0] });
          }
        } catch (error) {
          console.error('Error loading stores:', error);
        } finally {
          set({ loading: false });
        }
      },

      refreshCurrentStore: async () => {
        const { currentStore } = get();
        if (!currentStore) return;

        try {
          const { data, error } = await supabase
            .from('stores')
            .select('*')
            .eq('id', currentStore.id)
            .single();

          if (error) throw error;
          if (data) {
            set({ currentStore: data });
          }
        } catch (error) {
          console.error('Error refreshing store:', error);
        }
      },
    }),
    {
      name: 'store-storage',
      partialize: (state) => ({ currentStore: state.currentStore }),
      onRehydrateStorage: () => (state) => {
        // Called when rehydration is complete
        if (state) {
          state.setHydrated(true);
          console.log('[StoreStore] Rehydration complete, currentStore:', state.currentStore?.id);
        }
      },
    }
  )
);
