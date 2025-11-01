import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { getCurrentUser, getUserProfile, type Profile } from '../lib/auth';
import type { User } from '@supabase/supabase-js';

interface AuthStore {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  initialized: boolean;
  
  // Actions
  initialize: () => Promise<void>;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  initialized: false,

  initialize: async () => {
    try {
      set({ loading: true });
      
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const profile = await getUserProfile(session.user.id);
        set({ 
          user: session.user, 
          profile,
          loading: false,
          initialized: true 
        });
      } else {
        set({ 
          user: null, 
          profile: null, 
          loading: false,
          initialized: true 
        });
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          const profile = await getUserProfile(session.user.id);
          set({ user: session.user, profile });
        } else {
          set({ user: null, profile: null });
        }
      });
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ 
        user: null, 
        profile: null, 
        loading: false,
        initialized: true 
      });
    }
  },

  setUser: (user) => set({ user }),
  
  setProfile: (profile) => set({ profile }),

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null });
  },

  refreshProfile: async () => {
    const { user } = get();
    if (user) {
      const profile = await getUserProfile(user.id);
      set({ profile });
    }
  },
}));
