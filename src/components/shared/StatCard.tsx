import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
  isPositive?: boolean;
  subtitle?: string;
  gradient?: 'blue' | 'emerald' | 'amber' | 'purple' | 'rose';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  change,
  isPositive = true,
  subtitle,
  gradient = 'blue'
}) => {
  const gradientStyles = {
    blue: 'from-blue-500/10 to-indigo-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    emerald: 'from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    amber: 'from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    purple: 'from-purple-500/10 to-pink-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    rose: 'from-rose-500/10 to-red-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
  };

  const iconBgStyles = {
    blue: 'bg-zinc-800 text-orange-500 border border-zinc-700/50',
    emerald: 'bg-zinc-800 text-emerald-400 border border-zinc-700/50',
    amber: 'bg-amber-500/10 text-orange-400 border border-orange-500/20',
    purple: 'bg-zinc-800 text-purple-400 border border-zinc-700/50',
    rose: 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
  };

  return (
    <div className={cn(
      'bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between hover:border-zinc-700 transition-colors shadow-xl shadow-black/20'
    )}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-zinc-400 font-medium uppercase tracking-tight">
          {title}
        </span>
        <div className={cn('p-2 rounded-xl', iconBgStyles[gradient])}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-3 flex items-end justify-between">
        <h4 className="text-2xl font-bold text-white tracking-tight">
          {value}
        </h4>

        {change && (
          <span className={cn(
            'text-[10px] font-semibold px-1.5 py-0.5 rounded',
            isPositive ? 'text-emerald-400 bg-emerald-400/10' : 'text-rose-400 bg-rose-400/10'
          )}>
            {isPositive ? '+' : ''}{change}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-2 text-[11px] text-zinc-400 font-normal border-t border-zinc-800/80 pt-2">
          {subtitle}
        </p>
      )}
    </div>
  );
};
