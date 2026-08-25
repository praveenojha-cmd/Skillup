export type EmploymentStatus = 'ACTIVE' | 'INACTIVE';
export type SkillUpAccess = 'ENABLED' | 'DISABLED';

export type AdminRole = 'SUPER_ADMIN' | 'LND_ADMIN' | 'CONTENT_ADMIN' | 'REPORTING_ADMIN';

export interface Location {
  id: string | number;
  name: string;
  code?: string;
  city?: string;
  state?: string;
  created_at?: string;
}

export interface Role {
  id: string | number;
  name: string;
  department?: string;
  level?: string;
  created_at?: string;
}

export interface Employee {
  id?: string | number;
  employee_id: string;
  full_name: string;
  email: string;
  mobile_number?: string | null;
  role_id?: string | number | null;
  location_id?: string | number | null;
  internal_manager_id?: string | null;
  employment_status: EmploymentStatus;
  skillup_access: SkillUpAccess;
  created_at?: string;
  updated_at?: string;
  reporting_manager_employee_id?: string | null;
  reporting_manager_name?: string | null;
  
  // Joined or resolved fields for UI display
  role_name?: string;
  location_name?: string;
  roles?: { name: string } | null;
  locations?: { name: string; city?: string } | null;
}

export interface AdminUser {
  id?: string | number;
  auth_user_id?: string;
  email: string;
  name: string;
  role: AdminRole;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Course {
  id: string | number;
  title: string;
  code?: string;
  description?: string;
  category?: string;
  estimated_duration_minutes?: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  modules_count?: number;
  lessons_count?: number;
}

export interface CourseAssignment {
  id: string | number;
  course_id: string | number;
  employee_id: string;
  assigned_by?: string;
  assigned_at?: string;
  due_date?: string | null;
  status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
  progress_percentage?: number;
  completed_at?: string | null;
  course?: Course;
  employee?: Employee;
}

export interface AuditLog {
  id: string | number;
  action: string;
  entity_type: string;
  entity_id: string;
  performed_by_email?: string;
  performed_by_name?: string;
  details?: Record<string, any> | string;
  created_at?: string;
}

export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  skillUpEnabled: number;
  skillUpDisabled: number;
  totalCourses: number;
  activeCourses: number;
  assignedCourses: number;
  completedCourses: number;
  completionRate: number;
}

export interface EmployeeFilters {
  search: string;
  location: string;
  role: string;
  employmentStatus: 'ALL' | EmploymentStatus;
  skillUpAccess: 'ALL' | SkillUpAccess;
  page: number;
  pageSize: number;
}
