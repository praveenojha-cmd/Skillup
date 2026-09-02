import React, { useState, useEffect } from 'react';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { 
  fetchDashboardStats, 
  fetchLocations, 
  fetchRoles, 
  fetchLiveCityDistribution, 
  fetchLiveDesignationDistribution 
} from '../lib/supabase';
import { DashboardStats, Location, Role, LocationDistribution, RoleDistribution } from '../types/database';
import { AppRoute } from '../types/auth';

interface DashboardPageProps {
  onNavigate: (route: AppRoute) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [cityDist, setCityDist] = useState<LocationDistribution[]>([]);
  const [roleDist, setRoleDist] = useState<RoleDistribution[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      setError(null);
      setStats(null);
      try {
        const [statsData, locData, rolesData, cityData, roleData] = await Promise.all([
          fetchDashboardStats(),
          fetchLocations(),
          fetchRoles(),
          fetchLiveCityDistribution(),
          fetchLiveDesignationDistribution()
        ]);
        if (isMounted) {
          setStats(statsData);
          setLocations(locData);
          setRoles(rolesData);
          setCityDist(cityData);
          setRoleDist(roleData);
        }
      } catch (err: any) {
        console.error('Error loading live dashboard metrics from Supabase:', err);
        if (isMounted) {
          setError(err?.message || 'Failed to load real-time metrics from Supabase.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, []);

  const totalEmployeesCount = stats ? stats.totalEmployees : 0;
  const activeEmployeesCount = stats ? stats.activeEmployees : 0;
  const skillUpEnabledCount = stats ? stats.skillUpEnabled : 0;
  const skillUpDisabledCount = stats ? stats.skillUpDisabled : 0;
  const totalCoursesCount = stats ? stats.totalCourses : 0;
  const assignedCoursesCount = stats ? stats.assignedCourses : 0;
  const completionRateVal = stats ? stats.completionRate : 0;

  const activePct = totalEmployeesCount > 0 
    ? `${Math.round((activeEmployeesCount / totalEmployeesCount) * 100)}%` 
    : '0%';

  const colorPalette = ['bg-orange-500', 'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500'];

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Page Header Banner */}
      <div className="bg-gradient-to-r from-[#0B192C] via-[#0F2848] to-[#1E3A5F] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 w-96 h-full bg-gradient-to-l from-orange-600/15 to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-400/30 text-orange-300 text-xs font-bold uppercase tracking-wider mb-3">
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
              Rupeek Learning & Development
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              SkillUp LMS Executive Dashboard
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1.5 leading-relaxed">
              Real-time synchronization with Supabase PostgreSQL database. Monitoring {totalEmployeesCount > 0 ? `${totalEmployeesCount} business employees` : 'employees'} across {locations.length > 0 ? `${locations.length} operating locations` : 'operating locations'}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('/admin/employees')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-orange-950/40 flex items-center gap-2"
            >
              <span>Manage Employees</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-1 bg-rose-600 text-white font-semibold rounded-lg hover:bg-rose-700 transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Employees"
          value={totalEmployeesCount}
          subtitle="Registered in public.employees"
          accentColor="navy"
          loading={isLoading}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />

        <StatCard
          title="Active Employees"
          value={activeEmployeesCount}
          subtitle="employment_status = 'ACTIVE'"
          change={activePct}
          isPositive={true}
          accentColor="emerald"
          loading={isLoading}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        <StatCard
          title="SkillUp Enabled"
          value={skillUpEnabledCount}
          subtitle="skillup_access = 'ENABLED'"
          change="Access Active"
          isPositive={true}
          accentColor="blue"
          loading={isLoading}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />

        <StatCard
          title="SkillUp Disabled"
          value={skillUpDisabledCount}
          subtitle="skillup_access = 'DISABLED'"
          accentColor="rose"
          loading={isLoading}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          }
        />
      </div>

      {/* Secondary Learning Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Courses"
          value={totalCoursesCount}
          subtitle={totalCoursesCount > 0 ? "Published curricula" : "No courses published in database yet"}
          accentColor="orange"
          loading={isLoading}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          }
        />

        <StatCard
          title="Assigned Enrollments"
          value={assignedCoursesCount}
          subtitle={assignedCoursesCount > 0 ? "Active employee assignments" : "No assignments created yet"}
          accentColor="blue"
          loading={isLoading}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />

        <StatCard
          title="Completion Rate"
          value={assignedCoursesCount > 0 ? `${completionRateVal}%` : '0%'}
          subtitle={assignedCoursesCount > 0 ? "Organization completion ratio" : "No assignments to complete yet"}
          accentColor="emerald"
          loading={isLoading}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          }
        />
      </div>

      {/* Distribution Widgets & Enterprise Context */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Operating Location Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Operating Locations {locations.length > 0 ? `(${locations.length} Locations)` : ''}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Live headcount distribution from Supabase</p>
            </div>
            <button
              onClick={() => onNavigate('/admin/employees')}
              className="text-xs font-bold text-orange-600 hover:text-orange-700 transition"
            >
              View Directory &rarr;
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3, 4, 5].map(n => (
                <div key={n} className="space-y-1">
                  <div className="h-3 bg-slate-100 rounded w-1/3" />
                  <div className="h-2 bg-slate-100 rounded-full w-full" />
                </div>
              ))}
            </div>
          ) : cityDist.length > 0 ? (
            <div className="space-y-3">
              {cityDist.slice(0, 6).map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{item.location_name}</span>
                    <span className="font-bold text-slate-900">{item.count} employees ({item.percentage}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${colorPalette[idx % colorPalette.length]} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.min(100, Math.max(2, item.percentage))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              No location data found in Supabase.
            </div>
          )}
        </div>

        {/* Designation Hierarchy Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Business Roles {roles.length > 0 ? `(${roles.length} Roles)` : ''}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Live role headcount distribution from Supabase</p>
            </div>
            <button
              onClick={() => onNavigate('/admin/employees')}
              className="text-xs font-bold text-orange-600 hover:text-orange-700 transition"
            >
              Explore Roles &rarr;
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3, 4, 5].map(n => (
                <div key={n} className="space-y-1">
                  <div className="h-3 bg-slate-100 rounded w-1/3" />
                  <div className="h-2 bg-slate-100 rounded-full w-full" />
                </div>
              ))}
            </div>
          ) : roleDist.length > 0 ? (
            <div className="space-y-3">
              {roleDist.slice(0, 6).map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{item.role_name}</span>
                    <span className="font-bold text-slate-900">{item.count} employees ({item.percentage}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${colorPalette[idx % colorPalette.length]} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.min(100, Math.max(2, item.percentage))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              No role data found in Supabase.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

