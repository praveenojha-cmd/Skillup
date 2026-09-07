import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Employee, Role, Location, EmploymentStatus, SkillUpAccess, UpdateEmployeeInput } from '../../types/database';
import { updateEmployee } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';

interface EditEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employee: Employee | null;
  roles: Role[];
  locations: Location[];
}

export const EditEmployeeModal: React.FC<EditEmployeeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  employee,
  roles,
  locations
}) => {
  const { showSuccess, showError } = useToast();

  const [formData, setFormData] = useState<UpdateEmployeeInput>({
    full_name: '',
    mobile_number: '',
    role_id: '',
    location_id: '',
    reporting_manager_employee_id: '',
    reporting_manager_name: '',
    employment_status: 'ACTIVE',
    skillup_access: 'ENABLED'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (employee && isOpen) {
      setFormData({
        full_name: employee.full_name || '',
        mobile_number: employee.mobile_number || '',
        role_id: employee.role_id ? employee.role_id : (roles.length > 0 ? roles[0].id : ''),
        location_id: employee.location_id ? employee.location_id : (locations.length > 0 ? locations[0].id : ''),
        reporting_manager_employee_id: employee.reporting_manager_employee_id || '',
        reporting_manager_name: employee.reporting_manager_name || '',
        employment_status: employee.employment_status || 'ACTIVE',
        skillup_access: employee.skillup_access || 'ENABLED'
      });
      setFormErrors({});
      setIsSubmitting(false);
    }
  }, [employee, isOpen, roles, locations]);

  if (!employee) return null;

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    const cleanName = formData.full_name.trim();
    if (!cleanName) {
      errors.full_name = 'Full Name is required.';
    }

    if (!formData.role_id || formData.role_id === '') {
      errors.role_id = 'Please select a valid Designation.';
    }

    if (!formData.location_id || formData.location_id === '') {
      errors.location_id = 'Please select a valid Operating Location.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (!employee.id) {
      showError('Missing employee record ID identifier.', 'Update Error');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateEmployee(employee.id, formData, employee);
      showSuccess(`Employee details for ${formData.full_name} (${employee.employee_id}) updated successfully.`, 'Employee Updated');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error updating employee:', err);
      const errMsg = err?.message || 'Unable to update employee. Please try again.';
      showError(errMsg, 'Failed to Update Employee');
      setFormErrors(prev => ({ ...prev, general: errMsg }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Employee Master Record"
      subtitle={`Modifying profile for ${employee.full_name} (${employee.employee_id})`}
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {formErrors.general && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
            <svg className="w-4 h-4 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{formErrors.general}</span>
          </div>
        )}

        {/* Master Key Badges (Locked Identifiers) */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 gap-3">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Employee ID (System Key)</span>
            <div className="font-mono font-bold text-orange-600 text-xs mt-0.5">{employee.employee_id}</div>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Official Email ID</span>
            <div className="font-semibold text-slate-800 text-xs mt-0.5 truncate">{employee.email}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Full Name */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => {
                setFormData({ ...formData, full_name: e.target.value });
                if (formErrors.full_name) setFormErrors({ ...formErrors, full_name: '' });
              }}
              className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition ${
                formErrors.full_name ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
              }`}
            />
            {formErrors.full_name && (
              <p className="text-[10.5px] text-rose-600 mt-1">{formErrors.full_name}</p>
            )}
          </div>

          {/* Mobile Number */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Mobile Number
            </label>
            <input
              type="tel"
              value={formData.mobile_number || ''}
              onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
              placeholder="e.g. +91 98765 43210"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
            />
          </div>

          {/* Designation (Role) Dropdown */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Designation / Role <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.role_id}
              onChange={(e) => {
                setFormData({ ...formData, role_id: e.target.value });
                if (formErrors.role_id) setFormErrors({ ...formErrors, role_id: '' });
              }}
              className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition ${
                formErrors.role_id ? 'border-rose-400' : 'border-slate-200'
              }`}
            >
              <option value="">Select Designation...</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} {r.description ? `(${r.description})` : ''}
                </option>
              ))}
            </select>
            {formErrors.role_id && (
              <p className="text-[10.5px] text-rose-600 mt-1">{formErrors.role_id}</p>
            )}
          </div>

          {/* Operating Location Dropdown */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Operating Location <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.location_id}
              onChange={(e) => {
                setFormData({ ...formData, location_id: e.target.value });
                if (formErrors.location_id) setFormErrors({ ...formErrors, location_id: '' });
              }}
              className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition ${
                formErrors.location_id ? 'border-rose-400' : 'border-slate-200'
              }`}
            >
              <option value="">Select Operating Location...</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.city || loc.name} {loc.state ? `— ${loc.state}` : ''}
                </option>
              ))}
            </select>
            {formErrors.location_id && (
              <p className="text-[10.5px] text-rose-600 mt-1">{formErrors.location_id}</p>
            )}
          </div>

          {/* Reporting Manager Name */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Reporting Manager Name
            </label>
            <input
              type="text"
              value={formData.reporting_manager_name || ''}
              onChange={(e) => setFormData({ ...formData, reporting_manager_name: e.target.value })}
              placeholder="e.g. Priya Sharma"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
            />
          </div>

          {/* Reporting Manager Employee ID */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Reporting Manager Employee ID
            </label>
            <input
              type="text"
              value={formData.reporting_manager_employee_id || ''}
              onChange={(e) => setFormData({ ...formData, reporting_manager_employee_id: e.target.value.toUpperCase() })}
              placeholder="e.g. EMP004"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
            />
          </div>

          {/* Employment Status */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Employment Status <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.employment_status}
              onChange={(e) => setFormData({ ...formData, employment_status: e.target.value as EmploymentStatus })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>

          {/* SkillUp Access */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              SkillUp Access <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.skillup_access}
              onChange={(e) => setFormData({ ...formData, skillup_access: e.target.value as SkillUpAccess })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
            >
              <option value="ENABLED">ENABLED</option>
              <option value="DISABLED">DISABLED</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs transition shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Saving Changes...</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
