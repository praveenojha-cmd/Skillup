import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Employee, SkillUpAccess } from '../../types/database';
import { toggleSkillUpAccess } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';

interface AccessToggleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employee: Employee | null;
  targetAccess: SkillUpAccess;
}

export const AccessToggleModal: React.FC<AccessToggleModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  employee,
  targetAccess
}) => {
  const { showSuccess, showError } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!employee) return null;

  const isDisabling = targetAccess === 'DISABLED';

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await toggleSkillUpAccess(employee, targetAccess);
      const actionText = isDisabling ? 'disabled' : 'enabled';
      showSuccess(
        `SkillUp learning access for ${employee.full_name} (${employee.employee_id}) has been ${actionText}.`,
        isDisabling ? 'Access Revoked' : 'Access Restored'
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error toggling access:', err);
      showError(err?.message || 'Failed to update SkillUp access.', 'Access Update Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isDisabling ? 'Disable SkillUp Access' : 'Enable SkillUp Access'}
      subtitle={`Employee: ${employee.full_name} (${employee.employee_id})`}
      maxWidth="md"
    >
      <div className="space-y-4 text-xs">
        {/* Warning / Prompt Box */}
        {isDisabling ? (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
            <div className="flex items-start gap-2.5">
              <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="space-y-1">
                <p className="font-bold text-amber-900 text-xs leading-relaxed">
                  Disable SkillUp learning access for this employee?
                </p>
                <p className="text-amber-800 text-[11.5px] leading-relaxed">
                  The employee record and all learning history will be retained.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
            <div className="flex items-start gap-2.5">
              <svg className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="space-y-1">
                <p className="font-bold text-emerald-900 text-xs leading-relaxed">
                  Enable SkillUp learning access for this employee?
                </p>
                <p className="text-emerald-800 text-[11.5px] leading-relaxed">
                  The employee will have access to SkillUp learning modules and assigned courses.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Employee Summary Card */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Employee ID</span>
            <span className="font-mono font-bold text-orange-600">{employee.employee_id}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Full Name</span>
            <span className="font-semibold text-slate-800">{employee.full_name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Designation</span>
            <span className="text-slate-700">{employee.role_name || (employee.role_id ? `Role #${employee.role_id}` : 'Unassigned')}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Employment Status</span>
            <span className="font-bold text-slate-800">{employee.employment_status} (Preserved)</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 mt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className={`px-5 py-2 text-white font-bold rounded-xl text-xs transition shadow-sm flex items-center gap-2 disabled:opacity-50 ${
              isDisabling 
                ? 'bg-rose-600 hover:bg-rose-700' 
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {isSubmitting ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Updating Access...</span>
              </>
            ) : isDisabling ? (
              <span>Disable Access</span>
            ) : (
              <span>Enable Access</span>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};
