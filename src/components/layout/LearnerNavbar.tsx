import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { SupabaseConfigModal } from '../settings/SupabaseConfigModal';

interface LearnerNavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const LearnerNavbar: React.FC<LearnerNavbarProps> = ({ currentPath, onNavigate }) => {
  const { employeeProfile, adminProfile, portalRole, setActivePortal, logout } = useAuth();
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', path: '/learn/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { label: 'My Courses', path: '/learn/courses', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { label: 'Learning History', path: '/learn/history', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'My Profile', path: '/learn/profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' }
  ];

  const handleSwitchToAdmin = () => {
    setActivePortal('ADMIN');
    onNavigate('/admin/dashboard');
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#0B192C] border-b border-slate-800/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Brand & Navigation */}
            <div className="flex items-center gap-8">
              <div 
                onClick={() => onNavigate('/learn/dashboard')}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-orange-950/40 border border-orange-400/30 group-hover:scale-105 transition">
                  SK
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-white tracking-tight">SkillUp</span>
                    <span className="text-[10px] font-bold text-orange-400 bg-orange-950/60 border border-orange-800/60 px-1.5 py-0.5 rounded tracking-wide uppercase">
                      Learner
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium">Rupeek Learning Portal</div>
                </div>
              </div>

              {/* Desktop Nav Links */}
              <nav className="hidden md:flex items-center gap-1">
                {navItems.map((item) => {
                  const isActive = currentPath === item.path || (item.path !== '/learn/dashboard' && currentPath.startsWith(item.path));
                  return (
                    <button
                      key={item.path}
                      onClick={() => onNavigate(item.path)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                        isActive
                          ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30 shadow-sm'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                      </svg>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Right: Dual Role Switcher, Config, User Profile */}
            <div className="flex items-center gap-3">
              {/* Dual Role Switcher if user has Admin privileges */}
              {(portalRole === 'DUAL' || adminProfile) && (
                <button
                  type="button"
                  onClick={handleSwitchToAdmin}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition shadow-sm"
                  title="Switch to LMS Administrator Console"
                >
                  <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>Admin Console</span>
                </button>
              )}

              {/* Supabase Config Button */}
              <button
                type="button"
                onClick={() => setIsConfigOpen(true)}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-300 transition"
                title="Database Configuration"
              >
                <svg className="w-4 h-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(prev => !prev)}
                  className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 transition"
                >
                  <div className="w-8 h-8 rounded-lg bg-orange-600/30 border border-orange-500/40 flex items-center justify-center text-orange-300 font-bold text-xs">
                    {employeeProfile?.full_name?.charAt(0) || 'E'}
                  </div>
                  <div className="hidden lg:block text-left pr-1">
                    <div className="text-xs font-bold text-white leading-tight">
                      {employeeProfile?.full_name || 'Learner'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {employeeProfile?.employee_id || 'Employee'}
                    </div>
                  </div>
                  <svg className="w-3.5 h-3.5 text-slate-400 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#0B192C] border border-slate-800 shadow-2xl py-2 z-50 text-xs">
                    <div className="px-4 py-2.5 border-b border-slate-800/80">
                      <p className="font-bold text-white">{employeeProfile?.full_name || 'Learner'}</p>
                      <p className="text-[11px] text-slate-400 truncate">{employeeProfile?.email}</p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 text-[10px] font-semibold">
                          Active Employee
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-orange-950/80 text-orange-400 border border-orange-800/50 text-[10px] font-semibold">
                          SkillUp Enabled
                        </span>
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => { setIsUserMenuOpen(false); onNavigate('/learn/profile'); }}
                        className="w-full px-4 py-2 text-left text-slate-300 hover:bg-slate-800/80 hover:text-white flex items-center gap-2"
                      >
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>View Full Profile</span>
                      </button>

                      {(portalRole === 'DUAL' || adminProfile) && (
                        <button
                          type="button"
                          onClick={() => { setIsUserMenuOpen(false); handleSwitchToAdmin(); }}
                          className="w-full px-4 py-2 text-left text-amber-300 hover:bg-slate-800/80 flex items-center gap-2"
                        >
                          <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          <span>Switch to LMS Admin</span>
                        </button>
                      )}
                    </div>

                    <div className="pt-1 border-t border-slate-800/80">
                      <button
                        type="button"
                        onClick={async () => {
                          setIsUserMenuOpen(false);
                          await logout();
                          onNavigate('/login');
                        }}
                        className="w-full px-4 py-2 text-left text-rose-400 hover:bg-rose-950/30 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Navigation bar */}
          <div className="md:hidden py-2 border-t border-slate-800/60 flex items-center justify-around">
            {navItems.map((item) => {
              const isActive = currentPath === item.path || (item.path !== '/learn/dashboard' && currentPath.startsWith(item.path));
              return (
                <button
                  key={item.path}
                  onClick={() => onNavigate(item.path)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex flex-col items-center gap-1 transition ${
                    isActive
                      ? 'text-orange-400 bg-orange-500/10'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Supabase Config Modal */}
      <SupabaseConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
      />
    </>
  );
};
