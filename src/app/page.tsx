'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { ReminderBanner } from '@/components/ReminderBanner';
import { ActivityCard } from '@/components/ActivityCard';
import { ActivityModal } from '@/components/ActivityModal';
import { PostponeModal } from '@/components/PostponeModal';
import { ActualWorkModal } from '@/components/ActualWorkModal';
import { ApprovalWorkflowModal } from '@/components/ApprovalWorkflowModal';
import { activityService } from '@/services/activityService';
import { Activity, ActivityCategory, ActivityStatus } from '@/lib/types';
import { CATEGORIES } from '@/lib/constants';
import { getTodayString, formatDate, formatHours } from '@/lib/utils';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  RefreshCw,
  X,
} from 'lucide-react';

export default function DailyPlanPage() {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
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

  const [appwriteError, setAppwriteError] = useState<{ action: string; message: string; code?: number } | null>(null);

  useEffect(() => {
    loadActivities();

    const handleDataChanged = () => {
      loadActivities();
    };

    const handleAppwriteError = (e: any) => {
      setAppwriteError(e.detail);
    };

    window.addEventListener('dwm_activities_changed', handleDataChanged);
    window.addEventListener('dwm_appwrite_error', handleAppwriteError);
    return () => {
      window.removeEventListener('dwm_activities_changed', handleDataChanged);
      window.removeEventListener('dwm_appwrite_error', handleAppwriteError);
    };
  }, []);

  // Shift date backward or forward
  const shiftDate = (days: number) => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    d.setDate(d.getDate() + days);
    const newY = d.getFullYear();
    const newM = String(d.getMonth() + 1).padStart(2, '0');
    const newD = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${newY}-${newM}-${newD}`);
  };

  // Filter activities for selected date and criteria
  const dayActivities = useMemo(() => {
    return activities.filter((act) => act.plannedDate === selectedDate);
  }, [activities, selectedDate]);

  const filteredActivities = useMemo(() => {
    return dayActivities.filter((act) => {
      if (selectedCategory !== 'all' && act.category !== selectedCategory) {
        return false;
      }
      if (selectedStatus !== 'all' && act.status !== selectedStatus) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = act.title.toLowerCase().includes(q);
        const matchDesc = act.description?.toLowerCase().includes(q);
        const matchApprover = act.approverName?.toLowerCase().includes(q);
        const matchCandidate = act.metadata?.candidateName?.toLowerCase().includes(q);
        return matchTitle || matchDesc || matchApprover || matchCandidate;
      }
      return true;
    });
  }, [dayActivities, selectedCategory, selectedStatus, searchQuery]);

  // Daily statistics
  const metrics = useMemo(() => {
    const total = dayActivities.length;
    const completed = dayActivities.filter((a) => a.status === 'completed').length;
    const processing = dayActivities.filter((a) => a.status === 'under_processing').length;
    const waitingApproval = dayActivities.filter((a) => a.status === 'waiting_approval').length;
    const postponed = dayActivities.filter((a) => a.status === 'postponed').length;
    const plannedHours = dayActivities.reduce((acc, a) => acc + (a.plannedHours || 0), 0);
    const actualHours = dayActivities.reduce((acc, a) => acc + (a.actualHours || 0), 0);
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      processing,
      waitingApproval,
      postponed,
      plannedHours,
      actualHours,
      completionRate,
    };
  }, [dayActivities]);

  // Handlers
  const handleToggleComplete = async (activity: Activity) => {
    const isDone = activity.status === 'completed';
    await activityService.update(activity.id, {
      status: isDone ? 'planned' : 'completed',
      actualHours: !isDone && activity.actualHours === 0 ? activity.plannedHours : activity.actualHours,
    });
    loadActivities();
  };

  const handleDeleteActivity = async (id: string) => {
    if (confirm('Are you sure you want to delete this activity?')) {
      await activityService.delete(id);
      loadActivities();
    }
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

  const handleConfirmPostpone = async (
    activityId: string,
    newDate: string,
    reason: string,
    earlierReminder?: string
  ) => {
    await activityService.postpone(activityId, newDate, reason, earlierReminder);
    loadActivities();
  };

  const handleSaveActualWork = async (
    id: string,
    actualHours: number,
    notes: string,
    completed: boolean
  ) => {
    await activityService.updateActualWork(id, actualHours, notes, completed);
    loadActivities();
  };

  const handleApprove = async (id: string, notes: string) => {
    await activityService.respondToApproval(id, 'approved', notes);
    loadActivities();
  };

  const handleReject = async (id: string, notes: string) => {
    await activityService.respondToApproval(id, 'rejected', notes);
    loadActivities();
  };

  const handleRequestChanges = async (id: string, notes: string) => {
    await activityService.respondToApproval(id, 'changes_requested', notes);
    loadActivities();
  };

  const handleReassignApprover = async (
    id: string,
    name: string,
    role: string,
    deadline?: string
  ) => {
    await activityService.submitForApproval(id, name, role, deadline);
    loadActivities();
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-28 lg:pb-12">
      <Navbar onOpenNewActivity={() => setIsNewModalOpen(true)} />

      <main className="mx-auto max-w-7xl px-3.5 py-4 sm:px-6 sm:py-6">
        {/* Feature 1: Due Reminder Alert Banner */}
        <ReminderBanner
          activities={activities}
          onComplete={(id) => {
            const item = activities.find((a) => a.id === id);
            if (item) handleToggleComplete(item);
          }}
          onPostpone={(act) => setPostponeTarget(act)}
        />

        {/* Appwrite Cloud Sync Error Alert */}
        {appwriteError && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-rose-300 bg-rose-50 p-4 text-xs text-rose-900 shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-600 text-white font-bold">
                !
              </span>
              <div>
                <p className="font-bold">Appwrite Database Sync Warning (Saved Locally)</p>
                <p className="text-rose-700 font-mono mt-0.5">{appwriteError.message}</p>
                <p className="text-[11px] text-rose-600 mt-1">
                  Ensure Appwrite collection permissions allow <strong>Any: Create/Read/Update/Delete</strong> or check{' '}
                  <Link href="/settings" className="underline font-bold hover:text-rose-950">
                    Settings &gt; Appwrite Backend
                  </Link>.
                </p>
              </div>
            </div>
            <button
              onClick={() => setAppwriteError(null)}
              className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-100 hover:text-rose-800 transition-colors"
              aria-label="Dismiss error"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Date Navigation Bar */}
        <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-xs">
          <div className="flex items-center gap-2.5">
            {/* Day Shift Stepper */}
            <div className="flex items-center gap-1 rounded-xl bg-slate-100/90 p-1 border border-slate-200/50">
              <button
                onClick={() => shiftDate(-1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-white hover:text-slate-900 transition-colors cursor-pointer"
                title="Previous Day"
                aria-label="Previous Day"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setSelectedDate(today)}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                  selectedDate === today
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => shiftDate(1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-white hover:text-slate-900 transition-colors cursor-pointer"
                title="Next Day"
                aria-label="Next Day"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-indigo-600 shrink-0" />
                <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                  {formatDate(selectedDate)}
                </h1>
              </div>
              <p className="text-[11px] text-slate-500 truncate">
                {selectedDate === today
                  ? "Today's Execution Agenda"
                  : selectedDate > today
                  ? 'Upcoming Forward Schedule'
                  : 'Historical Execution Record'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-indigo-500 cursor-pointer"
            />
            <button
              onClick={() => setIsNewModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Plan Activity</span>
            </button>
          </div>
        </div>

        {/* Daily Progress & Interactive Status Filter Deck */}
        <div className="mb-5 rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Daily Completion Rate
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {metrics.completionRate}%
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  ({metrics.completed} of {metrics.total} tasks completed)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-1.5 text-slate-600">
                <span className="text-slate-400 font-medium">Logged: </span>
                <strong className="text-slate-900">{metrics.actualHours}h</strong>
                <span className="text-slate-400 font-normal"> / {metrics.plannedHours}h planned</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-3.5 w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-600 to-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${metrics.completionRate}%` }}
            />
          </div>

          {/* Interactive 1-Tap Status Filter Chips */}
          <div className="mt-4 flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
            <button
              onClick={() => setSelectedStatus('all')}
              className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                selectedStatus === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({metrics.total})
            </button>
            <button
              onClick={() => setSelectedStatus('completed')}
              className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                selectedStatus === 'completed'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/50'
              }`}
            >
              Done ({metrics.completed})
            </button>
            <button
              onClick={() => setSelectedStatus('under_processing')}
              className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                selectedStatus === 'under_processing'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200/50'
              }`}
            >
              In Flight ({metrics.processing})
            </button>
            <button
              onClick={() => setSelectedStatus('waiting_approval')}
              className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                selectedStatus === 'waiting_approval'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200/50'
              }`}
            >
              Approval ({metrics.waitingApproval})
            </button>
            <button
              onClick={() => setSelectedStatus('postponed')}
              className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                selectedStatus === 'postponed'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200/50'
              }`}
            >
              Postponed ({metrics.postponed})
            </button>
          </div>
        </div>

        {/* Category Pills & Search Strip */}
        <div className="mb-5 space-y-3">
          {/* Scrollable Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-200'
                  : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              All Pipelines ({dayActivities.length})
            </button>
            {CATEGORIES.map((cat) => {
              const count = dayActivities.filter((a) => a.category === cat.key).length;
              const isSelected = selectedCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-200'
                      : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
                  }`}
                >
                  {cat.label} {count > 0 && <span className="font-bold opacity-90">({count})</span>}
                </button>
              );
            })}
          </div>

          {/* Search bar with instant clear */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, approver, candidate, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200/90 bg-white pl-10 pr-9 py-2.5 text-xs sm:text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs p-0.5"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Activity List Content */}
        {loading ? (
          <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white shadow-xs">
            <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-500">
              <RefreshCw className="h-5 w-5 animate-spin text-indigo-600" />
              <span>Loading Daily Work Plan...</span>
            </div>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-14 px-4 text-center shadow-xs">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-3.5">
              <Calendar className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {dayActivities.length === 0
                ? 'No activities scheduled for this date'
                : 'No activities match the filter'}
            </h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm leading-relaxed">
              {dayActivities.length === 0
                ? `Ready to organize your day? Tap below to plan an activity for ${formatDate(selectedDate)}.`
                : 'Try adjusting your status, category, or search keywords.'}
            </p>
            <button
              onClick={() => setIsNewModalOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Plan New Activity</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
            {filteredActivities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                onEdit={(act) => {
                  setEditingActivity(act);
                  setIsNewModalOpen(true);
                }}
                onDelete={handleDeleteActivity}
                onPostpone={(act) => setPostponeTarget(act)}
                onCompleteToggle={handleToggleComplete}
                onOpenApproval={(act) => setApprovalTarget(act)}
                onUpdateActuals={(act) => setActualWorkTarget(act)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Mobile Floating Action Button (FAB) for instant 1-tap thumb access */}
      <button
        onClick={() => setIsNewModalOpen(true)}
        className="fixed bottom-20 right-4 z-30 lg:hidden flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-4 py-3.5 shadow-xl shadow-indigo-600/30 active:scale-90 transition-all cursor-pointer font-bold text-xs"
        aria-label="Plan New Activity"
      >
        <Plus className="h-5 w-5 stroke-[2.5]" />
        <span>Plan</span>
      </button>

      {/* Feature Modals */}
      <ActivityModal
        isOpen={isNewModalOpen}
        onClose={() => {
          setIsNewModalOpen(false);
          setEditingActivity(null);
        }}
        onSave={handleSaveActivity}
        activityToEdit={editingActivity}
        defaultDate={selectedDate}
      />

      <PostponeModal
        activity={postponeTarget}
        isOpen={Boolean(postponeTarget)}
        onClose={() => setPostponeTarget(null)}
        onConfirm={handleConfirmPostpone}
      />

      <ActualWorkModal
        activity={actualWorkTarget}
        isOpen={Boolean(actualWorkTarget)}
        onClose={() => setActualWorkTarget(null)}
        onSave={handleSaveActualWork}
      />

      <ApprovalWorkflowModal
        activity={approvalTarget}
        isOpen={Boolean(approvalTarget)}
        onClose={() => setApprovalTarget(null)}
        onApprove={handleApprove}
        onReject={handleReject}
        onRequestChanges={handleRequestChanges}
        onReassignApprover={handleReassignApprover}
      />
    </div>
  );
}

