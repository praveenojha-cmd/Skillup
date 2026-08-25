import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  Employee, 
  Location, 
  Role, 
  AdminUser, 
  DashboardStats, 
  EmployeeFilters, 
  LocationDistribution, 
  RoleDistribution,
  EmployeeLearningActivity,
  CreateEmployeeInput,
  UpdateEmployeeInput,
  BulkImportRow,
  BulkImportSummary,
  AuditLogPayload,
  Course,
  Module,
  Lesson,
  LessonType,
  Quiz,
  QuizQuestion,
  QuizOption,
  CourseFilters,
  CreateCourseInput,
  UpdateCourseInput,
  CourseAssignment,
  AssignmentFilters,
  AssignmentStats,
  CreateIndividualAssignmentInput,
  CreateBulkAssignmentInput,
  BulkAudienceFilters,
  BulkAssignmentPreviewResult,
  LessonProgress,
  QuizAttempt,
  CourseCompletion,
  LearnerDashboardStats,
  LearnerQuiz,
  LearnerQuizQuestion,
  LearnerQuizOption,
  QuizSubmissionPayload,
  QuizSubmissionResult,
  LearnerCourseDetails
} from '../types/database';

// Safe client-side storage keys
const STORAGE_URL_KEY = 'skillup_supabase_url';
const STORAGE_KEY_KEY = 'skillup_supabase_anon_key';

// Default / fallback credentials from environment
const ENV_URL = (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) || 
                (typeof window !== 'undefined' && (window as any).__ENV__?.VITE_SUPABASE_URL) || 
                '';
const ENV_KEY = (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) || 
                (typeof window !== 'undefined' && (window as any).__ENV__?.VITE_SUPABASE_ANON_KEY) || 
                '';

export function getStoredSupabaseConfig(): { url: string; anonKey: string } {
  if (typeof window === 'undefined') {
    return { url: ENV_URL, anonKey: ENV_KEY };
  }
  const url = localStorage.getItem(STORAGE_URL_KEY) || ENV_URL;
  const anonKey = localStorage.getItem(STORAGE_KEY_KEY) || ENV_KEY;
  return { url, anonKey };
}

export function saveStoredSupabaseConfig(url: string, anonKey: string): void {
  if (typeof window !== 'undefined') {
    if (url) localStorage.setItem(STORAGE_URL_KEY, url.trim());
    if (anonKey) localStorage.setItem(STORAGE_KEY_KEY, anonKey.trim());
  }
}

let supabaseInstance: SupabaseClient | null = null;
let currentConfig = getStoredSupabaseConfig();

export function getSupabaseClient(): SupabaseClient {
  const config = getStoredSupabaseConfig();
  
  if (!supabaseInstance || config.url !== currentConfig.url || config.anonKey !== currentConfig.anonKey) {
    currentConfig = config;
    if (config.url && config.anonKey) {
      supabaseInstance = createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: 'skillup_auth_token'
        }
      });
    } else {
      supabaseInstance = createClient('https://placeholder.supabase.co', 'placeholder-anon-key', {
        auth: { persistSession: true }
      });
    }
  }
  
  return supabaseInstance;
}

export const supabase = getSupabaseClient();

/**
 * Checks if the Supabase client is configured and can reach the backend
 */
export async function testSupabaseConnection(): Promise<{ ok: boolean; message: string; details?: any }> {
  try {
    const client = getSupabaseClient();
    const config = getStoredSupabaseConfig();
    
    if (!config.url || !config.anonKey || config.url.includes('placeholder')) {
      return {
        ok: false,
        message: 'Supabase URL or Anon Key is not configured yet.'
      };
    }
    
    // Test query against public.employees
    const { count, error } = await client
      .from('employees')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      // RLS policy active check
      if (error.code === 'PGRST301' || error.message.includes('permission denied') || error.message.includes('JWT')) {
        return {
          ok: true,
          message: 'Connected to Supabase. Row Level Security active.',
          details: { rlsActive: true }
        };
      }
      return {
        ok: false,
        message: `Supabase error: ${error.message} (Code: ${error.code})`
      };
    }
    
    return {
      ok: true,
      message: `Successfully connected. Verified ${count ?? 0} employees in PostgreSQL.`,
      details: { rowCount: count }
    };
  } catch (err: any) {
    return {
      ok: false,
      message: `Connection failed: ${err?.message || 'Network error'}`
    };
  }
}

/**
 * Fetch all locations from public.locations
 */
export async function fetchLocations(): Promise<Location[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('locations')
    .select('id, name, city, state, code, created_at')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching locations from public.locations:', error.message);
    throw error;
  }
  return data || [];
}

/**
 * Fetch all roles from public.roles
 */
export async function fetchRoles(): Promise<Role[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('roles')
    .select('id, name, department, level, created_at')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching roles from public.roles:', error.message);
    throw error;
  }
  return data || [];
}

/**
 * Fetch employees from public.employees with search, filter, and pagination
 */
export async function fetchEmployees(filters: EmployeeFilters): Promise<{
  employees: Employee[];
  totalCount: number;
}> {
  const client = getSupabaseClient();
  const { search, location, role, employmentStatus, skillUpAccess, page, pageSize } = filters;
  
  let query = client
    .from('employees')
    .select(
      'id, employee_id, full_name, email, mobile_number, role_id, location_id, internal_manager_id, employment_status, skillup_access, auth_user_id, reporting_manager_employee_id, reporting_manager_name, created_at, updated_at, roles(id, name), locations(id, name, city)',
      { count: 'exact' }
    );

  // Text search against actual employee attributes
  if (search && search.trim()) {
    const q = search.trim();
    query = query.or(`employee_id.ilike.%${q}%,full_name.ilike.%${q}%,email.ilike.%${q}%,reporting_manager_name.ilike.%${q}%,reporting_manager_employee_id.ilike.%${q}%`);
  }

  // Filter by location (ID or Name)
  if (location && location !== 'ALL') {
    if (!isNaN(Number(location))) {
      query = query.eq('location_id', Number(location));
    }
  }

  // Filter by role (ID or Name)
  if (role && role !== 'ALL') {
    if (!isNaN(Number(role))) {
      query = query.eq('role_id', Number(role));
    }
  }

  // Filter by employment_status enum ('ACTIVE' | 'INACTIVE')
  if (employmentStatus && employmentStatus !== 'ALL') {
    query = query.eq('employment_status', employmentStatus);
  }

  // Filter by skillup_access enum ('ENABLED' | 'DISABLED')
  if (skillUpAccess && skillUpAccess !== 'ALL') {
    query = query.eq('skillup_access', skillUpAccess);
  }

  // Pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.order('created_at', { ascending: false, nullsFirst: false }).range(from, to);

  const { data, count, error } = await query;

  if (error) {
    console.error('Error querying public.employees:', error);
    throw error;
  }

  let employees: Employee[] = (data || []).map((row: any) => ({
    id: row.id,
    employee_id: row.employee_id,
    full_name: row.full_name,
    email: row.email,
    mobile_number: row.mobile_number,
    role_id: row.role_id,
    location_id: row.location_id,
    internal_manager_id: row.internal_manager_id,
    employment_status: row.employment_status,
    skillup_access: row.skillup_access,
    auth_user_id: row.auth_user_id,
    reporting_manager_employee_id: row.reporting_manager_employee_id,
    reporting_manager_name: row.reporting_manager_name,
    created_at: row.created_at,
    updated_at: row.updated_at,
    role_name: row.roles?.name || (row.role_id ? `Role #${row.role_id}` : 'Unassigned'),
    location_name: row.locations?.city || row.locations?.name || (row.location_id ? `Location #${row.location_id}` : 'Unassigned')
  }));

  // Fallback text match on location/role name if passed string instead of ID
  if (location && location !== 'ALL' && isNaN(Number(location))) {
    employees = employees.filter(e => e.location_name?.toLowerCase() === location.toLowerCase());
  }
  if (role && role !== 'ALL' && isNaN(Number(role))) {
    employees = employees.filter(e => e.role_name?.toLowerCase() === role.toLowerCase());
  }

  return {
    employees,
    totalCount: count ?? employees.length
  };
}

/**
 * Fetch real-time KPI metrics for Admin Dashboard directly from Supabase
 */
export async function fetchDashboardStats(): Promise<DashboardStats> {
  const client = getSupabaseClient();
  
  // 1. Total Employees count (SELECT COUNT(*) FROM public.employees)
  const { count: totalEmployees, error: totalErr } = await client
    .from('employees')
    .select('*', { count: 'exact', head: true });

  if (totalErr) {
    throw new Error(`Failed to query employees: ${totalErr.message}`);
  }

  // 2. Active Employees count (SELECT COUNT(*) FROM public.employees WHERE employment_status = 'ACTIVE')
  const { count: activeEmployees, error: activeErr } = await client
    .from('employees')
    .select('*', { count: 'exact', head: true })
    .eq('employment_status', 'ACTIVE');

  if (activeErr) {
    throw new Error(`Failed to query active employees: ${activeErr.message}`);
  }

  // 3. SkillUp Enabled count (SELECT COUNT(*) FROM public.employees WHERE skillup_access = 'ENABLED')
  const { count: skillUpEnabled, error: enabledErr } = await client
    .from('employees')
    .select('*', { count: 'exact', head: true })
    .eq('skillup_access', 'ENABLED');

  if (enabledErr) {
    throw new Error(`Failed to query enabled employees: ${enabledErr.message}`);
  }

  // 4. SkillUp Disabled count (SELECT COUNT(*) FROM public.employees WHERE skillup_access = 'DISABLED')
  const { count: skillUpDisabled, error: disabledErr } = await client
    .from('employees')
    .select('*', { count: 'exact', head: true })
    .eq('skillup_access', 'DISABLED');

  if (disabledErr) {
    throw new Error(`Failed to query disabled employees: ${disabledErr.message}`);
  }

  // 5. Total Courses count (SELECT COUNT(*) FROM public.courses)
  let totalCourses = 0;
  try {
    const { count: cCount, error: cErr } = await client
      .from('courses')
      .select('*', { count: 'exact', head: true });
    if (!cErr && cCount !== null) {
      totalCourses = cCount;
    }
  } catch {
    totalCourses = 0;
  }

  // 6. Course Assignments count (SELECT COUNT(*) FROM public.course_assignments)
  let assignedCourses = 0;
  try {
    const { count: aCount, error: aErr } = await client
      .from('course_assignments')
      .select('*', { count: 'exact', head: true });
    if (!aErr && aCount !== null) {
      assignedCourses = aCount;
    }
  } catch {
    assignedCourses = 0;
  }

  // 7. Course Completions count (SELECT COUNT(*) FROM public.course_completions)
  let completedCourses = 0;
  try {
    const { count: compCount, error: compErr } = await client
      .from('course_completions')
      .select('*', { count: 'exact', head: true });
    if (!compErr && compCount !== null) {
      completedCourses = compCount;
    }
  } catch {
    completedCourses = 0;
  }

  const total = totalEmployees ?? 0;
  const active = activeEmployees ?? 0;
  const enabled = skillUpEnabled ?? 0;
  const disabled = skillUpDisabled ?? Math.max(0, total - enabled);
  const inactive = Math.max(0, total - active);
  
  const completionRate = assignedCourses > 0 
    ? Math.round((completedCourses / assignedCourses) * 100) 
    : 0;

  return {
    totalEmployees: total,
    activeEmployees: active,
    inactiveEmployees: inactive,
    skillUpEnabled: enabled,
    skillUpDisabled: disabled,
    totalCourses,
    activeCourses: totalCourses,
    assignedCourses,
    completedCourses,
    completionRate
  };
}

/**
 * Fetch live city-wise employee distribution from public.employees joined with public.locations
 */
export async function fetchLiveCityDistribution(): Promise<LocationDistribution[]> {
  const client = getSupabaseClient();
  
  try {
    const [locationsRes, employeesRes] = await Promise.all([
      client.from('locations').select('id, name, city'),
      client.from('employees').select('location_id')
    ]);

    const locations = locationsRes.data || [];
    const employees = employeesRes.data || [];
    const total = employees.length || 1;

    // Count by location_id
    const countMap = new Map<string | number, number>();
    employees.forEach(emp => {
      if (emp.location_id !== null && emp.location_id !== undefined) {
        countMap.set(emp.location_id, (countMap.get(emp.location_id) || 0) + 1);
      }
    });

    // Map each location to its actual count
    const list: LocationDistribution[] = locations.map(loc => {
      const count = countMap.get(loc.id) || 0;
      return {
        location_id: loc.id,
        location_name: loc.city || loc.name,
        count,
        percentage: Math.round((count / total) * 100)
      };
    });

    // Sort by count descending
    list.sort((a, b) => b.count - a.count);
    return list;
  } catch (err) {
    console.error('Error computing city distribution from Supabase:', err);
    return [];
  }
}

/**
 * Fetch live designation-wise employee distribution from public.employees joined with public.roles
 */
export async function fetchLiveDesignationDistribution(): Promise<RoleDistribution[]> {
  const client = getSupabaseClient();
  
  try {
    const [rolesRes, employeesRes] = await Promise.all([
      client.from('roles').select('id, name'),
      client.from('employees').select('role_id')
    ]);

    const roles = rolesRes.data || [];
    const employees = employeesRes.data || [];
    const total = employees.length || 1;

    // Count by role_id
    const countMap = new Map<string | number, number>();
    employees.forEach(emp => {
      if (emp.role_id !== null && emp.role_id !== undefined) {
        countMap.set(emp.role_id, (countMap.get(emp.role_id) || 0) + 1);
      }
    });

    // Map each role to its actual count
    const list: RoleDistribution[] = roles.map(r => {
      const count = countMap.get(r.id) || 0;
      return {
        role_id: r.id,
        role_name: r.name,
        count,
        percentage: Math.round((count / total) * 100)
      };
    });

    // Sort by count descending
    list.sort((a, b) => b.count - a.count);
    return list;
  } catch (err) {
    console.error('Error computing designation distribution from Supabase:', err);
    return [];
  }
}

/**
 * Fetch real learning activity for an employee from course_assignments and course_completions.
 * `employeeUuid` must be the employees.id UUID (course_assignments.employee_id is a uuid FK
 * to employees.id, NOT the employees.employee_id business code).
 */
export async function fetchEmployeeLearningActivity(employeeUuid: string): Promise<EmployeeLearningActivity | null> {
  const client = getSupabaseClient();

  try {
    const { data: assignments, error } = await client
      .from('course_assignments')
      .select('id, course_id, status, progress_percentage, completed_at, courses(title)')
      .eq('employee_id', employeeUuid);

    if (error || !assignments || assignments.length === 0) {
      return null;
    }

    const total = assignments.length;
    const completed = assignments.filter((a: any) => a.status === 'COMPLETED' || a.completed_at).length;
    const inProgress = assignments.filter((a: any) => a.status === 'IN_PROGRESS').length;
    
    return {
      assignedCount: total,
      completedCount: completed,
      inProgressCount: inProgress,
      assignments: assignments.map((a: any) => ({
        id: a.id,
        courseTitle: a.courses?.title || `Course #${a.course_id}`,
        status: a.status || 'NOT_STARTED',
        progress: a.progress_percentage || 0
      }))
    };
  } catch {
    return null;
  }
}

/**
 * Verify active admin authorization in public.admin_users
 * Maps authenticated user via auth_user_id (auth.uid()) or verified email, requiring is_active = true
 */
export async function verifyAdminUser(email: string, authUserId?: string): Promise<AdminUser | null> {
  const client = getSupabaseClient();
  const cleanEmail = email.trim().toLowerCase();
  
  try {
    let query = client
      .from('admin_users')
      .select('id, auth_user_id, email, name, role, is_active, created_at, updated_at')
      .eq('is_active', true);

    if (authUserId) {
      query = query.or(`auth_user_id.eq.${authUserId},email.ilike.${cleanEmail}`);
    } else {
      query = query.ilike('email', cleanEmail);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.warn('Error querying admin_users table:', error.message);
      return null;
    }

    if (!data) {
      return null;
    }

    return {
      id: data.id,
      auth_user_id: data.auth_user_id,
      email: data.email,
      name: data.name || 'Admin User',
      role: data.role || 'LND_ADMIN',
      is_active: Boolean(data.is_active),
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  } catch (err) {
    console.error('Exception verifying admin user:', err);
    return null;
  }
}

/**
 * Record action in public.audit_logs
 * Resolves authenticated admin identity from Supabase Auth session.
 */
export async function createAuditLog(payload: AuditLogPayload): Promise<void> {
  const client = getSupabaseClient();
  try {
    const { data: { user } } = await client.auth.getUser();
    
    const adminEmail = user?.email || 'admin@rupeek.com';
    const adminName = user?.user_metadata?.name || user?.user_metadata?.full_name || adminEmail.split('@')[0];

    const auditEntry = {
      action: payload.action,
      entity_type: payload.entity_type,
      entity_id: String(payload.entity_id),
      performed_by_email: adminEmail,
      performed_by_name: adminName,
      details: payload.details || {
        previous_values: payload.previous_values || null,
        new_values: payload.new_values || null
      },
      created_at: new Date().toISOString()
    };

    const { error } = await client
      .from('audit_logs')
      .insert([auditEntry]);

    if (error) {
      console.warn('Note: Could not write to public.audit_logs directly:', error.message);
    }
  } catch (err) {
    console.warn('Audit logging exception (non-fatal):', err);
  }
}

/**
 * Check if employee_id or email already exists in public.employees
 */
export async function checkEmployeeUniqueness(
  employeeId: string, 
  email: string, 
  excludeId?: string | number
): Promise<{ employeeIdExists: boolean; emailExists: boolean }> {
  const client = getSupabaseClient();
  const cleanId = employeeId.trim().toUpperCase();
  const cleanEmail = email.trim().toLowerCase();

  try {
    let query = client
      .from('employees')
      .select('id, employee_id, email');

    if (excludeId !== undefined && excludeId !== null) {
      query = query.neq('id', excludeId);
    }

    // Filter for matching employee_id or email
    const { data, error } = await query.or(`employee_id.ilike.${cleanId},email.ilike.${cleanEmail}`);

    if (error) {
      console.error('Error checking employee uniqueness:', error);
      throw error;
    }

    const matched = data || [];
    const employeeIdExists = matched.some((e: any) => e.employee_id?.toUpperCase() === cleanId);
    const emailExists = matched.some((e: any) => e.email?.toLowerCase() === cleanEmail);

    return { employeeIdExists, emailExists };
  } catch (err) {
    console.error('Error during uniqueness check:', err);
    throw err;
  }
}

/**
 * Fetch all existing employee IDs and emails for instant bulk import validation
 */
export async function fetchAllExistingEmployeeIdentifiers(): Promise<{
  employeeIds: Set<string>;
  emails: Set<string>;
}> {
  const client = getSupabaseClient();
  const employeeIds = new Set<string>();
  const emails = new Set<string>();

  try {
    // Fetch with high limit or chunked if needed
    let from = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await client
        .from('employees')
        .select('employee_id, email')
        .range(from, from + pageSize - 1);

      if (error) {
        console.error('Error fetching employee identifiers:', error);
        break;
      }

      if (!data || data.length === 0) {
        hasMore = false;
        break;
      }

      data.forEach((r: any) => {
        if (r.employee_id) employeeIds.add(r.employee_id.trim().toUpperCase());
        if (r.email) emails.add(r.email.trim().toLowerCase());
      });

      if (data.length < pageSize) {
        hasMore = false;
      } else {
        from += pageSize;
      }
    }
  } catch (err) {
    console.error('Exception fetching all identifiers:', err);
  }

  return { employeeIds, emails };
}

/**
 * Create a new employee record in public.employees
 */
export async function createEmployee(input: CreateEmployeeInput): Promise<Employee> {
  const client = getSupabaseClient();

  const cleanId = input.employee_id.trim().toUpperCase();
  const cleanEmail = input.email.trim().toLowerCase();
  const cleanFullName = input.full_name.trim();

  if (!cleanId) throw new Error('Employee ID is required.');
  if (!cleanFullName) throw new Error('Full Name is required.');
  if (!cleanEmail) throw new Error('Official Email is required.');
  if (!/\S+@\S+\.\S+/.test(cleanEmail)) throw new Error('Please enter a valid official email format.');
  if (!input.role_id) throw new Error('Please select a valid Designation.');
  if (!input.location_id) throw new Error('Please select a valid Operating Location.');

  // Pre-insert uniqueness verification
  const { employeeIdExists, emailExists } = await checkEmployeeUniqueness(cleanId, cleanEmail);
  if (employeeIdExists) {
    throw new Error(`Employee ID "${cleanId}" already exists in the system.`);
  }
  if (emailExists) {
    throw new Error(`Official Email "${cleanEmail}" already exists in the system.`);
  }

  const payload: any = {
    employee_id: cleanId,
    full_name: cleanFullName,
    email: cleanEmail,
    mobile_number: input.mobile_number?.trim() || null,
    role_id: Number(input.role_id),
    location_id: Number(input.location_id),
    reporting_manager_employee_id: input.reporting_manager_employee_id?.trim() || null,
    reporting_manager_name: input.reporting_manager_name?.trim() || null,
    employment_status: input.employment_status || 'ACTIVE',
    skillup_access: input.skillup_access || 'ENABLED'
  };

  const { data, error } = await client
    .from('employees')
    .insert([payload])
    .select('id, employee_id, full_name, email, mobile_number, role_id, location_id, employment_status, skillup_access, reporting_manager_employee_id, reporting_manager_name, created_at, updated_at')
    .single();

  if (error) {
    console.error('Error inserting employee into public.employees:', error);
    throw new Error(`Database error: ${error.message}`);
  }

  // Record Audit Log
  await createAuditLog({
    action: 'EMPLOYEE_CREATED',
    entity_type: 'EMPLOYEE',
    entity_id: cleanId,
    new_values: payload
  });

  return {
    id: data.id,
    employee_id: data.employee_id,
    full_name: data.full_name,
    email: data.email,
    mobile_number: data.mobile_number,
    role_id: data.role_id,
    location_id: data.location_id,
    employment_status: data.employment_status,
    skillup_access: data.skillup_access,
    reporting_manager_employee_id: data.reporting_manager_employee_id,
    reporting_manager_name: data.reporting_manager_name,
    created_at: data.created_at,
    updated_at: data.updated_at
  };
}

/**
 * Update an existing employee in public.employees
 */
export async function updateEmployee(
  id: string | number,
  input: UpdateEmployeeInput,
  previousRecord: Employee
): Promise<Employee> {
  const client = getSupabaseClient();

  const cleanFullName = input.full_name.trim();
  if (!cleanFullName) throw new Error('Full Name is required.');
  if (!input.role_id) throw new Error('Please select a valid Designation.');
  if (!input.location_id) throw new Error('Please select a valid Operating Location.');

  const payload: any = {
    full_name: cleanFullName,
    mobile_number: input.mobile_number?.trim() || null,
    role_id: Number(input.role_id),
    location_id: Number(input.location_id),
    reporting_manager_employee_id: input.reporting_manager_employee_id?.trim() || null,
    reporting_manager_name: input.reporting_manager_name?.trim() || null,
    employment_status: input.employment_status,
    skillup_access: input.skillup_access,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await client
    .from('employees')
    .update(payload)
    .eq('id', id)
    .select('id, employee_id, full_name, email, mobile_number, role_id, location_id, employment_status, skillup_access, reporting_manager_employee_id, reporting_manager_name, created_at, updated_at')
    .single();

  if (error) {
    console.error('Error updating employee in public.employees:', error);
    throw new Error(`Database update error: ${error.message}`);
  }

  // Record Audit Log
  await createAuditLog({
    action: 'EMPLOYEE_UPDATED',
    entity_type: 'EMPLOYEE',
    entity_id: previousRecord.employee_id,
    previous_values: {
      full_name: previousRecord.full_name,
      mobile_number: previousRecord.mobile_number,
      role_id: previousRecord.role_id,
      location_id: previousRecord.location_id,
      reporting_manager_name: previousRecord.reporting_manager_name,
      reporting_manager_employee_id: previousRecord.reporting_manager_employee_id,
      employment_status: previousRecord.employment_status,
      skillup_access: previousRecord.skillup_access
    },
    new_values: payload
  });

  return {
    id: data.id,
    employee_id: data.employee_id,
    full_name: data.full_name,
    email: data.email,
    mobile_number: data.mobile_number,
    role_id: data.role_id,
    location_id: data.location_id,
    employment_status: data.employment_status,
    skillup_access: data.skillup_access,
    reporting_manager_employee_id: data.reporting_manager_employee_id,
    reporting_manager_name: data.reporting_manager_name,
    created_at: data.created_at,
    updated_at: data.updated_at
  };
}

/**
 * Toggle SkillUp access for an employee (ENABLED <-> DISABLED)
 * IMPORTANT: Preserves employee record, course progress, quiz results, and employment_status.
 */
export async function toggleSkillUpAccess(
  employee: Employee,
  newAccess: 'ENABLED' | 'DISABLED'
): Promise<Employee> {
  const client = getSupabaseClient();
  const targetId = employee.id;

  if (!targetId) {
    throw new Error('Employee ID identifier missing for access update.');
  }

  const { data, error } = await client
    .from('employees')
    .update({ 
      skillup_access: newAccess,
      updated_at: new Date().toISOString()
    })
    .eq('id', targetId)
    .select('id, employee_id, full_name, email, mobile_number, role_id, location_id, employment_status, skillup_access, reporting_manager_employee_id, reporting_manager_name, created_at, updated_at')
    .single();

  if (error) {
    console.error('Error toggling SkillUp access in public.employees:', error);
    throw new Error(`Failed to change SkillUp access: ${error.message}`);
  }

  // Record Audit Log
  const actionName = newAccess === 'ENABLED' ? 'SKILLUP_ACCESS_ENABLED' : 'SKILLUP_ACCESS_DISABLED';
  await createAuditLog({
    action: actionName,
    entity_type: 'EMPLOYEE',
    entity_id: employee.employee_id,
    previous_values: { skillup_access: employee.skillup_access },
    new_values: { skillup_access: newAccess },
    details: {
      reason: `Admin updated SkillUp learning access to ${newAccess}`,
      employment_status_preserved: employee.employment_status
    }
  });

  return {
    id: data.id,
    employee_id: data.employee_id,
    full_name: data.full_name,
    email: data.email,
    mobile_number: data.mobile_number,
    role_id: data.role_id,
    location_id: data.location_id,
    employment_status: data.employment_status,
    skillup_access: data.skillup_access,
    reporting_manager_employee_id: data.reporting_manager_employee_id,
    reporting_manager_name: data.reporting_manager_name,
    created_at: data.created_at,
    updated_at: data.updated_at
  };
}

/**
 * Safely inserts valid employee records from CSV Bulk Import into public.employees
 * Strictly checks that no existing records are overwritten.
 */
export async function insertBulkEmployees(validRows: BulkImportRow[]): Promise<BulkImportSummary> {
  const client = getSupabaseClient();
  const summary: BulkImportSummary = {
    totalProcessed: validRows.length,
    successfullyImported: 0,
    rejectedCount: 0,
    errors: []
  };

  if (validRows.length === 0) {
    return summary;
  }

  // 1. Re-verify existing identifiers to guarantee zero overwrite of production data
  const { employeeIds: existingIds, emails: existingEmails } = await fetchAllExistingEmployeeIdentifiers();

  const toInsert: any[] = [];
  
  for (const row of validRows) {
    const cleanId = row.employee_id.trim().toUpperCase();
    const cleanEmail = row.email.trim().toLowerCase();

    if (existingIds.has(cleanId)) {
      summary.rejectedCount++;
      summary.errors.push({
        employee_id: cleanId,
        error: `Employee ID "${cleanId}" already exists in public.employees (Protected).`
      });
      continue;
    }

    if (existingEmails.has(cleanEmail)) {
      summary.rejectedCount++;
      summary.errors.push({
        employee_id: cleanId,
        error: `Email "${cleanEmail}" already exists in public.employees (Protected).`
      });
      continue;
    }

    if (!row.role_id || !row.location_id) {
      summary.rejectedCount++;
      summary.errors.push({
        employee_id: cleanId,
        error: 'Invalid or unresolved Role/Location reference.'
      });
      continue;
    }

    toInsert.push({
      employee_id: cleanId,
      full_name: row.full_name.trim(),
      email: cleanEmail,
      mobile_number: row.mobile_number ? row.mobile_number.trim() : null,
      role_id: row.role_id,
      location_id: row.location_id,
      reporting_manager_employee_id: row.reporting_manager_employee_id ? row.reporting_manager_employee_id.trim() : null,
      reporting_manager_name: row.reporting_manager_name ? row.reporting_manager_name.trim() : null,
      employment_status: row.employment_status || 'ACTIVE',
      skillup_access: row.skillup_access || 'ENABLED'
    });

    // Add to in-memory set to prevent cross-batch duplicates
    existingIds.add(cleanId);
    existingEmails.add(cleanEmail);
  }

  if (toInsert.length === 0) {
    return summary;
  }

  // 2. Atomic Database Transaction: Insert all valid records in a single atomic SQL statement.
  // In PostgreSQL / PostgREST, a single multi-row INSERT statement executes as an all-or-nothing transaction.
  // If any row fails a constraint or RLS policy, the entire batch is rolled back and 0 rows are committed.
  const { data, error } = await client
    .from('employees')
    .insert(toInsert)
    .select('id, employee_id');

  if (error) {
    console.error('Atomic bulk import failed - transaction rolled back completely:', error);
    toInsert.forEach(item => {
      summary.rejectedCount++;
      summary.errors.push({
        employee_id: item.employee_id,
        error: `Database transaction aborted: ${error.message}`
      });
    });
    summary.successfullyImported = 0;
    throw new Error(`Bulk import transaction failed and was rolled back: ${error.message}`);
  }

  summary.successfullyImported = (data || []).length;

  // 3. Record Audit log for the atomic batch operation
  if (summary.successfullyImported > 0) {
    await createAuditLog({
      action: 'EMPLOYEE_BULK_IMPORT',
      entity_type: 'EMPLOYEE',
      entity_id: `BATCH_${Date.now()}`,
      details: {
        totalProcessed: summary.totalProcessed,
        importedCount: summary.successfullyImported,
        rejectedCount: summary.rejectedCount,
        atomic_transaction: true
      }
    });
  }

  return summary;
}

// ============================================================================
// PHASE 2B: COURSE & CURRICULUM MANAGEMENT API
// Single source of truth: PostgreSQL public.courses, modules, lessons, quizzes
// ============================================================================

/**
 * Fetch all distinct categories currently present in public.courses
 */
export async function fetchCourseCategories(): Promise<string[]> {
  const client = getSupabaseClient();
  try {
    const { data, error } = await client
      .from('courses')
      .select('category');
    
    if (error || !data) return [];
    const set = new Set<string>();
    data.forEach((r: any) => {
      if (r.category && typeof r.category === 'string') {
        set.add(r.category.trim());
      }
    });
    return Array.from(set).sort();
  } catch {
    return [];
  }
}

/**
 * Fetch courses from public.courses with search, filtering, sorting, pagination, and relational counts
 */
export async function fetchCourses(filters: CourseFilters): Promise<{
  courses: Course[];
  totalCount: number;
}> {
  const client = getSupabaseClient();
  const { search, category, status, sortBy, sortOrder, page, pageSize } = filters;

  let query = client
    .from('courses')
    .select('id, title, code, description, category, difficulty, estimated_duration_minutes, thumbnail_url, is_active, status, created_at, updated_at', { count: 'exact' });

  // Text search on title, description, category, code
  if (search && search.trim()) {
    const q = search.trim();
    query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%,category.ilike.%${q}%,code.ilike.%${q}%`);
  }

  // Category filter
  if (category && category !== 'ALL') {
    query = query.eq('category', category);
  }

  // Status filter
  if (status && status !== 'ALL') {
    if (status === 'PUBLISHED' || status === 'ACTIVE') {
      query = query.eq('is_active', true);
    } else if (status === 'DRAFT' || status === 'INACTIVE') {
      query = query.eq('is_active', false);
    }
  }

  // Sorting
  const sortColumn = sortBy || 'created_at';
  const ascending = sortOrder === 'asc';
  query = query.order(sortColumn, { ascending, nullsFirst: false });

  // Pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) {
    console.error('Error fetching courses from public.courses:', error);
    throw error;
  }

  const rawCourses = data || [];
  if (rawCourses.length === 0) {
    return { courses: [], totalCount: count ?? 0 };
  }

  const courseIds = rawCourses.map((c: any) => c.id);

  // Fetch module counts for these courses
  let moduleCountMap = new Map<string | number, number>();
  let moduleIds: Array<string | number> = [];
  try {
    const { data: modulesData } = await client
      .from('modules')
      .select('id, course_id')
      .in('course_id', courseIds);

    if (modulesData) {
      modulesData.forEach((m: any) => {
        moduleCountMap.set(m.course_id, (moduleCountMap.get(m.course_id) || 0) + 1);
        moduleIds.push(m.id);
      });
    }
  } catch (err) {
    console.warn('Could not fetch module counts:', err);
  }

  // Fetch lesson counts for these modules
  let lessonCountMap = new Map<string | number, number>();
  if (moduleIds.length > 0) {
    try {
      const { data: lessonsData } = await client
        .from('lessons')
        .select('id, module_id')
        .in('module_id', moduleIds);

      if (lessonsData) {
        lessonsData.forEach((l: any) => {
          lessonCountMap.set(l.module_id, (lessonCountMap.get(l.module_id) || 0) + 1);
        });
      }
    } catch (err) {
      console.warn('Could not fetch lesson counts:', err);
    }
  }

  // Fetch quiz counts for these courses / modules
  let quizCountMap = new Map<string | number, number>();
  try {
    const { data: quizzesData } = await client
      .from('quizzes')
      .select('id, course_id, module_id')
      .or(`course_id.in.(${courseIds.join(',')})${moduleIds.length ? `,module_id.in.(${moduleIds.join(',')})` : ''}`);

    if (quizzesData) {
      quizzesData.forEach((q: any) => {
        if (q.course_id) {
          quizCountMap.set(q.course_id, (quizCountMap.get(q.course_id) || 0) + 1);
        }
      });
    }
  } catch (err) {
    console.warn('Could not fetch quiz counts:', err);
  }

  const courses: Course[] = rawCourses.map((c: any) => {
    const mCount = moduleCountMap.get(c.id) || 0;
    return {
      id: c.id,
      title: c.title,
      code: c.code,
      description: c.description,
      category: c.category || 'General',
      difficulty: c.difficulty || 'Intermediate',
      estimated_duration_minutes: c.estimated_duration_minutes || 30,
      thumbnail_url: c.thumbnail_url,
      is_active: Boolean(c.is_active),
      status: c.is_active ? 'PUBLISHED' : (c.status || 'DRAFT'),
      created_at: c.created_at,
      updated_at: c.updated_at,
      modules_count: mCount,
      lessons_count: Array.from(lessonCountMap.entries()).reduce((sum, [, count]) => sum + count, 0),
      quizzes_count: quizCountMap.get(c.id) || 0
    };
  });

  return {
    courses,
    totalCount: count ?? courses.length
  };
}

/**
 * Fetch full course with complete curriculum tree:
 * Course -> Modules -> Lessons -> Quizzes -> Questions -> Options
 */
export async function fetchCourseDetail(courseId: string | number): Promise<Course | null> {
  const client = getSupabaseClient();

  // 1. Fetch course
  const { data: courseData, error: courseErr } = await client
    .from('courses')
    .select('id, title, code, description, category, difficulty, estimated_duration_minutes, thumbnail_url, is_active, status, created_at, updated_at')
    .eq('id', courseId)
    .maybeSingle();

  if (courseErr || !courseData) {
    console.error('Error fetching course detail from public.courses:', courseErr);
    return null;
  }

  // 2. Fetch modules in sequence order
  const { data: rawModules, error: modErr } = await client
    .from('modules')
    .select('id, course_id, title, description, sequence_order, is_active, created_at, updated_at')
    .eq('course_id', courseId)
    .order('sequence_order', { ascending: true, nullsFirst: false });

  if (modErr) {
    console.warn('Error fetching modules:', modErr);
  }

  const modulesList = rawModules || [];
  const moduleIds = modulesList.map((m: any) => m.id);

  // 3. Fetch lessons for all modules
  let lessonsByModule = new Map<string | number, Lesson[]>();
  if (moduleIds.length > 0) {
    const { data: rawLessons, error: lessErr } = await client
      .from('lessons')
      .select('id, module_id, title, content_type, content_text, video_url, pdf_url, duration_minutes, sequence_order, is_active, created_at, updated_at')
      .in('module_id', moduleIds)
      .order('sequence_order', { ascending: true, nullsFirst: false });

    if (lessErr) {
      console.warn('Error fetching lessons:', lessErr);
    }

    (rawLessons || []).forEach((l: any) => {
      const list = lessonsByModule.get(l.module_id) || [];
      list.push({
        id: l.id,
        module_id: l.module_id,
        title: l.title,
        content_type: l.content_type || 'TEXT',
        content_text: l.content_text,
        video_url: l.video_url,
        pdf_url: l.pdf_url,
        duration_minutes: l.duration_minutes || 5,
        sequence_order: l.sequence_order || 1,
        is_active: l.is_active !== undefined ? l.is_active : true,
        created_at: l.created_at,
        updated_at: l.updated_at
      });
      lessonsByModule.set(l.module_id, list);
    });
  }

  // 4. Fetch quizzes for course and modules
  let quizzesByModule = new Map<string | number, Quiz[]>();
  let quizzesForCourse: Quiz[] = [];
  try {
    let quizQuery = client
      .from('quizzes')
      .select('id, course_id, module_id, title, description, passing_score, time_limit_minutes, is_active, created_at, updated_at');
    
    if (moduleIds.length > 0) {
      quizQuery = quizQuery.or(`course_id.eq.${courseId},module_id.in.(${moduleIds.join(',')})`);
    } else {
      quizQuery = quizQuery.eq('course_id', courseId);
    }

    const { data: rawQuizzes, error: qErr } = await quizQuery;
    if (qErr) {
      console.warn('Error fetching quizzes:', qErr);
    }

    const quizzes = rawQuizzes || [];
    const quizIds = quizzes.map((q: any) => q.id);

    // Fetch quiz questions
    let questionsByQuiz = new Map<string | number, QuizQuestion[]>();
    if (quizIds.length > 0) {
      const { data: rawQuestions } = await client
        .from('quiz_questions')
        .select('id, quiz_id, question_text, question_type, points, explanation, sequence_order, created_at')
        .in('quiz_id', quizIds)
        .order('sequence_order', { ascending: true, nullsFirst: false });

      const questionIds = (rawQuestions || []).map((q: any) => q.id);

      // Fetch options for questions
      let optionsByQuestion = new Map<string | number, QuizOption[]>();
      if (questionIds.length > 0) {
        const { data: rawOptions } = await client
          .from('quiz_options')
          .select('id, question_id, option_text, is_correct, sequence_order, created_at')
          .in('question_id', questionIds)
          .order('sequence_order', { ascending: true, nullsFirst: false });

        (rawOptions || []).forEach((opt: any) => {
          const list = optionsByQuestion.get(opt.question_id) || [];
          list.push({
            id: opt.id,
            question_id: opt.question_id,
            option_text: opt.option_text,
            is_correct: Boolean(opt.is_correct),
            sequence_order: opt.sequence_order || 1,
            created_at: opt.created_at
          });
          optionsByQuestion.set(opt.question_id, list);
        });
      }

      (rawQuestions || []).forEach((q: any) => {
        const list = questionsByQuiz.get(q.quiz_id) || [];
        list.push({
          id: q.id,
          quiz_id: q.quiz_id,
          question_text: q.question_text,
          question_type: q.question_type || 'SINGLE_CHOICE',
          points: q.points || 1,
          explanation: q.explanation,
          sequence_order: q.sequence_order || 1,
          created_at: q.created_at,
          options: optionsByQuestion.get(q.id) || []
        });
        questionsByQuiz.set(q.quiz_id, list);
      });
    }

    quizzes.forEach((q: any) => {
      const fullQuiz: Quiz = {
        id: q.id,
        course_id: q.course_id,
        module_id: q.module_id,
        title: q.title,
        description: q.description,
        passing_score: q.passing_score ?? 70,
        time_limit_minutes: q.time_limit_minutes,
        is_active: q.is_active !== undefined ? q.is_active : true,
        created_at: q.created_at,
        updated_at: q.updated_at,
        questions: questionsByQuiz.get(q.id) || []
      };

      if (q.module_id) {
        const mList = quizzesByModule.get(q.module_id) || [];
        mList.push(fullQuiz);
        quizzesByModule.set(q.module_id, mList);
      } else {
        quizzesForCourse.push(fullQuiz);
      }
    });
  } catch (err) {
    console.warn('Quiz hierarchy query warning:', err);
  }

  // Assemble modules with their lessons and quizzes
  const modules: Module[] = modulesList.map((m: any) => ({
    id: m.id,
    course_id: m.course_id,
    title: m.title,
    description: m.description,
    sequence_order: m.sequence_order || 1,
    is_active: m.is_active !== undefined ? m.is_active : true,
    created_at: m.created_at,
    updated_at: m.updated_at,
    lessons: lessonsByModule.get(m.id) || [],
    quizzes: quizzesByModule.get(m.id) || []
  }));

  const totalLessons = modules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0);
  const totalQuizzes = modules.reduce((sum, m) => sum + (m.quizzes?.length || 0), 0) + quizzesForCourse.length;

  return {
    id: courseData.id,
    title: courseData.title,
    code: courseData.code,
    description: courseData.description,
    category: courseData.category || 'General',
    difficulty: courseData.difficulty || 'Intermediate',
    estimated_duration_minutes: courseData.estimated_duration_minutes || 30,
    thumbnail_url: courseData.thumbnail_url,
    is_active: Boolean(courseData.is_active),
    status: courseData.is_active ? 'PUBLISHED' : (courseData.status || 'DRAFT'),
    created_at: courseData.created_at,
    updated_at: courseData.updated_at,
    modules_count: modules.length,
    lessons_count: totalLessons,
    quizzes_count: totalQuizzes,
    modules
  };
}

/**
 * Create a new Course in public.courses
 */
export async function createCourse(input: CreateCourseInput): Promise<Course> {
  const client = getSupabaseClient();
  const cleanTitle = input.title.trim();
  if (!cleanTitle) throw new Error('Course Title is required.');

  const payload: any = {
    title: cleanTitle,
    code: input.code?.trim() || null,
    description: input.description?.trim() || '',
    category: input.category?.trim() || 'General',
    difficulty: input.difficulty || 'Intermediate',
    estimated_duration_minutes: Number(input.estimated_duration_minutes) || 30,
    thumbnail_url: input.thumbnail_url?.trim() || null,
    is_active: false,
    status: 'DRAFT'
  };

  const { data, error } = await client
    .from('courses')
    .insert([payload])
    .select('id, title, code, description, category, difficulty, estimated_duration_minutes, thumbnail_url, is_active, status, created_at, updated_at')
    .single();

  if (error) {
    console.error('Error inserting course into public.courses:', error);
    throw new Error(`Database error: ${error.message}`);
  }

  // Record Audit Log
  await createAuditLog({
    action: 'COURSE_CREATED',
    entity_type: 'COURSE',
    entity_id: String(data.id),
    new_values: payload
  });

  return {
    id: data.id,
    title: data.title,
    code: data.code,
    description: data.description,
    category: data.category,
    difficulty: data.difficulty,
    estimated_duration_minutes: data.estimated_duration_minutes,
    thumbnail_url: data.thumbnail_url,
    is_active: Boolean(data.is_active),
    status: data.is_active ? 'PUBLISHED' : 'DRAFT',
    created_at: data.created_at,
    updated_at: data.updated_at,
    modules_count: 0,
    lessons_count: 0,
    quizzes_count: 0,
    modules: []
  };
}

/**
 * Update course master properties in public.courses
 */
export async function updateCourse(
  courseId: string | number,
  input: UpdateCourseInput,
  previousRecord?: Course
): Promise<Course> {
  const client = getSupabaseClient();
  const cleanTitle = input.title?.trim();
  if (cleanTitle !== undefined && !cleanTitle) throw new Error('Course Title cannot be empty.');

  const payload: any = {
    updated_at: new Date().toISOString()
  };

  if (cleanTitle !== undefined) payload.title = cleanTitle;
  if (input.code !== undefined) payload.code = input.code?.trim() || null;
  if (input.description !== undefined) payload.description = input.description?.trim() || '';
  if (input.category !== undefined) payload.category = input.category?.trim() || 'General';
  if (input.difficulty !== undefined) payload.difficulty = input.difficulty;
  if (input.estimated_duration_minutes !== undefined) payload.estimated_duration_minutes = Number(input.estimated_duration_minutes);
  if (input.thumbnail_url !== undefined) payload.thumbnail_url = input.thumbnail_url?.trim() || null;
  if (input.is_active !== undefined) payload.is_active = input.is_active;
  if (input.status !== undefined) payload.status = input.status;

  const { data, error } = await client
    .from('courses')
    .update(payload)
    .eq('id', courseId)
    .select('id, title, code, description, category, difficulty, estimated_duration_minutes, thumbnail_url, is_active, status, created_at, updated_at')
    .single();

  if (error) {
    console.error('Error updating course in public.courses:', error);
    throw new Error(`Database error: ${error.message}`);
  }

  // Record Audit Log
  await createAuditLog({
    action: 'COURSE_UPDATED',
    entity_type: 'COURSE',
    entity_id: String(courseId),
    previous_values: previousRecord ? {
      title: previousRecord.title,
      category: previousRecord.category,
      is_active: previousRecord.is_active
    } : null,
    new_values: payload
  });

  return {
    id: data.id,
    title: data.title,
    code: data.code,
    description: data.description,
    category: data.category,
    difficulty: data.difficulty,
    estimated_duration_minutes: data.estimated_duration_minutes,
    thumbnail_url: data.thumbnail_url,
    is_active: Boolean(data.is_active),
    status: data.is_active ? 'PUBLISHED' : (data.status || 'DRAFT'),
    created_at: data.created_at,
    updated_at: data.updated_at
  };
}

/**
 * Toggle course publish status (Draft <-> Published) with validation
 */
export async function toggleCoursePublish(
  courseId: string | number,
  publish: boolean,
  currentCourse: Course
): Promise<Course> {
  const client = getSupabaseClient();

  if (publish) {
    // Validate curriculum completeness before publishing
    const full = await fetchCourseDetail(courseId);
    if (!full || !full.modules || full.modules.length === 0) {
      throw new Error('A course must have at least one module before it can be published.');
    }
    const hasContent = full.modules.some(m => (m.lessons && m.lessons.length > 0) || (m.quizzes && m.quizzes.length > 0));
    if (!hasContent) {
      throw new Error('A course must contain at least one lesson or quiz before publishing.');
    }
  }

  const payload: any = {
    is_active: publish,
    status: publish ? 'PUBLISHED' : 'DRAFT',
    updated_at: new Date().toISOString()
  };

  const { data, error } = await client
    .from('courses')
    .update(payload)
    .eq('id', courseId)
    .select('id, title, code, description, category, difficulty, estimated_duration_minutes, thumbnail_url, is_active, status, created_at, updated_at')
    .single();

  if (error) {
    console.error('Error toggling course publish status:', error);
    throw new Error(`Database error: ${error.message}`);
  }

  // Record Audit Log
  await createAuditLog({
    action: publish ? 'COURSE_PUBLISHED' : 'COURSE_UPDATED',
    entity_type: 'COURSE',
    entity_id: String(courseId),
    previous_values: { is_active: currentCourse.is_active, status: currentCourse.status },
    new_values: payload
  });

  return {
    ...currentCourse,
    is_active: Boolean(data.is_active),
    status: data.is_active ? 'PUBLISHED' : 'DRAFT',
    updated_at: data.updated_at
  };
}

/**
 * Add a new Module to a Course
 */
export async function createModule(
  courseId: string | number, 
  input: { title: string; description?: string; sequence_order?: number }
): Promise<Module> {
  const client = getSupabaseClient();
  const cleanTitle = input.title.trim();
  if (!cleanTitle) throw new Error('Module Title is required.');

  const payload: any = {
    course_id: courseId,
    title: cleanTitle,
    description: input.description?.trim() || '',
    sequence_order: input.sequence_order || 1,
    is_active: true
  };

  const { data, error } = await client
    .from('modules')
    .insert([payload])
    .select('id, course_id, title, description, sequence_order, is_active, created_at, updated_at')
    .single();

  if (error) {
    console.error('Error creating module in public.modules:', error);
    throw new Error(`Database error: ${error.message}`);
  }

  await createAuditLog({
    action: 'MODULE_CREATED',
    entity_type: 'MODULE',
    entity_id: String(data.id),
    details: { course_id: courseId, title: cleanTitle }
  });

  return {
    id: data.id,
    course_id: data.course_id,
    title: data.title,
    description: data.description,
    sequence_order: data.sequence_order,
    is_active: data.is_active,
    created_at: data.created_at,
    updated_at: data.updated_at,
    lessons: [],
    quizzes: []
  };
}

/**
 * Update an existing Module
 */
export async function updateModule(
  moduleId: string | number,
  input: { title?: string; description?: string; sequence_order?: number }
): Promise<Module> {
  const client = getSupabaseClient();
  const payload: any = {
    updated_at: new Date().toISOString()
  };
  if (input.title !== undefined) payload.title = input.title.trim();
  if (input.description !== undefined) payload.description = input.description.trim();
  if (input.sequence_order !== undefined) payload.sequence_order = input.sequence_order;

  const { data, error } = await client
    .from('modules')
    .update(payload)
    .eq('id', moduleId)
    .select('id, course_id, title, description, sequence_order, is_active, created_at, updated_at')
    .single();

  if (error) {
    console.error('Error updating module in public.modules:', error);
    throw new Error(`Database error: ${error.message}`);
  }

  await createAuditLog({
    action: 'MODULE_UPDATED',
    entity_type: 'MODULE',
    entity_id: String(moduleId),
    new_values: payload
  });

  return {
    id: data.id,
    course_id: data.course_id,
    title: data.title,
    description: data.description,
    sequence_order: data.sequence_order,
    is_active: data.is_active,
    created_at: data.created_at,
    updated_at: data.updated_at
  };
}

/**
 * Reorder Modules in a Course
 */
export async function reorderModules(
  moduleOrders: Array<{ id: string | number; sequence_order: number }>
): Promise<void> {
  const client = getSupabaseClient();
  for (const item of moduleOrders) {
    await client
      .from('modules')
      .update({ sequence_order: item.sequence_order, updated_at: new Date().toISOString() })
      .eq('id', item.id);
  }
}

/**
 * Add a new Lesson to a Module
 */
export async function createLesson(
  moduleId: string | number,
  input: {
    title: string;
    content_type: LessonType;
    content_text?: string;
    video_url?: string;
    pdf_url?: string;
    duration_minutes?: number;
    sequence_order?: number;
  }
): Promise<Lesson> {
  const client = getSupabaseClient();
  const cleanTitle = input.title.trim();
  if (!cleanTitle) throw new Error('Lesson Title is required.');

  const payload: any = {
    module_id: moduleId,
    title: cleanTitle,
    content_type: input.content_type || 'TEXT',
    content_text: input.content_text || '',
    video_url: input.video_url?.trim() || null,
    pdf_url: input.pdf_url?.trim() || null,
    duration_minutes: Number(input.duration_minutes) || 5,
    sequence_order: input.sequence_order || 1,
    is_active: true
  };

  const { data, error } = await client
    .from('lessons')
    .insert([payload])
    .select('id, module_id, title, content_type, content_text, video_url, pdf_url, duration_minutes, sequence_order, is_active, created_at, updated_at')
    .single();

  if (error) {
    console.error('Error creating lesson in public.lessons:', error);
    throw new Error(`Database error: ${error.message}`);
  }

  await createAuditLog({
    action: 'LESSON_CREATED',
    entity_type: 'LESSON',
    entity_id: String(data.id),
    details: { module_id: moduleId, title: cleanTitle, content_type: input.content_type }
  });

  return {
    id: data.id,
    module_id: data.module_id,
    title: data.title,
    content_type: data.content_type,
    content_text: data.content_text,
    video_url: data.video_url,
    pdf_url: data.pdf_url,
    duration_minutes: data.duration_minutes,
    sequence_order: data.sequence_order,
    is_active: data.is_active,
    created_at: data.created_at,
    updated_at: data.updated_at
  };
}

/**
 * Update an existing Lesson
 */
export async function updateLesson(
  lessonId: string | number,
  input: Partial<Lesson>
): Promise<Lesson> {
  const client = getSupabaseClient();
  const payload: any = {
    updated_at: new Date().toISOString()
  };

  if (input.title !== undefined) payload.title = input.title.trim();
  if (input.content_type !== undefined) payload.content_type = input.content_type;
  if (input.content_text !== undefined) payload.content_text = input.content_text;
  if (input.video_url !== undefined) payload.video_url = input.video_url?.trim() || null;
  if (input.pdf_url !== undefined) payload.pdf_url = input.pdf_url?.trim() || null;
  if (input.duration_minutes !== undefined) payload.duration_minutes = Number(input.duration_minutes);
  if (input.sequence_order !== undefined) payload.sequence_order = input.sequence_order;
  if (input.is_active !== undefined) payload.is_active = input.is_active;

  const { data, error } = await client
    .from('lessons')
    .update(payload)
    .eq('id', lessonId)
    .select('id, module_id, title, content_type, content_text, video_url, pdf_url, duration_minutes, sequence_order, is_active, created_at, updated_at')
    .single();

  if (error) {
    console.error('Error updating lesson in public.lessons:', error);
    throw new Error(`Database error: ${error.message}`);
  }

  await createAuditLog({
    action: 'LESSON_UPDATED',
    entity_type: 'LESSON',
    entity_id: String(lessonId),
    new_values: payload
  });

  return {
    id: data.id,
    module_id: data.module_id,
    title: data.title,
    content_type: data.content_type,
    content_text: data.content_text,
    video_url: data.video_url,
    pdf_url: data.pdf_url,
    duration_minutes: data.duration_minutes,
    sequence_order: data.sequence_order,
    is_active: data.is_active,
    created_at: data.created_at,
    updated_at: data.updated_at
  };
}

/**
 * Reorder Lessons in a Module
 */
export async function reorderLessons(
  lessonOrders: Array<{ id: string | number; sequence_order: number }>
): Promise<void> {
  const client = getSupabaseClient();
  for (const item of lessonOrders) {
    await client
      .from('lessons')
      .update({ sequence_order: item.sequence_order, updated_at: new Date().toISOString() })
      .eq('id', item.id);
  }
}

/**
 * Save / Update a Quiz and its Questions + Answer Options
 */
export async function saveQuizWithQuestions(input: {
  id?: string | number;
  course_id?: string | number;
  module_id?: string | number;
  title: string;
  description?: string;
  passing_score: number;
  time_limit_minutes?: number;
  questions: Array<{
    id?: string | number;
    question_text: string;
    question_type?: string;
    points?: number;
    explanation?: string;
    sequence_order: number;
    options: Array<{
      id?: string | number;
      option_text: string;
      is_correct: boolean;
      sequence_order: number;
    }>;
  }>;
}): Promise<Quiz> {
  const client = getSupabaseClient();
  const cleanTitle = input.title.trim();
  if (!cleanTitle) throw new Error('Quiz Title is required.');

  // Validate Questions
  if (!input.questions || input.questions.length === 0) {
    throw new Error('A quiz must contain at least one question.');
  }

  for (let i = 0; i < input.questions.length; i++) {
    const q = input.questions[i];
    if (!q.question_text || !q.question_text.trim()) {
      throw new Error(`Question #${i + 1} text cannot be empty.`);
    }
    if (!q.options || q.options.length < 2) {
      throw new Error(`Question #${i + 1} must have at least 2 answer options.`);
    }
    const hasCorrect = q.options.some(opt => opt.is_correct);
    if (!hasCorrect) {
      throw new Error(`Question #${i + 1} must have at least one marked correct answer.`);
    }
    const optionTexts = q.options.map(opt => opt.option_text.trim().toLowerCase());
    const uniqueTexts = new Set(optionTexts);
    if (uniqueTexts.size < optionTexts.length) {
      throw new Error(`Question #${i + 1} has duplicate answer options.`);
    }
  }

  // 1. Create or Update Quiz header
  let quizId = input.id;
  const isNewQuiz = !quizId;

  const quizPayload: any = {
    title: cleanTitle,
    description: input.description?.trim() || '',
    passing_score: Number(input.passing_score) || 70,
    time_limit_minutes: input.time_limit_minutes ? Number(input.time_limit_minutes) : null,
    is_active: true,
    updated_at: new Date().toISOString()
  };

  if (input.course_id) quizPayload.course_id = input.course_id;
  if (input.module_id) quizPayload.module_id = input.module_id;

  if (isNewQuiz) {
    const { data: newQuiz, error: createQErr } = await client
      .from('quizzes')
      .insert([quizPayload])
      .select('id, course_id, module_id, title, description, passing_score, time_limit_minutes, is_active, created_at, updated_at')
      .single();

    if (createQErr) {
      console.error('Error creating quiz:', createQErr);
      throw new Error(`Database error: ${createQErr.message}`);
    }
    quizId = newQuiz.id;
  } else {
    const { error: updateQErr } = await client
      .from('quizzes')
      .update(quizPayload)
      .eq('id', quizId);

    if (updateQErr) {
      console.error('Error updating quiz:', updateQErr);
      throw new Error(`Database error: ${updateQErr.message}`);
    }
  }

  // 2. Insert or update questions and options
  // For simplicity and relational integrity: clear existing questions for this quiz and insert fresh structure
  if (!isNewQuiz && quizId) {
    try {
      // Find existing questions
      const { data: existingQuestions } = await client
        .from('quiz_questions')
        .select('id')
        .eq('quiz_id', quizId);

      const qIds = (existingQuestions || []).map((q: any) => q.id);
      if (qIds.length > 0) {
        await client.from('quiz_options').delete().in('question_id', qIds);
        await client.from('quiz_questions').delete().eq('quiz_id', quizId);
      }
    } catch (e) {
      console.warn('Note during question sync:', e);
    }
  }

  // Insert questions
  const createdQuestions: QuizQuestion[] = [];
  for (let i = 0; i < input.questions.length; i++) {
    const qInput = input.questions[i];
    const { data: questionData, error: qInsertErr } = await client
      .from('quiz_questions')
      .insert([{
        quiz_id: quizId,
        question_text: qInput.question_text.trim(),
        question_type: qInput.question_type || 'SINGLE_CHOICE',
        points: qInput.points || 1,
        explanation: qInput.explanation?.trim() || null,
        sequence_order: i + 1
      }])
      .select('id, quiz_id, question_text, question_type, points, explanation, sequence_order, created_at')
      .single();

    if (qInsertErr || !questionData) {
      console.error('Error inserting question:', qInsertErr);
      throw new Error(`Error saving question: ${qInsertErr?.message}`);
    }

    // Insert options
    const optionsPayload = qInput.options.map((opt, optIdx) => ({
      question_id: questionData.id,
      option_text: opt.option_text.trim(),
      is_correct: Boolean(opt.is_correct),
      sequence_order: optIdx + 1
    }));

    const { data: optionsData, error: optInsertErr } = await client
      .from('quiz_options')
      .insert(optionsPayload)
      .select('id, question_id, option_text, is_correct, sequence_order, created_at');

    if (optInsertErr) {
      console.error('Error inserting quiz options:', optInsertErr);
      throw new Error(`Error saving options: ${optInsertErr.message}`);
    }

    createdQuestions.push({
      id: questionData.id,
      quiz_id: questionData.quiz_id,
      question_text: questionData.question_text,
      question_type: questionData.question_type,
      points: questionData.points,
      explanation: questionData.explanation,
      sequence_order: questionData.sequence_order,
      created_at: questionData.created_at,
      options: optionsData || []
    });
  }

  // Record Audit Log
  await createAuditLog({
    action: isNewQuiz ? 'QUIZ_CREATED' : 'QUIZ_UPDATED',
    entity_type: 'QUIZ',
    entity_id: String(quizId),
    details: {
      title: cleanTitle,
      questionsCount: createdQuestions.length,
      passing_score: input.passing_score
    }
  });

  return {
    id: quizId!,
    course_id: input.course_id,
    module_id: input.module_id,
    title: cleanTitle,
    description: input.description,
    passing_score: input.passing_score,
    time_limit_minutes: input.time_limit_minutes,
    is_active: true,
    questions: createdQuestions
  };
}

// ============================================================
// PHASE 2C: COURSE ASSIGNMENT ENGINE SUPABASE INTEGRATIONS
// ============================================================

/**
 * Fetch list of published and active courses eligible for assignment.
 * Filters strictly by is_active = true AND status = 'PUBLISHED'.
 */
export async function fetchAssignableCourses(): Promise<Course[]> {
  const client = getSupabaseClient();
  try {
    const { data, error } = await client
      .from('courses')
      .select('id, title, code, description, category, difficulty, estimated_duration_minutes, thumbnail_url, is_active, status, created_at, updated_at')
      .eq('is_active', true)
      .order('title', { ascending: true });

    if (error) {
      console.warn('Error querying assignable courses from public.courses:', error.message);
      return [];
    }

    // Filter strictly to ensure status is PUBLISHED
    const published = (data || []).filter((c: any) => 
      Boolean(c.is_active) && (c.status === 'PUBLISHED' || !c.status)
    );

    return published.map((c: any) => ({
      id: c.id,
      title: c.title,
      code: c.code,
      description: c.description,
      category: c.category || 'General',
      difficulty: c.difficulty || 'Intermediate',
      estimated_duration_minutes: c.estimated_duration_minutes || 30,
      thumbnail_url: c.thumbnail_url,
      is_active: true,
      status: 'PUBLISHED',
      created_at: c.created_at,
      updated_at: c.updated_at
    }));
  } catch (err) {
    console.error('Exception in fetchAssignableCourses:', err);
    return [];
  }
}

/**
 * Check if a course has active assignments (status != 'REVOKED')
 * Prevents accidental structural deletions on courses with enrolled learners.
 */
export async function hasCourseActiveAssignments(courseId: string | number): Promise<boolean> {
  const client = getSupabaseClient();
  try {
    const { data, error } = await client
      .from('course_assignments')
      .select('id, status')
      .eq('course_id', courseId)
      .limit(20);

    if (error || !data) return false;
    return data.some((a: any) => a.status !== 'REVOKED');
  } catch {
    return false;
  }
}

/**
 * Fetch assignments with filters, pagination, and relational joins with employees and courses
 */
export async function fetchCourseAssignments(filters: Partial<AssignmentFilters>): Promise<{
  assignments: CourseAssignment[];
  totalCount: number;
}> {
  const client = getSupabaseClient();
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 10;
  const search = filters.search?.trim().toLowerCase();

  try {
    let query = client
      .from('course_assignments')
      .select(`
        id,
        course_id,
        employee_id,
        assigned_by,
        assigned_at,
        due_date,
        status,
        is_mandatory,
        progress_percentage,
        completed_at,
        created_at,
        updated_at,
        courses (
          id,
          title,
          code,
          category,
          estimated_duration_minutes,
          is_active,
          status
        ),
        employees (
          id,
          employee_id,
          full_name,
          email,
          mobile_number,
          role_id,
          location_id,
          employment_status,
          skillup_access,
          roles (
            id,
            name
          ),
          locations (
            id,
            name,
            city
          )
        )
      `, { count: 'exact' });

    // Filter by Course ID
    if (filters.courseId && filters.courseId !== 'ALL') {
      query = query.eq('course_id', filters.courseId);
    }

    // Filter by Status
    if (filters.status && filters.status !== 'ALL') {
      if (filters.status === 'OVERDUE') {
        const nowIso = new Date().toISOString();
        query = query.lt('due_date', nowIso).neq('status', 'COMPLETED').neq('status', 'REVOKED');
      } else {
        query = query.eq('status', filters.status);
      }
    }

    // Filter by Mandatory / Optional
    if (filters.type && filters.type !== 'ALL') {
      const isMandatory = filters.type === 'MANDATORY';
      query = query.eq('is_mandatory', isMandatory);
    }

    // Pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.order('created_at', { ascending: false, nullsFirst: false }).range(from, to);

    const { data, count, error } = await query;

    if (error) {
      console.warn('Error querying public.course_assignments:', error.message);
      return { assignments: [], totalCount: 0 };
    }

    const now = new Date();

    let assignments: CourseAssignment[] = (data || []).map((row: any) => {
      let status = row.status || 'NOT_STARTED';
      
      // Dynamic OVERDUE detection if due_date is past and not completed/revoked
      if (row.due_date && status !== 'COMPLETED' && status !== 'REVOKED') {
        const dueDate = new Date(row.due_date);
        if (dueDate < now) {
          status = 'OVERDUE';
        }
      }

      const emp = row.employees ? {
        id: row.employees.id,
        employee_id: row.employees.employee_id,
        full_name: row.employees.full_name,
        email: row.employees.email,
        mobile_number: row.employees.mobile_number,
        role_id: row.employees.role_id,
        location_id: row.employees.location_id,
        employment_status: row.employees.employment_status,
        skillup_access: row.employees.skillup_access,
        created_at: '',
        updated_at: '',
        role_name: row.employees.roles?.name || (row.employees.role_id ? `Role #${row.employees.role_id}` : 'Unassigned'),
        location_name: row.employees.locations?.city || row.employees.locations?.name || (row.employees.location_id ? `Location #${row.employees.location_id}` : 'Unassigned')
      } : undefined;

      const crs = row.courses ? {
        id: row.courses.id,
        title: row.courses.title,
        code: row.courses.code,
        category: row.courses.category || 'General',
        estimated_duration_minutes: row.courses.estimated_duration_minutes || 30,
        is_active: Boolean(row.courses.is_active),
        status: row.courses.status || 'PUBLISHED',
        created_at: '',
        updated_at: ''
      } : undefined;

      return {
        id: row.id,
        course_id: row.course_id,
        employee_id: row.employee_id,
        assigned_by: row.assigned_by,
        assigned_at: row.assigned_at || row.created_at,
        due_date: row.due_date,
        status: status as any,
        is_mandatory: row.is_mandatory !== undefined ? Boolean(row.is_mandatory) : true,
        progress_percentage: row.progress_percentage || 0,
        completed_at: row.completed_at,
        created_at: row.created_at,
        updated_at: row.updated_at,
        course: crs,
        employee: emp
      };
    });

    // Client-side text filter if searching employee name/ID or course title
    if (search) {
      assignments = assignments.filter(a => 
        a.employee?.full_name?.toLowerCase().includes(search) ||
        a.employee?.employee_id?.toLowerCase().includes(search) ||
        a.course?.title?.toLowerCase().includes(search) ||
        a.course?.code?.toLowerCase().includes(search)
      );
    }

    // Role / Location filters
    if (filters.roleId && filters.roleId !== 'ALL') {
      assignments = assignments.filter(a => String(a.employee?.role_id) === String(filters.roleId));
    }
    if (filters.locationId && filters.locationId !== 'ALL') {
      assignments = assignments.filter(a => String(a.employee?.location_id) === String(filters.locationId));
    }

    return {
      assignments,
      totalCount: count ?? assignments.length
    };
  } catch (err) {
    console.error('Exception in fetchCourseAssignments:', err);
    return { assignments: [], totalCount: 0 };
  }
}

/**
 * Fetch KPI summary stats for Course Assignments
 */
export async function fetchAssignmentStats(): Promise<AssignmentStats> {
  const client = getSupabaseClient();
  try {
    const { data, error } = await client
      .from('course_assignments')
      .select('id, status, due_date');

    if (error || !data) {
      return {
        total: 0,
        notStarted: 0,
        inProgress: 0,
        completed: 0,
        overdue: 0,
        revoked: 0
      };
    }

    const now = new Date();
    let notStarted = 0;
    let inProgress = 0;
    let completed = 0;
    let overdue = 0;
    let revoked = 0;

    data.forEach((row: any) => {
      const status = row.status || 'NOT_STARTED';
      if (status === 'REVOKED') {
        revoked++;
        return;
      }
      if (status === 'COMPLETED') {
        completed++;
        return;
      }

      // Check overdue
      if (row.due_date) {
        const dueDate = new Date(row.due_date);
        if (dueDate < now) {
          overdue++;
          return;
        }
      }

      if (status === 'IN_PROGRESS') {
        inProgress++;
      } else {
        notStarted++;
      }
    });

    return {
      total: data.length,
      notStarted,
      inProgress,
      completed,
      overdue,
      revoked
    };
  } catch (err) {
    console.warn('Exception in fetchAssignmentStats:', err);
    return {
      total: 0,
      notStarted: 0,
      inProgress: 0,
      completed: 0,
      overdue: 0,
      revoked: 0
    };
  }
}

/**
 * Calculate bulk assignment preview audience:
 * Identifies eligible employees, already assigned employees, and excluded ones.
 */
export async function calculateBulkAssignmentAudience(
  courseId: string | number,
  filters: BulkAudienceFilters
): Promise<BulkAssignmentPreviewResult> {
  const client = getSupabaseClient();

  // 1. Fetch active employees matching role and locations
  let empQuery = client
    .from('employees')
    .select(`
      id,
      employee_id,
      full_name,
      email,
      mobile_number,
      role_id,
      location_id,
      employment_status,
      skillup_access,
      roles ( name ),
      locations ( name, city )
    `)
    .eq('employment_status', 'ACTIVE')
    .eq('skillup_access', 'ENABLED');

  if (filters.roleId && filters.roleId !== 'ALL') {
    empQuery = empQuery.eq('role_id', Number(filters.roleId));
  }

  if (filters.locationIds && filters.locationIds.length > 0) {
    empQuery = empQuery.in('location_id', filters.locationIds.map(Number));
  }

  const { data: matchedEmployees, error: empErr } = await empQuery;
  if (empErr) {
    throw new Error(`Failed to query audience employees: ${empErr.message}`);
  }

  const allMatched: Employee[] = (matchedEmployees || []).map((row: any) => ({
    id: row.id,
    employee_id: row.employee_id,
    full_name: row.full_name,
    email: row.email,
    mobile_number: row.mobile_number,
    role_id: row.role_id,
    location_id: row.location_id,
    employment_status: row.employment_status,
    skillup_access: row.skillup_access,
    created_at: '',
    updated_at: '',
    role_name: row.roles?.name || `Role #${row.role_id}`,
    location_name: row.locations?.city || row.locations?.name || `Location #${row.location_id}`
  }));

  // 2. Fetch existing assignments for this course to prevent duplicates
  const { data: existingAssignments, error: assignErr } = await client
    .from('course_assignments')
    .select('id, course_id, employee_id, status, due_date, created_at')
    .eq('course_id', courseId);

  if (assignErr) {
    console.warn('Note checking existing assignments:', assignErr.message);
  }

  // course_assignments.employee_id is a uuid FK to employees.id — never the
  // employees.employee_id business code — so the dedup map must be keyed on
  // employees.id on both sides.
  const existingMap = new Map<string, any>();
  (existingAssignments || []).forEach((a: any) => {
    // Only active assignments count as already assigned; revoked ones can be reassigned
    if (a.status !== 'REVOKED') {
      existingMap.set(String(a.employee_id).toUpperCase(), a);
    }
  });

  const eligibleEmployees: Employee[] = [];
  const alreadyAssignedEmployees: { employee: Employee; assignment: CourseAssignment }[] = [];
  const excludedEmployees: { employee: Employee; reason: string }[] = [];

  allMatched.forEach(emp => {
    const key = String(emp.id).toUpperCase();
    if (existingMap.has(key)) {
      alreadyAssignedEmployees.push({
        employee: emp,
        assignment: existingMap.get(key)
      });
    } else {
      eligibleEmployees.push(emp);
    }
  });

  return {
    eligibleEmployees,
    alreadyAssignedEmployees,
    excludedEmployees,
    newAssignmentsCount: eligibleEmployees.length
  };
}

/**
 * Assign a single course to an employee.
 * Strictly validates course publication, employee eligibility, and prevents duplicate active assignments.
 */
export async function assignCourseIndividual(input: CreateIndividualAssignmentInput): Promise<CourseAssignment> {
  const client = getSupabaseClient();

  // 1. Verify Course is Published & Active
  const { data: course, error: courseErr } = await client
    .from('courses')
    .select('id, title, is_active, status')
    .eq('id', input.courseId)
    .single();

  if (courseErr || !course) {
    throw new Error('Course not found.');
  }

  if (!course.is_active || course.status === 'DRAFT') {
    throw new Error('Only PUBLISHED and Active courses can be assigned to learners.');
  }

  // 2. Verify Employee is Active & Enabled
  const { data: employee, error: empErr } = await client
    .from('employees')
    .select('id, employee_id, full_name, email, employment_status, skillup_access')
    .or(`employee_id.eq.${input.employeeId},id.eq.${input.employeeId}`)
    .single();

  if (empErr || !employee) {
    throw new Error(`Employee '${input.employeeId}' was not found in employee master.`);
  }

  if (employee.employment_status !== 'ACTIVE') {
    throw new Error(`Cannot assign learning track: Employee ${employee.full_name} is currently INACTIVE.`);
  }

  if (employee.skillup_access !== 'ENABLED') {
    throw new Error(`Cannot assign learning track: SkillUp access is DISABLED for ${employee.full_name}.`);
  }

  // 3. Due date validation
  if (input.dueDate) {
    const due = new Date(input.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (due < today) {
      throw new Error('Due Date cannot be earlier than today.');
    }
  }

  // 4. Duplicate Check
  // course_assignments.employee_id is a uuid FK to employees.id — never the
  // employees.employee_id business code. employee.employee_id remains available
  // separately below for human-readable error/audit messages.
  const empTargetId = String(employee.id);
  const { data: existing, error: existErr } = await client
    .from('course_assignments')
    .select('id, status')
    .eq('course_id', input.courseId)
    .eq('employee_id', empTargetId)
    .maybeSingle();

  if (existing && existing.status !== 'REVOKED') {
    throw new Error(`Course "${course.title}" is already assigned to ${employee.full_name} (${employee.employee_id}).`);
  }

  // 5. Get current authenticated admin identity
  const { data: { user } } = await client.auth.getUser();
  const adminEmail = user?.email || 'admin@rupeek.com';
  const nowIso = new Date().toISOString();

  // 6. Insert Assignment
  const assignmentPayload: any = {
    course_id: input.courseId,
    employee_id: empTargetId,
    assigned_by: adminEmail,
    assigned_at: nowIso,
    due_date: input.dueDate || null,
    status: 'NOT_STARTED',
    is_mandatory: Boolean(input.isMandatory),
    progress_percentage: 0,
    created_at: nowIso,
    updated_at: nowIso
  };

  const { data: createdAssignment, error: insertErr } = await client
    .from('course_assignments')
    .insert([assignmentPayload])
    .select('id, course_id, employee_id, assigned_by, assigned_at, due_date, status, is_mandatory, progress_percentage, created_at, updated_at')
    .single();

  if (insertErr || !createdAssignment) {
    console.error('Error inserting assignment in public.course_assignments:', insertErr);
    throw new Error(`Database error: ${insertErr?.message}`);
  }

  // 7. Audit Log
  await createAuditLog({
    action: 'COURSE_ASSIGNED',
    entity_type: 'COURSE_ASSIGNMENT',
    entity_id: String(createdAssignment.id),
    details: {
      courseId: input.courseId,
      courseTitle: course.title,
      employeeId: employee.employee_id,
      employeeName: employee.full_name,
      dueDate: input.dueDate,
      isMandatory: input.isMandatory,
      assignedBy: adminEmail
    }
  });

  return {
    id: createdAssignment.id,
    course_id: createdAssignment.course_id,
    employee_id: createdAssignment.employee_id,
    assigned_by: createdAssignment.assigned_by,
    assigned_at: createdAssignment.assigned_at,
    due_date: createdAssignment.due_date,
    status: createdAssignment.status,
    is_mandatory: createdAssignment.is_mandatory,
    progress_percentage: createdAssignment.progress_percentage || 0,
    created_at: createdAssignment.created_at,
    updated_at: createdAssignment.updated_at,
    course,
    employee
  };
}

/**
 * Bulk assign course to a cohort of employees in a single atomic database operation.
 */
export async function assignCourseBulk(input: CreateBulkAssignmentInput): Promise<{
  successCount: number;
  courseTitle: string;
}> {
  const client = getSupabaseClient();

  if (!input.employeeIds || input.employeeIds.length === 0) {
    throw new Error('No eligible employees selected for bulk assignment.');
  }

  // 1. Verify Course is Published & Active
  const { data: course, error: courseErr } = await client
    .from('courses')
    .select('id, title, is_active, status')
    .eq('id', input.courseId)
    .single();

  if (courseErr || !course) {
    throw new Error('Course not found.');
  }

  if (!course.is_active || course.status === 'DRAFT') {
    throw new Error('Only PUBLISHED and Active courses can be assigned.');
  }

  // 2. Due date validation
  if (input.dueDate) {
    const due = new Date(input.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (due < today) {
      throw new Error('Due Date cannot be earlier than today.');
    }
  }

  // 3. Fetch all target employees to verify active & enabled
  const { data: targetEmployees, error: empErr } = await client
    .from('employees')
    .select('id, employee_id, full_name, email, employment_status, skillup_access')
    .in('employee_id', input.employeeIds);

  if (empErr) {
    throw new Error(`Failed to verify target employees: ${empErr.message}`);
  }

  const validEmployees = (targetEmployees || []).filter(
    (e: any) => e.employment_status === 'ACTIVE' && e.skillup_access === 'ENABLED'
  );

  if (validEmployees.length === 0) {
    throw new Error('None of the selected employees are active with enabled SkillUp access.');
  }

  // 4. Query existing assignments to eliminate duplicates.
  // course_assignments.employee_id is a uuid FK to employees.id — never the
  // employees.employee_id business code — so both the lookup and the
  // dedup-set comparison below must key on employees.id.
  const { data: existingAssignments } = await client
    .from('course_assignments')
    .select('employee_id, status')
    .eq('course_id', input.courseId)
    .in('employee_id', validEmployees.map((e: any) => e.id));

  const alreadyAssignedSet = new Set(
    (existingAssignments || [])
      .filter((a: any) => a.status !== 'REVOKED')
      .map((a: any) => String(a.employee_id).toUpperCase())
  );

  const finalEmployeesToAssign = validEmployees.filter(
    (e: any) => !alreadyAssignedSet.has(String(e.id).toUpperCase())
  );

  if (finalEmployeesToAssign.length === 0) {
    throw new Error('All selected employees already have active assignments for this course.');
  }

  // 5. Get current authenticated admin identity
  const { data: { user } } = await client.auth.getUser();
  const adminEmail = user?.email || 'admin@rupeek.com';
  const nowIso = new Date().toISOString();
  const batchId = `BATCH-${Date.now()}`;

  // 6. Build atomic payload array. employee_id must be the employees.id uuid.
  const payloads = finalEmployeesToAssign.map((emp: any) => ({
    course_id: input.courseId,
    employee_id: emp.id,
    assigned_by: adminEmail,
    assigned_at: nowIso,
    due_date: input.dueDate || null,
    status: 'NOT_STARTED',
    is_mandatory: Boolean(input.isMandatory),
    progress_percentage: 0,
    created_at: nowIso,
    updated_at: nowIso
  }));

  // Atomic bulk insert
  const { error: bulkInsertErr } = await client
    .from('course_assignments')
    .insert(payloads);

  if (bulkInsertErr) {
    console.error('Error during bulk assignment insert:', bulkInsertErr);
    throw new Error(`Bulk assignment failed: ${bulkInsertErr.message}`);
  }

  // 7. Audit Log
  await createAuditLog({
    action: 'COURSE_BULK_ASSIGNED',
    entity_type: 'COURSE_ASSIGNMENT',
    entity_id: batchId,
    details: {
      courseId: input.courseId,
      courseTitle: course.title,
      totalAssigned: payloads.length,
      dueDate: input.dueDate,
      isMandatory: input.isMandatory,
      audienceDescription: input.audienceDescription || 'Custom Audience',
      assignedBy: adminEmail,
      // Business employee_id codes are logged here for human-readable audit
      // trail; the actual DB payload above uses employees.id (uuid).
      employeeIds: finalEmployeesToAssign.map((e: any) => e.employee_id)
    }
  });

  return {
    successCount: payloads.length,
    courseTitle: course.title
  };
}

/**
 * Revoke an assignment safely.
 * Sets status to 'REVOKED' without deleting employee, course, or past learning metrics.
 */
export async function revokeCourseAssignment(
  assignmentId: string | number,
  reason?: string
): Promise<void> {
  const client = getSupabaseClient();

  // 1. Fetch current assignment for audit details
  const { data: current, error: getErr } = await client
    .from('course_assignments')
    .select('id, course_id, employee_id, status, courses(title)')
    .eq('id', assignmentId)
    .single();

  if (getErr || !current) {
    throw new Error('Assignment not found.');
  }

  const { data: { user } } = await client.auth.getUser();
  const adminEmail = user?.email || 'admin@rupeek.com';
  const nowIso = new Date().toISOString();

  // 2. Update status to REVOKED
  const { error: updateErr } = await client
    .from('course_assignments')
    .update({
      status: 'REVOKED',
      updated_at: nowIso
    })
    .eq('id', assignmentId);

  if (updateErr) {
    console.error('Error revoking assignment:', updateErr);
    throw new Error(`Failed to revoke assignment: ${updateErr.message}`);
  }

  // 3. Audit Log
  await createAuditLog({
    action: 'COURSE_ASSIGNMENT_REVOKED',
    entity_type: 'COURSE_ASSIGNMENT',
    entity_id: String(assignmentId),
    details: {
      assignmentId,
      courseId: current.course_id,
      courseTitle: (current as any).courses?.title,
      employeeId: current.employee_id,
      revokedBy: adminEmail,
      reason: reason || 'Administrative Revocation'
    }
  });
}

// ============================================================================
// PHASE 2D: EMPLOYEE LEARNING PORTAL & CURRICULUM PLAYER INTEGRATIONS
// Single source of truth: PostgreSQL public schema with strict access enforcement
// ============================================================================

export interface EmployeeVerificationResult {
  employee: Employee | null;
  accessStatus: 'ALLOWED' | 'DISABLED' | 'INACTIVE' | 'NOT_FOUND';
  reason?: string;
}

/**
 * Verify employee identity and access status from public.employees
 * Maps authenticated user via auth_user_id (auth.uid()) or verified email.
 * Enforces: employment_status = 'ACTIVE' AND skillup_access = 'ENABLED'
 */
export async function verifyEmployeeUser(
  email: string,
  authUserId?: string
): Promise<EmployeeVerificationResult> {
  const client = getSupabaseClient();
  const cleanEmail = email.trim().toLowerCase();

  try {
    let query = client
      .from('employees')
      .select('id, employee_id, full_name, email, mobile_number, role_id, location_id, employment_status, skillup_access, auth_user_id, reporting_manager_employee_id, reporting_manager_name, created_at, updated_at, roles(id, name), locations(id, name, city)');

    if (authUserId) {
      query = query.or(`auth_user_id.eq.${authUserId},email.ilike.${cleanEmail}`);
    } else {
      query = query.ilike('email', cleanEmail);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.warn('Error querying public.employees for learner verification:', error.message);
      return { employee: null, accessStatus: 'NOT_FOUND', reason: error.message };
    }

    if (!data) {
      return { employee: null, accessStatus: 'NOT_FOUND', reason: 'Employee profile not found in directory.' };
    }

    const employee: Employee = {
      id: data.id,
      employee_id: data.employee_id,
      full_name: data.full_name,
      email: data.email,
      mobile_number: data.mobile_number,
      role_id: data.role_id,
      location_id: data.location_id,
      employment_status: data.employment_status,
      skillup_access: data.skillup_access,
      reporting_manager_employee_id: data.reporting_manager_employee_id,
      reporting_manager_name: data.reporting_manager_name,
      created_at: data.created_at,
      updated_at: data.updated_at,
      role_name: (data as any).roles?.name || (data.role_id ? `Role #${data.role_id}` : 'Unassigned'),
      location_name: (data as any).locations?.city || (data as any).locations?.name || (data.location_id ? `Location #${data.location_id}` : 'Unassigned')
    };

    // Check employment status
    if (employee.employment_status !== 'ACTIVE') {
      return {
        employee,
        accessStatus: 'INACTIVE',
        reason: 'Your employee profile is currently marked as INACTIVE. Learning portal access is unavailable.'
      };
    }

    // Check SkillUp access
    if (employee.skillup_access !== 'ENABLED') {
      return {
        employee,
        accessStatus: 'DISABLED',
        reason: 'Your SkillUp learning access is currently disabled. Please contact your administrator.'
      };
    }

    return {
      employee,
      accessStatus: 'ALLOWED'
    };
  } catch (err: any) {
    console.error('Exception in verifyEmployeeUser:', err);
    return { employee: null, accessStatus: 'NOT_FOUND', reason: err?.message || 'Verification exception' };
  }
}

/**
 * Fetch live learning dashboard KPIs for the authenticated employee
 * Computes strictly from actual assignment records.
 * Overdue is dynamically derived (due_date < current date AND status != 'COMPLETED' AND status != 'REVOKED').
 *
 * `employeeIdentifier` must be the employees.id UUID — course_assignments.employee_id
 * is a uuid FK to employees.id, not the employees.employee_id business code.
 */
export async function fetchLearnerDashboardStats(employeeIdentifier: string): Promise<LearnerDashboardStats> {
  const client = getSupabaseClient();
  const cleanId = employeeIdentifier.trim();

  try {
    const { data, error } = await client
      .from('course_assignments')
      .select('id, due_date, status, is_mandatory')
      .eq('employee_id', cleanId);

    if (error || !data) {
      console.warn('Error fetching learner dashboard stats:', error?.message);
      return {
        mandatoryCourses: 0,
        optionalCourses: 0,
        notStarted: 0,
        inProgress: 0,
        completed: 0,
        overdue: 0
      };
    }

    const now = new Date();
    let mandatoryCourses = 0;
    let optionalCourses = 0;
    let notStarted = 0;
    let inProgress = 0;
    let completed = 0;
    let overdue = 0;

    data.forEach((row: any) => {
      // Ignore REVOKED assignments for active metrics
      if (row.status === 'REVOKED') return;

      if (row.is_mandatory) {
        mandatoryCourses++;
      } else {
        optionalCourses++;
      }

      if (row.status === 'COMPLETED') {
        completed++;
      } else if (row.status === 'IN_PROGRESS') {
        inProgress++;
      } else {
        notStarted++;
      }

      // Check dynamic overdue
      if (row.due_date && row.status !== 'COMPLETED') {
        const dueDate = new Date(row.due_date);
        if (dueDate < now) {
          overdue++;
        }
      }
    });

    return {
      mandatoryCourses,
      optionalCourses,
      notStarted,
      inProgress,
      completed,
      overdue
    };
  } catch (err) {
    console.error('Exception in fetchLearnerDashboardStats:', err);
    return {
      mandatoryCourses: 0,
      optionalCourses: 0,
      notStarted: 0,
      inProgress: 0,
      completed: 0,
      overdue: 0
    };
  }
}

/**
 * Fetch all active courses assigned to the authenticated employee (/learn/courses)
 * Filters strictly to status != 'REVOKED'.
 *
 * `employeeIdentifier` must be the employees.id UUID — course_assignments.employee_id
 * is a uuid FK to employees.id, not the employees.employee_id business code.
 */
export async function fetchLearnerCourses(employeeIdentifier: string): Promise<CourseAssignment[]> {
  const client = getSupabaseClient();
  const cleanId = employeeIdentifier.trim();

  try {
    const { data, error } = await client
      .from('course_assignments')
      .select(`
        id,
        course_id,
        employee_id,
        assigned_by,
        assigned_at,
        due_date,
        status,
        is_mandatory,
        progress_percentage,
        completed_at,
        created_at,
        updated_at,
        courses (
          id,
          title,
          code,
          description,
          category,
          difficulty,
          estimated_duration_minutes,
          thumbnail_url,
          is_active,
          status
        )
      `)
      .eq('employee_id', cleanId)
      .neq('status', 'REVOKED')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching learner courses:', error.message);
      return [];
    }

    const now = new Date();

    return (data || []).map((row: any) => {
      let status = row.status || 'NOT_STARTED';

      if (row.due_date && status !== 'COMPLETED') {
        const dueDate = new Date(row.due_date);
        if (dueDate < now) {
          status = 'OVERDUE';
        }
      }

      const crs: Course = row.courses ? {
        id: row.courses.id,
        title: row.courses.title,
        code: row.courses.code,
        description: row.courses.description,
        category: row.courses.category || 'General',
        difficulty: row.courses.difficulty || 'Intermediate',
        estimated_duration_minutes: row.courses.estimated_duration_minutes || 30,
        thumbnail_url: row.courses.thumbnail_url,
        is_active: Boolean(row.courses.is_active),
        status: row.courses.status || 'PUBLISHED',
        created_at: '',
        updated_at: ''
      } : {
        id: row.course_id,
        title: 'Assigned Course',
        is_active: true
      };

      return {
        id: row.id,
        course_id: row.course_id,
        employee_id: row.employee_id,
        assigned_by: row.assigned_by,
        assigned_at: row.assigned_at || row.created_at,
        due_date: row.due_date,
        status: status as any,
        is_mandatory: row.is_mandatory !== undefined ? Boolean(row.is_mandatory) : true,
        progress_percentage: row.progress_percentage || 0,
        completed_at: row.completed_at,
        created_at: row.created_at,
        updated_at: row.updated_at,
        course: crs
      };
    });
  } catch (err) {
    console.error('Exception in fetchLearnerCourses:', err);
    return [];
  }
}

/**
 * Fetch full curriculum for a course for the authenticated employee.
 * CRITICAL ACCESS CONTROL:
 * 1. Verifies that the authenticated employee has an active assignment for courseId (status != 'REVOKED').
 * 2. OMITS `is_correct` field from all quiz options payload to prevent client-side answer inspection.
 * 3. Fetches lesson progress and quiz attempts for this learner.
 *
 * `employeeIdentifier` must be the employees.id UUID. course_assignments.employee_id,
 * lesson_progress.employee_id, and quiz_attempts.employee_id are all uuid FKs to
 * employees.id — never the employees.employee_id business code.
 */
export async function fetchLearnerCourseCurriculum(
  courseId: string | number,
  employeeIdentifier: string
): Promise<{
  assignment: CourseAssignment;
  course: Course;
  learnerQuizzes: LearnerQuiz[];
  completedLessonIds: string[];
  completedQuizIds: string[];
  quizAttempts: QuizAttempt[];
}> {
  const client = getSupabaseClient();
  const cleanEmpId = employeeIdentifier.trim();

  // 1. Verify Active Assignment
  const { data: assignmentData, error: assignErr } = await client
    .from('course_assignments')
    .select(`
      id,
      course_id,
      employee_id,
      assigned_by,
      assigned_at,
      due_date,
      status,
      is_mandatory,
      progress_percentage,
      completed_at,
      created_at,
      updated_at
    `)
    .eq('course_id', courseId)
    .eq('employee_id', cleanEmpId)
    .neq('status', 'REVOKED')
    .maybeSingle();

  if (assignErr || !assignmentData) {
    throw new Error('Access Denied: You do not have an active assignment for this course.');
  }

  // 2. Fetch Course Structure (modules & lessons)
  const { data: courseData, error: courseErr } = await client
    .from('courses')
    .select('id, title, code, description, category, difficulty, estimated_duration_minutes, thumbnail_url, is_active, status, created_at, updated_at')
    .eq('id', courseId)
    .single();

  if (courseErr || !courseData) {
    throw new Error('Course curriculum not found.');
  }

  // Fetch modules
  const { data: rawModules } = await client
    .from('modules')
    .select('id, course_id, title, description, sequence_order, is_active')
    .eq('course_id', courseId)
    .order('sequence_order', { ascending: true, nullsFirst: false });

  const modulesList = rawModules || [];
  const moduleIds = modulesList.map((m: any) => m.id);

  // Fetch lessons for all modules
  let lessonsByModule = new Map<string | number, Lesson[]>();
  let allLessonIds: Array<string | number> = [];

  if (moduleIds.length > 0) {
    const { data: rawLessons } = await client
      .from('lessons')
      .select('id, module_id, title, content_type, content_text, video_url, pdf_url, duration_minutes, sequence_order, is_active, created_at, updated_at')
      .in('module_id', moduleIds)
      .order('sequence_order', { ascending: true, nullsFirst: false });

    (rawLessons || []).forEach((l: any) => {
      allLessonIds.push(l.id);
      const list = lessonsByModule.get(l.module_id) || [];
      list.push({
        id: l.id,
        module_id: l.module_id,
        title: l.title,
        content_type: l.content_type || 'TEXT',
        content_text: l.content_text,
        video_url: l.video_url,
        pdf_url: l.pdf_url,
        duration_minutes: l.duration_minutes || 5,
        sequence_order: l.sequence_order || 1,
        is_active: l.is_active !== undefined ? l.is_active : true,
        created_at: l.created_at,
        updated_at: l.updated_at
      });
      lessonsByModule.set(l.module_id, list);
    });
  }

  // 3. Fetch quizzes for this course's lessons.
  // SCHEMA: quizzes has no course_id/module_id column — the real FK is
  // quizzes.lesson_id -> lessons.id, and a quiz's module is only reachable
  // by walking lesson -> module. Query by the already-known allLessonIds
  // (this course's lessons) instead of the previous (incorrect) query that
  // assumed quizzes.course_id/module_id existed.
  let rawQuizzesList: any[] = [];
  try {
    if (allLessonIds.length > 0) {
      const { data: qData } = await client
        .from('quizzes')
        .select('id, lesson_id, title, passing_score, attempts_allowed, lessons(module_id)')
        .in('lesson_id', allLessonIds);
      rawQuizzesList = (qData || []).map((q: any) => ({
        ...q,
        module_id: q.lessons?.module_id
      }));
    }
  } catch (e) {
    console.warn('Error fetching quizzes:', e);
  }

  const quizIds = rawQuizzesList.map((q: any) => q.id);

  // 4. Fetch questions & options via the learner-safe RPC.
  // SECURITY: public.learner_get_course_quiz_questions is a SECURITY DEFINER
  // Postgres function (see supabase/migrations/20260825_phase2d_learner_quiz_security.sql)
  // that re-validates the caller's active assignment for this course and
  // returns rows that never include quiz_options.is_correct. This replaces
  // the previous direct `.from('quiz_options').select(...)` read, which only
  // omitted is_correct at the JS layer — RLS is row-level, not column-level,
  // so that omission alone did not stop a learner session from querying
  // quiz_options directly and receiving the answer key.
  let learnerQuestionsByQuiz = new Map<string | number, LearnerQuizQuestion[]>();

  if (quizIds.length > 0) {
    const { data: rawRows, error: rpcErr } = await client
      .rpc('learner_get_course_quiz_questions', { p_course_id: courseId });

    if (rpcErr) {
      console.warn('learner_get_course_quiz_questions RPC warning:', rpcErr.message);
    }

    let learnerOptionsByQuestion = new Map<string | number, LearnerQuizOption[]>();
    let questionMetaById = new Map<string | number, any>();

    // NOTE: quiz_questions has no points/question_type column (verified
    // schema) — every question is treated as 1 point, single-choice-style
    // set comparison (which also correctly scores multi-select answers),
    // matching how public.learner_submit_quiz_attempt scores server-side.
    (rawRows || []).forEach((row: any) => {
      if (!questionMetaById.has(row.question_id)) {
        questionMetaById.set(row.question_id, row);
      }
      const optList = learnerOptionsByQuestion.get(row.question_id) || [];
      optList.push({
        id: row.option_id,
        question_id: row.question_id,
        option_text: row.option_text,
        sequence_order: row.option_sequence || 1
      });
      learnerOptionsByQuestion.set(row.question_id, optList);
    });

    questionMetaById.forEach((q: any) => {
      const list = learnerQuestionsByQuiz.get(q.quiz_id) || [];
      list.push({
        id: q.question_id,
        quiz_id: q.quiz_id,
        question_text: q.question_text,
        question_type: 'SINGLE_CHOICE',
        points: 1,
        sequence_order: q.question_sequence || 1,
        options: learnerOptionsByQuestion.get(q.question_id) || []
      });
      learnerQuestionsByQuiz.set(q.quiz_id, list);
    });

    learnerQuestionsByQuiz.forEach((list, quizId) => {
      list.sort((a, b) => (a.sequence_order || 1) - (b.sequence_order || 1));
      learnerQuestionsByQuiz.set(quizId, list);
    });
  }

  // 5. Fetch lesson progress for this employee
  let completedLessonIds: string[] = [];
  try {
    let progQuery = client
      .from('lesson_progress')
      .select('lesson_id, status')
      .eq('employee_id', cleanEmpId);

    if (allLessonIds.length > 0) {
      progQuery = progQuery.in('lesson_id', allLessonIds);
    }

    const { data: progData } = await progQuery;
    (progData || []).forEach((p: any) => {
      if (p.status === 'COMPLETED') {
        completedLessonIds.push(String(p.lesson_id));
      }
    });
  } catch (e) {
    console.warn('Lesson progress query warning:', e);
  }

  // 6. Fetch quiz attempts for this employee
  let quizAttempts: QuizAttempt[] = [];
  let completedQuizIds: string[] = [];

  if (quizIds.length > 0) {
    try {
      // quiz_attempts has no max_score/percentage column — only id, quiz_id,
      // employee_id, score, passed, attempt_number, completed_at, created_at
      // are real. quiz_attempts.score stores the percentage (0-100), per the
      // Phase 2D migration's documented decision (Revision 3), so it is used
      // directly as the historical percentage below.
      const { data: attemptsData } = await client
        .from('quiz_attempts')
        .select('id, quiz_id, employee_id, score, passed, attempt_number, completed_at, created_at')
        .eq('employee_id', cleanEmpId)
        .in('quiz_id', quizIds)
        .order('completed_at', { ascending: false, nullsFirst: false });

      quizAttempts = (attemptsData || []).map((a: any) => ({
        id: a.id,
        quiz_id: a.quiz_id,
        employee_id: a.employee_id,
        score: a.score,
        // score is percentage-scale (0-100); max_score is not a real column
        // and is not read anywhere in the UI, so it's fixed at 100 here
        // purely to satisfy the QuizAttempt type shape.
        max_score: 100,
        percentage: Number(a.score ?? 0),
        passed: Boolean(a.passed),
        attempt_number: a.attempt_number || 1,
        completed_at: a.completed_at || a.created_at,
        created_at: a.created_at
      }));

      // Find quizzes where employee achieved a passing score
      quizAttempts.forEach(att => {
        if (att.passed && !completedQuizIds.includes(String(att.quiz_id))) {
          completedQuizIds.push(String(att.quiz_id));
        }
      });
    } catch (e) {
      console.warn('Quiz attempts query warning:', e);
    }
  }

  // Assemble learner quizzes
  const learnerQuizzes: LearnerQuiz[] = rawQuizzesList.map((q: any) => {
    const attempts = quizAttempts.filter(a => String(a.quiz_id) === String(q.id));
    const bestAttempt = attempts.length > 0 
      ? [...attempts].sort((a, b) => b.percentage - a.percentage)[0] 
      : null;

    return {
      id: q.id,
      course_id: q.course_id,
      module_id: q.module_id,
      title: q.title,
      description: q.description,
      passing_score: q.passing_score ?? 70,
      time_limit_minutes: q.time_limit_minutes,
      is_active: q.is_active !== undefined ? q.is_active : true,
      questions: learnerQuestionsByQuiz.get(q.id) || [],
      bestAttempt,
      attemptsCount: attempts.length,
      hasPassed: completedQuizIds.includes(String(q.id))
    };
  });

  // Assemble modules with lessons & quizzes
  const modules: Module[] = modulesList.map((m: any) => ({
    id: m.id,
    course_id: m.course_id,
    title: m.title,
    description: m.description,
    sequence_order: m.sequence_order || 1,
    is_active: m.is_active !== undefined ? m.is_active : true,
    lessons: lessonsByModule.get(m.id) || [],
    quizzes: []
  }));

  const totalLessons = modules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0);

  const course: Course = {
    id: courseData.id,
    title: courseData.title,
    code: courseData.code,
    description: courseData.description,
    category: courseData.category || 'General',
    difficulty: courseData.difficulty || 'Intermediate',
    estimated_duration_minutes: courseData.estimated_duration_minutes || 30,
    thumbnail_url: courseData.thumbnail_url,
    is_active: Boolean(courseData.is_active),
    status: courseData.status || 'PUBLISHED',
    created_at: courseData.created_at,
    updated_at: courseData.updated_at,
    modules_count: modules.length,
    lessons_count: totalLessons,
    quizzes_count: learnerQuizzes.length,
    modules
  };

  const assignment: CourseAssignment = {
    id: assignmentData.id,
    course_id: assignmentData.course_id,
    employee_id: assignmentData.employee_id,
    assigned_by: assignmentData.assigned_by,
    assigned_at: assignmentData.assigned_at,
    due_date: assignmentData.due_date,
    status: assignmentData.status,
    is_mandatory: assignmentData.is_mandatory !== undefined ? Boolean(assignmentData.is_mandatory) : true,
    progress_percentage: assignmentData.progress_percentage || 0,
    completed_at: assignmentData.completed_at,
    created_at: assignmentData.created_at,
    updated_at: assignmentData.updated_at,
    course
  };

  return {
    assignment,
    course,
    learnerQuizzes,
    completedLessonIds,
    completedQuizIds,
    quizAttempts
  };
}

/**
 * Mark a lesson as completed for the authenticated employee.
 * Writes to public.lesson_progress and updates public.course_assignments.
 * Recalculates real progress percentage and completes course if 100%.
 *
 * `employeeIdentifier` must be the employees.id UUID. course_assignments.employee_id,
 * lesson_progress.employee_id, and course_completions.employee_id are all uuid FKs to
 * employees.id — never the employees.employee_id business code. `lessonId` must be a
 * real lesson_progress.lesson_id UUID (never a fabricated value such as 0).
 */
export async function markLessonCompleted(
  courseId: string | number,
  lessonId: string | number,
  employeeIdentifier: string
): Promise<{
  progressPercentage: number;
  isCourseCompleted: boolean;
  status: AssignmentStatus;
}> {
  const client = getSupabaseClient();
  const cleanEmpId = employeeIdentifier.trim();
  const nowIso = new Date().toISOString();

  // 1. Verify Active Assignment
  const { data: assignment, error: assignErr } = await client
    .from('course_assignments')
    .select('id, course_id, employee_id, status, progress_percentage')
    .eq('course_id', courseId)
    .eq('employee_id', cleanEmpId)
    .neq('status', 'REVOKED')
    .single();

  if (assignErr || !assignment) {
    throw new Error('Unauthorized: No active course assignment found.');
  }

  // 2. Insert or update lesson_progress
  const progressRecord = {
    assignment_id: assignment.id,
    employee_id: cleanEmpId,
    lesson_id: lessonId,
    status: 'COMPLETED',
    completed_at: nowIso,
    updated_at: nowIso
  };

  // Upsert progress
  const { error: progErr } = await client
    .from('lesson_progress')
    .upsert(progressRecord, { onConflict: 'employee_id,lesson_id' });

  if (progErr) {
    console.warn('Upsert lesson_progress warning, trying insert fallback:', progErr.message);
    await client
      .from('lesson_progress')
      .insert([progressRecord]);
  }

  // 3. Compute actual course completion & progress percentage
  // Get all module IDs for this course
  const { data: modulesData } = await client
    .from('modules')
    .select('id')
    .eq('course_id', courseId);

  const mIds = (modulesData || []).map((m: any) => m.id);

  // Get total lessons count
  let totalLessonsCount = 0;
  let allLessonIds: Array<string | number> = [];
  if (mIds.length > 0) {
    const { data: allLessons } = await client
      .from('lessons')
      .select('id')
      .in('module_id', mIds);

    allLessonIds = (allLessons || []).map((l: any) => l.id);
    totalLessonsCount = allLessonIds.length;
  }

  // Get total quizzes count
  let totalQuizzesCount = 0;
  let allQuizIds: Array<string | number> = [];
  try {
    let qQuery = client.from('quizzes').select('id');
    if (mIds.length > 0) {
      qQuery = qQuery.or(`course_id.eq.${courseId},module_id.in.(${mIds.join(',')})`);
    } else {
      qQuery = qQuery.eq('course_id', courseId);
    }
    const { data: quizzesData } = await qQuery;
    allQuizIds = (quizzesData || []).map((q: any) => q.id);
    totalQuizzesCount = allQuizIds.length;
  } catch (e) {
    console.warn('Quizzes count warning:', e);
  }

  const totalCourseItems = Math.max(1, totalLessonsCount + totalQuizzesCount);

  // Count completed lessons for this employee
  let completedLessonsCount = 0;
  if (allLessonIds.length > 0) {
    const { data: userLessons } = await client
      .from('lesson_progress')
      .select('lesson_id')
      .eq('employee_id', cleanEmpId)
      .eq('status', 'COMPLETED')
      .in('lesson_id', allLessonIds);

    const distinctLessons = new Set((userLessons || []).map((l: any) => String(l.lesson_id)));
    completedLessonsCount = distinctLessons.size;
  }

  // Count passed quizzes for this employee
  let passedQuizzesCount = 0;
  if (allQuizIds.length > 0) {
    const { data: userQuizzes } = await client
      .from('quiz_attempts')
      .select('quiz_id')
      .eq('employee_id', cleanEmpId)
      .eq('passed', true)
      .in('quiz_id', allQuizIds);

    const distinctQuizzes = new Set((userQuizzes || []).map((q: any) => String(q.quiz_id)));
    passedQuizzesCount = distinctQuizzes.size;
  }

  const completedItems = completedLessonsCount + passedQuizzesCount;
  const newProgress = Math.min(100, Math.round((completedItems / totalCourseItems) * 100));

  const isCompleted = (completedLessonsCount >= totalLessonsCount && passedQuizzesCount >= totalQuizzesCount);
  const newStatus: AssignmentStatus = isCompleted ? 'COMPLETED' : 'IN_PROGRESS';

  // 4. Update assignment
  const updatePayload: any = {
    progress_percentage: newProgress,
    status: newStatus,
    updated_at: nowIso
  };

  if (isCompleted && assignment.status !== 'COMPLETED') {
    updatePayload.completed_at = nowIso;
  }

  await client
    .from('course_assignments')
    .update(updatePayload)
    .eq('id', assignment.id);

  // 5. If course completed, insert record in public.course_completions
  if (isCompleted && assignment.status !== 'COMPLETED') {
    try {
      const { data: existingCompletion } = await client
        .from('course_completions')
        .select('id')
        .eq('course_id', courseId)
        .eq('employee_id', cleanEmpId)
        .maybeSingle();

      if (!existingCompletion) {
        await client
          .from('course_completions')
          .insert([{
            course_id: courseId,
            employee_id: cleanEmpId,
            assignment_id: assignment.id,
            completed_at: nowIso,
            created_at: nowIso
          }]);
      }
    } catch (e) {
      console.warn('Note during course_completions insert:', e);
    }
  }

  return {
    progressPercentage: newProgress,
    isCourseCompleted: isCompleted,
    status: newStatus
  };
}

/**
 * Submit Quiz Attempt securely.
 *
 * SECURITY: All authorization (employee lookup, ACTIVE/ENABLED check,
 * non-REVOKED assignment ownership, quiz-belongs-to-assigned-course check
 * via quizzes.lesson_id -> lessons.module_id -> modules.course_id) and all
 * scoring (including reading quiz_options.is_correct) happen entirely
 * inside the `learner_submit_quiz_attempt` SECURITY DEFINER Postgres
 * function — see supabase/migrations/20260825_phase2d_learner_quiz_security.sql.
 * The RPC re-derives the caller's employee identity from
 * employees.auth_user_id = auth.uid(); it never trusts `employeeIdentifier`
 * for authorization (kept as a parameter only for signature compatibility
 * with existing call sites — it is otherwise unused here).
 *
 * BUG FIX: this function previously followed up a passed attempt with
 * markLessonCompleted(courseId, 0, employeeId) — an invalid call, since
 * lesson_progress.lesson_id is `uuid NOT NULL` and 0 is not a real lesson.
 * The RPC now performs the equivalent lesson_progress/course_assignments/
 * course_completions update itself, using the quiz's REAL lesson uuid
 * (resolved server-side via quizzes.lesson_id) — no fabricated ID is used,
 * and no separate client-side follow-up call is needed.
 */
export async function submitQuizAttempt(
  payload: QuizSubmissionPayload,
  employeeIdentifier: string
): Promise<QuizSubmissionResult> {
  const client = getSupabaseClient();
  void employeeIdentifier; // retained for call-site compatibility only; see comment above

  const { data, error } = await client.rpc('learner_submit_quiz_attempt', {
    p_quiz_id: payload.quizId,
    p_course_id: payload.courseId,
    p_assignment_id: payload.assignmentId,
    p_answers: payload.answers
  });

  if (error || !data) {
    throw new Error(error?.message || 'Failed to submit quiz attempt.');
  }

  return {
    attemptId: data.attemptId,
    score: data.score,
    maxScore: data.maxScore,
    percentage: data.percentage,
    passed: Boolean(data.passed),
    passingScore: data.passingScore,
    attemptNumber: data.attemptNumber,
    courseProgressUpdated: data.courseProgressUpdated,
    isCourseCompleted: Boolean(data.isCourseCompleted),
    feedback: data.feedback || []
  };
}

/**
 * Fetch My Learning History for the authenticated employee (/learn/history)
 * Real records from public.course_assignments and public.course_completions.
 *
 * `employeeIdentifier` must be the employees.id UUID — course_assignments.employee_id
 * is a uuid FK to employees.id, not the employees.employee_id business code.
 */
export async function fetchLearnerHistory(employeeIdentifier: string): Promise<CourseAssignment[]> {
  const client = getSupabaseClient();
  const cleanEmpId = employeeIdentifier.trim();

  try {
    const { data, error } = await client
      .from('course_assignments')
      .select(`
        id,
        course_id,
        employee_id,
        assigned_by,
        assigned_at,
        due_date,
        status,
        is_mandatory,
        progress_percentage,
        completed_at,
        created_at,
        updated_at,
        courses (
          id,
          title,
          code,
          category,
          estimated_duration_minutes,
          thumbnail_url
        )
      `)
      .eq('employee_id', cleanEmpId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching learning history from public.course_assignments:', error.message);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      course_id: row.course_id,
      employee_id: row.employee_id,
      assigned_by: row.assigned_by,
      assigned_at: row.assigned_at || row.created_at,
      due_date: row.due_date,
      status: row.status,
      is_mandatory: row.is_mandatory !== undefined ? Boolean(row.is_mandatory) : true,
      progress_percentage: row.progress_percentage || 0,
      completed_at: row.completed_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
      course: row.courses ? {
        id: row.courses.id,
        title: row.courses.title,
        code: row.courses.code,
        category: row.courses.category || 'General',
        estimated_duration_minutes: row.courses.estimated_duration_minutes || 30,
        thumbnail_url: row.courses.thumbnail_url,
        is_active: true
      } : undefined
    }));
  } catch (err) {
    console.error('Exception in fetchLearnerHistory:', err);
    return [];
  }
}

/**
 * Fetch employee profile details for /learn/profile
 * Exposes only safe attributes.
 */
export async function fetchLearnerProfile(employeeIdentifier: string): Promise<Employee | null> {
  const client = getSupabaseClient();
  const cleanEmpId = employeeIdentifier.trim();

  try {
    const { data, error } = await client
      .from('employees')
      .select('id, employee_id, full_name, email, mobile_number, role_id, location_id, employment_status, skillup_access, reporting_manager_employee_id, reporting_manager_name, created_at, updated_at, roles(id, name), locations(id, name, city)')
      .or(`employee_id.eq.${cleanEmpId},id.eq.${cleanEmpId}`)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      employee_id: data.employee_id,
      full_name: data.full_name,
      email: data.email,
      mobile_number: data.mobile_number,
      role_id: data.role_id,
      location_id: data.location_id,
      employment_status: data.employment_status,
      skillup_access: data.skillup_access,
      reporting_manager_employee_id: data.reporting_manager_employee_id,
      reporting_manager_name: data.reporting_manager_name,
      created_at: data.created_at,
      updated_at: data.updated_at,
      role_name: (data as any).roles?.name || (data.role_id ? `Role #${data.role_id}` : 'Unassigned'),
      location_name: (data as any).locations?.city || (data as any).locations?.name || (data.location_id ? `Location #${data.location_id}` : 'Unassigned')
    };
  } catch (err) {
    console.error('Exception in fetchLearnerProfile:', err);
    return null;
  }
}




