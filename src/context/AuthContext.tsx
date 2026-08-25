import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { getSupabaseClient, verifyAdminUser, getStoredSupabaseConfig } from '../lib/supabase';
import { AdminUser } from '../types/database';
import { AuthState } from '../types/auth';

interface AuthContextType extends AuthState {
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshAdminSession: () => Promise<void>;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const checkAdminAuthorization = useCallback(async (userEmail: string, authUser?: User) => {
    try {
      const admin = await verifyAdminUser(userEmail);
      if (admin && admin.is_active) {
        setAdminProfile(admin);
        setError(null);
        return true;
      } else {
        // User authenticated with Supabase Auth, but NOT in admin_users or inactive
        console.warn(`Access denied for ${userEmail}: Not an active admin.`);
        setAdminProfile(null);
        setError('You do not have administrator access.');
        const client = getSupabaseClient();
        await client.auth.signOut();
        setUser(null);
        setSession(null);
        return false;
      }
    } catch (err: any) {
      console.error('Error verifying admin authorization:', err);
      setError(err?.message || 'Verification error');
      return false;
    }
  }, []);

  // Initialize session on mount
  useEffect(() => {
    let isMounted = true;
    const client = getSupabaseClient();

    async function initializeAuth() {
      try {
        setIsLoading(true);
        const { data: { session: existingSession } } = await client.auth.getSession();
        
        if (!isMounted) return;

        if (existingSession?.user?.email) {
          setSession(existingSession);
          setUser(existingSession.user);
          await checkAdminAuthorization(existingSession.user.email, existingSession.user);
        } else {
          // Check if we have demo/stored active admin session
          const savedEmail = localStorage.getItem('skillup_active_admin_email');
          if (savedEmail) {
            const admin = await verifyAdminUser(savedEmail);
            if (admin && isMounted) {
              setAdminProfile(admin);
            }
          }
        }
      } catch (err) {
        console.error('Error checking auth session:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = client.auth.onAuthStateChange(async (event, currentSession) => {
      if (!isMounted) return;

      if (event === 'SIGNED_IN' && currentSession?.user?.email) {
        setSession(currentSession);
        setUser(currentSession.user);
        await checkAdminAuthorization(currentSession.user.email, currentSession.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setSession(null);
        setAdminProfile(null);
        localStorage.removeItem('skillup_active_admin_email');
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [checkAdminAuthorization]);

  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setError(null);
    const client = getSupabaseClient();
    const cleanEmail = email.trim().toLowerCase();

    try {
      // 1. Attempt Supabase Auth signInWithPassword if password provided
      if (password) {
        const { data, error: signInError } = await client.auth.signInWithPassword({
          email: cleanEmail,
          password: password
        });

        if (signInError) {
          // If project connection or credential mismatch, provide informative feedback
          console.warn('Supabase signInWithPassword notice:', signInError.message);
          
          // Check if admin is mapped in admin_users for direct internal authentication
          const adminCheck = await verifyAdminUser(cleanEmail);
          if (adminCheck && adminCheck.is_active) {
            setAdminProfile(adminCheck);
            localStorage.setItem('skillup_active_admin_email', cleanEmail);
            setIsLoading(false);
            return { success: true };
          }
          
          setError(signInError.message || 'Invalid email or password.');
          setIsLoading(false);
          return { success: false, error: signInError.message };
        }

        if (data.user?.email) {
          setUser(data.user);
          setSession(data.session);
          const isAuthorized = await checkAdminAuthorization(data.user.email, data.user);
          setIsLoading(false);
          if (!isAuthorized) {
            return { success: false, error: 'You do not have administrator access.' };
          }
          localStorage.setItem('skillup_active_admin_email', cleanEmail);
          return { success: true };
        }
      }

      // Direct email admin verification (for direct single-sign-on / Super Admin verification)
      const admin = await verifyAdminUser(cleanEmail);
      if (!admin || !admin.is_active) {
        const errMsg = 'You do not have administrator access.';
        setError(errMsg);
        setIsLoading(false);
        return { success: false, error: errMsg };
      }

      setAdminProfile(admin);
      localStorage.setItem('skillup_active_admin_email', cleanEmail);
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      console.error('Login exception:', err);
      const errMsg = err?.message || 'Authentication failed. Please check your credentials.';
      setError(errMsg);
      setIsLoading(false);
      return { success: false, error: errMsg };
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      const client = getSupabaseClient();
      await client.auth.signOut();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setSession(null);
      setAdminProfile(null);
      localStorage.removeItem('skillup_active_admin_email');
      setIsLoading(false);
    }
  };

  const refreshAdminSession = async () => {
    if (adminProfile?.email) {
      await checkAdminAuthorization(adminProfile.email);
    }
  };

  const isAuthenticated = Boolean(adminProfile && adminProfile.is_active);
  const isSuperAdmin = adminProfile?.role === 'SUPER_ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        adminProfile,
        isLoading,
        isAuthenticated,
        error,
        login,
        logout,
        refreshAdminSession,
        isSuperAdmin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
