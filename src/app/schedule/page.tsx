'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { ActivityModal } from '@/components/ActivityModal';
import { ActivityCard } from '@/components/ActivityCard';
import { PostponeModal } from '@/components/PostponeModal';
import { ActualWorkModal } from '@/components/ActualWorkModal';
import { ApprovalWorkflowModal } from '@/components/ApprovalWorkflowModal';
import { activityService } from '@/services/activityService';
import { Activity } from '@/lib/types';
import { getTodayString, formatDate } from '@/lib/utils';
import {
  CalendarDays,
  Plus,
  ChevronRight,
  ChevronLeft,
  Calendar as CalendarIcon,
  Clock,
  Sparkles,
} from 'lucide-react';

export default function UpcomingSchedulePage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [targetScheduleDate, setTargetScheduleDate] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modals
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [postponeTarget, setPostponeTarget] = useState<Activity | null>(null);
  const [actualWorkTarget, setActualWorkTarget] = useState<Activity | null>(null);
  const [approvalTarget, setApprovalTarget] = useState<Activity | null>(null);

  const today = getTodayString();

  const loadActivities = async () => {
    setLoading(true);
    try {
      const data = await activityService.getAll();
      setActivities(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
    const handleDataChanged = () => loadActivities();
    window.addEventListener('dwm_activities_changed', handleDataChanged);
    return () => window.removeEventListener('dwm_activities_changed', handleDataChanged);
  }, []);

  // Generate next 7 days list
  const nextDays = useMemo(() => {
    const list: { dateStr: string; label: string; dayName: string; isToday: boolean }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      let label = formatDate(dateStr);
      if (i === 0) label = 'Today';
      if (i === 1) label = 'Tomorrow';

      const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
      list.push({ dateStr, label, dayName, isToday: i === 0 });
    }
    return list;
  }, []);

  const openNewForDate = (dateStr: string) => {
    setTargetScheduleDate(dateStr);
    setEditingActivity(null);
    setIsModalOpen(true);
  };

  const handleSaveActivity = async (activityData: any) => {
    if (editingActivity) {
      await activityService.update(editingActivity.id, activityData);
      setEditingActivity(null);
    } else {
      await activityService.create(activityData);
    }
    loadActivities();
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-28 lg:pb-12">
      <Navbar onOpenNewActivity={() => openNewForDate(today)} />

      <main className="mx-auto max-w-7xl px-3.5 py-4 sm:px-6 sm:py-6">
        {/* Header */}
        <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-2xs">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900">Upcoming 7-Day Schedule</h1>
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] sm:text-xs font-bold text-indigo-700 border border-indigo-100">
                  Agenda
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Plan forward schedules, upcoming statutory filing deadlines, interviews, and payroll
              </p>
            </div>
          </div>

          <button
            onClick={() => openNewForDate(today)}
            className="inline-flex items-center gap-1.5 self-end sm:self-center rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Schedule Ahead</span>
          </button>
        </div>

        {/* 7-Day Forward Schedule Feed */}
        <div className="space-y-4 sm:space-y-5">
          {nextDays.map((day) => {
            const dayItems = activities.filter((a) => a.plannedDate === day.dateStr);
            const totalHours = dayItems.reduce((acc, a) => acc + (a.plannedHours || 0), 0);

            return (
              <div
                key={day.dateStr}
                className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs"
              >
                {/* Day Header Bar */}
                <div
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-4 py-3 sm:px-5 sm:py-3.5 border-b ${
                    day.isToday
                      ? 'bg-indigo-50/70 border-indigo-100'
                      : 'bg-slate-50/70 border-slate-200/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-extrabold text-sm shadow-2xs ${
                        day.isToday
                          ? 'bg-indigo-600 text-white shadow-indigo-200'
                          : 'bg-white text-slate-800 border border-slate-200'
                      }`}
                    >
                      {day.dateStr.split('-')[2]}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold text-slate-900">{day.label}</h2>
                        <span className="text-xs text-slate-500">({day.dayName})</span>
                        {day.isToday && (
                          <span className="rounded-full bg-emerald-500 h-2 w-2 animate-pulse"></span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {dayItems.length} activities scheduled • {totalHours} planned hours
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => openNewForDate(day.dateStr)}
                    className="inline-flex items-center gap-1 self-start sm:self-center rounded-lg border border-slate-200/90 bg-white px-2.5 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-50 transition-colors shadow-2xs cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Plan for {day.label}</span>
                  </button>
                </div>

                {/* Day Activities List */}
                <div className="p-3.5 sm:p-4">
                  {dayItems.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400 italic">
                      No activities planned for {day.label}. Tap &ldquo;+ Plan for {day.label}&rdquo; to add.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {dayItems.map((act) => (
                        <ActivityCard
                          key={act.id}
                          activity={act}
                          onEdit={(a) => {
                            setEditingActivity(a);
                            setIsModalOpen(true);
                          }}
                          onDelete={async (id) => {
                            if (confirm('Delete this scheduled activity?')) {
                              await activityService.delete(id);
                              loadActivities();
                            }
                          }}
                          onPostpone={(a) => setPostponeTarget(a)}
                          onCompleteToggle={async (a) => {
                            await activityService.update(a.id, {
                              status: a.status === 'completed' ? 'planned' : 'completed',
                            });
                            loadActivities();
                          }}
                          onOpenApproval={(a) => setApprovalTarget(a)}
                          onUpdateActuals={(a) => setActualWorkTarget(a)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <ActivityModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingActivity(null);
        }}
        onSave={handleSaveActivity}
        activityToEdit={editingActivity}
        defaultDate={targetScheduleDate}
      />

      <PostponeModal
        activity={postponeTarget}
        isOpen={Boolean(postponeTarget)}
        onClose={() => setPostponeTarget(null)}
        onConfirm={async (id, newDate, reason, earlier) => {
          await activityService.postpone(id, newDate, reason, earlier);
          loadActivities();
        }}
      />

      <ActualWorkModal
        activity={actualWorkTarget}
        isOpen={Boolean(actualWorkTarget)}
        onClose={() => setActualWorkTarget(null)}
        onSave={async (id, actualHours, notes, completed) => {
          await activityService.updateActualWork(id, actualHours, notes, completed);
          loadActivities();
        }}
      />

      <ApprovalWorkflowModal
        activity={approvalTarget}
        isOpen={Boolean(approvalTarget)}
        onClose={() => setApprovalTarget(null)}
        onApprove={async (id, notes) => {
          await activityService.respondToApproval(id, 'approved', notes);
          loadActivities();
        }}
        onReject={async (id, notes) => {
          await activityService.respondToApproval(id, 'rejected', notes);
          loadActivities();
        }}
        onRequestChanges={async (id, notes) => {
          await activityService.respondToApproval(id, 'changes_requested', notes);
          loadActivities();
        }}
        onReassignApprover={async (id, name, role, deadline) => {
          await activityService.submitForApproval(id, name, role, deadline);
          loadActivities();
        }}
      />
    </div>
  );
}
