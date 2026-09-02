import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchLearnerCourses } from '../../lib/supabase';
import { CourseAssignment } from '../../types/database';

interface LearnerCoursesPageProps {
  onNavigate: (path: string) => void;
}

type FilterTab = 'ALL' | 'MANDATORY' | 'OPTIONAL' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';

export const LearnerCoursesPage: React.FC<LearnerCoursesPageProps> = ({ onNavigate }) => {
  const { employeeProfile } = useAuth();
  const [courses, setCourses] = useState<CourseAssignment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'DUE_DATE' | 'RECENT' | 'PROGRESS' | 'TITLE'>('RECENT');

  // Learning-table employee_id FKs (course_assignments/lesson_progress/quiz_attempts/
  // course_completions) are employees.id UUIDs, NOT the employees.employee_id business
  // code — use employeeProfile.id here. employee_id remains available separately for
  // display/search.
  const empId = employeeProfile?.id ? String(employeeProfile.id) : '';

  const loadCourses = async () => {
    if (!empId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchLearnerCourses(empId);
      setCourses(data);
    } catch (err: any) {
      console.error('Error fetching learner courses:', err);
      setError(err?.message || 'Failed to load assigned courses.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, [empId]);

  // Extract distinct categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    courses.forEach(c => {
      if (c.course?.category) set.add(c.course.category);
    });
    return Array.from(set).sort();
  }, [courses]);

  // Filter and sort courses
  const filteredCourses = useMemo(() => {
    return courses.filter(item => {
      // Tab filter
      if (activeTab === 'MANDATORY' && !item.is_mandatory) return false;
      if (activeTab === 'OPTIONAL' && item.is_mandatory) return false;
      if (activeTab === 'IN_PROGRESS' && item.status !== 'IN_PROGRESS') return false;
      if (activeTab === 'COMPLETED' && item.status !== 'COMPLETED') return false;
      if (activeTab === 'OVERDUE' && item.status !== 'OVERDUE') return false;

      // Category filter
      if (selectedCategory !== 'ALL' && item.course?.category !== selectedCategory) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = item.course?.title?.toLowerCase().includes(q);
        const codeMatch = item.course?.code?.toLowerCase().includes(q);
        const catMatch = item.course?.category?.toLowerCase().includes(q);
        const descMatch = item.course?.description?.toLowerCase().includes(q);
        if (!titleMatch && !codeMatch && !catMatch && !descMatch) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'DUE_DATE') {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      if (sortBy === 'PROGRESS') {
        return (b.progress_percentage || 0) - (a.progress_percentage || 0);
      }
      if (sortBy === 'TITLE') {
        return (a.course?.title || '').localeCompare(b.course?.title || '');
      }
      // RECENT (default)
      return new Date(b.assigned_at || b.created_at || '').getTime() - new Date(a.assigned_at || a.created_at || '').getTime();
    });
  }, [courses, activeTab, selectedCategory, searchQuery, sortBy]);

  const getStatusBadge = (status: string) => {
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
      case 'ASSIGNED':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Assigned
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-orange-400 uppercase tracking-widest bg-orange-950/50 px-2 py-0.5 rounded border border-orange-800/60">
              Assigned Curriculum
            </span>
            <span className="text-xs text-slate-400">&bull; {courses.length} total assigned</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
            My Learning Catalog
          </h1>
        </div>

        <button
          onClick={loadCourses}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-2 transition"
        >
          <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh List</span>
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-[#0B192C] p-4 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
          {[
            { key: 'ALL', label: 'All Courses', count: courses.length },
            { key: 'MANDATORY', label: 'Mandatory', count: courses.filter(c => c.is_mandatory).length },
            { key: 'OPTIONAL', label: 'Optional', count: courses.filter(c => !c.is_mandatory).length },
            { key: 'IN_PROGRESS', label: 'In Progress', count: courses.filter(c => c.status === 'IN_PROGRESS').length },
            { key: 'COMPLETED', label: 'Completed', count: courses.filter(c => c.status === 'COMPLETED').length },
            { key: 'OVERDUE', label: 'Overdue', count: courses.filter(c => c.status === 'OVERDUE').length },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as FilterTab)}
              className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition flex items-center gap-2 ${
                activeTab === tab.key
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-950/40'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                activeTab === tab.key ? 'bg-orange-800 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search, Category, and Sort Row */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-slate-800/80">
          {/* Search Field */}
          <div className="sm:col-span-6 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by course title, code, or description..."
              className="w-full pl-10 pr-3.5 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Category Dropdown */}
          <div className="sm:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full py-2 px-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="ALL">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="sm:col-span-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full py-2 px-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="RECENT">Sort by: Recently Assigned</option>
              <option value="DUE_DATE">Sort by: Due Date</option>
              <option value="PROGRESS">Sort by: Progress %</option>
              <option value="TITLE">Sort by: Course Title</option>
            </select>
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-[#0B192C] p-6 rounded-2xl border border-slate-800 animate-pulse space-y-4">
              <div className="h-4 bg-slate-800 rounded w-1/3" />
              <div className="h-6 bg-slate-800 rounded w-3/4" />
              <div className="h-16 bg-slate-800/60 rounded-xl" />
              <div className="h-10 bg-slate-800 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[#0B192C] border border-slate-800 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-white">No courses match your filter</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search terms, switching tabs, or resetting category filters.
          </p>
          {(searchQuery || selectedCategory !== 'ALL' || activeTab !== 'ALL') && (
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('ALL'); setActiveTab('ALL'); }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-orange-400 font-semibold text-xs transition"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCourses.map(assignment => (
            <div
              key={assignment.id}
              className="bg-[#0B192C] rounded-2xl border border-slate-800 hover:border-slate-700 transition shadow-xl overflow-hidden flex flex-col justify-between group"
            >
              <div className="p-5 space-y-3">
                {/* Category & Status */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold text-orange-400 bg-orange-950/40 border border-orange-800/50 px-2 py-0.5 rounded uppercase tracking-wider">
                    {assignment.course?.category || 'COURSE'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {assignment.is_mandatory ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-950 text-orange-300 border border-orange-800/50 uppercase">
                        Mandatory
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800/50 uppercase">
                        Optional
                      </span>
                    )}
                    {getStatusBadge(assignment.status)}
                  </div>
                </div>

                {/* Course Title */}
                <h3 className="font-bold text-white text-base group-hover:text-orange-400 transition leading-snug line-clamp-2">
                  {assignment.course?.title || 'Assigned Course'}
                </h3>

                {/* Course Code & Metadata */}
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  {assignment.course?.code && (
                    <span className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 text-[10px]">
                      {assignment.course.code}
                    </span>
                  )}
                  <span>&bull;</span>
                  <span>⏱ {assignment.course?.estimated_duration_minutes || 30} mins</span>
                  <span>&bull;</span>
                  <span className="capitalize">{assignment.course?.difficulty || 'Intermediate'}</span>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {assignment.course?.description || 'Access course curriculum, complete lessons, and submit quizzes.'}
                </p>
              </div>

              {/* Card Footer: Progress & Action */}
              <div className="p-5 pt-3 border-t border-slate-800/80 bg-slate-900/40 space-y-3">
                {/* Progress bar */}
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-slate-400 font-medium">Completion Progress</span>
                    <span className="font-bold text-white">{assignment.progress_percentage || 0}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${assignment.progress_percentage || 0}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="text-[11px] text-slate-400">
                    {assignment.due_date ? (
                      <span className={assignment.status === 'OVERDUE' ? 'text-rose-400 font-bold' : ''}>
                        Due: {new Date(assignment.due_date).toLocaleDateString()}
                      </span>
                    ) : (
                      'Self-paced'
                    )}
                  </div>
                  <button
                    onClick={() => onNavigate(`/learn/courses/${assignment.course_id}`)}
                    className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs uppercase tracking-wider transition shadow-sm flex items-center gap-1.5"
                  >
                    <span>
                      {assignment.status === 'COMPLETED' ? 'Review' : assignment.status === 'IN_PROGRESS' ? 'Continue' : 'Start'}
                    </span>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
