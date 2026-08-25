import React from 'react';
import { useAuth } from '../../context/AuthContext';

interface LearnerProfilePageProps {
  onNavigate: (path: string) => void;
}

export const LearnerProfilePage: React.FC<LearnerProfilePageProps> = ({ onNavigate }) => {
  const { employeeProfile, adminProfile, portalRole, setActivePortal } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-orange-400 uppercase tracking-widest bg-orange-950/50 px-2 py-0.5 rounded border border-orange-800/60">
            Employee Profile
          </span>
          <span className="text-xs text-slate-400">&bull; Master Data Record</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
          My Account &amp; Access Details
        </h1>
      </div>

      {/* Main Profile Card */}
      <div className="bg-[#0B192C] rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
        {/* Cover / Header Banner */}
        <div className="h-32 bg-gradient-to-r from-orange-600 via-amber-600 to-slate-900 relative p-6 flex items-end">
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-xl bg-slate-950/80 text-white text-xs font-bold border border-white/20">
              Verified Rupeek Employee
            </span>
          </div>
        </div>

        <div className="p-6 sm:p-8 pt-0 relative space-y-6">
          {/* Avatar and Primary Info */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12">
            <div className="flex items-end gap-4">
              <div className="w-24 h-24 rounded-3xl bg-[#071322] border-4 border-[#0B192C] shadow-2xl flex items-center justify-center text-3xl font-black text-orange-400">
                {employeeProfile?.full_name?.charAt(0) || 'E'}
              </div>
              <div className="space-y-0.5 mb-1">
                <h2 className="text-xl sm:text-2xl font-black text-white">{employeeProfile?.full_name || 'Rupeek Learner'}</h2>
                <p className="text-xs text-slate-400">{employeeProfile?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-end">
              <span className="px-3 py-1 rounded-xl bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 text-xs font-bold">
                ● ACTIVE
              </span>
              <span className="px-3 py-1 rounded-xl bg-orange-950/80 text-orange-300 border border-orange-700/60 text-xs font-bold">
                SkillUp: ENABLED
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Employee ID</div>
              <div className="text-sm font-black text-white font-mono">{employeeProfile?.employee_id || 'N/A'}</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Official Email</div>
              <div className="text-sm font-bold text-white">{employeeProfile?.email || 'N/A'}</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Role / Designation</div>
              <div className="text-sm font-bold text-white">{employeeProfile?.role_name || 'N/A'}</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Location / Branch</div>
              <div className="text-sm font-bold text-white">{employeeProfile?.location_name || 'Pan India'}</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Mobile Number</div>
              <div className="text-sm font-bold text-white">{employeeProfile?.mobile_number || 'N/A'}</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Reporting Manager</div>
              <div className="text-sm font-bold text-white">{employeeProfile?.reporting_manager_name || employeeProfile?.reporting_manager_email || 'Not Specified'}</div>
            </div>
          </div>

          {/* Dual Role Switcher if Admin access exists */}
          {(portalRole === 'DUAL' || adminProfile) && (
            <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>Administrator Privileges Detected</span>
                </div>
                <p className="text-xs text-slate-300">
                  Your official email is also authorized as an LMS Administrator in <code className="font-mono text-[11px] text-amber-300">public.admin_users</code>.
                </p>
              </div>

              <button
                onClick={() => {
                  setActivePortal('ADMIN');
                  onNavigate('/admin/dashboard');
                }}
                className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-amber-950/60 whitespace-nowrap"
              >
                Switch to Admin Console &rarr;
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
