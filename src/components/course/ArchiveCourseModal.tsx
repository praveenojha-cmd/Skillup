import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Course } from '../../types/database';
import { archiveCourse, restoreCourse, hasCourseActiveAssignments } from '../../lib/supabase';

interface ArchiveCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course | null;
  mode: 'archive' | 'restore';
  onSuccess: (message: string) => void;
}

export const ArchiveCourseModal: React.FC<ArchiveCourseModalProps> = ({
  isOpen,
  onClose,
  course,
  mode,
  onSuccess
}) => {
  const [checking, setChecking] = useState(true);
  const [blockedCount, setBlockedCount] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !course) return;

    setError(null);
    setIsSubmitting(false);

    if (mode === 'archive') {
      setChecking(true);
      setBlockedCount(null);
      hasCourseActiveAssignments(course.id)
        .then(({ hasActive, activeCount }) => {
          setBlockedCount(hasActive ? activeCount : 0);
        })
        .catch(() => {
          // Fail safe: if the check itself errors, don't let archiving proceed silently.
          setError('Could not verify active assignments for this course. Please try again.');
          setBlockedCount(null);
        })
        .finally(() => setChecking(false));
    } else {
      setChecking(false);
      setBlockedCount(0);
    }
  }, [isOpen, course, mode]);

  if (!isOpen || !course) return null;

  const isBlocked = mode === 'archive' && (blockedCount || 0) > 0;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      if (mode === 'archive') {
        await archiveCourse(course.id, course);
        onSuccess(`Course "${course.title}" archived successfully.`);
      } else {
        const restored = await restoreCourse(course.id, course);
        onSuccess(`Course "${course.title}" restored to ${restored.status}.`);
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || `Failed to ${mode} course.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'archive' ? 'Archive Course' : 'Restore Course'}
      subtitle={
        mode === 'archive'
          ? 'Remove this course from active circulation without deleting any data.'
          : 'Return this archived course to active circulation.'
      }
      maxWidth="md"
    >
      <div className="space-y-4 text-xs">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold">{error}</span>
          </div>
        )}

        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Course</span>
            <span className="font-bold text-slate-800 text-right">{course.title}</span>
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Current Status</span>
            <span className="font-bold text-slate-700">{course.status || 'DRAFT'}</span>
          </div>
        </div>

        {checking ? (
          <div className="p-6 text-center text-slate-500">
            <svg className="w-6 h-6 animate-spin mx-auto text-orange-600 mb-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span className="text-xs font-semibold">Checking active assignments...</span>
          </div>
        ) : isBlocked ? (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-rose-800">
              <svg className="w-4 h-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>Cannot Archive — Active Assignments Exist</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              This course has <strong>{blockedCount} active assignment{blockedCount === 1 ? '' : 's'}</strong>.
              Active assignments must be completed or revoked before this course can be archived.
            </p>
          </div>
        ) : mode === 'archive' ? (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-amber-800">
              <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>Before You Archive</span>
            </div>
            <ul className="text-[11px] leading-relaxed list-disc pl-4 space-y-0.5">
              <li>Learning history is <strong>not deleted</strong> — no assignment, progress, or quiz records are touched.</li>
              <li>Employees already assigned this course retain their access to it.</li>
              <li>The course will no longer be available for <strong>new</strong> assignments, since assignment selection already requires PUBLISHED status.</li>
            </ul>
          </div>
        ) : (
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-blue-800">
              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Restoring This Course</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              If this course still meets the existing publish requirements (at least one module, with at least one lesson or quiz), it will be restored to <strong>PUBLISHED</strong>. Otherwise it will be restored to <strong>DRAFT</strong> so its curriculum can be completed first.
            </p>
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition"
          >
            {isBlocked ? 'Close' : 'Cancel'}
          </button>
          {!isBlocked && !checking && (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSubmitting}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow-md disabled:opacity-50 transition flex items-center gap-1.5 ${
                mode === 'archive'
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-900/20'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-900/20'
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>{mode === 'archive' ? 'Archiving...' : 'Restoring...'}</span>
                </>
              ) : (
                <span>{mode === 'archive' ? 'Confirm Archive' : 'Confirm Restore'}</span>
              )}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};
