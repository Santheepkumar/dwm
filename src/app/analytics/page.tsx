'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { PostponeModal } from '@/components/PostponeModal';
import { ApprovalWorkflowModal } from '@/components/ApprovalWorkflowModal';
import { ActualWorkModal } from '@/components/ActualWorkModal';
import { activityService } from '@/services/activityService';
import { Activity } from '@/lib/types';
import { CATEGORIES } from '@/lib/constants';
import { formatDate, formatHours, isLongPending, isLongUnderProcessing, getDaysDifference, getTodayString } from '@/lib/utils';
import {
  BarChart3,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  TrendingUp,
  FileText,
  ShieldCheck,
  CalendarClock,
  Download,
  Filter,
} from 'lucide-react';

export default function AnalyticsPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly'>('weekly');
  const [postponeTarget, setPostponeTarget] = useState<Activity | null>(null);
  const [approvalTarget, setApprovalTarget] = useState<Activity | null>(null);
  const [actualTarget, setActualTarget] = useState<Activity | null>(null);

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

  // Filter activities within current week or current month
  const filteredActivities = useMemo(() => {
    const now = new Date();
    return activities.filter((act) => {
      const actDate = new Date(act.plannedDate);
      if (isNaN(actDate.getTime())) return true;

      if (timeframe === 'weekly') {
        const diffDays = (now.getTime() - actDate.getTime()) / (1000 * 3600 * 24);
        return diffDays >= -7 && diffDays <= 7; // Current week window
      } else {
        return (
          actDate.getMonth() === now.getMonth() && actDate.getFullYear() === now.getFullYear()
        );
      }
    });
  }, [activities, timeframe]);

  // Overall calculations
  const summary = useMemo(() => {
    const total = filteredActivities.length;
    const completed = filteredActivities.filter((a) => a.status === 'completed').length;
    const underProcessing = filteredActivities.filter((a) => a.status === 'under_processing').length;
    const waitingApproval = filteredActivities.filter((a) => a.status === 'waiting_approval').length;
    const postponed = filteredActivities.filter((a) => a.status === 'postponed' || a.postponeCount > 0).length;

    // Feature 5 core requirements:
    const longPendingList = activities.filter((a) => isLongPending(a));
    const longProcessingList = activities.filter((a) => isLongUnderProcessing(a));

    const totalPlannedHours = filteredActivities.reduce((acc, a) => acc + (a.plannedHours || 0), 0);
    const totalActualHours = filteredActivities.reduce((acc, a) => acc + (a.actualHours || 0), 0);
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      underProcessing,
      waitingApproval,
      postponed,
      longPendingList,
      longProcessingList,
      totalPlannedHours,
      totalActualHours,
      completionRate,
    };
  }, [filteredActivities, activities]);

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    return CATEGORIES.map((cat) => {
      const items = filteredActivities.filter((a) => a.category === cat.key);
      const completed = items.filter((a) => a.status === 'completed').length;
      return {
        ...cat,
        total: items.length,
        completed,
        rate: items.length > 0 ? Math.round((completed / items.length) * 100) : 0,
      };
    });
  }, [filteredActivities]);

  return (
    <div className="min-h-screen bg-slate-50 pb-28 lg:pb-12">
      <Navbar />

      <main className="mx-auto max-w-7xl px-3.5 py-4 sm:px-6 sm:py-6">
        {/* Header */}
        <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-2xs">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900">
                  Weekly & Monthly Summary & Aging
                </h1>
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] sm:text-xs font-bold text-indigo-700 border border-indigo-100">
                  Analytics
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Executive dashboard tracking completed tasks, long pending (&gt;3d), and stalled items
              </p>
            </div>
          </div>

          {/* Timeframe Switcher & Export */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            <div className="flex rounded-xl bg-slate-100/90 p-1 border border-slate-200/50">
              <button
                onClick={() => setTimeframe('weekly')}
                className={`rounded-lg px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                  timeframe === 'weekly'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setTimeframe('monthly')}
                className={`rounded-lg px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                  timeframe === 'monthly'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Monthly
              </button>
            </div>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              <span className="hidden sm:inline">Print / PDF</span>
              <span className="sm:hidden">Print</span>
            </button>
          </div>
        </div>

        {/* Top 4 KPI Metrics */}
        <div className="mb-5 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="rounded-2xl border border-emerald-200/90 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                Completed
              </span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{summary.completed}</span>
              <span className="text-[11px] text-emerald-800 font-bold">
                {summary.completionRate}%
              </span>
            </div>
            <p className="mt-2 text-[11px] text-slate-500 truncate">
              {summary.completed} of {summary.total} tasks finished
            </p>
          </div>

          <div className="rounded-2xl border border-indigo-200/90 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider">
                In Flight
              </span>
              <Clock className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{summary.underProcessing}</span>
              <span className="text-[11px] text-slate-500">active</span>
            </div>
            <p className="mt-2 text-[11px] text-slate-500 truncate">
              +{summary.waitingApproval} awaiting sign-off
            </p>
          </div>

          {/* Long Pending Alert Card */}
          <div className="rounded-2xl border border-rose-300 bg-rose-50/50 p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-rose-900 uppercase tracking-wider">
                Long Pending (&gt;3d)
              </span>
              <AlertOctagon className="h-4 w-4 text-rose-600 animate-pulse" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-rose-700">{summary.longPendingList.length}</span>
              <span className="text-[11px] text-rose-800 font-bold">overdue</span>
            </div>
            <p className="mt-2 text-[11px] text-rose-700 truncate">
              Needs immediate prioritization
            </p>
          </div>

          {/* Long Under Processing Alert Card */}
          <div className="rounded-2xl border border-amber-300 bg-amber-50/50 p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
                Stalled (&gt;3d)
              </span>
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-amber-700">
                {summary.longProcessingList.length}
              </span>
              <span className="text-[11px] text-amber-900 font-bold">stalled</span>
            </div>
            <p className="mt-2 text-[11px] text-amber-800 truncate">
              Stuck beyond processing SLA
            </p>
          </div>
        </div>

        {/* Drill-down Section for Long Pending and Long Under Processing */}
        <div className="mb-5 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          {/* Long Pending Items */}
          <div className="rounded-2xl border border-rose-200/90 bg-white p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-rose-100">
              <div className="flex items-center gap-2">
                <AlertOctagon className="h-4 w-4 text-rose-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Long Pending Tasks ({summary.longPendingList.length})
                </h2>
              </div>
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                &gt; 3 Days
              </span>
            </div>

            {summary.longPendingList.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 italic">
                🎉 Excellent! Zero tasks in Long Pending state.
              </div>
            ) : (
              <div className="mt-3 divide-y divide-slate-100">
                {summary.longPendingList.map((item) => {
                  const days = getDaysDifference(item.plannedDate);
                  return (
                    <div key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="rounded-md bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-800">
                            {days}d overdue
                          </span>
                          <span className="text-xs font-bold text-slate-900 truncate">{item.title}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Planned for: {formatDate(item.plannedDate)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        <button
                          onClick={() => setPostponeTarget(item)}
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          Postpone
                        </button>
                        <button
                          onClick={() => setActualTarget(item)}
                          className="rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-indigo-700 active:scale-95 transition-all cursor-pointer"
                        >
                          Log Work
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Long Under Processing Items */}
          <div className="rounded-2xl border border-amber-200/90 bg-white p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-amber-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Stalled in Processing ({summary.longProcessingList.length})
                </h2>
              </div>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                Stuck In Pipeline
              </span>
            </div>

            {summary.longProcessingList.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 italic">
                ✨ No items stalled in processing. Pipelines running smoothly!
              </div>
            ) : (
              <div className="mt-3 divide-y divide-slate-100">
                {summary.longProcessingList.map((item) => {
                  const days = getDaysDifference(item.updatedAt?.slice(0, 10) || item.plannedDate);
                  return (
                    <div key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-900">
                            Stuck {days}d
                          </span>
                          <span className="text-xs font-bold text-slate-900 truncate">{item.title}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Approver: <strong>{item.approverName || 'VP Operations'}</strong> • Stage: {item.stage}
                        </p>
                      </div>
                      <button
                        onClick={() => setApprovalTarget(item)}
                        className="rounded-lg bg-amber-600 px-3 py-1 text-xs font-bold text-white hover:bg-amber-700 active:scale-95 transition-all shrink-0 self-end sm:self-center cursor-pointer"
                      >
                        Action Sign-off
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Category Performance Breakdown */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs p-4 sm:p-5">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 mb-1">
            Category Breakdown for {timeframe === 'weekly' ? 'This Week' : 'This Month'}
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Analysis across Candidate Sourcing, Reports, Statutory, Payroll, and Engagement
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {categoryBreakdown.map((cat) => (
              <div key={cat.key} className="rounded-xl border border-slate-200/80 p-3.5 bg-slate-50/50">
                <div className="flex items-center justify-between mb-2">
                  <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${cat.badgeClass}`}>
                    {cat.label}
                  </span>
                  <span className="text-xs font-extrabold text-slate-800">{cat.rate}%</span>
                </div>

                <div className="flex items-baseline justify-between text-xs text-slate-600 mb-2">
                  <span>{cat.completed} done</span>
                  <span>{cat.total} planned</span>
                </div>

                <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${cat.rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <PostponeModal
        activity={postponeTarget}
        isOpen={Boolean(postponeTarget)}
        onClose={() => setPostponeTarget(null)}
        onConfirm={async (id, newDate, reason, earlierReminder) => {
          await activityService.postpone(id, newDate, reason, earlierReminder);
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

      <ActualWorkModal
        activity={actualTarget}
        isOpen={Boolean(actualTarget)}
        onClose={() => setActualTarget(null)}
        onSave={async (id, actualHours, notes, completed) => {
          await activityService.updateActualWork(id, actualHours, notes, completed);
          loadActivities();
        }}
      />
    </div>
  );
}

