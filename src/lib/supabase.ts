import { createClient } from '@supabase/supabase-js'

// Hardcoded Supabase configuration
const supabaseUrl = 'https://guynifjqydytpihazopl.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1eW5pZmpxeWR5dHBpaGF6b3BsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MTQxODIsImV4cCI6MjA3NzQ5MDE4Mn0.Euvdu-5pKuFhRmAn3f4uwRFE4lS9jcBbbeZWpBK-_IA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    // Refresh token before it expires (default is 10 seconds before expiry)
    storageKey: 'tea-boys-auth',
  },
  global: {
    headers: {
      'x-application-name': 'tea-boys-management',
    },
    // Add retry logic for failed requests
    fetch: (url, options = {}) => {
      return fetch(url, {
        ...options,
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})
