import React, { useState, useRef } from 'react';
import { Modal } from '../common/Modal';
import { Role, Location, BulkImportRow, BulkImportValidationResult, BulkImportSummary } from '../../types/database';
import { fetchAllExistingEmployeeIdentifiers, insertBulkEmployees } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  roles: Role[];
  locations: Location[];
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  roles,
  locations
}) => {
  const { showSuccess, showError, showInfo } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [validationResult, setValidationResult] = useState<BulkImportValidationResult | null>(null);
  const [importSummary, setImportSummary] = useState<BulkImportSummary | null>(null);
  const [activeTab, setActiveTab] = useState<'valid' | 'errors'>('errors');

  // Reset state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setStep('upload');
      setSelectedFile(null);
      setIsProcessing(false);
      setValidationResult(null);
      setImportSummary(null);
      setActiveTab('errors');
    }
  }, [isOpen]);

  // 1. Download CSV Template (Headers Only - No fake or sample employee rows)
  const handleDownloadTemplate = () => {
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

    const blob = new Blob([headers + '\n'], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'SkillUp_Employee_Bulk_Import_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showInfo('Clean CSV template downloaded (headers only).', 'Template Download');
  };

  // Helper to parse a single CSV line with quote handling
  const parseCsvLine = (text: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(cur.trim().replace(/^["']|["']$/g, ''));
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur.trim().replace(/^["']|["']$/g, ''));
    return result;
  };

  // 2. Parse & Validate CSV
  const handleFileChange = async (file: File) => {
    if (!file) return;
    setSelectedFile(file);
    setIsProcessing(true);

    try {
      const text = await file.text();
      const lines = text.split(/\r\n|\n/).map(l => l.trim()).filter(l => l.length > 0);

      if (lines.length <= 1) {
        showError('The uploaded CSV file has no employee data rows.', 'Empty File');
        setIsProcessing(false);
        return;
      }

      // Fetch all existing employee IDs and emails from Supabase
      const { employeeIds: existingIds, emails: existingEmails } = await fetchAllExistingEmployeeIdentifiers();

      const seenIdsInCsv = new Set<string>();
      const seenEmailsInCsv = new Set<string>();
      let duplicateRowsCount = 0;

      const validRows: BulkImportRow[] = [];
      const invalidRows: BulkImportRow[] = [];
      const allErrors: Array<{ row: number; employee_id: string; error: string }> = [];

      // Create lookup maps for roles and locations
      const roleMap = new Map<string, Role>();
      roles.forEach(r => {
        roleMap.set(r.name.toLowerCase().trim(), r);
      });

      const locationMap = new Map<string, Location>();
      locations.forEach(loc => {
        if (loc.name) locationMap.set(loc.name.toLowerCase().trim(), loc);
        if (loc.city) locationMap.set(loc.city.toLowerCase().trim(), loc);
      });

      const dataRows = lines.slice(1);

      dataRows.forEach((line, idx) => {
        const rowNum = idx + 2; // header is row 1
        const cols = parseCsvLine(line);

        const empId = (cols[0] || '').trim().toUpperCase();
        const fullName = (cols[1] || '').trim();
        const email = (cols[2] || '').trim().toLowerCase();
        const mobile = (cols[3] || '').trim();
        const roleStr = (cols[4] || '').trim();
        const locStr = (cols[5] || '').trim();
        const mgrEmpId = (cols[6] || '').trim().toUpperCase();
        const mgrName = (cols[7] || '').trim();
        const rawStatus = (cols[8] || 'ACTIVE').trim().toUpperCase();
        const rawAccess = (cols[9] || 'ENABLED').trim().toUpperCase();

        const employment_status = rawStatus === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';
        const skillup_access = rawAccess === 'DISABLED' ? 'DISABLED' : 'ENABLED';

        const rowErrors: string[] = [];

        // Required checks
        if (!empId) rowErrors.push('Missing Employee ID.');
        if (!fullName) rowErrors.push('Missing Full Name.');
        if (!email) rowErrors.push('Missing Official Email.');
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          rowErrors.push(`Invalid email format: "${email}".`);
        }

        // Intra-CSV Duplicate Checks
        if (empId) {
          if (seenIdsInCsv.has(empId)) {
            rowErrors.push(`Duplicate Employee ID "${empId}" found within CSV.`);
            duplicateRowsCount++;
          } else {
            seenIdsInCsv.add(empId);
          }
        }

        if (email) {
          if (seenEmailsInCsv.has(email)) {
            rowErrors.push(`Duplicate Email "${email}" found within CSV.`);
          } else {
            seenEmailsInCsv.add(email);
          }
        }

        // Check against existing production database (Zero overwrite rule)
        if (empId && existingIds.has(empId)) {
          rowErrors.push(`Employee ID "${empId}" already exists in public.employees (Protected).`);
        }

        if (email && existingEmails.has(email)) {
          rowErrors.push(`Email "${email}" already exists in public.employees (Protected).`);
        }

        // Role validation
        let matchedRole: Role | undefined = undefined;
        if (!roleStr) {
          rowErrors.push('Missing Designation / Role.');
        } else {
          matchedRole = roleMap.get(roleStr.toLowerCase());
          if (!matchedRole) {
            rowErrors.push(`Designation "${roleStr}" is not recognized in public.roles.`);
          }
        }

        // Location validation
        let matchedLocation: Location | undefined = undefined;
        if (!locStr) {
          rowErrors.push('Missing Operating Location.');
        } else {
          matchedLocation = locationMap.get(locStr.toLowerCase());
          if (!matchedLocation) {
            rowErrors.push(`Location "${locStr}" is not recognized in public.locations.`);
          }
        }

        const parsedRow: BulkImportRow = {
          rowNumber: rowNum,
          employee_id: empId || `ROW_${rowNum}`,
          full_name: fullName,
          email: email,
          mobile_number: mobile,
          role_name: matchedRole?.name || roleStr,
          location_name: matchedLocation?.city || matchedLocation?.name || locStr,
          reporting_manager_employee_id: mgrEmpId,
          reporting_manager_name: mgrName,
          employment_status,
          skillup_access,
          role_id: matchedRole ? Number(matchedRole.id) : undefined,
          location_id: matchedLocation ? Number(matchedLocation.id) : undefined,
          isValid: rowErrors.length === 0,
          errors: rowErrors
        };

        if (rowErrors.length === 0) {
          validRows.push(parsedRow);
        } else {
          invalidRows.push(parsedRow);
          rowErrors.forEach(err => {
            allErrors.push({
              row: rowNum,
              employee_id: empId || `Row #${rowNum}`,
              error: err
            });
          });
        }
      });

      const res: BulkImportValidationResult = {
        totalRows: dataRows.length,
        validRows,
        invalidRows,
        duplicateRowsCount,
        allErrors
      };

      setValidationResult(res);
      setStep('preview');
      setActiveTab(invalidRows.length > 0 ? 'errors' : 'valid');
    } catch (err: any) {
      console.error('Error parsing CSV:', err);
      showError(err?.message || 'Failed to parse CSV file.', 'Parsing Error');
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. Confirm & Execute Insertion of Valid Rows
  const handleExecuteImport = async () => {
    if (!validationResult || validationResult.validRows.length === 0) {
      showError('No valid rows available to import.', 'Validation Block');
      return;
    }

    setIsProcessing(true);
    try {
      const summary = await insertBulkEmployees(validationResult.validRows);
      setImportSummary(summary);
      setStep('result');
      showSuccess(
        `Successfully imported ${summary.successfullyImported} employees into public.employees.`,
        'Bulk Import Completed'
      );
      onSuccess();
    } catch (err: any) {
      console.error('Error during bulk import execution:', err);
      showError(err?.message || 'Failed to insert bulk employee records.', 'Import Error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bulk Employee Import"
      subtitle="Upload and validate employee master CSV with row-level error reporting"
      maxWidth="3xl"
    >
      <div className="space-y-4 text-xs font-sans">
        {/* Step 1: Upload CSV */}
        {step === 'upload' && (
          <div className="space-y-5">
            {/* Template Download Prompt */}
            <div className="p-4 bg-orange-50/70 border border-orange-200/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-slate-900 text-xs">Need the official template?</h4>
                <p className="text-[11.5px] text-slate-600 mt-0.5">
                  Download the formatted CSV template with required columns and valid designations.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="px-3.5 py-2 bg-white border border-orange-300 text-orange-700 hover:bg-orange-100 rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow-sm shrink-0"
              >
                <svg className="w-4 h-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Download CSV Template</span>
              </button>
            </div>

            {/* Drag & Drop Upload Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileChange(e.dataTransfer.files[0]);
                }
              }}
              className="border-2 border-dashed border-slate-300 hover:border-orange-500 bg-slate-50 hover:bg-orange-50/30 rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-inner">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div className="space-y-1">
                <p className="font-bold text-slate-800 text-sm">Click to choose or drag & drop CSV file</p>
                <p className="text-[11px] text-slate-400">Strict validation will verify all employee IDs, emails, roles, and locations.</p>
              </div>
            </div>

            {/* Import Instructions Box */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5 text-[11.5px] text-slate-600">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                <svg className="w-4 h-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Import Instructions & Column Guidelines</span>
              </div>
              <ul className="space-y-1.5 list-disc pl-5 text-slate-600 leading-relaxed">
                <li><strong className="text-slate-800">Employee ID:</strong> Unique alphanumeric ID (e.g. EMP001). Must not already exist in the system.</li>
                <li><strong className="text-slate-800">Full Name & Official Email:</strong> Mandatory. Email must follow official corporate format (e.g. name@rupeek.com).</li>
                <li><strong className="text-slate-800">Designation & Location:</strong> Must match system designations and operating cities exactly.</li>
                <li><strong className="text-slate-800">Employment Status:</strong> Allowed values are <code className="px-1 py-0.5 bg-slate-200 rounded font-mono text-[10.5px]">ACTIVE</code> or <code className="px-1 py-0.5 bg-slate-200 rounded font-mono text-[10.5px]">INACTIVE</code> (defaults to ACTIVE if omitted).</li>
                <li><strong className="text-slate-800">SkillUp Access:</strong> Allowed values are <code className="px-1 py-0.5 bg-slate-200 rounded font-mono text-[10.5px]">ENABLED</code> or <code className="px-1 py-0.5 bg-slate-200 rounded font-mono text-[10.5px]">DISABLED</code> (defaults to ENABLED if omitted).</li>
                <li><strong className="text-slate-800">Atomicity & Zero-Overwrite:</strong> Existing production employees will never be modified. All valid records in a confirmed batch are committed atomically in a single production transaction.</li>
              </ul>
            </div>

            {isProcessing && (
              <div className="p-4 bg-slate-100 rounded-xl flex items-center justify-center gap-2 text-slate-700 font-semibold">
                <svg className="w-4 h-4 animate-spin text-orange-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Validating CSV rows against public.employees...</span>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Validation Preview */}
        {step === 'preview' && validationResult && (
          <div className="space-y-4">
            {/* Validation Metrics Grid */}
            <div className="grid grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <div className="text-[10.5px] font-bold text-slate-500 uppercase">Total Rows</div>
                <div className="text-lg font-black text-slate-900 mt-0.5">{validationResult.totalRows}</div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                <div className="text-[10.5px] font-bold text-emerald-700 uppercase">Valid Rows</div>
                <div className="text-lg font-black text-emerald-800 mt-0.5">{validationResult.validRows.length}</div>
              </div>

              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-center">
                <div className="text-[10.5px] font-bold text-rose-700 uppercase">Invalid Rows</div>
                <div className="text-lg font-black text-rose-800 mt-0.5">{validationResult.invalidRows.length}</div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
                <div className="text-[10.5px] font-bold text-amber-700 uppercase">Duplicates</div>
                <div className="text-lg font-black text-amber-800 mt-0.5">{validationResult.duplicateRowsCount}</div>
              </div>
            </div>

            {/* Tabs for Valid vs Invalid Rows */}
            <div className="flex items-center gap-2 border-b border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab('errors')}
                className={`pb-2 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
                  activeTab === 'errors'
                    ? 'border-rose-600 text-rose-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <span>Row-Level Errors</span>
                <span className="px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800 text-[10px]">
                  {validationResult.allErrors.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('valid')}
                className={`pb-2 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
                  activeTab === 'valid'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <span>Valid Records Preview</span>
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px]">
                  {validationResult.validRows.length}
                </span>
              </button>
            </div>

            {/* Error Table */}
            {activeTab === 'errors' && (
              <div className="max-h-60 overflow-y-auto rounded-xl border border-rose-200 bg-rose-50/30 p-2 space-y-1.5">
                {validationResult.allErrors.length === 0 ? (
                  <div className="py-6 text-center text-emerald-700 font-bold">
                    No validation errors found in this CSV. All rows are valid for import.
                  </div>
                ) : (
                  validationResult.allErrors.map((err, i) => (
                    <div key={i} className="p-2 bg-white rounded-lg border border-rose-200 flex items-start gap-2.5">
                      <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-mono font-bold text-[10px] shrink-0">
                        Row {err.row}
                      </span>
                      <span className="font-mono text-slate-700 font-bold shrink-0">{err.employee_id}:</span>
                      <span className="text-rose-700 font-medium text-xs">{err.error}</span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Valid Rows Preview Table */}
            {activeTab === 'valid' && (
              <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0">
                    <tr>
                      <th className="p-2">Row</th>
                      <th className="p-2">ID</th>
                      <th className="p-2">Name</th>
                      <th className="p-2">Email</th>
                      <th className="p-2">Designation</th>
                      <th className="p-2">Location</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {validationResult.validRows.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400">
                          No valid rows to preview.
                        </td>
                      </tr>
                    ) : (
                      validationResult.validRows.map((r) => (
                        <tr key={r.rowNumber} className="hover:bg-slate-50 font-medium">
                          <td className="p-2 font-mono text-slate-400">{r.rowNumber}</td>
                          <td className="p-2 font-mono font-bold text-orange-600">{r.employee_id}</td>
                          <td className="p-2 font-bold text-slate-900">{r.full_name}</td>
                          <td className="p-2 text-slate-600">{r.email}</td>
                          <td className="p-2 text-slate-800">{r.role_name}</td>
                          <td className="p-2 text-slate-700">{r.location_name}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Safety Notice */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-[11px] flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                Existing 813 production employee records are strictly protected and will not be overwritten.
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep('upload')}
                disabled={isProcessing}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
              >
                Choose Another File
              </button>

              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={isProcessing || validationResult.validRows.length === 0}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Importing Valid Employees...</span>
                  </>
                ) : (
                  <span>Import {validationResult.validRows.length} Valid Employees</span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Result Summary */}
        {step === 'result' && importSummary && (
          <div className="space-y-4">
            <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="text-base font-bold text-emerald-900">Bulk Import Processed</h4>
              <p className="text-xs text-emerald-800">
                Live database has been updated and dashboard counts synchronized.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Processed</div>
                <div className="text-base font-black text-slate-900 mt-0.5">{importSummary.totalProcessed}</div>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                <div className="text-[10px] font-bold text-emerald-700 uppercase">Imported</div>
                <div className="text-base font-black text-emerald-800 mt-0.5">{importSummary.successfullyImported}</div>
              </div>
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-center">
                <div className="text-[10px] font-bold text-rose-700 uppercase">Rejected / Skipped</div>
                <div className="text-base font-black text-rose-800 mt-0.5">{importSummary.rejectedCount}</div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition"
              >
                Close & View Directory
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
