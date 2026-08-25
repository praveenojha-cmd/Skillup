import { AdminUser, AdminRole } from './database';
import { User, Session } from '@supabase/supabase-js';

export interface AuthState {
  user: User | null;
  session: Session | null;
  adminProfile: AdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
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
  | '/admin/admins';
