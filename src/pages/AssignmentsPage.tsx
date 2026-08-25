import React, { useState, useEffect, useCallback } from 'react';
import { 
  CourseAssignment, 
  AssignmentStats, 
  Course, 
  Role, 
  Location, 
  AssignmentStatus 
} from '../types/database';
import { 
  fetchCourseAssignments, 
  fetchAssignmentStats, 
  fetchAssignableCourses, 
  fetchRoles, 
  fetchLocations 
} from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { AssignCourseModal } from '../components/assignment/AssignCourseModal';
import { BulkAssignModal } from '../components/assignment/BulkAssignModal';
import { RevokeAssignmentModal } from '../components/assignment/RevokeAssignmentModal';
import { AssignmentDetailModal } from '../components/assignment/AssignmentDetailModal';
import { Pagination } from '../components/common/Pagination';

export const AssignmentsPage: React.FC = () => {
  const { adminProfile } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();

  const isReadOnly = adminProfile?.role === 'REPORTING_ADMIN' || adminProfile?.role === 'CONTENT_ADMIN';

  // Assignments Data & Pagination
  const [assignments, setAssignments] = useState<CourseAssignment[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Stats
  const [stats, setStats] = useState<AssignmentStats>({
    total: 0,
    notStarted: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
    revoked: 0
  });

  // Filter States
  const [search, setSearch] = useState<string>('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | AssignmentStatus>('ALL');
  const [selectedType, setSelectedType] = useState<'ALL' | 'MANDATORY' | 'OPTIONAL'>('ALL');
  const [selectedRoleId, setSelectedRoleId] = useState<string>('ALL');
  const [selectedLocationId, setSelectedLocationId] = useState<string>('ALL');

  // Master Data options for filters
  const [courses, setCourses] = useState<Course[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  // Modals state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState<boolean>(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState<boolean>(false);
  const [selectedAssignmentForDetail, setSelectedAssignmentForDetail] = useState<CourseAssignment | null>(null);
  const [assignmentToRevoke, setAssignmentToRevoke] = useState<CourseAssignment | null>(null);

  // Load Master Options for Filters
  useEffect(() => {
    const loadFiltersData = async () => {
      try {
        const [cList, rList, lList] = await Promise.all([
          fetchAssignableCourses(),
          fetchRoles(),
          fetchLocations()
        ]);
        setCourses(cList);
        setRoles(rList);
        setLocations(lList);
      } catch (err) {
        console.warn('Error loading filter options:', err);
      }
    };
    loadFiltersData();
  }, []);

  // Fetch Assignments & Stats
  const loadAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const [assignRes, statsRes] = await Promise.all([
        fetchCourseAssignments({
          page,
          pageSize,
          search,
          courseId: selectedCourseId,
          status: selectedStatus,
          type: selectedType,
          roleId: selectedRoleId,
          locationId: selectedLocationId
        }),
        fetchAssignmentStats()
      ]);

      setAssignments(assignRes.assignments);
      setTotalCount(assignRes.totalCount);
      setStats(statsRes);
    } catch (err: any) {
      console.error('Error fetching assignments:', err);
      showError('Failed to load assignments: ' + (err.message || 'Database error'));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, selectedCourseId, selectedStatus, selectedType, selectedRoleId, selectedLocationId, showError]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCourseId('ALL');
    setSelectedStatus('ALL');
    setSelectedType('ALL');
    setSelectedRoleId('ALL');
    setSelectedLocationId('ALL');
    setPage(1);
  };

  const getStatusBadge = (status: AssignmentStatus) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            COMPLETED
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
            IN_PROGRESS
          </span>
        );
      case 'OVERDUE':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
            OVERDUE
          </span>
        );
      case 'REVOKED':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-300">
            REVOKED
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            NOT_STARTED
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Course Assignment Engine</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-orange-100 text-orange-800 rounded border border-orange-200 uppercase">
              Phase 2C Verified
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Assign curriculum tracks with due dates, compliance requirements, and audience targeting.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={loadAssignments}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold transition shadow-sm"
            title="Refresh assignments table"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {!isReadOnly && (
            <>
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(true)}
                className="px-4 py-2.5 bg-white border border-blue-300 hover:border-blue-400 text-blue-700 rounded-xl text-xs font-bold shadow-sm hover:bg-blue-50 transition flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Bulk Assign Cohort</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAssignModalOpen(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-950/20 hover:from-orange-500 hover:to-amber-500 transition flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Assign Course</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Enrolled</div>
          <div className="text-xl font-extrabold text-slate-900 mt-1">{stats.total}</div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Not Started</div>
          <div className="text-xl font-extrabold text-amber-700 mt-1">{stats.notStarted}</div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600">In Progress</div>
          <div className="text-xl font-extrabold text-blue-700 mt-1">{stats.inProgress}</div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Completed</div>
          <div className="text-xl font-extrabold text-emerald-700 mt-1">{stats.completed}</div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Overdue</div>
          <div className="text-xl font-extrabold text-rose-700 mt-1">{stats.overdue}</div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Revoked</div>
          <div className="text-xl font-extrabold text-slate-700 mt-1">{stats.revoked}</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Text Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search learner name, ID, or course..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Course Filter */}
          <div>
            <select
              value={selectedCourseId}
              onChange={(e) => {
                setSelectedCourseId(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="ALL">All Courses ({courses.length})</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} {c.code ? `(${c.code})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value as any);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="NOT_STARTED">Not Started</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="OVERDUE">Overdue</option>
              <option value="REVOKED">Revoked</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value as any);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="ALL">All Policies (Mandatory & Optional)</option>
              <option value="MANDATORY">Mandatory Only</option>
              <option value="OPTIONAL">Optional Only</option>
            </select>
          </div>
        </div>

        {/* Secondary Filter Row */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Role Filter */}
            <select
              value={selectedRoleId}
              onChange={(e) => {
                setSelectedRoleId(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700"
            >
              <option value="ALL">All Designations</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>

            {/* Location Filter */}
            <select
              value={selectedLocationId}
              onChange={(e) => {
                setSelectedLocationId(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700"
            >
              <option value="ALL">All Locations</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.city || loc.name}
                </option>
              ))}
            </select>

            {(search || selectedCourseId !== 'ALL' || selectedStatus !== 'ALL' || selectedType !== 'ALL' || selectedRoleId !== 'ALL' || selectedLocationId !== 'ALL') && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-orange-600 hover:text-orange-800 font-bold px-2 py-1 hover:bg-orange-50 rounded transition"
              >
                Reset Filters
              </button>
            )}
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-800">{assignments.length}</strong> of <strong className="text-slate-800">{totalCount}</strong> assignments
          </div>
        </div>
      </div>

      {/* Main Assignments Data Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center">
            <svg className="w-8 h-8 animate-spin text-orange-600 mb-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span className="text-xs font-semibold">Querying live course assignments...</span>
          </div>
        ) : assignments.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto shadow-inner">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">No Course Assignments Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                {totalCount === 0 
                  ? 'There are currently 0 assignments in the system. Use the buttons above to assign published curriculum to employees.' 
                  : 'No assignments match the selected filter criteria. Try resetting filters.'}
              </p>
            </div>

            {!isReadOnly && courses.length > 0 && (
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(true)}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  + Assign First Course
                </button>
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  👥 Bulk Assign Cohort
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Learner Profile</th>
                  <th className="py-3.5 px-4">Assigned Course</th>
                  <th className="py-3.5 px-4">Policy</th>
                  <th className="py-3.5 px-4">Status & Progress</th>
                  <th className="py-3.5 px-4">Timeline</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assignments.map((assignment) => {
                  const emp = assignment.employee;
                  const course = assignment.course;

                  return (
                    <tr 
                      key={assignment.id} 
                      className="hover:bg-slate-50/60 transition group cursor-pointer"
                      onClick={() => setSelectedAssignmentForDetail(assignment)}
                    >
                      {/* Learner Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {emp?.full_name?.substring(0, 2).toUpperCase() || 'EM'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{emp?.full_name || assignment.employee_id}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-slate-400">{emp?.employee_id || assignment.employee_id}</span>
                              <span>&bull;</span>
                              <span>{emp?.role_name || 'Staff'}</span>
                              <span>&bull;</span>
                              <span className="font-medium text-slate-600">{emp?.location_name || 'HQ'}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Course */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">
                          {course?.title || `Course #${assignment.course_id}`}
                        </div>
                        <div className="text-[10.5px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          {course?.code && <span className="font-mono text-slate-400">{course.code}</span>}
                          <span>{course?.category || 'General'}</span>
                          <span>&bull;</span>
                          <span>{course?.estimated_duration_minutes || 30} mins</span>
                        </div>
                      </td>

                      {/* Policy / Type */}
                      <td className="py-3.5 px-4">
                        {assignment.is_mandatory ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-50 text-orange-800 border border-orange-200">
                            MANDATORY
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                            OPTIONAL
                          </span>
                        )}
                      </td>

                      {/* Status & Progress */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1.5">
                          <div>{getStatusBadge(assignment.status)}</div>
                          <div className="w-28 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                assignment.status === 'COMPLETED' ? 'bg-emerald-600' :
                                assignment.status === 'OVERDUE' ? 'bg-rose-500' :
                                assignment.status === 'REVOKED' ? 'bg-slate-400' : 'bg-orange-500'
                              }`}
                              style={{ width: `${assignment.progress_percentage || 0}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {assignment.progress_percentage || 0}% Complete
                          </span>
                        </div>
                      </td>

                      {/* Timeline */}
                      <td className="py-3.5 px-4">
                        <div className="text-[11px] text-slate-600 space-y-0.5">
                          <div>
                            <span className="text-slate-400 text-[10px] block uppercase font-bold">Assigned</span>
                            <span>{assignment.assigned_at ? new Date(assignment.assigned_at).toLocaleDateString('en-IN') : '—'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] block uppercase font-bold">Due Date</span>
                            <span className={assignment.status === 'OVERDUE' ? 'text-rose-600 font-bold' : ''}>
                              {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString('en-IN') : 'No due date'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedAssignmentForDetail(assignment)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                            title="Inspect Details"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>

                          {!isReadOnly && assignment.status !== 'REVOKED' && (
                            <button
                              type="button"
                              onClick={() => setAssignmentToRevoke(assignment)}
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                              title="Revoke Assignment"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalCount > pageSize && (
          <div className="p-4 border-t border-slate-200">
            <Pagination
              currentPage={page}
              totalItems={totalCount}
              pageSize={pageSize}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Individual Assign Modal */}
      <AssignCourseModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onSuccess={(courseTitle, empName) => {
          showSuccess(`Assigned "${courseTitle}" to ${empName}`);
          loadAssignments();
        }}
      />

      {/* Bulk Assign Modal */}
      <BulkAssignModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSuccess={(courseTitle, count) => {
          showSuccess(`Bulk assigned "${courseTitle}" to ${count} employees.`);
          loadAssignments();
        }}
      />

      {/* Revoke Assignment Modal */}
      <RevokeAssignmentModal
        assignment={assignmentToRevoke}
        isOpen={Boolean(assignmentToRevoke)}
        onClose={() => setAssignmentToRevoke(null)}
        onSuccess={(courseTitle, empName) => {
          showInfo(`Revoked assignment for "${courseTitle}" (${empName})`);
          loadAssignments();
        }}
      />

      {/* Assignment Detail Modal */}
      <AssignmentDetailModal
        assignment={selectedAssignmentForDetail}
        isOpen={Boolean(selectedAssignmentForDetail)}
        onClose={() => setSelectedAssignmentForDetail(null)}
        onRevoke={(assignment) => {
          setSelectedAssignmentForDetail(null);
          setAssignmentToRevoke(assignment);
        }}
        isReadOnly={isReadOnly}
      />

    </div>
  );
};
