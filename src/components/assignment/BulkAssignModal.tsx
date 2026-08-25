import React, { useState, useEffect } from 'react';
import { Course, Role, Location, BulkAssignmentPreviewResult, CreateBulkAssignmentInput } from '../../types/database';
import { 
  fetchAssignableCourses, 
  fetchRoles, 
  fetchLocations, 
  calculateBulkAssignmentAudience, 
  assignCourseBulk 
} from '../../lib/supabase';

interface BulkAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (courseTitle: string, count: number) => void;
}

export const BulkAssignModal: React.FC<BulkAssignModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  // Step: 'CONFIGURE' vs 'PREVIEW'
  const [step, setStep] = useState<'CONFIGURE' | 'PREVIEW'>('CONFIGURE');

  // Master Data
  const [courses, setCourses] = useState<Course[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loadingMaster, setLoadingMaster] = useState<boolean>(false);

  // Form selections
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedRoleId, setSelectedRoleId] = useState<string>('ALL');
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState<string>('');
  const [isMandatory, setIsMandatory] = useState<boolean>(true);

  // Audience Preview state
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [previewResult, setPreviewResult] = useState<BulkAssignmentPreviewResult | null>(null);

  // Submission
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setStep('CONFIGURE');
      setError(null);
      setSelectedCourseId('');
      setSelectedRoleId('ALL');
      setSelectedLocationIds([]);
      setDueDate('');
      setIsMandatory(true);
      setPreviewResult(null);

      const loadData = async () => {
        setLoadingMaster(true);
        try {
          const [cList, rList, lList] = await Promise.all([
            fetchAssignableCourses(),
            fetchRoles(),
            fetchLocations()
          ]);
          setCourses(cList);
          if (cList.length > 0) {
            setSelectedCourseId(String(cList[0].id));
          }
          setRoles(rList);
          setLocations(lList);
        } catch (err: any) {
          setError('Failed to load configuration data: ' + (err.message || 'Unknown error'));
        } finally {
          setLoadingMaster(false);
        }
      };

      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedCourse = courses.find(c => String(c.id) === String(selectedCourseId));
  const todayStr = new Date().toISOString().split('T')[0];

  const handleLocationToggle = (locId: string) => {
    if (selectedLocationIds.includes(locId)) {
      setSelectedLocationIds(selectedLocationIds.filter(id => id !== locId));
    } else {
      setSelectedLocationIds([...selectedLocationIds, locId]);
    }
  };

  const handleSelectAllLocations = () => {
    if (selectedLocationIds.length === locations.length) {
      setSelectedLocationIds([]);
    } else {
      setSelectedLocationIds(locations.map(l => String(l.id)));
    }
  };

  const handleCalculateAudience = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedCourseId || !selectedCourse) {
      setError('Please select an active, published course.');
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

    setIsCalculating(true);
    try {
      const res = await calculateBulkAssignmentAudience(selectedCourse.id, {
        roleId: selectedRoleId,
        locationIds: selectedLocationIds,
        employmentStatus: 'ACTIVE',
        skillUpAccess: 'ENABLED'
      });

      setPreviewResult(res);
      setStep('PREVIEW');
    } catch (err: any) {
      setError(err.message || 'Failed to calculate audience preview.');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleConfirmBulkAssignment = async () => {
    if (!selectedCourse || !previewResult || previewResult.eligibleEmployees.length === 0) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const roleObj = roles.find(r => String(r.id) === String(selectedRoleId));
      const roleLabel = selectedRoleId === 'ALL' ? 'All Roles' : (roleObj?.name || `Role #${selectedRoleId}`);
      const locLabel = selectedLocationIds.length === 0 
        ? 'All Operating Locations' 
        : `${selectedLocationIds.length} Locations`;

      const audienceDesc = `${roleLabel} across ${locLabel}`;

      const payload: CreateBulkAssignmentInput = {
        courseId: selectedCourse.id,
        employeeIds: previewResult.eligibleEmployees.map(e => e.employee_id || String(e.id)),
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        isMandatory,
        audienceDescription: audienceDesc
      };

      const result = await assignCourseBulk(payload);
      onSuccess(result.courseTitle, result.successCount);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Bulk assignment failed.');
      setStep('CONFIGURE');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center font-bold text-white shadow-inner">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                {step === 'CONFIGURE' ? 'Bulk Cohort Course Assignment' : 'Audience Breakdown & Atomic Insertion Preview'}
              </h2>
              <p className="text-blue-200 text-xs">
                {step === 'CONFIGURE' ? 'Define audience filters by role and operating locations' : 'Review eligible cohort before committing bulk insert'}
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

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2">
              <svg className="w-4 h-4 text-red-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {step === 'CONFIGURE' ? (
            <form id="bulk-assign-form" onSubmit={handleCalculateAudience} className="space-y-4">
              {/* Course Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Published Curriculum <span className="text-red-500">*</span>
                </label>
                {loadingMaster ? (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Loading published courses...</span>
                  </div>
                ) : courses.length === 0 ? (
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                    <strong>No published courses found.</strong> Create and publish a course in the Course Catalog first.
                  </div>
                ) : (
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} {c.code ? `(${c.code})` : ''} &bull; {c.category}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Audience Definition Filters */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                  <span>🎯 Audience Cohort Filters</span>
                  <span className="text-[10px] text-slate-500 font-normal">Active & Enabled Only</span>
                </div>

                {/* Role / Designation Filter */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Target Role / Designation
                  </label>
                  <select
                    value={selectedRoleId}
                    onChange={(e) => setSelectedRoleId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ALL">All Designations (Everyone across selected cities)</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Locations Filter */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Operating Locations ({selectedLocationIds.length === 0 ? 'All' : `${selectedLocationIds.length} Selected`})
                    </label>
                    <button
                      type="button"
                      onClick={handleSelectAllLocations}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-bold"
                    >
                      {selectedLocationIds.length === locations.length ? 'Clear Selection' : 'Select All Cities'}
                    </button>
                  </div>

                  <div className="max-h-36 overflow-y-auto p-2 bg-white border border-slate-300 rounded-xl grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {locations.map((loc) => {
                      const isChecked = selectedLocationIds.includes(String(loc.id));
                      return (
                        <label
                          key={loc.id}
                          className={`flex items-center gap-2 p-2 rounded-lg text-xs cursor-pointer transition ${
                            isChecked ? 'bg-blue-50 text-blue-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleLocationToggle(String(loc.id))}
                            className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="truncate">{loc.city || loc.name}</span>
                        </label>
                      );
                    })}
                  </div>
                  <p className="text-[10.5px] text-slate-400 mt-1">Leave all unchecked to assign across all locations</p>
                </div>
              </div>

              {/* Due Date & Mandatory Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Target Due Date
                  </label>
                  <input
                    type="date"
                    min={todayStr}
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Assignment Type
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setIsMandatory(true)}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition ${
                        isMandatory
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      🚨 Mandatory
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsMandatory(false)}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition ${
                        !isMandatory
                          ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      💡 Optional
                    </button>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            /* PREVIEW & AUDIENCE BREAKDOWN */
            <div className="space-y-4">
              {/* Metric Breakdown Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <div className="text-[10.5px] font-bold uppercase text-slate-400">Total Matched</div>
                  <div className="text-lg font-black text-slate-800">
                    {(previewResult?.eligibleEmployees.length || 0) + (previewResult?.alreadyAssignedEmployees.length || 0)}
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                  <div className="text-[10.5px] font-bold uppercase text-emerald-700">New Assignments</div>
                  <div className="text-lg font-black text-emerald-800">
                    {previewResult?.eligibleEmployees.length || 0}
                  </div>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
                  <div className="text-[10.5px] font-bold uppercase text-amber-700">Already Assigned</div>
                  <div className="text-lg font-black text-amber-800">
                    {previewResult?.alreadyAssignedEmployees.length || 0}
                  </div>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-center">
                  <div className="text-[10.5px] font-bold uppercase text-blue-700">Type</div>
                  <div className="text-xs font-bold text-blue-900 mt-1">
                    {isMandatory ? 'Mandatory' : 'Optional'}
                  </div>
                </div>
              </div>

              {/* Already Assigned notice */}
              {previewResult && previewResult.alreadyAssignedEmployees.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                  <strong>Duplicate prevention:</strong> {previewResult.alreadyAssignedEmployees.length} employee(s) already have an active assignment for this course and are safely excluded from duplicate insertion.
                </div>
              )}

              {/* Eligible Learners List Table */}
              <div>
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Eligible Employees to Assign ({previewResult?.eligibleEmployees.length || 0})</span>
                  <span className="text-[11px] text-slate-400 font-normal">Atomic Single-Transaction Insert</span>
                </div>

                {previewResult && previewResult.eligibleEmployees.length === 0 ? (
                  <div className="p-6 text-center bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-xs">
                    No new eligible employees found for this filter criteria.
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl bg-white divide-y divide-slate-100 text-xs">
                    {previewResult?.eligibleEmployees.map((emp, idx) => (
                      <div key={emp.id} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-slate-400 w-6">{idx + 1}.</span>
                          <div>
                            <span className="font-bold text-slate-900">{emp.full_name}</span>
                            <span className="font-mono text-[10px] text-slate-400 ml-1.5">({emp.employee_id})</span>
                            <div className="text-[10.5px] text-slate-500">
                              {emp.role_name} &bull; {emp.location_name}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          READY TO ASSIGN
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          {step === 'CONFIGURE' ? (
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
                form="bulk-assign-form"
                disabled={isCalculating || !selectedCourseId || courses.length === 0}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold hover:shadow-lg hover:shadow-blue-950/20 disabled:opacity-50 transition flex items-center gap-2"
              >
                {isCalculating ? (
                  <>
                    <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Calculating Cohort...</span>
                  </>
                ) : (
                  <>
                    <span>Calculate Audience & Preview</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep('CONFIGURE')}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-200/60 transition flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Change Filters</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmBulkAssignment}
                disabled={isSubmitting || !previewResult || previewResult.eligibleEmployees.length === 0}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-xs font-bold hover:shadow-lg hover:shadow-emerald-950/20 disabled:opacity-50 transition flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Executing Bulk Insert...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Confirm Bulk Assignment ({previewResult?.eligibleEmployees.length || 0} Employees)</span>
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
