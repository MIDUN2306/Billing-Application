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
          supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
              const profile = await getUserProfile(session.user.id);
              set({ 
                user: session.user, 
                profile,
                lastProfileFetch: Date.now()
              });
            } else {
              set({ 
                user: null, 
                profile: null,
                lastProfileFetch: null
              });
            }
          });

          // Handle page visibility changes - refresh session when tab becomes visible
          if (typeof document !== 'undefined') {
            document.addEventListener('visibilitychange', async () => {
              if (!document.hidden) {
                // Tab became visible - check session validity
                const { data: { session } } = await supabase.auth.getSession();
                
                if (session?.user) {
                  // Session exists, refresh profile if needed
                  const { lastProfileFetch } = get();
                  const now = Date.now();
                  const shouldRefresh = !lastProfileFetch || (now - lastProfileFetch) > PROFILE_CACHE_DURATION;
                  
                  if (shouldRefresh) {
                    const freshProfile = await getUserProfile(session.user.id);
                    set({ 
                      user: session.user,
                      profile: freshProfile,
                      lastProfileFetch: now
                    });
                  }
                } else {
                  // No session - user might have been logged out
                  set({ 
                    user: null, 
                    profile: null,
                    lastProfileFetch: null
                  });
                }
              }
            });
          }
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
