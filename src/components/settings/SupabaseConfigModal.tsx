import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { getStoredSupabaseConfig, saveStoredSupabaseConfig, testSupabaseConnection } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({ isOpen, onClose }) => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (isOpen) {
      const config = getStoredSupabaseConfig();
      setUrl(config.url || '');
      setAnonKey(config.anonKey || '');
      setTestResult(null);
    }
  }, [isOpen]);

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    saveStoredSupabaseConfig(url, anonKey);
    
    const res = await testSupabaseConnection();
    setTestResult(res);
    setIsTesting(false);
    
    if (res.ok) {
      showSuccess(res.message, 'Supabase Connected');
    } else {
      showError(res.message, 'Connection Test Failed');
    }
  };

  const handleSave = () => {
    saveStoredSupabaseConfig(url, anonKey);
    showSuccess('Supabase configuration saved successfully.');
    onClose();
    // reload to apply new client configuration
    setTimeout(() => {
      window.location.reload();
    }, 400);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Supabase Backend Configuration"
      subtitle="Rupeek SkillUp LMS database and authentication connection settings."
      maxWidth="lg"
    >
      <div className="space-y-4 text-xs">
        {/* Security Advisory */}
        <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <div className="leading-relaxed text-blue-900">
            <strong className="font-bold">Client-Side Security Guarantee:</strong> Only safe public client credentials (<code className="font-mono bg-blue-100/80 px-1 py-0.5 rounded text-blue-800">anon_key</code>) are used. Privileged operations are strictly validated against <code className="font-mono bg-blue-100/80 px-1 py-0.5 rounded text-blue-800">public.admin_users</code> and PostgreSQL RLS security boundaries.
          </div>
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[11px]">
            Supabase Project URL
          </label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://your-project-ref.supabase.co"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
          />
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[11px]">
            Supabase Anon / Public Key
          </label>
          <textarea
            rows={3}
            value={anonKey}
            onChange={(e) => setAnonKey(e.target.value)}
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition resize-none"
          />
        </div>

        {testResult && (
          <div
            className={`p-3 rounded-xl border flex items-center gap-2.5 ${
              testResult.ok
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            <span className="font-bold">{testResult.ok ? '✓ Status:' : '✗ Notice:'}</span>
            <span>{testResult.message}</span>
          </div>
        )}

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={handleTest}
            disabled={isTesting}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition flex items-center gap-1.5"
          >
            {isTesting ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Testing...</span>
              </>
            ) : (
              <span>Test Connection</span>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl shadow-sm transition"
            >
              Save & Apply
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
