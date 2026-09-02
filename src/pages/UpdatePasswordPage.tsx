import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getSupabaseClient } from '../lib/supabase';

const MIN_PASSWORD_LENGTH = 8;

/**
 * Rendered whenever AuthContext's `isPasswordRecovery` is true (i.e. the
 * current Supabase session came from a password-recovery link's
 * PASSWORD_RECOVERY auth event, not a normal sign-in). Lets the user set a
 * new password via the standard, non-privileged `auth.updateUser()` API —
 * no service_role/secret key, no direct database access, no manual
 * auth.users manipulation. The recovery token itself is never read,
 * displayed, or logged here; supabase-js already consumed it to establish
 * the current session before this page ever renders.
 */
export const UpdatePasswordPage: React.FC = () => {
  const { logout } = useAuth();
  const { showSuccess, showError } = useToast();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!newPassword || !confirmPassword) {
      setValidationError('Please enter and confirm your new password.');
      return;
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setValidationError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setValidationError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await getSupabaseClient().auth.updateUser({
        password: newPassword
      });

      if (error) {
        setValidationError(error.message || 'Failed to update password.');
        showError(error.message || 'Failed to update password.', 'Update Failed');
        return;
      }

      setIsSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      showSuccess('Your password has been updated successfully.', 'Password Updated');
    } catch (err: any) {
      const msg = err?.message || 'Failed to update password. Please try again.';
      setValidationError(msg);
      showError(msg, 'Update Failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinueToLogin = async () => {
    // Sign out the temporary recovery session first, then AuthContext's
    // state reset (including isPasswordRecovery) naturally routes back to
    // the normal LoginPage.
    await logout();
  };

  return (
    <div className="min-h-screen bg-[#071322] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans selection:bg-orange-500 selection:text-white">
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
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
        </div>
        <p className="mt-2 text-xs text-slate-400 max-w-sm mx-auto">
          {isSuccess
            ? 'Your password has been changed. Sign in with your new password to continue.'
            : 'Set a new password for your account to complete the recovery process.'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-[#0B192C] py-8 px-6 sm:px-8 shadow-2xl rounded-3xl border border-slate-800/90 backdrop-blur-xl relative">
          {isSuccess ? (
            <div className="space-y-6 text-center">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-950/80 border border-emerald-700/60 text-emerald-400 flex items-center justify-center">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="text-sm font-bold text-white">Password updated successfully</div>
              <button
                type="button"
                onClick={handleContinueToLogin}
                className="w-full py-3 px-4 rounded-xl text-white font-bold bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition shadow-lg shadow-orange-950/50 text-xs uppercase tracking-wider"
              >
                Continue to Login
              </button>
            </div>
          ) : (
            <>
              {validationError && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-950/80 border border-rose-700/50 text-rose-200 text-xs flex items-start gap-2.5">
                  <svg className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="font-medium leading-relaxed">{validationError}</div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block font-bold text-slate-200 uppercase tracking-wider text-[11px]">
                      New Password
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
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-200 uppercase tracking-wider text-[11px] mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition text-xs"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 rounded-xl text-white font-bold bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition shadow-lg shadow-orange-950/50 flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <span>Set New Password</span>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
