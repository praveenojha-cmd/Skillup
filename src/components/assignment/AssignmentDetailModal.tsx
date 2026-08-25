import React from 'react';
import { CourseAssignment } from '../../types/database';

interface AssignmentDetailModalProps {
  assignment: CourseAssignment | null;
  isOpen: boolean;
  onClose: () => void;
  onRevoke?: (assignment: CourseAssignment) => void;
  isReadOnly?: boolean;
}

export const AssignmentDetailModal: React.FC<AssignmentDetailModalProps> = ({
  assignment,
  isOpen,
  onClose,
  onRevoke,
  isReadOnly = false
}) => {
  if (!isOpen || !assignment) return null;

  const emp = assignment.employee;
  const course = assignment.course;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 font-bold text-xs">COMPLETED</span>;
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-1 rounded-md bg-blue-100 text-blue-800 font-bold text-xs">IN_PROGRESS</span>;
      case 'OVERDUE':
        return <span className="px-2.5 py-1 rounded-md bg-rose-100 text-rose-800 font-bold text-xs">OVERDUE</span>;
      case 'REVOKED':
        return <span className="px-2.5 py-1 rounded-md bg-slate-200 text-slate-700 font-bold text-xs">REVOKED</span>;
      default:
        return <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-800 font-bold text-xs">NOT_STARTED</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center font-bold text-white shadow-md">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Assignment Details</h2>
              <p className="text-slate-400 text-xs">
                Assignment ID: #{assignment.id}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          
          {/* Status Banner */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">Status</span>
              <div className="mt-1">{getStatusBadge(assignment.status)}</div>
            </div>

            <div className="text-right">
              <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">Progress</span>
              <span className="text-base font-extrabold text-slate-900">
                {assignment.progress_percentage || 0}%
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  assignment.status === 'COMPLETED' ? 'bg-emerald-600' :
                  assignment.status === 'OVERDUE' ? 'bg-rose-500' :
                  assignment.status === 'REVOKED' ? 'bg-slate-400' : 'bg-orange-500'
                }`}
                style={{ width: `${assignment.progress_percentage || 0}%` }}
              />
            </div>
          </div>

          {/* Employee Information */}
          <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              👤 Learner Information
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-500 block text-[10.5px]">Full Name</span>
                <span className="font-bold text-slate-900">{emp?.full_name || assignment.employee_id}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10.5px]">Employee ID</span>
                <span className="font-mono font-bold text-slate-800">{emp?.employee_id || assignment.employee_id}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10.5px]">Designation</span>
                <span className="font-semibold text-slate-800">{emp?.role_name || 'Unassigned'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10.5px]">Operating Location</span>
                <span className="font-semibold text-slate-800">{emp?.location_name || 'Unassigned'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10.5px]">Email</span>
                <span className="text-slate-700">{emp?.email || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10.5px]">SkillUp Access</span>
                <span className="font-bold text-emerald-700">{emp?.skillup_access || 'ENABLED'}</span>
              </div>
            </div>
          </div>

          {/* Course Information */}
          <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              📚 Course Curriculum
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2">
                <span className="text-slate-500 block text-[10.5px]">Course Title</span>
                <span className="font-bold text-slate-900 text-sm">{course?.title || `Course #${assignment.course_id}`}</span>
              </div>
              {course?.code && (
                <div>
                  <span className="text-slate-500 block text-[10.5px]">Course Code</span>
                  <span className="font-mono font-semibold text-slate-700">{course.code}</span>
                </div>
              )}
              <div>
                <span className="text-slate-500 block text-[10.5px]">Category</span>
                <span className="font-semibold text-slate-700">{course?.category || 'General'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10.5px]">Est. Duration</span>
                <span className="font-semibold text-slate-700">{course?.estimated_duration_minutes || 30} mins</span>
              </div>
            </div>
          </div>

          {/* Timeline & Metadata */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              ⏱ Assignment Timeline & Metadata
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500 block text-[10.5px]">Assigned Date</span>
                <span className="font-semibold text-slate-800">
                  {assignment.assigned_at ? new Date(assignment.assigned_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10.5px]">Target Due Date</span>
                <span className="font-semibold text-slate-800">
                  {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No strict deadline'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10.5px]">Assigned By</span>
                <span className="font-semibold text-slate-800 truncate block">{assignment.assigned_by || 'System Admin'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10.5px]">Assignment Policy</span>
                <span className="font-bold text-slate-800">
                  {assignment.is_mandatory ? '🚨 Mandatory Compliance' : '💡 Optional Learning'}
                </span>
              </div>
              {assignment.completed_at && (
                <div className="col-span-2">
                  <span className="text-slate-500 block text-[10.5px]">Completion Timestamp</span>
                  <span className="font-semibold text-emerald-700">
                    {new Date(assignment.completed_at).toLocaleString('en-IN')}
                  </span>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div>
            {!isReadOnly && assignment.status !== 'REVOKED' && onRevoke && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRevoke(assignment);
                }}
                className="px-3.5 py-2 text-xs font-bold text-red-600 hover:text-red-800 hover:bg-red-50 rounded-xl transition flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Revoke Assignment</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
