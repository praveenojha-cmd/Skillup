import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  fetchLearnerDashboardStats, 
  fetchLearnerCourses 
} from '../../lib/supabase';
import { LearnerDashboardStats, CourseAssignment } from '../../types/database';

interface LearnerDashboardPageProps {
  onNavigate: (path: string) => void;
}

export const LearnerDashboardPage: React.FC<LearnerDashboardPageProps> = ({ onNavigate }) => {
  const { employeeProfile } = useAuth();
  const [stats, setStats] = useState<LearnerDashboardStats>({
    mandatoryCourses: 0,
    optionalCourses: 0,
    notStarted: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0
  });
  const [assignedCourses, setAssignedCourses] = useState<CourseAssignment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const empId = employeeProfile?.employee_id || employeeProfile?.id || '';

  const loadData = async () => {
    if (!empId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [statsData, coursesData] = await Promise.all([
        fetchLearnerDashboardStats(empId),
        fetchLearnerCourses(empId)
      ]);
      setStats(statsData);
      setAssignedCourses(coursesData);
    } catch (err: any) {
      console.error('Error loading learner dashboard data:', err);
      setError(err?.message || 'Failed to load learner dashboard.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [empId]);

  const inProgressCourses = assignedCourses.filter(c => c.status === 'IN_PROGRESS');
  const pendingMandatoryCourses = assignedCourses.filter(c => c.is_mandatory && c.status !== 'COMPLETED');
  const recentCourses = assignedCourses.slice(0, 6);

  const getStatusBadge = (status: string, isMandatory: boolean) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-700/50">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Completed
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-950/80 text-blue-300 border border-blue-700/50">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            In Progress
          </span>
        );
      case 'OVERDUE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-950/80 text-rose-300 border border-rose-700/50">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
            Overdue
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Not Started
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0E2238] via-[#0B192C] to-[#122B49] p-6 sm:p-8 border border-slate-800 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-orange-950/50 border border-orange-800/60 text-orange-400 text-xs font-bold uppercase tracking-wider">
              <span>Rupeek SkillUp LMS</span>
              <span>&bull;</span>
              <span>Learner Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Welcome back, {employeeProfile?.full_name || 'Learner'}! 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Track your assigned learning paths, complete modules, take interactive quizzes, and advance your skills across Rupeek.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-200">Role:</span> {employeeProfile?.role_name || 'Assigned Staff'}
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-200">Location:</span> {employeeProfile?.location_name || 'Pan India'}
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-200">ID:</span> {employeeProfile?.employee_id || 'EMP'}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate('/learn/courses')}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-orange-950/50 flex items-center justify-center gap-2"
            >
              <span>Explore My Courses</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
            <button
              onClick={loadData}
              className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition flex items-center justify-center"
              title="Refresh Dashboard"
            >
              <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-700/50 text-rose-200 text-xs flex items-center gap-3">
          <svg className="w-5 h-5 text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>{error}</div>
        </div>
      )}

      {/* 6 KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* 1. Mandatory Courses */}
        <div className="bg-[#0B192C] p-4 rounded-2xl border border-slate-800 shadow-lg relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Mandatory</span>
            <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-white">{stats.mandatoryCourses}</div>
          <div className="text-[10px] text-slate-400 mt-1 font-medium">Assigned by admin</div>
        </div>

        {/* 2. Optional Courses */}
        <div className="bg-[#0B192C] p-4 rounded-2xl border border-slate-800 shadow-lg relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Optional</span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-white">{stats.optionalCourses}</div>
          <div className="text-[10px] text-slate-400 mt-1 font-medium">Self-paced tracks</div>
        </div>

        {/* 3. Not Started */}
        <div className="bg-[#0B192C] p-4 rounded-2xl border border-slate-800 shadow-lg relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Not Started</span>
            <div className="w-7 h-7 rounded-lg bg-slate-700/30 text-slate-300 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-200">{stats.notStarted}</div>
          <div className="text-[10px] text-slate-400 mt-1 font-medium">Awaiting kickoff</div>
        </div>

        {/* 4. In Progress */}
        <div className="bg-[#0B192C] p-4 rounded-2xl border border-slate-800 shadow-lg relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">In Progress</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-blue-400">{stats.inProgress}</div>
          <div className="text-[10px] text-slate-400 mt-1 font-medium">Active learning</div>
        </div>

        {/* 5. Completed */}
        <div className="bg-[#0B192C] p-4 rounded-2xl border border-slate-800 shadow-lg relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Completed</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-400">{stats.completed}</div>
          <div className="text-[10px] text-slate-400 mt-1 font-medium">100% Passed</div>
        </div>

        {/* 6. Overdue */}
        <div className="bg-[#0B192C] p-4 rounded-2xl border border-slate-800 shadow-lg relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Overdue</span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-rose-400">{stats.overdue}</div>
          <div className="text-[10px] text-slate-400 mt-1 font-medium">Action required</div>
        </div>
      </div>

      {/* Continue Learning Section (if any in progress) */}
      {inProgressCourses.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
              <span>Continue Learning</span>
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              {inProgressCourses.length} active {inProgressCourses.length === 1 ? 'course' : 'courses'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inProgressCourses.map(assignment => (
              <div 
                key={assignment.id}
                className="bg-[#0B192C] p-5 rounded-2xl border border-blue-900/40 hover:border-blue-700/60 transition shadow-xl flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">
                        {assignment.course?.category || 'COURSE'}
                      </span>
                      <h3 className="font-bold text-white text-sm sm:text-base group-hover:text-orange-400 transition leading-snug">
                        {assignment.course?.title || 'Assigned Course'}
                      </h3>
                    </div>
                    {getStatusBadge(assignment.status, assignment.is_mandatory)}
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2">
                    {assignment.course?.description || 'Continue your learning modules and prepare for evaluation quizzes.'}
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-400 font-medium">Progress</span>
                      <span className="font-bold text-white">{assignment.progress_percentage}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(5, assignment.progress_percentage)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="text-[11px] text-slate-400">
                      {assignment.due_date ? `Due: ${new Date(assignment.due_date).toLocaleDateString()}` : 'Self-paced'}
                    </div>
                    <button
                      onClick={() => onNavigate(`/learn/courses/${assignment.course_id}`)}
                      className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition shadow-sm flex items-center gap-1.5"
                    >
                      <span>Resume</span>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mandatory & Urgent Assignments */}
      {pendingMandatoryCourses.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              <span>Mandatory Learning Paths</span>
            </h2>
            <button
              onClick={() => onNavigate('/learn/courses')}
              className="text-xs text-orange-400 hover:text-orange-300 font-semibold"
            >
              View all
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {pendingMandatoryCourses.slice(0, 3).map(assignment => (
              <div
                key={assignment.id}
                className="bg-[#0B192C] p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition shadow-lg flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-950/80 text-orange-400 border border-orange-800/60 uppercase">
                      Mandatory
                    </span>
                    {getStatusBadge(assignment.status, true)}
                  </div>
                  <h3 className="font-bold text-white text-sm line-clamp-2">
                    {assignment.course?.title || 'Assigned Course'}
                  </h3>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2">
                    <span>⏱ {assignment.course?.estimated_duration_minutes || 30} mins</span>
                    <span>&bull;</span>
                    <span>{assignment.course?.category || 'General'}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {assignment.due_date ? `Due: ${new Date(assignment.due_date).toLocaleDateString()}` : 'No due date'}
                  </span>
                  <button
                    onClick={() => onNavigate(`/learn/courses/${assignment.course_id}`)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-orange-600 text-slate-200 hover:text-white font-semibold text-xs transition"
                  >
                    Start
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Assigned Courses Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-white">All Assigned Courses</h2>
            <p className="text-xs text-slate-400">Curated modules assigned to your profile</p>
          </div>
          <button
            onClick={() => onNavigate('/learn/courses')}
            className="text-xs font-bold text-orange-400 hover:text-orange-300"
          >
            Browse All ({assignedCourses.length}) &rarr;
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-[#0B192C] p-6 rounded-2xl border border-slate-800 animate-pulse space-y-4">
                <div className="h-4 bg-slate-800 rounded w-1/3" />
                <div className="h-6 bg-slate-800 rounded w-3/4" />
                <div className="h-3 bg-slate-800 rounded w-full" />
                <div className="h-10 bg-slate-800 rounded-xl" />
              </div>
            ))}
          </div>
        ) : assignedCourses.length === 0 ? (
          <div className="p-12 rounded-3xl bg-[#0B192C] border border-slate-800/80 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-slate-800/80 text-slate-400 mx-auto flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">No Courses Assigned Yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Your Learning &amp; Development administrator has not assigned courses to your profile yet. Check back soon for new training modules!
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {recentCourses.map(assignment => (
              <div
                key={assignment.id}
                className="bg-[#0B192C] rounded-2xl border border-slate-800 hover:border-slate-700 transition shadow-xl overflow-hidden flex flex-col justify-between group"
              >
                {/* Course Card Header & Thumbnail / Category bar */}
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-orange-400 bg-orange-950/40 border border-orange-800/50 px-2 py-0.5 rounded uppercase tracking-wider">
                      {assignment.course?.category || 'COURSE'}
                    </span>
                    {getStatusBadge(assignment.status, assignment.is_mandatory)}
                  </div>

                  <h3 className="font-bold text-white text-base group-hover:text-orange-400 transition leading-snug line-clamp-2">
                    {assignment.course?.title || 'Assigned Course'}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {assignment.course?.description || 'Access course lessons, learning resources, and quiz assessments.'}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {assignment.course?.estimated_duration_minutes || 30} mins
                    </span>
                    <span>&bull;</span>
                    <span className="capitalize">{assignment.course?.difficulty || 'Intermediate'}</span>
                  </div>
                </div>

                {/* Progress bar & Action button footer */}
                <div className="p-5 pt-3 border-t border-slate-800/80 bg-slate-900/40 space-y-3">
                  {assignment.status !== 'NOT_STARTED' && (
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Progress</span>
                        <span className="font-bold text-white">{assignment.progress_percentage}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div 
                          className="h-full bg-orange-500 rounded-full"
                          style={{ width: `${assignment.progress_percentage}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <div className="text-[11px] text-slate-400">
                      {assignment.due_date ? `Due: ${new Date(assignment.due_date).toLocaleDateString()}` : 'Self-paced'}
                    </div>
                    <button
                      onClick={() => onNavigate(`/learn/courses/${assignment.course_id}`)}
                      className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs uppercase tracking-wider transition shadow-sm flex items-center gap-1"
                    >
                      {assignment.status === 'COMPLETED' ? 'Review' : assignment.status === 'IN_PROGRESS' ? 'Continue' : 'Start'}
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
