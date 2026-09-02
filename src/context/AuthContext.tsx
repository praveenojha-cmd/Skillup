import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { getSupabaseClient, verifyAdminUser, verifyEmployeeUser, getLastAdminAuthDiagnostic, AdminAuthDiagnostic } from '../lib/supabase';
import { AdminUser, Employee } from '../types/database';
import { AuthState, UserPortalRole } from '../types/auth';

interface AuthContextType extends AuthState {
  login: (email: string, password?: string, preferredPortal?: 'ADMIN' | 'EMPLOYEE') => Promise<{ success: boolean; error?: string; portal?: 'ADMIN' | 'EMPLOYEE' }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  refreshAdminSession: () => Promise<void>;
  isSuperAdmin: boolean;
  canManageEmployees: boolean;
  canManageAccess: boolean;
  activePortal: 'ADMIN' | 'EMPLOYEE';
  setActivePortal: (portal: 'ADMIN' | 'EMPLOYEE') => void;
  isEmployee: boolean;
  isAdmin: boolean;
  /**
   * True when the current Supabase session originated from a password
   * recovery link (the `PASSWORD_RECOVERY` auth event), rather than a
   * normal sign-in. While true, the app must route to the password-update
   * screen instead of the normal authenticated dashboard — this session is
   * only valid for calling `auth.updateUser({ password })`, not for
   * granting regular portal access.
   */
  isPasswordRecovery: boolean;
  /**
   * TEMP DIAGNOSTIC — remove once the admin_users authorization issue is
   * resolved. The outcome of the most recent verifyAdminUser() call,
   * captured here (React state, set inside checkUserAuthorization itself)
   * rather than read from a plain module variable at some later, racy
   * point — checkUserAuthorization can run from two independent places
   * (the direct call inside login(), and the onAuthStateChange('SIGNED_IN')
   * listener triggered by the same sign-in), so this must be captured at
   * the source, not reconstructed by a caller afterward.
   */
  adminAuthDiagnostic: AdminAuthDiagnostic | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminUser | null>(null);
  const [employeeProfile, setEmployeeProfile] = useState<Employee | null>(null);
  const [portalRole, setPortalRole] = useState<UserPortalRole | null>(null);
  const [activePortal, setActivePortalState] = useState<'ADMIN' | 'EMPLOYEE'>('ADMIN');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [accessDeniedReason, setAccessDeniedReason] = useState<string | null>(null);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState<boolean>(false);
  // TEMP DIAGNOSTIC — remove once the admin_users authorization issue is resolved.
  const [adminAuthDiagnostic, setAdminAuthDiagnostic] = useState<AdminAuthDiagnostic | null>(null);

  const setActivePortal = (portal: 'ADMIN' | 'EMPLOYEE') => {
    setActivePortalState(portal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('skillup_preferred_portal', portal);
    }
  };

  const checkUserAuthorization = useCallback(async (userEmail: string, authUser?: User, preferredPortal?: 'ADMIN' | 'EMPLOYEE') => {
    try {
      const authUserId = authUser?.id;

      // TEMP DIAGNOSTIC LOGGING — authorization runtime diagnosis, remove after use.
      const diagClient = getSupabaseClient();
      const { data: diagSessionData } = await diagClient.auth.getSession();
      console.log('[AUTH DIAG] checkUserAuthorization() called');
      console.log('[AUTH DIAG] getSession() returned a session:', Boolean(diagSessionData.session));
      console.log('[AUTH DIAG] session user UUID:', diagSessionData.session?.user?.id);
      console.log('[AUTH DIAG] authUser param UUID (passed in):', authUserId);
      console.log('[AUTH DIAG] userEmail param:', userEmail);

      // Concurrently verify Admin and Employee credentials
      const [adminRes, empRes] = await Promise.all([
        verifyAdminUser(userEmail, authUserId),
        verifyEmployeeUser(userEmail, authUserId)
      ]);

      // TEMP DIAGNOSTIC LOGGING
      console.log('[AUTH DIAG] verifyAdminUser() result:', adminRes ? { auth_user_id: adminRes.auth_user_id, role: adminRes.role, is_active: adminRes.is_active } : null);
      console.log('[AUTH DIAG] verifyEmployeeUser() accessStatus:', empRes.accessStatus, '| employee found:', Boolean(empRes.employee));

      // TEMP DIAGNOSTIC — capture into React state (not a module variable a
      // caller has to read at just the right moment) so LoginPage renders it
      // reliably regardless of which invocation of checkUserAuthorization
      // (the direct call from login(), or the onAuthStateChange listener
      // triggered by the same sign-in) actually produced this result.
      setAdminAuthDiagnostic(getLastAdminAuthDiagnostic());

      const isAdminActive = Boolean(adminRes && adminRes.is_active);
      const isEmpAllowed = empRes.accessStatus === 'ALLOWED' && Boolean(empRes.employee);

      // TEMP DIAGNOSTIC LOGGING
      console.log('[AUTH DIAG] isAdminActive:', isAdminActive, '| isEmpAllowed:', isEmpAllowed);

      if (adminRes && adminRes.is_active) {
        setAdminProfile(adminRes);
      } else {
        setAdminProfile(null);
      }

      if (empRes.employee) {
        setEmployeeProfile(empRes.employee);
      } else {
        setEmployeeProfile(null);
      }

      if (empRes.accessStatus === 'DISABLED') {
        setAccessDeniedReason('Your SkillUp learning access is currently disabled. Please contact your administrator.');
      } else if (empRes.accessStatus === 'INACTIVE') {
        setAccessDeniedReason('Your employee profile is currently marked as INACTIVE. Learning portal access is unavailable.');
      } else {
        setAccessDeniedReason(null);
      }

      if (isAdminActive && isEmpAllowed) {
        // TEMP DIAGNOSTIC LOGGING
        console.log('[AUTH DIAG] branch: DUAL (isAdminActive && isEmpAllowed)');
        setPortalRole('DUAL');
        const storedPref = typeof window !== 'undefined' ? localStorage.getItem('skillup_preferred_portal') : null;
        const initialPortal = preferredPortal || (storedPref as 'ADMIN' | 'EMPLOYEE') || 'ADMIN';
        setActivePortalState(initialPortal);
        setError(null);
        return { success: true, portal: initialPortal };
      } else if (isAdminActive) {
        // TEMP DIAGNOSTIC LOGGING
        console.log('[AUTH DIAG] branch: ADMIN (isAdminActive only)');
        setPortalRole('ADMIN');
        setActivePortalState('ADMIN');
        setError(null);
        return { success: true, portal: 'ADMIN' as const };
      } else if (isEmpAllowed) {
        // TEMP DIAGNOSTIC LOGGING
        console.log('[AUTH DIAG] branch: EMPLOYEE (isEmpAllowed only)');
        setPortalRole('EMPLOYEE');
        setActivePortalState('EMPLOYEE');
        setError(null);
        return { success: true, portal: 'EMPLOYEE' as const };
      } else {
        // Neither active admin nor active enabled employee
        let deniedMsg = 'Access Denied: You do not have active access to SkillUp.';
        if (empRes.accessStatus === 'DISABLED') {
          deniedMsg = 'Your SkillUp learning access is currently disabled. Please contact your administrator.';
        } else if (empRes.accessStatus === 'INACTIVE') {
          deniedMsg = 'Your employee profile is currently marked as INACTIVE. Learning portal access is unavailable.';
        }

        // TEMP DIAGNOSTIC LOGGING
        console.log('[AUTH DIAG] branch: DENIED (else) — isAdminActive:', isAdminActive, '| isEmpAllowed:', isEmpAllowed, '| empRes.accessStatus:', empRes.accessStatus, '| deniedMsg:', deniedMsg);

        setError(deniedMsg);
        const client = getSupabaseClient();
        await client.auth.signOut();
        setUser(null);
        setSession(null);
        setAdminProfile(null);
        setEmployeeProfile(null);
        setPortalRole(null);
        return { success: false, error: deniedMsg };
      }
    } catch (err: any) {
      console.error('Error verifying user authorization:', err);
      const errMsg = err?.message || 'Verification error';
      setError(errMsg);
      return { success: false, error: errMsg };
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
          await checkUserAuthorization(existingSession.user.email, existingSession.user);
        } else {
          setUser(null);
          setSession(null);
          setAdminProfile(null);
          setEmployeeProfile(null);
          setPortalRole(null);
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
        await checkUserAuthorization(currentSession.user.email, currentSession.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setSession(null);
        setAdminProfile(null);
        setEmployeeProfile(null);
        setPortalRole(null);
        setIsPasswordRecovery(false);
      } else if (event === 'PASSWORD_RECOVERY' && currentSession) {
        // A recovery-link session. Deliberately does NOT run
        // checkUserAuthorization — this session must only be used to call
        // auth.updateUser({ password }); it must never silently grant normal
        // admin/employee portal access before a new password is set.
        setSession(currentSession);
        setUser(currentSession.user);
        setIsPasswordRecovery(true);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [checkUserAuthorization]);

  const login = async (
    email: string, 
    password?: string,
    preferredPortal?: 'ADMIN' | 'EMPLOYEE'
  ): Promise<{ success: boolean; error?: string; portal?: 'ADMIN' | 'EMPLOYEE' }> => {
    setIsLoading(true);
    setError(null);
    setAccessDeniedReason(null);
    const client = getSupabaseClient();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      const errMsg = 'Email and password are required.';
      setError(errMsg);
      setIsLoading(false);
      return { success: false, error: errMsg };
    }

    try {
      // 1. Authenticate with Supabase Auth
      const { data, error: signInError } = await client.auth.signInWithPassword({
        email: cleanEmail,
        password: password
      });

      if (signInError) {
        console.warn('Supabase signInWithPassword failed:', signInError.message);
        setError(signInError.message || 'Invalid email or password.');
        setIsLoading(false);
        return { success: false, error: signInError.message };
      }

      if (data.user?.email) {
        setUser(data.user);
        setSession(data.session);
        const authResult = await checkUserAuthorization(data.user.email, data.user, preferredPortal);
        setIsLoading(false);
        if (!authResult.success) {
          return { success: false, error: authResult.error || 'Access denied.' };
        }
        return { success: true, portal: authResult.portal };
      }

      setError('Authentication failed. No user returned.');
      setIsLoading(false);
      return { success: false, error: 'Authentication failed.' };
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
      setEmployeeProfile(null);
      setPortalRole(null);
      setIsPasswordRecovery(false);
      setIsLoading(false);
    }
  };

  const refreshSession = async () => {
    if (user?.email) {
      await checkUserAuthorization(user.email, user);
    }
  };

  const refreshAdminSession = refreshSession;

  const isAdmin = Boolean(adminProfile && adminProfile.is_active);
  const isEmployee = Boolean(employeeProfile && employeeProfile.employment_status === 'ACTIVE' && employeeProfile.skillup_access === 'ENABLED');
  const isAuthenticated = isAdmin || isEmployee;
  const isEmployeeAuthenticated = isEmployee;
  const isSuperAdmin = adminProfile?.role === 'SUPER_ADMIN';
  const canManageEmployees = adminProfile?.role === 'SUPER_ADMIN' || adminProfile?.role === 'LND_ADMIN';
  const canManageAccess = adminProfile?.role === 'SUPER_ADMIN' || adminProfile?.role === 'LND_ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        adminProfile,
        employeeProfile,
        portalRole,
        activePortal,
        setActivePortal,
        isLoading,
        isAuthenticated,
        isEmployeeAuthenticated,
        isAdmin,
        isEmployee,
        error,
        accessDeniedReason,
        isPasswordRecovery,
        adminAuthDiagnostic,
        login,
        logout,
        refreshSession,
        refreshAdminSession,
        isSuperAdmin,
        canManageEmployees,
        canManageAccess
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

