import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export function masteryLabel(mastery: number): { label: string; color: string } {
  if (mastery >= 80) return { label: 'Mastered', color: 'text-emerald-600' };
  if (mastery >= 60) return { label: 'Developing', color: 'text-blue-600' };
  if (mastery >= 40) return { label: 'Practising', color: 'text-amber-600' };
  if (mastery > 0) return { label: 'Needs Work', color: 'text-red-600' };
  return { label: 'Not Started', color: 'text-slate-400' };
}

export function priorityBadgeClass(priority: string): string {
  switch (priority) {
    case 'very_high': return 'bg-red-100 text-red-700 border border-red-200';
    case 'high': return 'bg-orange-100 text-orange-700 border border-orange-200';
    case 'medium': return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
    case 'low': return 'bg-slate-100 text-slate-600 border border-slate-200';
    default: return 'bg-slate-100 text-slate-500 border border-slate-200';
  }
}

export function priorityLabel(priority: string): string {
  switch (priority) {
    case 'very_high': return 'Very High Priority';
    case 'high': return 'High Priority';
    case 'medium': return 'Medium Priority';
    case 'low': return 'Low Priority';
    default: return 'Emerging';
  }
}

export function difficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'easy': return 'text-emerald-600 bg-emerald-50';
    case 'medium': return 'text-amber-600 bg-amber-50';
    case 'hard': return 'text-red-600 bg-red-50';
    default: return 'text-slate-600 bg-slate-50';
  }
}
