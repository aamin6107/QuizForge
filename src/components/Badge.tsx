import React from 'react';

interface BadgeProps {
  variant?: 'purple' | 'gray' | 'green' | 'amber' | 'red' | 'blue';
  children: React.ReactNode;
  className?: string;
  mono?: boolean;
}

export function Badge({ variant = 'gray', children, className = '', mono = false }: BadgeProps) {
  const variantStyles = {
    purple: 'bg-purple-100/80 text-[#7B0FE8] border-purple-200',
    gray: 'bg-neutral-100 text-neutral-700 border-neutral-200/80',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-rose-50 text-rose-700 border-rose-200',
    blue: 'bg-sky-50 text-sky-700 border-sky-200',
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${variantStyles} ${
        mono ? 'font-mono' : ''
      } ${className}`}
    >
      {children}
    </span>
  );
}
