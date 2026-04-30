import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface User {
  id: string;
  name: string;
  role: string;
  avatar: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, metadata: any) => Promise<{ error: any }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<{ error: any }>;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and subscribe to auth changes
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        mapSupabaseUserToUser(session.user);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        mapSupabaseUserToUser(session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const mapSupabaseUserToUser = async (sbUser: SupabaseUser) => {
    try {
      // Try to get profile from profiles table
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sbUser.id)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" for .single()
         console.warn('Error fetching profile:', error);
      }

      setUser({
        id: sbUser.id,
        name: profile?.full_name || sbUser.user_metadata?.full_name || 'Usuário Supabase',
        role: profile?.role || 'operator',
        email: sbUser.email || '',
        avatar: profile?.avatar_url || sbUser.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop'
      });
    } catch (err) {
      console.error('Failed to map user profile:', err);
      // Fallback to basic user info
      setUser({
        id: sbUser.id,
        name: sbUser.user_metadata?.full_name || 'Usuário Supabase',
        role: 'operator',
        email: sbUser.email || '',
        avatar: sbUser.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop'
      });
    }
  };

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, metadata: any) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });
    return { error };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return { error: 'Not logged in' };

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: updates.name,
          avatar_url: updates.avatar,
          role: updates.role,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Update local state
      setUser(prev => prev ? { ...prev, ...updates } : null);
      
      return { error: null };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { error };
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, signUp, logout, updateProfile, isAuthenticated: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
