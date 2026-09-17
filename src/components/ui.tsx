import React from 'react';
import { cn } from '../utils';

// ---------------------------------------------------------------
// Button
// ---------------------------------------------------------------
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ variant = 'primary', size = 'md', className, children, ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus:ring-slate-400',
    ghost: 'text-slate-600 hover:bg-slate-100 focus:ring-slate-400',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2',
  };
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  );
}

// ---------------------------------------------------------------
// Card
// ---------------------------------------------------------------
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: boolean;
}
export function Card({ className, children, padding = true, ...props }: CardProps) {
  return (
    <div className={cn('bg-white rounded-xl border border-slate-200 shadow-sm', padding && 'p-5', className)} {...props}>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------
// Badge
// ---------------------------------------------------------------
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'blue' | 'green' | 'amber' | 'red' | 'slate';
}
export function Badge({ variant = 'blue', className, children, ...props }: BadgeProps) {
  const colors = {
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    red: 'bg-red-100 text-red-700',
    slate: 'bg-slate-100 text-slate-600',
  };
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', colors[variant], className)} {...props}>
      {children}
    </span>
  );
}

// ---------------------------------------------------------------
// Progress Bar
// ---------------------------------------------------------------
interface ProgressBarProps {
  value: number; // 0–100
  className?: string;
  color?: string;
}
export function ProgressBar({ value, className, color = 'bg-blue-500' }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={cn('w-full bg-slate-100 rounded-full h-2', className)}>
      <div
        className={cn('h-2 rounded-full transition-all duration-300', color)}
        style={{ width: `${clamped}%` }}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
}

// ---------------------------------------------------------------
// MasteryBar - colour-coded version
// ---------------------------------------------------------------
export function MasteryBar({ mastery, className }: { mastery: number; className?: string }) {
  const color =
    mastery >= 80 ? 'bg-emerald-500' :
    mastery >= 60 ? 'bg-blue-500' :
    mastery >= 40 ? 'bg-amber-500' :
    mastery > 0 ? 'bg-red-400' : 'bg-slate-200';
  return <ProgressBar value={mastery} color={color} className={className} />;
}

// ---------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------
export function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-800">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

// ---------------------------------------------------------------
// Page wrapper
// ---------------------------------------------------------------
export function PageWrapper({ children, title, subtitle }: { children: React.ReactNode; title?: string; subtitle?: string }) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      {title && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          {subtitle && <p className="mt-1 text-slate-500">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

// ---------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------
export function EmptyState({ icon, title, description, action }: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="text-center py-12 px-4">
      {icon && <div className="mx-auto mb-4 text-slate-300">{icon}</div>}
      <h3 className="text-base font-semibold text-slate-700">{title}</h3>
      {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
