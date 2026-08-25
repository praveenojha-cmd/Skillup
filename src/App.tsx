import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AdminLayout } from './components/layout/AdminLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { AppRoute } from './types/auth';

const MainRouter: React.FC = () => {
  const { isAuthenticated, isLoading, isSuperAdmin } = useAuth();
  
  // URL Hash or state-based routing
  const getInitialRoute = (): AppRoute => {
    if (typeof window !== 'undefined') {
      const path = window.location.hash.replace('#', '') || window.location.pathname;
      if (['/admin/dashboard', '/admin/employees', '/admin/courses', '/admin/assignments', '/admin/reports', '/admin/admins'].includes(path)) {
        return path as AppRoute;
      }
    }
    return '/admin/dashboard';
  };

  const [currentRoute, setCurrentRoute] = useState<AppRoute>(getInitialRoute);
  const [globalSearch, setGlobalSearch] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.location.hash = currentRoute;
    }
  }, [currentRoute]);

  const handleNavigate = (route: AppRoute) => {
    setCurrentRoute(route);
  };

  // If loading session verification
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#071322] flex items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center font-black text-xl shadow-xl shadow-orange-950/60 mx-auto animate-bounce">
            SK
          </div>
          <div className="text-white font-bold text-sm tracking-wide">SkillUp LMS &bull; Rupeek</div>
          <div className="flex items-center justify-center gap-1.5 text-xs text-orange-400">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span>Verifying Admin Authorization...</span>
          </div>
        </div>
      </div>
    );
  }

  // If not authenticated, render the enterprise login screen
  if (!isAuthenticated) {
    return (
      <LoginPage
        onLoginSuccess={() => setCurrentRoute('/admin/dashboard')}
      />
    );
  }

  // Determine title and subtitle per route
  const getPageInfo = () => {
    switch (currentRoute) {
      case '/admin/dashboard':
        return {
          title: 'Executive Dashboard',
          subtitle: 'Overview of learning health and employee training KPIs'
        };
      case '/admin/employees':
        return {
          title: 'Employee Directory',
          subtitle: 'Manage 813 employee profiles, locations, and SkillUp access'
        };
      case '/admin/courses':
        return {
          title: 'Course Catalog & Curriculum',
          subtitle: 'Gold Loan, sales mastery, appraisal standards, and compliance'
        };
      case '/admin/assignments':
        return {
          title: 'Course Assignments',
          subtitle: 'Assign learning tracks and due dates to individuals and cohorts'
        };
      case '/admin/reports':
        return {
          title: 'Analytics & Compliance Reports',
          subtitle: 'City-wise completion rates and evaluation audit metrics'
        };
      case '/admin/admins':
        return {
          title: 'Admin Management',
          subtitle: 'Manage system administrators and administrative role assignments'
        };
      default:
        return {
          title: 'Admin Portal',
          subtitle: 'SkillUp LMS Management'
        };
    }
  };

  const { title, subtitle } = getPageInfo();

  return (
    <AdminLayout
      currentRoute={currentRoute}
      onNavigate={handleNavigate}
      title={title}
      subtitle={subtitle}
      onSearchChange={currentRoute === '/admin/employees' ? setGlobalSearch : undefined}
      searchValue={globalSearch}
    >
      {currentRoute === '/admin/dashboard' && (
        <DashboardPage onNavigate={handleNavigate} />
      )}

      {currentRoute === '/admin/employees' && (
        <EmployeesPage initialSearch={globalSearch} />
      )}

      {currentRoute === '/admin/courses' && (
        <PlaceholderPage
          title="Course Management System"
          subtitle="Full curriculum management module with course authoring, modules, lessons, and quiz builders."
          moduleName="courses"
          icon={
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          }
          tables={['courses', 'modules', 'lessons', 'quizzes', 'quiz_questions', 'quiz_options']}
          features={[
            'Create, edit, and organize multi-module course curricula',
            'Rich lesson content with video, markdown, and appraisal guides',
            'Interactive evaluation quizzes with passing threshold criteria',
            'Course activation and deactivation controls'
          ]}
          onNavigate={handleNavigate}
        />
      )}

      {currentRoute === '/admin/assignments' && (
        <PlaceholderPage
          title="Course Assignment Engine"
          subtitle="Assign mandatory and elective learning paths to individuals, operating locations, and roles."
          moduleName="assignments"
          icon={
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          }
          tables={['course_assignments', 'course_completions', 'lesson_progress']}
          features={[
            'Individual employee assignment with target completion deadlines',
            'Bulk cohort assignments by City/Branch or Designation/Role',
            'Real-time progression tracking and automated reminders',
            'Assignment status tracking (Not Started, In Progress, Completed, Overdue)'
          ]}
          onNavigate={handleNavigate}
        />
      )}

      {currentRoute === '/admin/reports' && (
        <PlaceholderPage
          title="Executive Reporting & Analytics"
          subtitle="Comprehensive training metrics, regional completion leaderboards, and audit compliance exports."
          moduleName="reports"
          icon={
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
          tables={['course_completions', 'quiz_attempts', 'audit_logs', 'employees']}
          features={[
            'City-wise and designation-wise completion percentage heatmaps',
            'Quiz evaluation score distribution and retry analytics',
            'Automated compliance export reports for L&D leadership',
            'Complete audit log trail for governance'
          ]}
          onNavigate={handleNavigate}
        />
      )}

      {currentRoute === '/admin/admins' && (
        isSuperAdmin ? (
          <PlaceholderPage
            title="Administrator Management"
            subtitle="Access control for L&D Administrators, Content Admins, and Reporting Managers."
            moduleName="admins"
            icon={
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            }
            tables={['admin_users', 'audit_logs']}
            features={[
              'Add and invite new administrative team members',
              'Role assignment: SUPER_ADMIN, LND_ADMIN, CONTENT_ADMIN, REPORTING_ADMIN',
              'Enable or disable administrator accounts',
              'Super Admin exclusive management boundary protected by private.is_admin()'
            ]}
            onNavigate={handleNavigate}
          />
        ) : (
          <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-2">
            <div className="font-bold text-rose-800 text-base">Access Restricted</div>
            <p className="text-xs text-rose-600">Admin Management is only accessible to users with the SUPER_ADMIN role.</p>
          </div>
        )
      )}
    </AdminLayout>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <MainRouter />
      </ToastProvider>
    </AuthProvider>
  );
};
