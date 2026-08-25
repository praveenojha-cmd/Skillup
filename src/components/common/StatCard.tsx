import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: string;
  isPositive?: boolean;
  icon?: React.ReactNode;
  accentColor?: 'orange' | 'navy' | 'emerald' | 'blue' | 'rose' | 'amber';
  loading?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  change,
  isPositive,
  icon,
  accentColor = 'orange',
  loading = false
}) => {
  const accentClasses = {
    orange: 'bg-orange-500/10 text-orange-600 border-orange-200/50',
    navy: 'bg-slate-900/10 text-slate-900 border-slate-200/60',
    emerald: 'bg-emerald-500/10 text-emerald-600 border-emerald-200/50',
    blue: 'bg-blue-500/10 text-blue-600 border-blue-200/50',
    rose: 'bg-rose-500/10 text-rose-600 border-rose-200/50',
    amber: 'bg-amber-500/10 text-amber-600 border-amber-200/50'
  }[accentColor];

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm animate-pulse">
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 bg-slate-200 rounded w-24" />
          <div className="w-10 h-10 bg-slate-200 rounded-xl" />
        </div>
        <div className="h-8 bg-slate-200 rounded w-20 mb-2" />
        <div className="h-3 bg-slate-100 rounded w-36" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        {icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${accentClasses} transition-transform group-hover:scale-105`}>
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">{value}</span>
        {change && (
          <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
            {change}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{subtitle}</p>
      )}
    </div>
  );
};
