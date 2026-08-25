import { AdminUser, Employee, AdminRole } from './database';
import { User, Session } from '@supabase/supabase-js';

export type UserPortalRole = 'ADMIN' | 'EMPLOYEE' | 'DUAL';

export interface AuthState {
  user: User | null;
  session: Session | null;
  adminProfile: AdminUser | null;
  employeeProfile: Employee | null;
  portalRole: UserPortalRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isEmployeeAuthenticated: boolean;
  error: string | null;
  accessDeniedReason: string | null;
}

export interface LoginCredentials {
  email: string;
  password?: string;
}

export type AppRoute = 
  | '/login'
  | '/admin/dashboard'
  | '/admin/employees'
  | '/admin/courses'
  | '/admin/assignments'
  | '/admin/reports'
  | '/admin/admins'
  | '/learn/dashboard'
  | '/learn/courses'
  | '/learn/history'
  | '/learn/profile';

