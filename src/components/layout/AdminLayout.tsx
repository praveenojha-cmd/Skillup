import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';
import { AppRoute } from '../../types/auth';
import { SupabaseConfigModal } from '../settings/SupabaseConfigModal';

interface AdminLayoutProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onSearchChange?: (q: string) => void;
  searchValue?: string;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentRoute,
  onNavigate,
  title,
  subtitle,
  children,
  onSearchChange,
  searchValue
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex font-sans antialiased">
      {/* Sidebar navigation */}
      <Sidebar
        currentRoute={currentRoute}
        onNavigate={onNavigate}
        isOpen={isSidebarOpen}
        onCloseMobile={() => setIsSidebarOpen(false)}
      />

      {/* Main content view */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <TopNavbar
          title={title}
          subtitle={subtitle}
          onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
          onOpenConfig={() => setIsConfigOpen(true)}
          onSearchChange={onSearchChange}
          searchValue={searchValue}
        />

        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Supabase backend status & configuration modal */}
      <SupabaseConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
      />
    </div>
  );
};
