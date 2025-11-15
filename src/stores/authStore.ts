import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { getUserProfile, type Profile } from '../lib/auth';
import type { User } from '@supabase/supabase-js';

interface AuthStore {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  initialized: boolean;
  lastProfileFetch: number | null;
  
  // Actions
  initialize: () => Promise<void>;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  signOut: () => Promise<void>;
  refreshProfile: (force?: boolean) => Promise<void>;
}

// Cache profile for 5 minutes to reduce database queries
const PROFILE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      loading: true,
      initialized: false,
      lastProfileFetch: null,

      initialize: async () => {
        try {
          set({ loading: true });
          
          // Get current session
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user) {
            // Check if we have cached profile and it's still valid
            const { profile, lastProfileFetch } = get();
            const now = Date.now();
            const isCacheValid = profile && lastProfileFetch && (now - lastProfileFetch) < PROFILE_CACHE_DURATION;
            
            if (isCacheValid) {
              // Use cached profile
              set({ 
                user: session.user,
                loading: false,
                initialized: true 
              });
            } else {
              // Fetch fresh profile
              const freshProfile = await getUserProfile(session.user.id);
              set({ 
                user: session.user, 
                profile: freshProfile,
                lastProfileFetch: now,
                loading: false,
                initialized: true 
              });
            }
          } else {
            set({ 
              user: null, 
              profile: null,
              lastProfileFetch: null,
              loading: false,
              initialized: true 
            });
          }

          // Listen for auth changes
          // Supabase automatically handles token refresh with autoRefreshToken: true
          // This listener updates our store when auth state changes
          supabase.auth.onAuthStateChange(async (_event, session) => {
            console.log('[AuthStore] Auth state changed:', _event);
            
            // Skip INITIAL_SESSION - it's just checking existing session
            if (_event === 'INITIAL_SESSION') {
              return;
            }
            
            // Only handle actual sign out
            if (_event === 'SIGNED_OUT') {
              set({ 
                user: null, 
                profile: null,
                lastProfileFetch: null
              });
              return;
            }
            
            // For SIGNED_IN, only fetch profile if we don't have one yet
            // This prevents unnecessary refetches during token refresh
            if (_event === 'SIGNED_IN' && session?.user) {
              const currentState = get();
              if (!currentState.profile) {
                const profile = await getUserProfile(session.user.id);
                set({ 
                  user: session.user, 
                  profile,
                  lastProfileFetch: Date.now()
                });
              } else {
                // Just update the user session, keep existing profile
                set({ user: session.user });
              }
            }
          });
        } catch (error) {
          console.error('Auth initialization error:', error);
          set({ 
            user: null, 
            profile: null,
            lastProfileFetch: null,
            loading: false,
            initialized: true 
          });
        }
      },

      setUser: (user) => set({ user }),
      
      setProfile: (profile) => set({ profile, lastProfileFetch: Date.now() }),

      signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null, profile: null, lastProfileFetch: null });
      },

      refreshProfile: async (force = false) => {
        const { user, lastProfileFetch } = get();
        if (!user) return;

        // Check cache validity unless force refresh
        if (!force && lastProfileFetch) {
          const now = Date.now();
          const isCacheValid = (now - lastProfileFetch) < PROFILE_CACHE_DURATION;
          if (isCacheValid) {
            // Cache is still valid, skip fetch
            return;
          }
        }

        // Fetch fresh profile
        const profile = await getUserProfile(user.id);
        set({ profile, lastProfileFetch: Date.now() });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        profile: state.profile,
        lastProfileFetch: state.lastProfileFetch
      }),
    }
  )
);
