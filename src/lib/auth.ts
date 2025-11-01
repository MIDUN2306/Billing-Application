import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  role: 'admin' | 'manager' | 'staff';
  store_id: string | null;
  is_active: boolean;
}

export interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
}

// Get current user
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

// Get user profile
export async function getUserProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data;
}

// Sign in with email and password
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
}

// Sign out
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// Sign up new user
export async function signUp(email: string, password: string, fullName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });
  
  if (error) throw error;
  return data;
}

// Check if user has permission
export function hasPermission(profile: Profile | null, requiredRole: 'admin' | 'manager' | 'staff'): boolean {
  if (!profile || !profile.is_active) return false;
  
  const roleHierarchy = { admin: 3, manager: 2, staff: 1 };
  return roleHierarchy[profile.role] >= roleHierarchy[requiredRole];
}

// Check if user is admin
export function isAdmin(profile: Profile | null): boolean {
  return profile?.role === 'admin' && profile.is_active;
}

// Check if user is manager or above
export function isManager(profile: Profile | null): boolean {
  return hasPermission(profile, 'manager');
}
