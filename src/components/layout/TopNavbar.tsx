import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common/Badge';

interface TopNavbarProps {
  onToggleSidebar: () => void;
  onOpenConfig: () => void;
  title: string;
  subtitle?: string;
  onSearchChange?: (q: string) => void;
  searchValue?: string;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  onToggleSidebar,
  onOpenConfig,
  title,
  subtitle,
  onSearchChange,
  searchValue = ''
}) => {
  const { adminProfile, isSuperAdmin, logout } = useAuth();

  return (
    <header className="sticky top-0 z-20 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 flex items-center justify-between">
      {/* Left: Mobile Toggle & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">SkillUp</span>
            <span className="text-xs text-slate-300">/</span>
            <h1 className="text-base font-bold text-slate-900 tracking-tight">{title}</h1>
          </div>
          {subtitle && <p className="text-[11px] text-slate-500 hidden sm:block">{subtitle}</p>}
        </div>
      </div>

      {/* Right: Search, Database Status, Config & User Actions */}
      <div className="flex items-center gap-3">
        {/* Search Bar if provided */}
        {onSearchChange && (
          <div className="relative hidden md:block w-64">
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Quick search employee, id..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
            />
          </div>
        )}

        {/* Supabase Connection Status Button */}
        <button
          onClick={onOpenConfig}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-700 transition"
          title="Supabase Database Status & Configuration"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="hidden sm:inline font-semibold">Supabase DB</span>
          <span className="text-[10px] text-slate-400 font-mono">RLS Active</span>
        </button>

        {/* User Pill */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
            {adminProfile?.name?.charAt(0) || 'P'}
          </div>
          <div className="hidden xl:block text-left">
            <div className="text-xs font-bold text-slate-900 leading-none">{adminProfile?.name || 'Praveen Ojha'}</div>
            <div className="text-[10px] text-slate-500 font-medium mt-0.5">{adminProfile?.role || 'SUPER_ADMIN'}</div>
          </div>
        </div>
      </div>
    </header>
  );
};
