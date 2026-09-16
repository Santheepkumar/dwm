'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Calendar, Clock, Bell, ShieldCheck, UserCheck, FileText, CreditCard, Sparkles } from 'lucide-react';
import { Activity, ActivityCategory, ActivityPriority, ActivityStatus } from '@/lib/types';
import { CATEGORIES, CATEGORY_STAGES, TOP_LEVEL_APPROVERS } from '@/lib/constants';
import { getTodayString } from '@/lib/utils';
import { notificationService } from '@/services/notificationService';

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (activityData: any) => Promise<void>;
  activityToEdit?: Activity | null;
  defaultDate?: string;
}

export const ActivityModal: React.FC<ActivityModalProps> = ({
  isOpen,
  onClose,
  onSave,
  activityToEdit,
  defaultDate,
}) => {
  const today = getTodayString();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ActivityCategory>('candidate_sourcing');
  const [stage, setStage] = useState('sourcing');
  const [status, setStatus] = useState<ActivityStatus>('planned');
  const [priority, setPriority] = useState<ActivityPriority>('medium');
  const [plannedDate, setPlannedDate] = useState(defaultDate || today);
  const [plannedStartTime, setPlannedStartTime] = useState('10:00');
  const [plannedHours, setPlannedHours] = useState(1.5);
  const [actualHours, setActualHours] = useState(0);
  const [actualNotes, setActualNotes] = useState('');
  const [hasReminder, setHasReminder] = useState(true);
  const [reminderOffset, setReminderOffset] = useState('15'); // mins before
  const [deadline, setDeadline] = useState('');
  const [approverId, setApproverId] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Metadata custom fields
  const [candidateName, setCandidateName] = useState('');
  const [candidateRole, setCandidateRole] = useState('');
  const [reportType, setReportType] = useState('');
  const [statutoryType, setStatutoryType] = useState<'PF' | 'ESI' | 'TDS' | 'PT' | 'GST' | 'Other'>('PF');
  const [payrollSubtype, setPayrollSubtype] = useState<'addition' | 'deletion' | 'separation' | 'transfer'>('addition');
  const [budgetAllocated, setBudgetAllocated] = useState<number>(0);
  const [eventVenue, setEventVenue] = useState('');

  // Populate when editing
  useEffect(() => {
    setErrorMessage(null);
    if (activityToEdit) {
      setTitle(activityToEdit.title || '');
      setDescription(activityToEdit.description || '');
      setCategory(activityToEdit.category || 'candidate_sourcing');
      setStage(activityToEdit.stage || 'sourcing');
      setStatus(activityToEdit.status || 'planned');
      setPriority(activityToEdit.priority || 'medium');
      setPlannedDate(activityToEdit.plannedDate || today);
      setPlannedStartTime(activityToEdit.plannedStartTime || '10:00');
      setPlannedHours(activityToEdit.plannedHours || 1.5);
      setActualHours(activityToEdit.actualHours || 0);
      setActualNotes(activityToEdit.actualNotes || '');
      setHasReminder(activityToEdit.hasReminder ?? true);
      setDeadline(activityToEdit.deadline || '');

      const foundApp = TOP_LEVEL_APPROVERS.find((a) => a.name === activityToEdit.approverName);
      setApproverId(foundApp ? foundApp.id : '');

      if (activityToEdit.metadata) {
        setCandidateName(activityToEdit.metadata.candidateName || '');
        setCandidateRole(activityToEdit.metadata.candidateRole || '');
        setReportType(activityToEdit.metadata.reportType || '');
        setStatutoryType(activityToEdit.metadata.statutoryType || 'PF');
        setPayrollSubtype(activityToEdit.metadata.payrollSubtype || 'addition');
        setBudgetAllocated(activityToEdit.metadata.budgetAllocated || 0);
        setEventVenue(activityToEdit.metadata.eventVenue || '');
      }
    } else {
      // Reset defaults
      setTitle('');
      setDescription('');
      setCategory('candidate_sourcing');
      setStage('sourcing');
      setStatus('planned');
      setPriority('medium');
      setPlannedDate(defaultDate || today);
      setPlannedStartTime('10:00');
      setPlannedHours(1.5);
      setActualHours(0);
      setActualNotes('');
      setHasReminder(true);
      setDeadline('');
      setApproverId('');
      setCandidateName('');
      setCandidateRole('');
      setReportType('');
      setStatutoryType('PF');
      setPayrollSubtype('addition');
      setBudgetAllocated(0);
      setEventVenue('');
    }
  }, [activityToEdit, isOpen, defaultDate, today]);

  // Sync default stage when category changes
  const handleCategoryChange = (newCat: ActivityCategory) => {
    setCategory(newCat);
    const availableStages = CATEGORY_STAGES[newCat] || [];
    if (availableStages.length > 0) {
      setStage(availableStages[0].key);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    const approverObj = TOP_LEVEL_APPROVERS.find((a) => a.id === approverId);

    // Compute reminder time
    let reminderTime = '';
    if (hasReminder && plannedStartTime) {
      const [h, m] = plannedStartTime.split(':').map(Number);
      const d = new Date(`${plannedDate}T${plannedStartTime}:00`);
      d.setMinutes(d.getMinutes() - parseInt(reminderOffset, 10));
      reminderTime = `${plannedDate}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }

    const payload: any = {
      title,
      description,
      category,
      stage,
      status,
      priority,
      plannedDate,
      plannedStartTime,
      plannedHours: Number(plannedHours),
      actualHours: Number(actualHours),
      actualNotes,
      hasReminder,
      reminderTime,
      deadline: deadline ? `${plannedDate}T${deadline}` : undefined,
      approverName: approverObj ? approverObj.name : undefined,
      approverRole: approverObj ? approverObj.role : undefined,
      approverEmail: approverObj ? approverObj.email : undefined,
      approvalStatus: approverObj ? 'pending' : 'none',
      metadata: {
        candidateName,
        candidateRole,
        reportType,
        statutoryType,
        payrollSubtype,
        budgetAllocated: Number(budgetAllocated) || 0,
        eventVenue,
      },
    };

    try {
      await onSave(payload);
      onClose();
    } catch (err: any) {
      console.error('Failed to save activity:', err);
      setErrorMessage(err.message || 'Failed to save activity to database');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs sm:p-4 overflow-hidden animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-t-3xl sm:rounded-2xl bg-white shadow-2xl transition-all border border-slate-200/90 flex flex-col max-h-[92vh] sm:max-h-[88vh]">
        {/* Mobile drag handle */}
        <div className="w-10 h-1 rounded-full bg-slate-300 mx-auto mt-2.5 sm:hidden" />

        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              {activityToEdit ? 'Edit Activity' : 'Plan New Activity'}
            </h3>
            <p className="text-xs text-slate-500">
              Daily Work Management (DWM) Planning Engine
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto px-5 sm:px-6 py-4 space-y-4 flex-1">
            {errorMessage && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
                ⚠️ {errorMessage}
              </div>
            )}


          {/* Category Selector Tabs */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Activity Category & Pipeline
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat.key}
                  onClick={() => handleCategoryChange(cat.key)}
                  className={`flex items-center gap-2 rounded-lg border p-2 text-left text-xs font-medium transition-all ${
                    category === cat.key
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-2xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="shrink-0">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Activity Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Sourcing Frontend profiles / PF ECR Challan / September Payroll..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden"
            />
          </div>

          {/* Category Specific Dynamic Fields */}
          {category === 'candidate_sourcing' && (
            <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-3.5 space-y-3">
              <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                Recruitment Details
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Candidate Name</label>
                  <input
                    type="text"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Target Role / Designation</label>
                  <input
                    type="text"
                    value={candidateRole}
                    onChange={(e) => setCandidateRole(e.target.value)}
                    placeholder="e.g. Senior Backend Engineer"
                    className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {category === 'reports' && (
            <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-3.5 space-y-3">
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                Reporting Attributes
              </span>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Report Name / Frequency</label>
                <input
                  type="text"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  placeholder="e.g. Monthly Attrition / Overtime Audit / Hiring Funnel"
                  className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                />
              </div>
            </div>
          )}

          {category === 'statutory' && (
            <div className="rounded-xl border border-purple-100 bg-purple-50/40 p-3.5 space-y-3">
              <span className="text-xs font-bold text-purple-900 uppercase tracking-wider">
                Statutory Compliance
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Compliance Act / Type</label>
                  <select
                    value={statutoryType}
                    onChange={(e) => setStatutoryType(e.target.value as any)}
                    className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                  >
                    <option value="PF">PF (Provident Fund)</option>
                    <option value="ESI">ESI (Employee State Insurance)</option>
                    <option value="TDS">TDS (Tax Deducted at Source)</option>
                    <option value="PT">PT (Professional Tax)</option>
                    <option value="GST">GST Compliance</option>
                    <option value="Other">Other Labor Laws</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {category === 'payroll' && (
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3.5 space-y-3">
              <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                Payroll Operation Type
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['addition', 'deletion', 'separation', 'transfer'] as const).map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setPayrollSubtype(sub)}
                    className={`rounded-md border py-1.5 text-xs font-semibold uppercase ${
                      payrollSubtype === sub
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>
          )}

          {category === 'engagement' && (
            <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-3.5 space-y-3">
              <span className="text-xs font-bold text-rose-900 uppercase tracking-wider">
                Engagement & Event Planning
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Estimated Budget (INR ₹)</label>
                  <input
                    type="number"
                    value={budgetAllocated}
                    onChange={(e) => setBudgetAllocated(Number(e.target.value))}
                    className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Venue / Format</label>
                  <input
                    type="text"
                    value={eventVenue}
                    onChange={(e) => setEventVenue(e.target.value)}
                    placeholder="e.g. Auditorium / Cafeteria / Virtual"
                    className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description / Notes
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed action items, dependencies, or remarks..."
              className="w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-hidden"
            />
          </div>

          {/* Stage & Status & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Workflow Stage
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800"
              >
                {(CATEGORY_STAGES[category] || []).map((st) => (
                  <option key={st.key} value={st.key}>
                    {st.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Current Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800"
              >
                <option value="planned">Planned</option>
                <option value="under_processing">Under Processing</option>
                <option value="waiting_approval">Waiting for Approval</option>
                <option value="completed">Completed</option>
                <option value="postponed">Postponed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Date & Time & Estimation */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Planned Date
              </label>
              <input
                type="date"
                required
                value={plannedDate}
                onChange={(e) => setPlannedDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={plannedStartTime}
                onChange={(e) => setPlannedStartTime(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Estimated Hours
              </label>
              <input
                type="number"
                step="0.25"
                min="0"
                max="24"
                value={plannedHours}
                onChange={(e) => setPlannedHours(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800"
              />
            </div>
          </div>

          {/* Reminder Engine (Requirement 1) */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-amber-600" />
                <span className="text-xs font-bold text-amber-950">
                  Feature 1: Reminder Notification
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasReminder}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setHasReminder(val);
                    if (val) {
                      notificationService.requestPermission().catch(() => {});
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>
            {hasReminder && (
              <div className="mt-2.5 flex items-center gap-2 text-xs text-amber-900">
                <span>Alert me:</span>
                <select
                  value={reminderOffset}
                  onChange={(e) => setReminderOffset(e.target.value)}
                  className="rounded border border-amber-300 bg-white px-2 py-1 text-xs text-slate-800"
                >
                  <option value="0">At start time</option>
                  <option value="15">15 mins before</option>
                  <option value="30">30 mins before</option>
                  <option value="60">1 hour before</option>
                </select>
                <span>prior to {plannedStartTime || 'event'}</span>
              </div>
            )}
          </div>

          {/* State Transition Audit Trail (Requirement: Normalized Audit Entity) */}
          {activityToEdit && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-indigo-600" />
                  Audit Trail & State Transitions
                </span>
                <span className="text-[10px] font-medium text-slate-500">
                  Tenant: {activityToEdit.tenantId || 'org_default'}
                </span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="rounded-lg bg-white border border-slate-200/70 p-2.5 space-y-1">
                  <div className="flex items-center justify-between text-slate-700 font-semibold">
                    <span className="capitalize text-indigo-700">Initial Planning</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {activityToEdit.createdAt ? new Date(activityToEdit.createdAt).toLocaleString() : 'Recent'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Activity created with initial status &quot;{activityToEdit.status}&quot; and planned date {activityToEdit.plannedDate}.
                  </p>
                </div>

                {activityToEdit.postponeCount > 0 && (
                  <div className="rounded-lg bg-amber-50/80 border border-amber-200 p-2.5 space-y-1">
                    <div className="flex items-center justify-between text-amber-900 font-semibold">
                      <span>Postponement Log ({activityToEdit.postponeCount}x)</span>
                      <span className="text-[10px] text-amber-600 font-normal">
                        Original Date: {activityToEdit.originalPlannedDate || 'N/A'}
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-800">
                      Reason: {activityToEdit.postponeReason || 'Operational rescheduling'}
                    </p>
                  </div>
                )}

                {activityToEdit.approvalStatus !== 'none' && (
                  <div className="rounded-lg bg-indigo-50/80 border border-indigo-200 p-2.5 space-y-1">
                    <div className="flex items-center justify-between text-indigo-900 font-semibold">
                      <span>Approval Request ({activityToEdit.approvalStatus.toUpperCase()})</span>
                      <span className="text-[10px] text-indigo-600 font-normal">
                        Approver: {activityToEdit.approverName || 'Executive'}
                      </span>
                    </div>
                    {activityToEdit.approvalNotes && (
                      <p className="text-[11px] text-indigo-800">
                        Decision Notes: {activityToEdit.approvalNotes}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          </div>

          {/* Sticky Footer Actions */}
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
              {loading ? 'Saving...' : activityToEdit ? 'Update Activity' : 'Save Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
