import React from 'react';
import { AppRoute } from '../types/auth';

interface PlaceholderPageProps {
  title: string;
  subtitle: string;
  moduleName: string;
  icon: React.ReactNode;
  tables: string[];
  features: string[];
  onNavigate: (route: AppRoute) => void;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  title,
  subtitle,
  moduleName,
  icon,
  tables,
  features,
  onNavigate
}) => {
  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 shadow-sm text-center max-w-2xl mx-auto space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-orange-50 text-orange-600 border border-orange-200/60 mx-auto flex items-center justify-center shadow-sm">
          {icon}
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            Phase 1 Staging &bull; Ready for Phase 2 Deployment
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight sm:text-3xl">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Database & Schema Readiness Details */}
        <div className="text-left bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Target Supabase PostgreSQL Tables
          </div>
          <div className="flex flex-wrap gap-2">
            {tables.map((t) => (
              <span key={t} className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-mono text-xs font-semibold text-slate-800 shadow-2xs">
                public.{t}
              </span>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-200/60">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Scheduled Capabilities in Phase 2
            </div>
            <ul className="text-xs text-slate-600 space-y-1">
              {features.map((f, i) => (
                <li key={i} className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => onNavigate('/admin/dashboard')}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition shadow-sm"
          >
            &larr; Back to Dashboard
          </button>
          <button
            onClick={() => onNavigate('/admin/employees')}
            className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs uppercase tracking-wider transition shadow-sm"
          >
            Go to Employee Directory &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};
