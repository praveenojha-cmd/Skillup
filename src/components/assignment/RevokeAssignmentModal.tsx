import React, { useState } from 'react';
import { CourseAssignment } from '../../types/database';
import { revokeCourseAssignment } from '../../lib/supabase';

interface RevokeAssignmentModalProps {
  assignment: CourseAssignment | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (courseTitle: string, employeeName: string) => void;
}

export const RevokeAssignmentModal: React.FC<RevokeAssignmentModalProps> = ({
  assignment,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !assignment) return null;

  const handleRevoke = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await revokeCourseAssignment(assignment.id, reason.trim() || undefined);
      onSuccess(
        assignment.course?.title || `Course #${assignment.course_id}`,
        assignment.employee?.full_name || assignment.employee_id
      );
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to revoke assignment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="p-5 bg-red-50 border-b border-red-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold shadow-md shadow-red-900/20 shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Revoke Course Assignment</h3>
            <p className="text-xs text-red-700">Safety status transition without deleting history</p>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleRevoke} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-100/80 border border-red-300 text-red-800 rounded-xl text-xs">
              {error}
            </div>
          )}

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Course</span>
              <span className="font-bold text-slate-800 text-right">{assignment.course?.title || `Course #${assignment.course_id}`}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Learner</span>
              <span className="font-bold text-slate-800 text-right">
                {assignment.employee?.full_name || assignment.employee_id} ({assignment.employee?.employee_id || assignment.employee_id})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Current Status</span>
              <span className="font-bold text-orange-700">{assignment.status} ({assignment.progress_percentage || 0}%)</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Reason for Revocation (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Role transition, curriculum replacement..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-amber-800">
              <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>Learning History Preserved</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Revoking will change the assignment status to <strong>REVOKED</strong>. This will NOT delete past quiz attempts, lesson progress, or employee records.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md shadow-red-900/20 disabled:opacity-50 transition flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Revoking...</span>
                </>
              ) : (
                <span>Confirm Revocation</span>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
