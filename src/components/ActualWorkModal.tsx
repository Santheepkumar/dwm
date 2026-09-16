'use client';

import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Clock, FileText, Check } from 'lucide-react';
import { Activity } from '@/lib/types';
import { calculateVariance } from '@/lib/utils';

interface ActualWorkModalProps {
  activity: Activity | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, actualHours: number, notes: string, completed: boolean) => Promise<void>;
}

export const ActualWorkModal: React.FC<ActualWorkModalProps> = ({
  activity,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen || !activity) return null;

  const [actualHours, setActualHours] = useState<number>(activity.actualHours || activity.plannedHours);
  const [actualNotes, setActualNotes] = useState<string>(activity.actualNotes || '');
  const [markCompleted, setMarkCompleted] = useState<boolean>(activity.status === 'completed');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activity) {
      setActualHours(activity.actualHours || activity.plannedHours);
      setActualNotes(activity.actualNotes || '');
      setMarkCompleted(activity.status === 'completed');
    }
  }, [activity]);

  const variance = calculateVariance(activity.plannedHours, actualHours);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(activity.id, Number(actualHours), actualNotes, markCompleted);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs sm:p-4 overflow-hidden animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-2xl bg-white shadow-2xl transition-all border border-slate-200/90 flex flex-col max-h-[92vh] sm:max-h-[88vh]">
        {/* Drag handle on mobile */}
        <div className="w-10 h-1 rounded-full bg-slate-300 mx-auto mt-2.5 sm:hidden" />

        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-xs">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Log Actual Work Done</h3>
              <p className="text-xs text-slate-500">Track execution vs planned duration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto px-5 sm:px-6 py-4 space-y-4 flex-1">
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Activity</span>
              <p className="text-sm font-bold text-slate-900 mt-0.5 leading-snug">{activity.title}</p>
              <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-600">
                <span>Planned effort:</span>
                <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200/70">
                  {activity.plannedHours} hrs
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Actual Hours Spent *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  max="24"
                  required
                  value={actualHours}
                  onChange={(e) => setActualHours(Number(e.target.value))}
                  className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                />
                {/* Quick match preset */}
                <button
                  type="button"
                  onClick={() => setActualHours(activity.plannedHours)}
                  className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-2.5 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                  title="Match planned hours"
                >
                  As Planned
                </button>
              </div>

              {/* Dynamic Variance indicator */}
              <div className="mt-2.5 flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 p-2.5 text-xs">
                <span className="text-slate-600 font-medium">Variance Analysis:</span>
                <span className={`font-bold px-2 py-0.5 rounded ${variance.color}`}>
                  {variance.text}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Work Remarks & Roadblocks
              </label>
              <textarea
                rows={3}
                value={actualNotes}
                onChange={(e) => setActualNotes(e.target.value)}
                placeholder="What was completed? Any blockers or follow-up notes..."
                className="w-full rounded-xl border border-slate-200 p-3 text-xs sm:text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden resize-none"
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer rounded-xl border border-slate-200/90 bg-slate-50/50 p-3.5 hover:bg-slate-50 transition-colors">
              <input
                type="checkbox"
                checked={markCompleted}
                onChange={(e) => setMarkCompleted(e.target.checked)}
                className="h-5 w-5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-900 block">Mark Activity as Completed</span>
                <span className="text-slate-500">Sign-off on today's execution plan</span>
              </div>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2.5 px-5 sm:px-6 py-3 border-t border-slate-100 bg-slate-50/90 sm:rounded-b-2xl shrink-0 pb-safe sm:pb-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm shadow-indigo-200 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? 'Saving...' : 'Save Actual Work'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

