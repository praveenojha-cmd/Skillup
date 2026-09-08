import React, { useState, useEffect } from 'react';
import { Course, CourseFilters, CreateCourseInput, UpdateCourseInput } from '../types/database';
import { fetchCourses, fetchCourseCategories, createCourse, updateCourse, toggleCoursePublish, fetchCourseDetail } from '../lib/supabase';
import { CreateCourseModal } from '../components/course/CreateCourseModal';
import { EditCourseModal } from '../components/course/EditCourseModal';
import { CoursePreviewModal } from '../components/course/CoursePreviewModal';
import { ArchiveCourseModal } from '../components/course/ArchiveCourseModal';
import { CourseStudio } from '../components/course/CourseStudio';
import { useAuth } from '../context/AuthContext';

export const CoursesPage: React.FC = () => {
  const { adminProfile } = useAuth();
  const role = adminProfile?.role;
  const [courses, setCourses] = useState<Course[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Active view: Catalog or Curriculum Studio
  const [activeStudioCourseId, setActiveStudioCourseId] = useState<string | number | null>(null);

  // Filters State
  const [filters, setFilters] = useState<CourseFilters>({
    search: '',
    category: 'ALL',
    status: 'ALL',
    sortBy: 'created_at',
    sortOrder: 'desc',
    page: 1,
    pageSize: 10
  });

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewCourse, setPreviewCourse] = useState<Course | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<{ course: Course; mode: 'archive' | 'restore' } | null>(null);

  // Permissions
  const isReadOnly = role === 'REPORTING_ADMIN';
  const canManageCourses = role === 'SUPER_ADMIN' || role === 'LND_ADMIN' || role === 'CONTENT_ADMIN';

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [coursesRes, cats] = await Promise.all([
        fetchCourses(filters),
        fetchCourseCategories()
      ]);
      setCourses(coursesRes.courses);
      setTotalCount(coursesRes.totalCount);
      setCategories(cats);
    } catch (err: any) {
      console.error('Error loading courses:', err);
      setError(err?.message || 'Failed to load courses from Supabase.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!activeStudioCourseId) {
      loadData();
    }
  }, [filters, activeStudioCourseId]);

  const showNotification = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleCreateCourse = async (input: CreateCourseInput) => {
    const created = await createCourse(input);
    showNotification(`Course "${created.title}" created successfully.`);
    setIsCreateModalOpen(false);
    // Open directly in studio
    setActiveStudioCourseId(created.id);
  };

  const handleOpenEdit = (course: Course) => {
    setEditingCourse(course);
    setIsEditModalOpen(true);
  };

  const handleUpdateCourse = async (input: UpdateCourseInput) => {
    if (!editingCourse) return;
    await updateCourse(editingCourse.id, input, editingCourse);
    showNotification('Course properties updated successfully.');
    setIsEditModalOpen(false);
    loadData();
  };

  const handleOpenPreview = async (course: Course) => {
    try {
      const full = await fetchCourseDetail(course.id);
      setPreviewCourse(full || course);
      setIsPreviewModalOpen(true);
    } catch (err: any) {
      setError('Could not load course preview.');
    }
  };

  const handleTogglePublish = async (course: Course) => {
    try {
      const willPublish = course.status !== 'PUBLISHED';
      await toggleCoursePublish(course.id, willPublish, course);
      showNotification(
        willPublish
          ? `Course "${course.title}" published successfully.`
          : `Course "${course.title}" set to DRAFT.`
      );
      loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to toggle course publish status.');
    }
  };

  // If Studio Mode is active, render CourseStudio
  if (activeStudioCourseId) {
    return (
      <CourseStudio
        courseId={activeStudioCourseId}
        onBack={() => {
          setActiveStudioCourseId(null);
          loadData();
        }}
        existingCategories={categories}
      />
    );
  }

  const publishedCount = courses.filter(c => c.status === 'PUBLISHED').length;
  const draftCount = courses.filter(c => c.status !== 'PUBLISHED' && c.status !== 'ARCHIVED').length;
  const totalPages = Math.ceil(totalCount / filters.pageSize) || 1;

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[10px] font-bold uppercase tracking-wider">
                Phase 2B • Course Management
              </span>
              <span className="text-xs text-slate-400 font-mono">
                PostgreSQL public.courses
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Courses & Curriculum Management</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Design, structure, and publish multi-module training programs, lesson materials, and assessment quizzes.
            </p>
          </div>

          {canManageCourses && (
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md shadow-orange-600/20 transition flex items-center gap-2 shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Create New Course</span>
            </button>
          )}
        </div>

        {/* Notifications & Error Alerts */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold">{error}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button onClick={loadData} className="px-3 py-1 bg-rose-600 text-white font-semibold rounded-lg hover:bg-rose-700 transition">
                Retry
              </button>
              <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700 font-bold text-xs">✕</button>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-semibold">{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="text-emerald-500 hover:text-emerald-700 font-bold text-xs">✕</button>
          </div>
        )}
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Courses</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{totalCount}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Published & Active</div>
          <div className="text-xl font-bold text-emerald-700 mt-1">{publishedCount}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">Drafts in Studio</div>
          <div className="text-xl font-bold text-amber-700 mt-1">{draftCount}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider">Curriculum Categories</div>
          <div className="text-xl font-bold text-indigo-700 mt-1">{categories.length}</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3">
          
          {/* Search Box */}
          <div className="md:col-span-5">
            <div className="relative">
              <svg className="w-4 h-4 absolute left-3 top-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                placeholder="Search courses by title, description..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 text-xs font-medium outline-none transition"
              />
              {filters.search && (
                <button
                  onClick={() => setFilters({ ...filters, search: '', page: 1 })}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Category Filter */}
          <div className="md:col-span-3">
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value, page: 1 })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none bg-white"
            >
              <option value="ALL">All Categories ({categories.length})</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="md:col-span-2">
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="PUBLISHED">Published Only</option>
              <option value="DRAFT">Draft Only</option>
              <option value="ARCHIVED">Archived Only</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="md:col-span-2">
            <select
              value={`${filters.sortBy}_${filters.sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('_');
                setFilters({ ...filters, sortBy: sb as any, sortOrder: so as any, page: 1 });
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none bg-white"
            >
              <option value="created_at_desc">Newest First</option>
              <option value="created_at_asc">Oldest First</option>
              <option value="title_asc">Title (A-Z)</option>
              <option value="title_desc">Title (Z-A)</option>
              <option value="estimated_duration_minutes_desc">Longest Duration</option>
              <option value="estimated_duration_minutes_asc">Shortest Duration</option>
            </select>
          </div>
        </div>
      </div>

      {/* Courses List / Table / Grid */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <svg className="w-8 h-8 animate-spin mx-auto text-orange-600 mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <div className="text-xs font-semibold text-slate-600">Querying public.courses...</div>
        </div>
      ) : error ? (
        /* A failed query is a distinct state from a legitimate zero-row
           result — the error banner above already carries the message and
           Retry action, so avoid also claiming "no courses created yet". */
        null
      ) : courses.length === 0 ? (
        /* Explicit Empty State Mandate */
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center mx-auto shadow-sm">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">No courses created yet.</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              {filters.search || filters.category !== 'ALL' || filters.status !== 'ALL'
                ? 'No courses match your active search filters. Try adjusting your query.'
                : 'The database contains 0 course records. Authorized L&D Administrators can create a curriculum program to begin.'}
            </p>
          </div>
          {canManageCourses && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs shadow-md shadow-orange-600/20 transition"
              >
                + Create First Course
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                {/* Thumbnail / Header */}
                <div>
                  <div className="h-32 w-full bg-slate-100 relative overflow-hidden border-b border-slate-100">
                    {course.thumbnail_url ? (
                      <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-orange-500/10 via-amber-500/10 to-indigo-500/10 flex items-center justify-center text-orange-600">
                        <svg className="w-10 h-10 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-2.5 right-2.5">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] shadow-sm flex items-center gap-1 ${
                        course.status === 'PUBLISHED'
                          ? 'bg-emerald-600 text-white'
                          : course.status === 'ARCHIVED'
                          ? 'bg-slate-500 text-white'
                          : 'bg-amber-600 text-white'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        <span>{course.status || 'DRAFT'}</span>
                      </span>
                    </div>

                    {/* Category */}
                    <div className="absolute bottom-2.5 left-2.5">
                      <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white font-bold text-[10px] tracking-wide">
                        {course.category}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-2.5">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-slate-400 font-mono">
                          {course.code || `ID: #${course.id}`}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500">
                          {course.difficulty || 'Intermediate'}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm mt-0.5 leading-snug line-clamp-1">
                        {course.title}
                      </h3>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {course.description || 'No course description provided.'}
                    </p>

                    {/* Metrics row */}
                    <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 text-center text-xs">
                      <div>
                        <div className="font-bold text-slate-800">{course.modules_count || 0}</div>
                        <div className="text-[9px] text-slate-400 uppercase">Modules</div>
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{course.lessons_count || 0}</div>
                        <div className="text-[9px] text-slate-400 uppercase">Lessons</div>
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{course.estimated_duration_minutes || 30}m</div>
                        <div className="text-[9px] text-slate-400 uppercase">Duration</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenPreview(course)}
                    className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl text-xs font-semibold transition"
                    title="Learner Preview Mode"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>

                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(course)}
                      className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl text-xs font-semibold transition"
                      title="Edit Course Properties"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  )}

                  {!isReadOnly && (
                    course.status === 'ARCHIVED' ? (
                      <button
                        type="button"
                        onClick={() => setArchiveTarget({ course, mode: 'restore' })}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-xl text-xs font-semibold transition"
                        title="Restore Course"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setArchiveTarget({ course, mode: 'archive' })}
                        className="p-2 text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-semibold transition"
                        title="Archive Course"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 01-2-2V5a1 1 0 011-1h16a1 1 0 011 1v1a2 2 0 01-2 2M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-7 4h.01" />
                        </svg>
                      </button>
                    )
                  )}

                  <button
                    type="button"
                    onClick={() => setActiveStudioCourseId(course.id)}
                    className="flex-1 py-1.5 px-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs shadow-sm transition flex items-center justify-center gap-1.5"
                  >
                    <span>Curriculum Studio</span>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl text-xs">
              <div className="text-slate-500">
                Showing {((filters.page - 1) * filters.pageSize) + 1} to {Math.min(filters.page * filters.pageSize, totalCount)} of {totalCount} courses
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={filters.page === 1}
                  onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 disabled:opacity-30 font-semibold hover:bg-slate-50 transition"
                >
                  Previous
                </button>
                <span className="font-bold text-slate-700">
                  {filters.page} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={filters.page >= totalPages}
                  onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 disabled:opacity-30 font-semibold hover:bg-slate-50 transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {isCreateModalOpen && (
        <CreateCourseModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateCourse}
          existingCategories={categories}
        />
      )}

      {isEditModalOpen && (
        <EditCourseModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          course={editingCourse}
          onSubmit={handleUpdateCourse}
          existingCategories={categories}
        />
      )}

      {isPreviewModalOpen && (
        <CoursePreviewModal
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          course={previewCourse}
        />
      )}

      {archiveTarget && (
        <ArchiveCourseModal
          isOpen={Boolean(archiveTarget)}
          onClose={() => setArchiveTarget(null)}
          course={archiveTarget.course}
          mode={archiveTarget.mode}
          onSuccess={(message) => {
            showNotification(message);
            loadData();
          }}
        />
      )}
    </div>
  );
};
