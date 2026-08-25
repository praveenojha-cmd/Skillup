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
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced' | string;
  estimated_duration_minutes?: number;
  thumbnail_url?: string;
  is_active: boolean;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | string;
  created_at?: string;
  updated_at?: string;
  modules_count?: number;
  lessons_count?: number;
  quizzes_count?: number;
  modules?: Module[];
}

export interface Module {
  id: string | number;
  course_id: string | number;
  title: string;
  description?: string;
  sequence_order: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  lessons?: Lesson[];
  quizzes?: Quiz[];
}

export type LessonType = 'VIDEO' | 'PDF' | 'TEXT' | 'ARTICLE';

export interface Lesson {
  id: string | number;
  module_id: string | number;
  title: string;
  content_type: LessonType;
  content_text?: string;
  video_url?: string;
  pdf_url?: string;
  duration_minutes?: number;
  sequence_order: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Quiz {
  id: string | number;
  course_id?: string | number;
  module_id?: string | number;
  title: string;
  description?: string;
  passing_score: number;
  time_limit_minutes?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  questions?: QuizQuestion[];
}

export type QuestionType = 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE';

export interface QuizQuestion {
  id: string | number;
  quiz_id: string | number;
  question_text: string;
  question_type: QuestionType | string;
  points: number;
  explanation?: string;
  sequence_order: number;
  created_at?: string;
  options?: QuizOption[];
}

export interface QuizOption {
  id: string | number;
  question_id: string | number;
  option_text: string;
  is_correct: boolean;
  sequence_order: number;
  created_at?: string;
}

export interface CourseFilters {
  search: string;
  category: string;
  status: string; // 'ALL' | 'PUBLISHED' | 'DRAFT' | 'ACTIVE' | 'INACTIVE'
  sortBy: 'created_at' | 'title' | 'estimated_duration_minutes';
  sortOrder: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

export interface CreateCourseInput {
  title: string;
  code?: string;
  description?: string;
  category?: string;
  difficulty?: string;
  estimated_duration_minutes?: number;
  thumbnail_url?: string;
  is_active?: boolean;
  status?: string;
}

export interface UpdateCourseInput {
  title?: string;
  code?: string;
  description?: string;
  category?: string;
  difficulty?: string;
  estimated_duration_minutes?: number;
  thumbnail_url?: string;
  is_active?: boolean;
  status?: string;
}

export type AssignmentStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE' | 'REVOKED';

export interface CourseAssignment {
  id: string | number;
  course_id: string | number;
  /** employees.id UUID (FK) — NOT the employees.employee_id business code. */
  employee_id: string;
  assigned_by?: string;
  assigned_at?: string;
  due_date?: string | null;
  status: AssignmentStatus;
  is_mandatory?: boolean;
  progress_percentage?: number;
  completed_at?: string | null;
  created_at?: string;
  updated_at?: string;
  course?: Course;
  employee?: Employee;
}

export interface AssignmentFilters {
  search: string;
  courseId: string;
  status: 'ALL' | AssignmentStatus;
  type: 'ALL' | 'MANDATORY' | 'OPTIONAL';
  locationId: string;
  roleId: string;
  page: number;
  pageSize: number;
}

export interface AssignmentStats {
  total: number;
  notStarted: number;
  inProgress: number;
  completed: number;
  overdue: number;
  revoked: number;
}

export interface CreateIndividualAssignmentInput {
  courseId: string | number;
  employeeId: string;
  dueDate: string | null;
  isMandatory: boolean;
}

export interface CreateBulkAssignmentInput {
  courseId: string | number;
  employeeIds: string[];
  dueDate: string | null;
  isMandatory: boolean;
  audienceDescription?: string;
}

export interface BulkAudienceFilters {
  roleId: string; // 'ALL' or specific role_id
  locationIds: string[]; // empty for all, or array of location_ids
  employmentStatus: 'ACTIVE';
  skillUpAccess: 'ENABLED';
}

export interface BulkAssignmentPreviewResult {
  eligibleEmployees: Employee[];
  alreadyAssignedEmployees: { employee: Employee; assignment: CourseAssignment }[];
  excludedEmployees: { employee: Employee; reason: string }[];
  newAssignmentsCount: number;
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

export interface LocationDistribution {
  location_id: string | number;
  location_name: string;
  count: number;
  percentage: number;
}

export interface RoleDistribution {
  role_id: string | number;
  role_name: string;
  count: number;
  percentage: number;
}

export interface EmployeeLearningActivity {
  assignedCount: number;
  completedCount: number;
  inProgressCount: number;
  assignments: Array<{
    id: string | number;
    courseTitle: string;
    status: string;
    progress: number;
  }>;
}

export interface CreateEmployeeInput {
  employee_id: string;
  full_name: string;
  email: string;
  mobile_number?: string | null;
  role_id: number;
  location_id: number;
  reporting_manager_employee_id?: string | null;
  reporting_manager_name?: string | null;
  employment_status: EmploymentStatus;
  skillup_access: SkillUpAccess;
}

export interface UpdateEmployeeInput {
  full_name: string;
  mobile_number?: string | null;
  role_id: number;
  location_id: number;
  reporting_manager_employee_id?: string | null;
  reporting_manager_name?: string | null;
  employment_status: EmploymentStatus;
  skillup_access: SkillUpAccess;
}

export interface BulkImportRow {
  rowNumber: number;
  employee_id: string;
  full_name: string;
  email: string;
  mobile_number: string;
  role_name: string;
  location_name: string;
  reporting_manager_employee_id: string;
  reporting_manager_name: string;
  employment_status: EmploymentStatus;
  skillup_access: SkillUpAccess;
  role_id?: number;
  location_id?: number;
  isValid: boolean;
  errors: string[];
}

export interface BulkImportValidationResult {
  totalRows: number;
  validRows: BulkImportRow[];
  invalidRows: BulkImportRow[];
  duplicateRowsCount: number;
  allErrors: Array<{
    row: number;
    employee_id: string;
    error: string;
  }>;
}

export interface BulkImportSummary {
  totalProcessed: number;
  successfullyImported: number;
  rejectedCount: number;
  errors: Array<{
    employee_id: string;
    error: string;
  }>;
}

export interface AuditLogPayload {
  action: 'EMPLOYEE_CREATED' | 'EMPLOYEE_UPDATED' | 'SKILLUP_ACCESS_ENABLED' | 'SKILLUP_ACCESS_DISABLED' | string;
  entity_type: 'EMPLOYEE' | string;
  entity_id: string;
  previous_values?: Record<string, any> | null;
  new_values?: Record<string, any> | null;
  details?: Record<string, any> | string;
}

// ============================================================
// PHASE 2D: EMPLOYEE LEARNER PORTAL TYPES
// ============================================================

export interface LessonProgress {
  id?: string | number;
  assignment_id?: string | number;
  /** employees.id UUID (FK) — NOT the employees.employee_id business code. */
  employee_id: string;
  /** lesson_progress.lesson_id UUID (FK) — must be a real lessons.id, never a fabricated value. */
  lesson_id: string | number;
  status: 'COMPLETED' | 'IN_PROGRESS';
  completed_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface QuizAttempt {
  id?: string | number;
  quiz_id: string | number;
  /** employees.id UUID (FK) — NOT the employees.employee_id business code. */
  employee_id: string;
  score: number;
  max_score: number;
  percentage: number;
  passed: boolean;
  answers?: Record<string, any> | string;
  attempt_number?: number;
  completed_at?: string;
  created_at?: string;
}

export interface CourseCompletion {
  id?: string | number;
  course_id: string | number;
  /** employees.id UUID (FK) — NOT the employees.employee_id business code. */
  employee_id: string;
  assignment_id?: string | number;
  completed_at: string;
  final_score?: number;
  certificate_url?: string;
  created_at?: string;
  course?: Course;
}

export interface LearnerDashboardStats {
  mandatoryCourses: number;
  optionalCourses: number;
  notStarted: number;
  inProgress: number;
  completed: number;
  overdue: number;
}

export interface LearnerQuizOption {
  id: string | number;
  question_id: string | number;
  option_text: string;
  sequence_order: number;
}

export interface LearnerQuizQuestion {
  id: string | number;
  quiz_id: string | number;
  question_text: string;
  question_type: QuestionType | string;
  points: number;
  sequence_order: number;
  options: LearnerQuizOption[];
}

export interface LearnerQuiz {
  id: string | number;
  course_id?: string | number;
  module_id?: string | number;
  title: string;
  description?: string;
  passing_score: number;
  time_limit_minutes?: number;
  is_active?: boolean;
  questions: LearnerQuizQuestion[];
  bestAttempt?: QuizAttempt | null;
  attemptsCount?: number;
  hasPassed?: boolean;
}

export interface QuizSubmissionPayload {
  quizId: string | number;
  courseId: string | number;
  assignmentId?: string | number;
  answers: Record<string, string | string[]>; // questionId -> selected optionId(s)
}

export interface QuizSubmissionResult {
  attemptId?: string | number;
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  passingScore: number;
  attemptNumber: number;
  courseProgressUpdated?: number;
  isCourseCompleted?: boolean;
  feedback: Array<{
    questionId: string | number;
    questionText: string;
    isCorrect: boolean;
    pointsAwarded: number;
    explanation?: string;
  }>;
}

export interface LearnerCourseDetails {
  assignment: CourseAssignment;
  course: Course;
  completedLessonIds: Set<string | number>;
  completedQuizIds: Set<string | number>;
  quizAttempts: QuizAttempt[];
}


