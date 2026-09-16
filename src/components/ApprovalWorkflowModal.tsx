'use client';

import React, { useState } from 'react';
import { X, ShieldCheck, CheckCircle2, AlertTriangle, User, Clock, FileCheck } from 'lucide-react';
import { Activity } from '@/lib/types';
import { TOP_LEVEL_APPROVERS } from '@/lib/constants';

interface ApprovalWorkflowModalProps {
  activity: Activity | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (id: string, notes: string) => Promise<void>;
  onReject: (id: string, notes: string) => Promise<void>;
  onRequestChanges: (id: string, notes: string) => Promise<void>;
  onReassignApprover: (id: string, approverName: string, approverRole: string, deadline?: string) => Promise<void>;
}

export const ApprovalWorkflowModal: React.FC<ApprovalWorkflowModalProps> = ({
  activity,
  isOpen,
  onClose,
  onApprove,
  onReject,
  onRequestChanges,
  onReassignApprover,
}) => {
  if (!isOpen || !activity) return null;

  const [notes, setNotes] = useState('');
  const [selectedApproverId, setSelectedApproverId] = useState(
    TOP_LEVEL_APPROVERS.find((a) => a.name === activity.approverName)?.id || TOP_LEVEL_APPROVERS[0].id
  );
  const [deadline, setDeadline] = useState(activity.deadline ? activity.deadline.split('T')[1] || '17:00' : '17:00');
  const [loading, setLoading] = useState(false);
  const [isReassigning, setIsReassigning] = useState(false);

  const handleAction = async (action: 'approve' | 'reject' | 'changes') => {
    setLoading(true);
    try {
      if (action === 'approve') {
        await onApprove(activity.id, notes);
      } else if (action === 'reject') {
        await onReject(activity.id, notes);
      } else {
        await onRequestChanges(activity.id, notes);
      }
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleReassignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const app = TOP_LEVEL_APPROVERS.find((a) => a.id === selectedApproverId);
      if (app) {
        await onReassignApprover(activity.id, app.name, app.role, `${activity.plannedDate}T${deadline}`);
      }
      setIsReassigning(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs sm:p-4 overflow-hidden animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-t-3xl sm:rounded-2xl bg-white shadow-2xl transition-all border border-slate-200/90 flex flex-col max-h-[92vh] sm:max-h-[88vh]">
        {/* Drag handle on mobile */}
        <div className="w-10 h-1 rounded-full bg-slate-300 mx-auto mt-2.5 sm:hidden" />

        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-xs">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Top-Level Approval Desk
              </h3>
              <p className="text-xs text-slate-500">Executive sign-off & workflow escalation</p>
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

        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto px-5 sm:px-6 py-4 space-y-4 flex-1">
            {/* Target Activity Details */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[11px]">
                  Item for Review
                </span>
                <span className="rounded-md bg-indigo-100/80 px-2 py-0.5 font-bold text-indigo-800 text-[11px]">
                  {activity.stage.replace(/_/g, ' ')}
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 leading-snug">{activity.title}</h4>
              {activity.description && <p className="text-slate-600 leading-relaxed">{activity.description}</p>}
            </div>

            {/* Assigned Approver Banner */}
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <User className="h-4 w-4 text-indigo-700" />
                  <span className="text-xs font-bold text-indigo-950">Assigned Executive Approver</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsReassigning(!isReassigning)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                >
                  {isReassigning ? 'Cancel' : 'Change Approver'}
                </button>
              </div>

              {isReassigning ? (
                <form onSubmit={handleReassignSubmit} className="mt-3 space-y-2.5">
                  <select
                    value={selectedApproverId}
                    onChange={(e) => setSelectedApproverId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-medium text-slate-800"
                  >
                    {TOP_LEVEL_APPROVERS.map((app) => (
                      <option key={app.id} value={app.id}>
                        {app.name} - {app.role} ({app.department})
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600 font-medium">Deadline:</span>
                    <input
                      type="time"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs"
                    />
                    <button
                      type="submit"
                      className="ml-auto rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition-colors cursor-pointer"
                    >
                      Update
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mt-2 text-xs text-slate-700">
                  <p className="font-bold text-slate-900">{activity.approverName || 'Meera Nambiar'}</p>
                  <p className="text-slate-600">{activity.approverRole || 'VP - Human Resources'}</p>
                  {activity.deadline && (
                    <p className="mt-1.5 flex items-center gap-1 font-semibold text-amber-800">
                      <Clock className="h-3.5 w-3.5 text-amber-600" /> SLA Deadline: {activity.deadline.split('T')[1] || activity.deadline}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Review Notes Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Approver Remarks & Instructions
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Approved. Proceed with execution / Verified with statutory records."
                className="w-full rounded-xl border border-slate-200 p-3 text-xs sm:text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden resize-none"
              />
            </div>
          </div>

          {/* Action Buttons: Sticky Bottom Bar on Mobile */}
          <div className="px-5 sm:px-6 py-3 border-t border-slate-100 bg-slate-50/90 sm:rounded-b-2xl shrink-0 pb-safe sm:pb-3">
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleAction('approve')}
                disabled={loading}
                className="flex items-center justify-center gap-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-xs shadow-emerald-200 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Approve</span>
              </button>

              <button
                type="button"
                onClick={() => handleAction('changes')}
                disabled={loading}
                className="flex items-center justify-center gap-1 rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-white shadow-xs shadow-amber-200 hover:bg-amber-600 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Changes</span>
              </button>

              <button
                type="button"
                onClick={() => handleAction('reject')}
                disabled={loading}
                className="flex items-center justify-center gap-1 rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white shadow-xs shadow-rose-200 hover:bg-rose-700 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
                <span>Reject</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

