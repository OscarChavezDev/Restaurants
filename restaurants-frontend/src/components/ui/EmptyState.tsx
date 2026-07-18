import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
  glowColor?: 'orange' | 'rose' | 'gray' | 'emerald' | 'blue';
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  glowColor = 'orange'
}: EmptyStateProps) {
  
  const glowVariants = {
    orange: 'bg-orange-500/20 text-orange-500',
    rose: 'bg-rose-500/20 text-rose-500',
    gray: 'bg-gray-500/20 text-gray-500',
    emerald: 'bg-emerald-500/20 text-emerald-500',
    blue: 'bg-blue-500/20 text-blue-500',
  };

  return (
    <div className={cn("flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-3xl bg-white dark:bg-[#15120E] border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden", className)}>
      {/* Background Glow */}
      <div className={cn("absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-[100px] pointer-events-none opacity-50 dark:opacity-30", glowVariants[glowColor].split(' ')[0])} />
      
      {/* Icon Container */}
      <div className="relative mb-6 group">
        <div className={cn("absolute inset-0 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500", glowVariants[glowColor].split(' ')[0])} />
        <div className="relative h-20 w-20 flex items-center justify-center rounded-3xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-lg group-hover:-translate-y-1 transition-transform duration-300">
          <Icon className={cn("h-10 w-10", glowVariants[glowColor].split(' ')[1])} strokeWidth={1.5} />
        </div>
      </div>

      {/* Content */}
      <h3 className="relative z-10 text-2xl font-bold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="relative z-10 text-gray-500 dark:text-gray-400 max-w-sm mb-8 leading-relaxed">
        {description}
      </p>

      {/* Action */}
      {action && (
        <div className="relative z-10">
          {action}
        </div>
      )}
    </div>
  );
}
