'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { ActualWorkModal } from '@/components/ActualWorkModal';
import { activityService } from '@/services/activityService';
import { Activity } from '@/lib/types';
import { CATEGORIES } from '@/lib/constants';
import { getTodayString, formatDate, formatHours, calculateVariance } from '@/lib/utils';
import {
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  FileSpreadsheet,
  Edit3,
  Percent,
} from 'lucide-react';

export default function PlanVsActualPage() {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedItem, setSelectedItem] = useState<Activity | null>(null);

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

  const shiftDate = (days: number) => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    d.setDate(d.getDate() + days);
    const newY = d.getFullYear();
    const newM = String(d.getMonth() + 1).padStart(2, '0');
    const newD = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${newY}-${newM}-${newD}`);
  };

  const dayActivities = useMemo(() => {
    return activities.filter((act) => act.plannedDate === selectedDate);
  }, [activities, selectedDate]);

  // Overall Plan vs Actual metrics
  const stats = useMemo(() => {
    const totalPlanned = dayActivities.length;
    const completed = dayActivities.filter((a) => a.status === 'completed').length;
    const totalPlannedHours = dayActivities.reduce((acc, a) => acc + (a.plannedHours || 0), 0);
    const totalActualHours = dayActivities.reduce((acc, a) => acc + (a.actualHours || 0), 0);
    const varianceHours = totalActualHours - totalPlannedHours;
    const taskCompletionRate = totalPlanned > 0 ? Math.round((completed / totalPlanned) * 100) : 0;
    const hourEfficiency = totalPlannedHours > 0 ? Math.round((totalActualHours / totalPlannedHours) * 100) : 0;

    return {
      totalPlanned,
      completed,
      totalPlannedHours,
      totalActualHours,
      varianceHours,
      taskCompletionRate,
      hourEfficiency,
    };
  }, [dayActivities]);

  const handleSaveActualWork = async (
    id: string,
    actualHours: number,
    notes: string,
    completed: boolean
  ) => {
    await activityService.updateActualWork(id, actualHours, notes, completed);
    loadActivities();
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-28 lg:pb-12">
      <Navbar />

      <main className="mx-auto max-w-7xl px-3.5 py-4 sm:px-6 sm:py-6">
        {/* Page Header & Date Picker */}
        <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-2xs">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900">Plan vs Actual Work Done</h1>
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] sm:text-xs font-bold text-indigo-700 border border-indigo-100">
                  Variance
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Time utilization and execution tracking for {formatDate(selectedDate)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <div className="flex items-center gap-1 rounded-xl bg-slate-100/90 p-1 border border-slate-200/50">
              <button
                onClick={() => shiftDate(-1)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 hover:bg-white hover:text-slate-900 transition-colors cursor-pointer"
                title="Previous Day"
                aria-label="Previous Day"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setSelectedDate(today)}
                className={`rounded-lg px-2.5 py-0.5 text-xs font-bold transition-all cursor-pointer ${
                  selectedDate === today ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => shiftDate(1)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 hover:bg-white hover:text-slate-900 transition-colors cursor-pointer"
                title="Next Day"
                aria-label="Next Day"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-indigo-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Executive Variance Scorecards */}
        <div className="mb-5 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Completion
              </span>
              <Percent className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{stats.taskCompletionRate}%</span>
              <span className="text-[11px] text-slate-500 truncate">
                ({stats.completed}/{stats.totalPlanned})
              </span>
            </div>
            <div className="mt-2.5 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${stats.taskCompletionRate}%` }}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Planned Effort
              </span>
              <Clock className="h-4 w-4 text-slate-400" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{stats.totalPlannedHours}h</span>
              <span className="text-[11px] text-slate-500">allocated</span>
            </div>
            <p className="mt-2 text-[11px] text-slate-500 truncate">Baseline work planned</p>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Actual Time Spent
              </span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{stats.totalActualHours}h</span>
              <span className="text-[11px] text-slate-500">clocked</span>
            </div>
            <p className="mt-2 text-[11px] text-slate-500 truncate">
              {stats.hourEfficiency}% time utilized
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Net Variance
              </span>
              <TrendingUp className="h-4 w-4 text-amber-600" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span
                className={`text-2xl sm:text-3xl font-extrabold ${
                  stats.varianceHours > 0
                    ? 'text-rose-600'
                    : stats.varianceHours < 0
                    ? 'text-teal-600'
                    : 'text-slate-900'
                }`}
              >
                {stats.varianceHours > 0 ? `+${stats.varianceHours.toFixed(1)}h` : `${stats.varianceHours.toFixed(1)}h`}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                {stats.varianceHours > 0 ? 'overrun' : stats.varianceHours < 0 ? 'saved' : 'balanced'}
              </span>
            </div>
            <p className="mt-2 text-[11px] text-slate-500 truncate">
              {stats.varianceHours > 0 ? 'Exceeded planned target' : 'Within planned duration'}
            </p>
          </div>
        </div>

        {/* Detailed Plan vs Actual Section */}
        <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3.5 sm:px-6 sm:py-4 bg-slate-50/70">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">Activity Breakdown & Variance Ledger</h2>
              <p className="text-xs text-slate-500">Compare individual task commitments with reality</p>
            </div>
            <button
              onClick={() => {
                const csv = [
                  ['Title', 'Category', 'Stage', 'Planned Hours', 'Actual Hours', 'Variance', 'Status', 'Notes'],
                  ...dayActivities.map((a) => [
                    `"${a.title}"`,
                    a.category,
                    a.stage,
                    a.plannedHours,
                    a.actualHours,
                    (a.actualHours - a.plannedHours).toFixed(1),
                    a.status,
                    `"${a.actualNotes || ''}"`,
                  ]),
                ]
                  .map((row) => row.join(','))
                  .join('\n');

                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `dwm_plan_vs_actual_${selectedDate}.csv`;
                link.click();
              }}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              <span className="hidden sm:inline">Export CSV</span>
              <span className="sm:hidden">CSV</span>
            </button>
          </div>

          {dayActivities.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs px-4">
              No planned activities recorded for {formatDate(selectedDate)}.
            </div>
          ) : (
            <>
              {/* Mobile Card Layout (block md:hidden) */}
              <div className="divide-y divide-slate-100 block md:hidden">
                {dayActivities.map((activity) => {
                  const variance = calculateVariance(activity.plannedHours, activity.actualHours);
                  const catObj = CATEGORIES.find((c) => c.key === activity.category);

                  return (
                    <div key={activity.id} className="p-4 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-slate-900 leading-snug">{activity.title}</h4>
                          <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                                catObj?.badgeClass || 'bg-slate-50 text-slate-700'
                              }`}
                            >
                              {catObj?.label || activity.category}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Stage: {activity.stage.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </div>

                        <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded ${variance.color}`}>
                          {variance.text}
                        </span>
                      </div>

                      {/* Hours comparison bar */}
                      <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2 text-xs">
                        <div className="text-slate-600">
                          <span>Planned: <strong>{activity.plannedHours}h</strong></span>
                          <span className="mx-2">•</span>
                          <span>Actual: <strong className="text-indigo-600">{activity.actualHours}h</strong></span>
                        </div>

                        <button
                          onClick={() => setSelectedItem(activity)}
                          className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer"
                        >
                          <Edit3 className="h-3 w-3" />
                          <span>Log</span>
                        </button>
                      </div>

                      {activity.actualNotes && (
                        <p className="text-xs text-slate-500 italic line-clamp-2">
                          &ldquo;{activity.actualNotes}&rdquo;
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View (hidden md:block) */}
              <div className="overflow-x-auto hidden md:block">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3.5">Activity & Details</th>
                      <th className="px-4 py-3.5">Category / Stage</th>
                      <th className="px-4 py-3.5 text-center">Planned Hours</th>
                      <th className="px-4 py-3.5 text-center">Actual Hours</th>
                      <th className="px-4 py-3.5 text-center">Variance</th>
                      <th className="px-4 py-3.5 text-center">Status</th>
                      <th className="px-6 py-3.5">Remarks / Notes</th>
                      <th className="px-4 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dayActivities.map((activity) => {
                      const variance = calculateVariance(activity.plannedHours, activity.actualHours);
                      const catObj = CATEGORIES.find((c) => c.key === activity.category);

                      return (
                        <tr key={activity.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900 text-sm">{activity.title}</div>
                            {activity.plannedStartTime && (
                              <span className="text-[11px] text-slate-500">
                                Scheduled at {activity.plannedStartTime}
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                                catObj?.badgeClass || 'bg-slate-50 text-slate-700'
                              }`}
                            >
                              {catObj?.label || activity.category}
                            </span>
                            <div className="text-[11px] text-slate-500 mt-1">
                              {activity.stage.replace(/_/g, ' ')}
                            </div>
                          </td>

                          <td className="px-4 py-4 text-center font-semibold text-slate-700">
                            {activity.plannedHours} hrs
                          </td>

                          <td className="px-4 py-4 text-center">
                            <span
                              className={`inline-block rounded-md px-2 py-1 font-bold ${
                                activity.actualHours > 0
                                  ? 'bg-indigo-50 text-indigo-700'
                                  : 'bg-slate-100 text-slate-400'
                              }`}
                            >
                              {activity.actualHours} hrs
                            </span>
                          </td>

                          <td className="px-4 py-4 text-center">
                            <span className={`font-bold ${variance.color}`}>{variance.text}</span>
                          </td>

                          <td className="px-4 py-4 text-center">
                            <span
                              className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                                activity.status === 'completed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : activity.status === 'under_processing'
                                  ? 'bg-indigo-100 text-indigo-800'
                                  : activity.status === 'waiting_approval'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {activity.status.replace(/_/g, ' ')}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-slate-600 max-w-xs">
                            {activity.actualNotes ? (
                              <p className="line-clamp-2">{activity.actualNotes}</p>
                            ) : (
                              <span className="text-slate-400 italic">No notes logged yet</span>
                            )}
                          </td>

                          <td className="px-4 py-4 text-right">
                            <button
                              onClick={() => setSelectedItem(activity)}
                              className="inline-flex items-center gap-1 rounded-xl bg-indigo-50 px-2.5 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              <span>Log</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </main>

      <ActualWorkModal
        activity={selectedItem}
        isOpen={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        onSave={handleSaveActualWork}
      />
    </div>
  );
}

