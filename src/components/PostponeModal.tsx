'use client';

import React, { useState } from 'react';
import { X, CalendarClock, Clock, Bell, AlertTriangle } from 'lucide-react';
import { Activity } from '@/lib/types';
import { getTodayString } from '@/lib/utils';

interface PostponeModalProps {
  activity: Activity | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (activityId: string, newDate: string, reason: string, earlierReminder?: string) => Promise<void>;
}

export const PostponeModal: React.FC<PostponeModalProps> = ({
  activity,
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !activity) return null;

  const today = getTodayString();
  const getTomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState<string>(getTomorrow());
  const [reason, setReason] = useState<string>('');
  const [advanceReminderType, setAdvanceReminderType] = useState<string>('morning_of');
  const [loading, setLoading] = useState<boolean>(false);

  const handleQuickSelect = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let earlierReminder = '';
    if (advanceReminderType === 'morning_of') {
      earlierReminder = `${selectedDate}T09:00`;
    } else if (advanceReminderType === 'day_before') {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() - 1);
      earlierReminder = `${d.toISOString().split('T')[0]}T17:00`;
    } else if (advanceReminderType === 'one_hour_before') {
      earlierReminder = `${selectedDate}T08:00`;
    }

    try {
      await onConfirm(activity.id, selectedDate, reason, earlierReminder);
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
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 shadow-xs">
              <CalendarClock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Postpone Activity</h3>
              <p className="text-xs text-slate-500">Reschedule with advance reminder</p>
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
              {activity.postponeCount > 0 && (
                <p className="text-xs text-rose-600 font-semibold mt-1">
                  ⚠️ Already postponed {activity.postponeCount} time(s).
                </p>
              )}
            </div>

            {/* Quick Date Presets */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Select Rescheduled Date *
              </label>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => handleQuickSelect(1)}
                  className={`rounded-xl border py-2 text-xs font-semibold transition-all cursor-pointer ${
                    selectedDate === getTomorrow()
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSelect(2)}
                  className="rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  In 2 Days
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSelect(7)}
                  className="rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Next Week
                </button>
              </div>
              <input
                type="date"
                required
                min={today}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:border-indigo-500 focus:outline-hidden"
              />
            </div>

            {/* Advance Earlier Reminder Selection */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                <Bell className="h-4 w-4 text-amber-600" />
                <span>Advance Earlier Reminder (Required by DWM)</span>
              </div>
              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2.5 cursor-pointer text-slate-700 font-medium">
                  <input
                    type="radio"
                    name="earlierReminder"
                    value="morning_of"
                    checked={advanceReminderType === 'morning_of'}
                    onChange={(e) => setAdvanceReminderType(e.target.value)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Morning of rescheduled day (9:00 AM)</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer text-slate-700 font-medium">
                  <input
                    type="radio"
                    name="earlierReminder"
                    value="day_before"
                    checked={advanceReminderType === 'day_before'}
                    onChange={(e) => setAdvanceReminderType(e.target.value)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>1 Day prior evening (5:00 PM)</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer text-slate-700 font-medium">
                  <input
                    type="radio"
                    name="earlierReminder"
                    value="one_hour_before"
                    checked={advanceReminderType === 'one_hour_before'}
                    onChange={(e) => setAdvanceReminderType(e.target.value)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>1 Hour before scheduled time</span>
                </label>
              </div>
            </div>

            {/* Reason for Postponement */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Reason for Postponement (Audit Log) *
              </label>
              <textarea
                required
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Waiting for candidate response / Pending executive review..."
                className="w-full rounded-xl border border-slate-200 p-3 text-xs sm:text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden resize-none"
              />
            </div>
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
              className="rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm shadow-amber-200 hover:bg-amber-700 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? 'Rescheduling...' : 'Confirm Postpone'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

