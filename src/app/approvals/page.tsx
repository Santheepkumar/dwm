'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { ApprovalWorkflowModal } from '@/components/ApprovalWorkflowModal';
import { activityService } from '@/services/activityService';
import { Activity } from '@/lib/types';
import { TOP_LEVEL_APPROVERS, CATEGORIES } from '@/lib/constants';
import { formatDate, formatHours, getDaysDifference } from '@/lib/utils';
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Filter,
  Calendar,
  ChevronRight,
  User,
  Check,
  X,
  FileCheck2,
} from 'lucide-react';

export default function ApprovalsPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'waiting_approval' | 'under_processing' | 'all'>('waiting_approval');
  const [selectedApproverFilter, setSelectedApproverFilter] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<Activity | null>(null);

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

  // Filter items
  const approvalItems = useMemo(() => {
    return activities.filter((act) => {
      if (activeTab === 'waiting_approval') {
        if (act.status !== 'waiting_approval' && act.approvalStatus !== 'pending') return false;
      } else if (activeTab === 'under_processing') {
        if (act.status !== 'under_processing') return false;
      } else {
        // all processing or approval
        if (act.status !== 'waiting_approval' && act.status !== 'under_processing') return false;
      }

      if (selectedApproverFilter !== 'all' && act.approverName !== selectedApproverFilter) {
        return false;
      }

      return true;
    });
  }, [activities, activeTab, selectedApproverFilter]);

  const waitingCount = useMemo(
    () => activities.filter((a) => a.status === 'waiting_approval' || a.approvalStatus === 'pending').length,
    [activities]
  );

  const processingCount = useMemo(
    () => activities.filter((a) => a.status === 'under_processing').length,
    [activities]
  );

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
      <Navbar />

      <main className="mx-auto max-w-7xl px-3.5 py-4 sm:px-6 sm:py-6">
        {/* Header */}
        <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-2xs">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900">
                  Processing & Top-Level Approvals
                </h1>
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] sm:text-xs font-bold text-indigo-700 border border-indigo-100">
                  Workflow
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Track works under processing with SLA deadline & executive sign-off desk
              </p>
            </div>
          </div>

          {/* Approver Filter */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            <User className="h-4 w-4 text-slate-400" />
            <select
              value={selectedApproverFilter}
              onChange={(e) => setSelectedApproverFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Approvers</option>
              {TOP_LEVEL_APPROVERS.map((app) => (
                <option key={app.id} value={app.name}>
                  {app.name} ({app.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab Navigation with clean pills */}
        <div className="mb-5 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setActiveTab('waiting_approval')}
            className={`flex items-center gap-1.5 shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'waiting_approval'
                ? 'bg-amber-500 text-white shadow-xs shadow-amber-200'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Waiting Approval ({waitingCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('under_processing')}
            className={`flex items-center gap-1.5 shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'under_processing'
                ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-200'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>In Processing ({processingCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
            }`}
          >
            All Workflows ({waitingCount + processingCount})
          </button>
        </div>

        {/* List of Approval & Processing Cards */}
        {loading ? (
          <div className="flex h-48 items-center justify-center rounded-2xl bg-white border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500">Loading workflows...</span>
          </div>
        ) : approvalItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 px-4 text-center shadow-xs">
            <FileCheck2 className="h-12 w-12 text-slate-300 mb-2" />
            <h3 className="text-base font-bold text-slate-800">No active items in this queue</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              All processing activities and executive approvals for this filter are up to date!
            </p>
          </div>
        ) : (
          <div className="space-y-3.5 sm:space-y-4">
            {approvalItems.map((item) => {
              const catObj = CATEGORIES.find((c) => c.key === item.category);
              const daysInQueue = getDaysDifference(item.updatedAt?.slice(0, 10) || item.plannedDate);

              return (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs hover:shadow-md transition-all"
                >
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                          catObj?.badgeClass || 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {catObj?.label || item.category}
                      </span>

                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 border border-slate-200/50">
                        {item.stage.replace(/_/g, ' ')}
                      </span>

                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          item.status === 'waiting_approval'
                            ? 'bg-amber-50 text-amber-900 border border-amber-200'
                            : 'bg-indigo-50 text-indigo-900 border border-indigo-200'
                        }`}
                      >
                        {item.status === 'waiting_approval' ? 'Waiting Sign-off' : 'Processing'}
                      </span>

                      {daysInQueue >= 3 && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-800 animate-pulse">
                          <AlertTriangle className="h-3 w-3" /> Stalled {daysInQueue}d
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900 leading-snug">{item.title}</h3>
                    {item.description && (
                      <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed max-w-3xl">
                        {item.description}
                      </p>
                    )}

                    {/* Approver & Deadline Info Bar */}
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-1 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5 font-medium">
                        <User className="h-3.5 w-3.5 text-indigo-600" />
                        <span>Approver:</span>
                        <strong className="text-slate-900">{item.approverName || 'Meera Nambiar'}</strong>
                        <span className="text-slate-500">({item.approverRole || 'VP HR'})</span>
                      </div>

                      {item.deadline && (
                        <div className="flex items-center gap-1 font-semibold text-rose-700">
                          <Clock className="h-3.5 w-3.5" />
                          <span>Deadline: {item.deadline.split('T')[1] || item.deadline}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1 text-slate-400">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{formatDate(item.plannedDate)}</span>
                      </div>
                    </div>

                    {item.approvalNotes && (
                      <div className="rounded-xl bg-amber-50/70 border border-amber-200/70 p-2.5 text-xs text-amber-900 mt-2">
                        <strong>Approval Memo:</strong> {item.approvalNotes}
                      </div>
                    )}
                  </div>

                  {/* Actions Right */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => setSelectedItem(item)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all cursor-pointer"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      <span>Review & Sign</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <ApprovalWorkflowModal
        activity={selectedItem}
        isOpen={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        onApprove={handleApprove}
        onReject={handleReject}
        onRequestChanges={handleRequestChanges}
        onReassignApprover={handleReassignApprover}
      />
    </div>
  );
}

