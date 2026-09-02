import React, { useState, useEffect, useCallback } from 'react';
import { Employee, EmployeeFilters, Location, Role, EmployeeLearningActivity, SkillUpAccess } from '../types/database';
import { fetchEmployees, fetchLocations, fetchRoles, fetchEmployeeLearningActivity } from '../lib/supabase';
import { Badge } from '../components/common/Badge';
import { Pagination } from '../components/common/Pagination';
import { Modal } from '../components/common/Modal';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { AddEmployeeModal } from '../components/employee/AddEmployeeModal';
import { EditEmployeeModal } from '../components/employee/EditEmployeeModal';
import { AccessToggleModal } from '../components/employee/AccessToggleModal';
import { BulkImportModal } from '../components/employee/BulkImportModal';

interface EmployeesPageProps {
  initialSearch?: string;
}

export const EmployeesPage: React.FC<EmployeesPageProps> = ({ initialSearch = '' }) => {
  const { canManageEmployees, canManageAccess } = useAuth();
  const { showInfo, showSuccess, showError } = useToast();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [locations, setLocations] = useState<Location[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [queryError, setQueryError] = useState<string | null>(null);
  
  // Modals state
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [togglingState, setTogglingState] = useState<{ employee: Employee; targetAccess: SkillUpAccess } | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState<boolean>(false);

  // Learning activity for selected employee
  const [learningActivity, setLearningActivity] = useState<EmployeeLearningActivity | null>(null);
  const [isLoadingActivity, setIsLoadingActivity] = useState<boolean>(false);

  // Filters state
  const [filters, setFilters] = useState<EmployeeFilters>({
    search: initialSearch,
    location: 'ALL',
    role: 'ALL',
    employmentStatus: 'ALL',
    skillUpAccess: 'ALL',
    page: 1,
    pageSize: 10
  });

  // Fetch filter dropdown options dynamically from Supabase
  useEffect(() => {
    let isMounted = true;
    async function loadFilterOptions() {
      try {
        const [locs, rls] = await Promise.all([
          fetchLocations(),
          fetchRoles()
        ]);
        if (isMounted) {
          setLocations(locs);
          setRoles(rls);
        }
      } catch (err) {
        console.error('Error fetching filter options:', err);
      }
    }
    loadFilterOptions();
    return () => { isMounted = false; };
  }, []);

  const loadEmployees = useCallback(async () => {
    setIsLoading(true);
    setQueryError(null);
    try {
      const result = await fetchEmployees(filters);
      setEmployees(result.employees);
      setTotalCount(result.totalCount);
    } catch (err: any) {
      console.error('Error fetching employees from Supabase:', err);
      setEmployees([]);
      setTotalCount(0);
      setQueryError(err?.message || 'Failed to load employees from Supabase.');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  // Load real learning activity when an employee is selected.
  // fetchEmployeeLearningActivity expects the employees.id UUID (course_assignments
  // is keyed by that uuid, not the employee_id business code).
  useEffect(() => {
    let isMounted = true;
    if (selectedEmployee?.id) {
      setIsLoadingActivity(true);
      fetchEmployeeLearningActivity(String(selectedEmployee.id))
        .then(activity => {
          if (isMounted) {
            setLearningActivity(activity);
          }
        })
        .catch(() => {
          if (isMounted) setLearningActivity(null);
        })
        .finally(() => {
          if (isMounted) setIsLoadingActivity(false);
        });
    } else {
      setLearningActivity(null);
    }
    return () => { isMounted = false; };
  }, [selectedEmployee]);

  const handleSearchChange = (val: string) => {
    setFilters(prev => ({ ...prev, search: val, page: 1 }));
  };

  const handleFilterChange = (key: keyof EmployeeFilters, val: any) => {
    setFilters(prev => ({ ...prev, [key]: val, page: 1 }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      location: 'ALL',
      role: 'ALL',
      employmentStatus: 'ALL',
      skillUpAccess: 'ALL',
      page: 1,
      pageSize: 10
    });
  };

  // Real CSV Export of currently displayed or filtered dataset
  const handleExportRoster = () => {
    if (employees.length === 0) {
      showError('No employee records matching current criteria to export.', 'Export Empty');
      return;
    }

    try {
      const headers = [
        'Employee ID',
        'Full Name',
        'Official Email ID',
        'Mobile Number',
        'Designation',
        'Operating Location',
        'Reporting Manager Employee ID',
        'Reporting Manager Name',
        'Employment Status',
        'SkillUp Access'
      ].join(',');

      const csvRows = employees.map(emp => {
        const escapeCsv = (str: string | undefined | null) => `"${(str || '').replace(/"/g, '""')}"`;
        return [
          escapeCsv(emp.employee_id),
          escapeCsv(emp.full_name),
          escapeCsv(emp.email),
          escapeCsv(emp.mobile_number),
          escapeCsv(emp.role_name || (emp.role_id ? `Role #${emp.role_id}` : '')),
          escapeCsv(emp.location_name || (emp.location_id ? `Location #${emp.location_id}` : '')),
          escapeCsv(emp.reporting_manager_employee_id),
          escapeCsv(emp.reporting_manager_name),
          escapeCsv(emp.employment_status),
          escapeCsv(emp.skillup_access)
        ].join(',');
      });

      const fullCsv = [headers, ...csvRows].join('\n');
      const blob = new Blob([fullCsv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `SkillUp_Employees_Roster_Page${filters.page}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showSuccess(`Exported ${employees.length} records to CSV.`, 'Roster Exported');
    } catch (err: any) {
      console.error('Error exporting roster:', err);
      showError('Failed to generate roster export.', 'Export Error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Header & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Employee Directory & Access Control</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Querying <strong className="text-slate-800 font-semibold">{totalCount}</strong> business-team employees across {locations.length > 0 ? `${locations.length} operating locations` : 'operating locations'}.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Export Roster */}
          <button
            onClick={handleExportRoster}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
          >
            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Export Roster</span>
          </button>

          {/* Bulk Import Button */}
          {canManageEmployees && (
            <button
              onClick={() => setIsBulkModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
            >
              <svg className="w-3.5 h-3.5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span>Bulk Import CSV</span>
            </button>
          )}

          {/* Add Employee Button */}
          {canManageEmployees && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>+ Add Employee</span>
            </button>
          )}
        </div>
      </div>

      {queryError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Error querying Supabase: {queryError}</span>
          </div>
          <button
            onClick={loadEmployees}
            className="px-3 py-1 bg-rose-600 text-white font-semibold rounded-lg hover:bg-rose-700 transition"
          >
            Retry Query
          </button>
        </div>
      )}

      {/* Filter and Search Panel */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-2 relative">
            <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by Employee ID, Name, Email, or Manager..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
            />
            {filters.search && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Operating Location / City Filter */}
          <div>
            <select
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="ALL">All Locations {locations.length > 0 ? `(${locations.length} Locations)` : ''}</option>
              {locations.map(loc => (
                <option key={loc.id} value={String(loc.id)}>{loc.city || loc.name}</option>
              ))}
            </select>
          </div>

          {/* Designation / Role Filter */}
          <div>
            <select
              value={filters.role}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="ALL">All Roles {roles.length > 0 ? `(${roles.length} Roles)` : ''}</option>
              {roles.map(r => (
                <option key={r.id} value={String(r.id)}>{r.name}</option>
              ))}
            </select>
          </div>

          {/* Status & Access Filters */}
          <div className="flex items-center gap-2">
            <select
              value={filters.employmentStatus}
              onChange={(e) => handleFilterChange('employmentStatus', e.target.value)}
              className="w-1/2 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="ALL">Status: All</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            <select
              value={filters.skillUpAccess}
              onChange={(e) => handleFilterChange('skillUpAccess', e.target.value)}
              className="w-1/2 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="ALL">Access: All</option>
              <option value="ENABLED">Enabled</option>
              <option value="DISABLED">Disabled</option>
            </select>
          </div>
        </div>

        {/* Active Filter Indicators */}
        {(filters.search || filters.location !== 'ALL' || filters.role !== 'ALL' || filters.employmentStatus !== 'ALL' || filters.skillUpAccess !== 'ALL') && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-400 font-medium">Active filters:</span>
              {filters.search && <Badge variant="primary" size="sm">Search: {filters.search}</Badge>}
              {filters.location !== 'ALL' && <Badge variant="neutral" size="sm">Location Filter</Badge>}
              {filters.role !== 'ALL' && <Badge variant="neutral" size="sm">Role Filter</Badge>}
              {filters.employmentStatus !== 'ALL' && <Badge variant="active" size="sm">Status: {filters.employmentStatus}</Badge>}
              {filters.skillUpAccess !== 'ALL' && <Badge variant="enabled" size="sm">Access: {filters.skillUpAccess}</Badge>}
            </div>
            <button
              onClick={handleResetFilters}
              className="text-orange-600 hover:text-orange-700 font-bold transition"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10.5px]">
                <th className="py-3.5 px-4">Employee ID</th>
                <th className="py-3.5 px-4">Full Name & Email</th>
                <th className="py-3.5 px-4">Mobile Number</th>
                <th className="py-3.5 px-4">Designation</th>
                <th className="py-3.5 px-4">Operating Location</th>
                <th className="py-3.5 px-4">Reporting Manager</th>
                <th className="py-3.5 px-4 text-center">Employment</th>
                <th className="py-3.5 px-4 text-center">SkillUp Access</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-4"><div className="h-4 bg-slate-200 rounded w-16" /></td>
                    <td className="py-4 px-4">
                      <div className="h-4 bg-slate-200 rounded w-32 mb-1" />
                      <div className="h-3 bg-slate-100 rounded w-44" />
                    </td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-100 rounded w-24" /></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-100 rounded w-28" /></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-100 rounded w-20" /></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-100 rounded w-24" /></td>
                    <td className="py-4 px-4 text-center"><div className="h-5 bg-slate-100 rounded-full w-16 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><div className="h-5 bg-slate-100 rounded-full w-16 mx-auto" /></td>
                    <td className="py-4 px-4 text-right"><div className="h-7 bg-slate-100 rounded-lg w-20 ml-auto" /></td>
                  </tr>
                ))
              ) : queryError ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-rose-600">
                    <div className="max-w-xs mx-auto space-y-2">
                      <svg className="w-8 h-8 text-rose-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="font-bold text-sm">Unable to Load Employees</div>
                      <p className="text-xs text-rose-500">The Supabase query failed. See the error above and retry.</p>
                      <button
                        onClick={loadEmployees}
                        className="mt-2 px-3 py-1.5 bg-rose-600 text-white rounded-xl font-semibold text-xs hover:bg-rose-700 transition"
                      >
                        Retry Query
                      </button>
                    </div>
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <div className="max-w-xs mx-auto space-y-2">
                      <svg className="w-8 h-8 text-slate-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <div className="font-bold text-slate-800 text-sm">No Employees Found</div>
                      <p className="text-xs text-slate-400">No records matching your search or active filter criteria.</p>
                      <button
                        onClick={handleResetFilters}
                        className="mt-2 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-xl font-semibold text-xs hover:bg-orange-100 transition"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr
                    key={emp.employee_id || emp.id}
                    className="hover:bg-slate-50/80 transition cursor-pointer"
                    onClick={() => setSelectedEmployee(emp)}
                  >
                    {/* Employee ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-orange-600">
                      {emp.employee_id}
                    </td>

                    {/* Name & Email */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {emp.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'EM'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{emp.full_name}</div>
                          <div className="text-[11px] text-slate-500 font-normal">{emp.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Mobile */}
                    <td className="py-3.5 px-4 font-mono text-slate-600 text-[11.5px]">
                      {emp.mobile_number || '—'}
                    </td>

                    {/* Designation */}
                    <td className="py-3.5 px-4 text-slate-800 font-semibold">
                      {emp.role_name || (emp.role_id ? `Role #${emp.role_id}` : 'Unassigned')}
                    </td>

                    {/* Operating Location */}
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{emp.location_name || (emp.location_id ? `Location #${emp.location_id}` : 'Unassigned')}</span>
                      </div>
                    </td>

                    {/* Reporting Manager */}
                    <td className="py-3.5 px-4 text-slate-700">
                      <div className="font-medium">{emp.reporting_manager_name || '—'}</div>
                      {emp.reporting_manager_employee_id && (
                        <div className="text-[10px] text-slate-400 font-mono">({emp.reporting_manager_employee_id})</div>
                      )}
                    </td>

                    {/* Employment Status */}
                    <td className="py-3.5 px-4 text-center">
                      <Badge
                        variant={emp.employment_status === 'ACTIVE' ? 'active' : 'inactive'}
                        size="sm"
                        dot
                      >
                        {emp.employment_status || 'ACTIVE'}
                      </Badge>
                    </td>

                    {/* SkillUp Access */}
                    <td className="py-3.5 px-4 text-center">
                      <Badge
                        variant={emp.skillup_access === 'ENABLED' ? 'enabled' : 'disabled'}
                        size="sm"
                      >
                        {emp.skillup_access || 'ENABLED'}
                      </Badge>
                    </td>

                    {/* Action Group */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {/* View Button */}
                        <button
                          onClick={() => setSelectedEmployee(emp)}
                          className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition"
                          title="View Employee Profile"
                        >
                          View
                        </button>

                        {/* Edit Button */}
                        {canManageEmployees && (
                          <button
                            onClick={() => setEditingEmployee(emp)}
                            className="px-2 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 font-semibold text-[11px] transition"
                            title="Edit Employee Master Record"
                          >
                            Edit
                          </button>
                        )}

                        {/* Access Toggle Button */}
                        {canManageAccess && (
                          emp.skillup_access === 'ENABLED' ? (
                            <button
                              onClick={() => setTogglingState({ employee: emp, targetAccess: 'DISABLED' })}
                              className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-[11px] transition"
                              title="Disable SkillUp Learning Access"
                            >
                              Disable
                            </button>
                          ) : (
                            <button
                              onClick={() => setTogglingState({ employee: emp, targetAccess: 'ENABLED' })}
                              className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-[11px] transition"
                              title="Enable SkillUp Learning Access"
                            >
                              Enable
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        <Pagination
          currentPage={filters.page}
          totalCount={totalCount}
          pageSize={filters.pageSize}
          onPageChange={(p) => setFilters(prev => ({ ...prev, page: p }))}
          onPageSizeChange={(s) => setFilters(prev => ({ ...prev, pageSize: s, page: 1 }))}
        />
      </div>

      {/* Employee Detail Modal */}
      {selectedEmployee && (
        <Modal
          isOpen={Boolean(selectedEmployee)}
          onClose={() => setSelectedEmployee(null)}
          title="Employee Profile & Learning Details"
          subtitle={`Master record for ${selectedEmployee.full_name} (${selectedEmployee.employee_id})`}
          maxWidth="lg"
        >
          <div className="space-y-5 text-xs">
            {/* Header Profile Card */}
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center font-black text-base shadow-sm">
                  {selectedEmployee.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'EM'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-slate-900">{selectedEmployee.full_name}</h4>
                    <span className="font-mono text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                      {selectedEmployee.employee_id}
                    </span>
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5">{selectedEmployee.email}</div>
                </div>
              </div>

              <div className="text-right space-y-1">
                <div>
                  <Badge variant={selectedEmployee.employment_status === 'ACTIVE' ? 'active' : 'inactive'} size="sm" dot>
                    {selectedEmployee.employment_status}
                  </Badge>
                </div>
                <div>
                  <Badge variant={selectedEmployee.skillup_access === 'ENABLED' ? 'enabled' : 'disabled'} size="sm">
                    Access: {selectedEmployee.skillup_access}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Profile Grid Details */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Designation / Role</span>
                <div className="text-xs font-bold text-slate-800 mt-0.5">{selectedEmployee.role_name || (selectedEmployee.role_id ? `Role #${selectedEmployee.role_id}` : 'Unassigned')}</div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Operating Location</span>
                <div className="text-xs font-bold text-slate-800 mt-0.5">{selectedEmployee.location_name || (selectedEmployee.location_id ? `Location #${selectedEmployee.location_id}` : 'Unassigned')}</div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Official Mobile</span>
                <div className="text-xs font-mono font-bold text-slate-800 mt-0.5">{selectedEmployee.mobile_number || '—'}</div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reporting Manager</span>
                <div className="text-xs font-bold text-slate-800 mt-0.5">
                  {selectedEmployee.reporting_manager_name || '—'}
                  {selectedEmployee.reporting_manager_employee_id && (
                    <span className="text-[11px] font-mono text-slate-400 ml-1">({selectedEmployee.reporting_manager_employee_id})</span>
                  )}
                </div>
              </div>
            </div>

            {/* Learning Activity Status Section */}
            {isLoadingActivity ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl animate-pulse space-y-2">
                <div className="h-4 bg-slate-200 rounded w-1/3" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            ) : learningActivity && learningActivity.assignedCount > 0 ? (
              <div className="p-4 bg-orange-50/60 border border-orange-200/80 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">SkillUp Learning Progress</span>
                  <span className="text-orange-600 font-bold">{learningActivity.assignedCount} Courses Assigned</span>
                </div>
                
                <div className="space-y-2">
                  {learningActivity.assignments.map(a => (
                    <div key={a.id} className="p-2.5 bg-white rounded-xl border border-orange-100 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-slate-800 text-xs">{a.courseTitle}</div>
                        <div className="text-[10px] text-slate-400 uppercase">{a.status}</div>
                      </div>
                      <span className="font-bold text-slate-700">{a.progress}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-5 bg-slate-50 border border-slate-200/70 rounded-2xl text-center space-y-1.5">
                <svg className="w-6 h-6 text-slate-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <div className="font-bold text-slate-700 text-xs">No learning activity yet</div>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  Course assignments and module completions will appear here once curricula are assigned to this employee.
                </p>
              </div>
            )}

            {/* Profile Action Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                {canManageEmployees && (
                  <button
                    type="button"
                    onClick={() => {
                      const emp = selectedEmployee;
                      setSelectedEmployee(null);
                      setEditingEmployee(emp);
                    }}
                    className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold rounded-xl text-xs transition"
                  >
                    Edit Details
                  </button>
                )}

                {canManageAccess && (
                  selectedEmployee.skillup_access === 'ENABLED' ? (
                    <button
                      type="button"
                      onClick={() => {
                        const emp = selectedEmployee;
                        setSelectedEmployee(null);
                        setTogglingState({ employee: emp, targetAccess: 'DISABLED' });
                      }}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition"
                    >
                      Disable Access
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const emp = selectedEmployee;
                        setSelectedEmployee(null);
                        setTogglingState({ employee: emp, targetAccess: 'ENABLED' });
                      }}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl text-xs transition"
                    >
                      Enable Access
                    </button>
                  )
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedEmployee(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition"
              >
                Close Profile
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Employee Modal */}
      <AddEmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={loadEmployees}
        roles={roles}
        locations={locations}
      />

      {/* Edit Employee Modal */}
      <EditEmployeeModal
        isOpen={Boolean(editingEmployee)}
        onClose={() => setEditingEmployee(null)}
        onSuccess={loadEmployees}
        employee={editingEmployee}
        roles={roles}
        locations={locations}
      />

      {/* Access Toggle Confirmation Modal */}
      {togglingState && (
        <AccessToggleModal
          isOpen={Boolean(togglingState)}
          onClose={() => setTogglingState(null)}
          onSuccess={loadEmployees}
          employee={togglingState.employee}
          targetAccess={togglingState.targetAccess}
        />
      )}

      {/* Bulk CSV Import Modal */}
      <BulkImportModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSuccess={loadEmployees}
        roles={roles}
        locations={locations}
      />
    </div>
  );
};
