import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Role, Location, EmploymentStatus, SkillUpAccess, CreateEmployeeInput } from '../../types/database';
import { createEmployee } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  roles: Role[];
  locations: Location[];
}

export const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  roles,
  locations
}) => {
  const { showSuccess, showError } = useToast();

  const [formData, setFormData] = useState<CreateEmployeeInput>({
    employee_id: '',
    full_name: '',
    email: '',
    mobile_number: '',
    role_id: roles.length > 0 ? Number(roles[0].id) : 0,
    location_id: locations.length > 0 ? Number(locations[0].id) : 0,
    reporting_manager_employee_id: '',
    reporting_manager_name: '',
    employment_status: 'ACTIVE',
    skillup_access: 'ENABLED'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        employee_id: '',
        full_name: '',
        email: '',
        mobile_number: '',
        role_id: roles.length > 0 ? Number(roles[0].id) : 0,
        location_id: locations.length > 0 ? Number(locations[0].id) : 0,
        reporting_manager_employee_id: '',
        reporting_manager_name: '',
        employment_status: 'ACTIVE',
        skillup_access: 'ENABLED'
      });
      setFormErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen, roles, locations]);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    const cleanId = formData.employee_id.trim();
    if (!cleanId) {
      errors.employee_id = 'Employee ID is required (e.g. EMP814).';
    }

    const cleanName = formData.full_name.trim();
    if (!cleanName) {
      errors.full_name = 'Full Name is required.';
    }

    const cleanEmail = formData.email.trim();
    if (!cleanEmail) {
      errors.email = 'Official Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      errors.email = 'Please enter a valid email address format.';
    }

    if (!formData.role_id || formData.role_id === 0) {
      errors.role_id = 'Please select a valid Designation.';
    }

    if (!formData.location_id || formData.location_id === 0) {
      errors.location_id = 'Please select a valid Operating Location.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await createEmployee(formData);
      showSuccess(`Employee ${formData.full_name} (${formData.employee_id.toUpperCase()}) added successfully.`, 'Employee Created');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error adding employee:', err);
      const errMsg = err?.message || 'Unable to save employee. Please try again.';
      showError(errMsg, 'Failed to Add Employee');
      setFormErrors(prev => ({ ...prev, general: errMsg }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Employee"
      subtitle="Register an employee master record into public.employees"
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Employee ID */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Employee ID <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.employee_id}
              onChange={(e) => {
                setFormData({ ...formData, employee_id: e.target.value.toUpperCase() });
                if (formErrors.employee_id) setFormErrors({ ...formErrors, employee_id: '' });
              }}
              placeholder="e.g. EMP814"
              className={`w-full px-3 py-2 bg-slate-50 border rounded-xl font-mono text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition ${
                formErrors.employee_id ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
              }`}
            />
            {formErrors.employee_id && (
              <p className="text-[10.5px] text-rose-600 mt-1">{formErrors.employee_id}</p>
            )}
          </div>

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
              placeholder="e.g. Anand Mahindra"
              className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition ${
                formErrors.full_name ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
              }`}
            />
            {formErrors.full_name && (
              <p className="text-[10.5px] text-rose-600 mt-1">{formErrors.full_name}</p>
            )}
          </div>

          {/* Official Email */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Official Email ID <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value.toLowerCase() });
                if (formErrors.email) setFormErrors({ ...formErrors, email: '' });
              }}
              placeholder="e.g. anand.m@rupeek.com"
              className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition ${
                formErrors.email ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
              }`}
            />
            {formErrors.email && (
              <p className="text-[10.5px] text-rose-600 mt-1">{formErrors.email}</p>
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
                setFormData({ ...formData, role_id: Number(e.target.value) });
                if (formErrors.role_id) setFormErrors({ ...formErrors, role_id: '' });
              }}
              className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition ${
                formErrors.role_id ? 'border-rose-400' : 'border-slate-200'
              }`}
            >
              <option value={0}>Select Designation...</option>
              {roles.map((r) => (
                <option key={r.id} value={Number(r.id)}>
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
                setFormData({ ...formData, location_id: Number(e.target.value) });
                if (formErrors.location_id) setFormErrors({ ...formErrors, location_id: '' });
              }}
              className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition ${
                formErrors.location_id ? 'border-rose-400' : 'border-slate-200'
              }`}
            >
              <option value={0}>Select Operating Location...</option>
              {locations.map((loc) => (
                <option key={loc.id} value={Number(loc.id)}>
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

        {/* Modal Action Buttons */}
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
            className="px-5 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold rounded-xl text-xs transition shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Saving Employee...</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Add Employee</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
