import React, { useState, useEffect } from 'react';
import { Course, Employee, CreateIndividualAssignmentInput } from '../../types/database';
import { fetchAssignableCourses, fetchEmployees, assignCourseIndividual } from '../../lib/supabase';

interface AssignCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (assignedCourseTitle: string, employeeName: string) => void;
}

export const AssignCourseModal: React.FC<AssignCourseModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  // Step 1: Form vs Step 2: Preview
  const [step, setStep] = useState<'FORM' | 'PREVIEW'>('FORM');

  // Form states
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [employeeSearch, setEmployeeSearch] = useState<string>('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [dueDate, setDueDate] = useState<string>('');
  const [isMandatory, setIsMandatory] = useState<boolean>(true);

  // Search / Selection list
  const [matchedEmployees, setMatchedEmployees] = useState<Employee[]>([]);
  const [isSearchingEmp, setIsSearchingEmp] = useState<boolean>(false);
  const [loadingCourses, setLoadingCourses] = useState<boolean>(false);

  // Error & submission
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Load assignable courses when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('FORM');
      setError(null);
      setSelectedCourseId('');
      setSelectedEmployee(null);
      setEmployeeSearch('');
      setDueDate('');
      setIsMandatory(true);

      const loadCourses = async () => {
        setLoadingCourses(true);
        try {
          const list = await fetchAssignableCourses();
          setCourses(list);
          if (list.length > 0) {
            setSelectedCourseId(String(list[0].id));
          }
        } catch (err: any) {
          setError('Failed to load courses: ' + (err.message || 'Unknown error'));
        } finally {
          setLoadingCourses(false);
        }
      };

      loadCourses();
    }
  }, [isOpen]);

  // Search employees dynamically
  useEffect(() => {
    if (!employeeSearch || employeeSearch.trim().length < 2) {
      setMatchedEmployees([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingEmp(true);
      try {
        const res = await fetchEmployees({
          search: employeeSearch.trim(),
          page: 1,
          pageSize: 10,
          employmentStatus: 'ACTIVE',
          skillUpAccess: 'ENABLED'
        });
        setMatchedEmployees(res.employees);
      } catch {
        setMatchedEmployees([]);
      } finally {
        setIsSearchingEmp(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [employeeSearch]);

  if (!isOpen) return null;

  const selectedCourse = courses.find(c => String(c.id) === String(selectedCourseId));

  // Minimum date allowed for due date is today
  const todayStr = new Date().toISOString().split('T')[0];

  const handleValidateToPreview = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedCourseId || !selectedCourse) {
      setError('Please select an active, published course to assign.');
      return;
    }

    if (!selectedEmployee) {
      setError('Please select an eligible employee (Active with enabled SkillUp access).');
      return;
    }

    if (selectedEmployee.employment_status !== 'ACTIVE') {
      setError(`Cannot assign: Employee ${selectedEmployee.full_name} is currently INACTIVE.`);
      return;
    }

    if (selectedEmployee.skillup_access !== 'ENABLED') {
      setError(`Cannot assign: SkillUp access is DISABLED for ${selectedEmployee.full_name}.`);
      return;
    }

    if (dueDate) {
      const selectedDue = new Date(dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDue < today) {
        setError('Due date cannot be earlier than today.');
        return;
      }
    }

    setStep('PREVIEW');
  };

  const handleConfirmAssignment = async () => {
    if (!selectedCourse || !selectedEmployee) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: CreateIndividualAssignmentInput = {
        courseId: selectedCourse.id,
        employeeId: selectedEmployee.employee_id || String(selectedEmployee.id),
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        isMandatory
      };

      await assignCourseIndividual(payload);
      onSuccess(selectedCourse.title, selectedEmployee.full_name);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to assign course.');
      setStep('FORM'); // Go back to form so user can fix issue
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-orange-600 to-amber-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center font-bold text-white shadow-inner">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                {step === 'FORM' ? 'Assign Course to Individual' : 'Assignment Preview & Confirmation'}
              </h2>
              <p className="text-orange-100 text-xs">
                {step === 'FORM' ? 'Select published curriculum and target learner' : 'Verify assignment parameters before database insertion'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2">
              <svg className="w-4 h-4 text-red-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {step === 'FORM' ? (
            <form id="individual-assign-form" onSubmit={handleValidateToPreview} className="space-y-4">
              {/* Course Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Published Course <span className="text-red-500">*</span>
                </label>
                {loadingCourses ? (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin text-orange-600" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Loading available courses...</span>
                  </div>
                ) : courses.length === 0 ? (
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                    <strong>No published courses found.</strong> You must create and publish a course in the Course Catalog before creating assignments.
                  </div>
                ) : (
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} {c.code ? `(${c.code})` : ''} — {c.category} ({c.estimated_duration_minutes || 30} mins)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Employee Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Target Employee <span className="text-red-500">*</span>
                </label>

                {selectedEmployee ? (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                        <span>{selectedEmployee.full_name}</span>
                        <span className="font-mono text-[10px] px-1.5 py-0.2 bg-white text-orange-700 rounded border border-orange-200">
                          {selectedEmployee.employee_id}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {selectedEmployee.role_name} &bull; {selectedEmployee.location_name} &bull; {selectedEmployee.email}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedEmployee(null);
                        setEmployeeSearch('');
                      }}
                      className="px-2.5 py-1 text-xs text-orange-700 hover:text-orange-900 font-bold hover:bg-orange-100/60 rounded-lg transition"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search by Employee Name or ID (e.g. Rahul, EMP001)..."
                        value={employeeSearch}
                        onChange={(e) => setEmployeeSearch(e.target.value)}
                        className="w-full px-3.5 py-2.5 pl-9 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                      <svg className="w-4 h-4 text-slate-400 absolute left-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      {isSearchingEmp && (
                        <div className="absolute right-3 top-3">
                          <svg className="w-4 h-4 animate-spin text-orange-600" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Matched Employee Dropdown */}
                    {matchedEmployees.length > 0 && (
                      <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl bg-white shadow-lg divide-y divide-slate-100">
                        {matchedEmployees.map((emp) => (
                          <div
                            key={emp.id}
                            onClick={() => {
                              setSelectedEmployee(emp);
                              setMatchedEmployees([]);
                            }}
                            className="p-2.5 hover:bg-orange-50 cursor-pointer flex items-center justify-between transition text-xs"
                          >
                            <div>
                              <div className="font-bold text-slate-800 flex items-center gap-2">
                                <span>{emp.full_name}</span>
                                <span className="font-mono text-[10px] text-slate-400">({emp.employee_id})</span>
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {emp.role_name} &bull; {emp.location_name}
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              ELIGIBLE
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Due Date & Mandatory Switch */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Target Due Date (Optional)
                  </label>
                  <input
                    type="date"
                    min={todayStr}
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <p className="text-[10.5px] text-slate-400 mt-1">Leave blank for open-ended learning</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Assignment Type <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setIsMandatory(true)}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                        isMandatory
                          ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>🚨 Mandatory</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsMandatory(false)}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                        !isMandatory
                          ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>💡 Optional</span>
                    </button>
                  </div>
                  <p className="text-[10.5px] text-slate-400 mt-1">Mandatory tracks count toward compliance</p>
                </div>
              </div>
            </form>
          ) : (
            /* PREVIEW SCREEN */
            <div className="space-y-4">
              <div className="p-4 bg-orange-50/70 border border-orange-200 rounded-2xl space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-orange-800">
                  📋 Assignment Summary Preview
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Course Title</span>
                    <span className="font-bold text-slate-800 text-sm">{selectedCourse?.title}</span>
                    {selectedCourse?.code && (
                      <span className="block text-[11px] text-slate-500 font-mono">Code: {selectedCourse.code}</span>
                    )}
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Learner Target</span>
                    <span className="font-bold text-slate-800 text-sm">{selectedEmployee?.full_name}</span>
                    <span className="block text-[11px] text-slate-500">
                      {selectedEmployee?.employee_id} &bull; {selectedEmployee?.role_name}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Operating Location</span>
                    <span className="font-semibold text-slate-700">{selectedEmployee?.location_name}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Target Completion Due Date</span>
                    <span className="font-semibold text-slate-700">
                      {dueDate ? new Date(dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No strict due date'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Assignment Policy</span>
                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold mt-0.5 ${
                      isMandatory ? 'bg-orange-100 text-orange-800 border border-orange-300' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {isMandatory ? 'MANDATORY COMPLIANCE' : 'OPTIONAL / ELECTIVE'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Initial Assignment Status</span>
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800 mt-0.5">
                      NOT_STARTED (0%)
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-start gap-2">
                <svg className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  <strong>Zero premature database writes:</strong> No database INSERT has occurred yet. Clicking &quot;Confirm Assignment&quot; below will persist this record and log an audit trail entry.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          {step === 'FORM' ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-200/60 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="individual-assign-form"
                disabled={!selectedCourseId || !selectedEmployee || courses.length === 0}
                className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl text-xs font-bold hover:shadow-lg hover:shadow-orange-950/20 disabled:opacity-50 transition flex items-center gap-1.5"
              >
                <span>Continue to Preview</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep('FORM')}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-200/60 transition flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Edit Parameters</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmAssignment}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-xs font-bold hover:shadow-lg hover:shadow-emerald-950/20 disabled:opacity-50 transition flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Persisting Assignment...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Confirm Assignment</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
