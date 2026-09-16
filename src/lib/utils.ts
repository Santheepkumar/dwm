import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Activity } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Get today in YYYY-MM-DD format
export function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Format date to readable string
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

// Calculate days difference between a past date and today
export function getDaysDifference(dateString: string): number {
  if (!dateString) return 0;
  try {
    const d1 = new Date(dateString).getTime();
    const d2 = new Date(getTodayString()).getTime();
    const diffTime = d2 - d1;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}

// Calculate if task is "Long Pending" (Planned but not completed for > 3 days)
export function isLongPending(activity: Activity): boolean {
  if (activity.status === 'completed') return false;
  const days = getDaysDifference(activity.plannedDate);
  return days >= 3;
}

// Calculate if task is "Long Under Processing" (Under processing or waiting approval for > 3 days)
export function isLongUnderProcessing(activity: Activity): boolean {
  if (activity.status !== 'under_processing' && activity.status !== 'waiting_approval') {
    return false;
  }
  const days = getDaysDifference(activity.updatedAt ? activity.updatedAt.slice(0, 10) : activity.plannedDate);
  return days >= 3;
}

// Format hours nicely
export function formatHours(hours: number): string {
  if (!hours) return '0 hrs';
  if (hours < 1) return `${Math.round(hours * 60)} mins`;
  return `${hours} hrs`;
}

// Calculate variance between planned and actual hours
export function calculateVariance(planned: number, actual: number): { diff: number; text: string; color: string } {
  const diff = actual - planned;
  if (actual === 0) {
    return { diff: 0, text: 'Not started', color: 'text-slate-500' };
  }
  if (diff === 0) {
    return { diff: 0, text: 'On Target (0h variance)', color: 'text-emerald-600' };
  }
  if (diff < 0) {
    return { diff, text: `${Math.abs(diff).toFixed(1)}h ahead of plan`, color: 'text-teal-600' };
  }
  return { diff, text: `+${diff.toFixed(1)}h delayed`, color: 'text-rose-600' };
}
