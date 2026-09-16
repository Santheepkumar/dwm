'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Bell, BellRing, Clock, X, Check } from 'lucide-react';
import { Activity } from '@/lib/types';
import { notificationService } from '@/services/notificationService';
import { formatHours } from '@/lib/utils';

interface ReminderBannerProps {
  activities: Activity[];
  onComplete?: (id: string) => void;
  onPostpone?: (activity: Activity) => void;
}

export const ReminderBanner: React.FC<ReminderBannerProps> = ({
  activities,
  onComplete,
  onPostpone,
}) => {
  const [activeReminders, setActiveReminders] = useState<Activity[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const notifiedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setHasPermission(Notification.permission === 'granted');
      if (Notification.permission === 'granted' && 'serviceWorker' in navigator) {
        notificationService.registerServiceWorker().catch(() => {});
      }
    }

    const checkReminders = () => {
      const due = notificationService.getDueReminders(activities);
      const filtered = due.filter((act) => !dismissedIds.includes(act.id));
      setActiveReminders(filtered);

      // Trigger browser notification if allowed (only once per activity session)
      filtered.forEach((act) => {
        if (!notifiedIdsRef.current.has(act.id)) {
          notifiedIdsRef.current.add(act.id);
          notificationService.showNotification(
            `DWM Reminder: ${act.title}`,
            `Scheduled for ${act.plannedStartTime || 'today'} (${formatHours(act.plannedHours)})`
          );
        }
      });
    };

    checkReminders();
    const interval = setInterval(checkReminders, 60000); // check every minute
    return () => clearInterval(interval);
  }, [activities, dismissedIds]);

  const requestBrowserPermission = async () => {
    const res = await notificationService.requestPermission();
    setHasPermission(res === 'granted');
  };

  const dismiss = (id: string) => {
    setDismissedIds((prev) => [...prev, id]);
  };

  if (activeReminders.length === 0) {
    return null;
  }

  const primaryReminder = activeReminders[0];

  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl border border-amber-300/80 bg-gradient-to-r from-amber-50/90 via-orange-50/80 to-amber-50/90 p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm shadow-amber-200">
            <BellRing className="h-5 w-5 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="rounded-full bg-amber-200/90 px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-amber-900 uppercase">
                Due Reminder
              </span>
              {primaryReminder.plannedStartTime && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-950">
                  <Clock className="h-3.5 w-3.5 text-amber-700" /> {primaryReminder.plannedStartTime}
                </span>
              )}
              {activeReminders.length > 1 && (
                <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                  +{activeReminders.length - 1} more due
                </span>
              )}
            </div>
            <h4 className="mt-1 text-sm sm:text-base font-bold text-slate-900 truncate">
              {primaryReminder.title}
            </h4>
            {primaryReminder.description && (
              <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">
                {primaryReminder.description}
              </p>
            )}
          </div>
        </div>

        {/* Action Controls with friendly mobile buttons */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end">
          {!hasPermission && (
            <button
              onClick={requestBrowserPermission}
              className="rounded-lg border border-amber-300 bg-white/90 px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-white active:scale-95 transition-all cursor-pointer"
            >
              Enable Alerts
            </button>
          )}

          {onComplete && (
            <button
              onClick={() => onComplete(primaryReminder.id)}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 active:scale-95 shadow-xs shadow-emerald-200 transition-all cursor-pointer"
            >
              <Check className="h-3.5 w-3.5 stroke-[3]" />
              <span>Mark Done</span>
            </button>
          )}

          {onPostpone && (
            <button
              onClick={() => onPostpone(primaryReminder)}
              className="rounded-lg bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-amber-700 active:scale-95 shadow-xs shadow-amber-200 transition-all cursor-pointer"
            >
              Postpone
            </button>
          )}

          <button
            onClick={() => dismiss(primaryReminder.id)}
            className="rounded-lg p-2 text-amber-700 hover:bg-amber-200/50 transition-colors cursor-pointer"
            title="Dismiss reminder"
            aria-label="Dismiss reminder"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

