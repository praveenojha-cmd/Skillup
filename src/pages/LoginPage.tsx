import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { SupabaseConfigModal } from '../components/settings/SupabaseConfigModal';

interface LoginPageProps {
  onLoginSuccess: (portal?: 'ADMIN' | 'EMPLOYEE') => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [targetPortal, setTargetPortal] = useState<'AUTO' | 'EMPLOYEE' | 'ADMIN'>('AUTO');
  // TEMP DIAGNOSTIC — adminAuthDiagnostic comes from AuthContext (set inside
  // checkUserAuthorization itself), not from a local submit-handler read, so
  // it's captured reliably regardless of which invocation of
  // checkUserAuthorization (login()'s direct call, or the
  // onAuthStateChange('SIGNED_IN') listener triggered by the same sign-in)
  // actually produced it. Remove this once the admin_users issue is resolved.
  const { login, isLoading, error, accessDeniedReason, adminAuthDiagnostic } = useAuth();
  const { showSuccess, showError } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      showError('Please enter your official Rupeek email.');
      return;
    }
    if (!password) {
      showError('Please enter your account password.');
      return;
    }

    const preferred = targetPortal === 'AUTO' ? undefined : targetPortal;
    const res = await login(email, password, preferred);
    if (res.success) {
      const portalType = res.portal || 'EMPLOYEE';
      showSuccess(`Welcome back! Authenticated as ${email}`, portalType === 'ADMIN' ? 'Admin Authorized' : 'Learner Portal Ready');
      onLoginSuccess(portalType);
    } else {
      showError(res.error || 'Authentication failed. Please verify credentials.', 'Access Denied');
    }
  };

  return (
    <div className="min-h-screen bg-[#071322] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans selection:bg-orange-500 selection:text-white">
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar Config link */}
      <div className="absolute top-4 right-4 z-10">
        <button
          type="button"
          onClick={() => setIsConfigOpen(true)}
          className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition shadow-sm backdrop-blur"
        >
          <svg className="w-3.5 h-3.5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Supabase Config</span>
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Rupeek Brand Icon */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white font-black text-2xl shadow-xl shadow-orange-950/60 mb-4 border border-orange-400/30">
          SK
        </div>

        <h2 className="text-2xl font-black text-white tracking-tight sm:text-3xl">
          SkillUp LMS
        </h2>
        <div className="flex items-center justify-center gap-2 mt-1">
          <span className="text-xs font-bold text-orange-400 uppercase tracking-widest bg-orange-950/50 px-2 py-0.5 rounded border border-orange-800/60">
            RUPEEK LEARNING PLATFORM
          </span>
          <span className="text-xs text-slate-400">&bull; Enterprise Portal</span>
        </div>
        <p className="mt-2 text-xs text-slate-400 max-w-sm mx-auto">
          Sign in with your official Rupeek credentials to access assigned courses, learning modules, quizzes, and LMS tools.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-[#0B192C] py-8 px-6 sm:px-8 shadow-2xl rounded-3xl border border-slate-800/90 backdrop-blur-xl relative">
          {/* Error Banner */}
          {(error || accessDeniedReason) && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-950/80 border border-rose-700/50 text-rose-200 text-xs flex items-start gap-2.5">
              <svg className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="font-medium leading-relaxed">{accessDeniedReason || error}</div>
            </div>
          )}

          {/* TEMP DIAGNOSTIC BOX — admin_users authorization diagnosis. Remove
              this entire block once the current login issue is resolved. */}
          {adminAuthDiagnostic && (
            <div className="mb-5 p-3.5 rounded-xl bg-amber-950/60 border border-amber-700/50 text-amber-100 text-[11px] font-mono leading-relaxed space-y-1">
              <div className="font-bold uppercase tracking-wider text-amber-300 text-[10px] mb-1">
                TEMP DIAGNOSTIC — admin_users query
              </div>
              <div>Admin query status: <span className="font-bold">{adminAuthDiagnostic.status}</span></div>
              {adminAuthDiagnostic.authUserId && <div>Auth user UUID queried: {adminAuthDiagnostic.authUserId}</div>}
              {adminAuthDiagnostic.errorCode !== undefined && adminAuthDiagnostic.errorCode !== null && (
                <div>Error code: {adminAuthDiagnostic.errorCode}</div>
              )}
              {adminAuthDiagnostic.errorMessage && <div>Error message: {adminAuthDiagnostic.errorMessage}</div>}
              {adminAuthDiagnostic.errorDetails && <div>Error details: {adminAuthDiagnostic.errorDetails}</div>}
              {adminAuthDiagnostic.errorHint && <div>Error hint: {adminAuthDiagnostic.errorHint}</div>}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-200 uppercase tracking-wider text-[11px] mb-1.5">
                Official Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="employee.name@rupeek.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition text-xs"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block font-bold text-slate-200 uppercase tracking-wider text-[11px]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="text-[11px] text-slate-400 hover:text-orange-400 transition"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter account password"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition text-xs"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl text-white font-bold bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition shadow-lg shadow-orange-950/50 flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
              >
                {isLoading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Verifying Authorization...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to SkillUp</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <SupabaseConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
      />
    </div>
  );
};
