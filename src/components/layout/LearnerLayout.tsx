import React from 'react';
import { LearnerNavbar } from './LearnerNavbar';

interface LearnerLayoutProps {
  children: React.ReactNode;
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const LearnerLayout: React.FC<LearnerLayoutProps> = ({
  children,
  currentPath,
  onNavigate
}) => {
  return (
    <div className="min-h-screen bg-[#071322] text-slate-100 font-sans flex flex-col selection:bg-orange-500 selection:text-white">
      {/* Learner Navigation Bar */}
      <LearnerNavbar currentPath={currentPath} onNavigate={onNavigate} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0B192C] py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">Rupeek SkillUp LMS</span>
            <span>&bull;</span>
            <span className="text-slate-400">Employee Learning &amp; Upskilling Platform</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Enterprise PostgreSQL &amp; Supabase RLS Security Active
          </div>
        </div>
      </footer>
    </div>
  );
};
