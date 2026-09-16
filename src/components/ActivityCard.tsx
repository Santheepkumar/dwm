'use client';

import React from 'react';
import {
  Clock,
  Bell,
  AlertCircle,
  Calendar,
  CheckCircle2,
  CalendarClock,
  ShieldCheck,
  UserCheck,
  FileText,
  CreditCard,
  Sparkles,
  Briefcase,
  Edit2,
  Trash2,
  Check,
  CheckSquare,
} from 'lucide-react';
import { Activity } from '@/lib/types';
import { CATEGORIES, CATEGORY_STAGES, STATUS_LABELS, PRIORITY_LABELS } from '@/lib/constants';
import { formatDate, formatHours, isLongPending, isLongUnderProcessing, getDaysDifference } from '@/lib/utils';

interface ActivityCardProps {
  activity: Activity;
  onEdit?: (activity: Activity) => void;
  onDelete?: (id: string) => void;
  onPostpone?: (activity: Activity) => void;
  onCompleteToggle?: (activity: Activity) => void;
  onOpenApproval?: (activity: Activity) => void;
  onUpdateActuals?: (activity: Activity) => void;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  onEdit,
  onDelete,
  onPostpone,
  onCompleteToggle,
  onOpenApproval,
  onUpdateActuals,
}) => {
  const categoryInfo = CATEGORIES.find((c) => c.key === activity.category) || CATEGORIES[5];
  const stages = CATEGORY_STAGES[activity.category] || [];
  const currentStage = stages.find((s) => s.key === activity.stage);
  const statusInfo = STATUS_LABELS[activity.status] || STATUS_LABELS.planned;
  const priorityInfo = PRIORITY_LABELS[activity.priority] || PRIORITY_LABELS.medium;

  const longPending = isLongPending(activity);
  const longProcessing = isLongUnderProcessing(activity);
  const isCompleted = activity.status === 'completed';

  const renderCategoryIcon = () => {
    switch (activity.category) {
      case 'candidate_sourcing':
        return <UserCheck className="h-3.5 w-3.5" />;
      case 'reports':
        return <FileText className="h-3.5 w-3.5" />;
      case 'statutory':
        return <ShieldCheck className="h-3.5 w-3.5" />;
      case 'payroll':
        return <CreditCard className="h-3.5 w-3.5" />;
      case 'engagement':
        return <Sparkles className="h-3.5 w-3.5" />;
      default:
        return <Briefcase className="h-3.5 w-3.5" />;
    }
  };

  return (
    <div
      className={`group relative rounded-2xl border bg-white p-4 sm:p-5 transition-all duration-200 shadow-xs hover:shadow-md ${
        isCompleted
          ? 'border-emerald-200/90 bg-emerald-50/20'
          : longPending || longProcessing
          ? 'border-rose-200 bg-rose-50/15'
          : 'border-slate-200/90 hover:border-indigo-200'
      }`}
    >
      {/* Top Header: Category Pill + Status & Priority */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Category Pill */}
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${categoryInfo.badgeClass}`}
          >
            {renderCategoryIcon()}
            <span>{categoryInfo.label}</span>
          </span>

          {/* Pipeline Stage */}
          {currentStage && (
            <span className="rounded-md bg-slate-100/90 px-2 py-0.5 text-[11px] font-medium text-slate-600 border border-slate-200/60">
              {currentStage.label}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Status Badge */}
          <span
            className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusInfo.badgeClass}`}
          >
            {statusInfo.label}
          </span>

          {/* Priority Dot */}
          <span
            title={`Priority: ${priorityInfo.label}`}
            className="flex items-center gap-1 rounded-md bg-slate-50 px-1.5 py-0.5 text-[11px] font-medium text-slate-600 border border-slate-200/60"
          >
            <span className={`h-2 w-2 rounded-full ${priorityInfo.dotClass}`} />
            <span className="hidden sm:inline">{priorityInfo.label}</span>
          </span>
        </div>
      </div>

      {/* Main Title & Tactile Checkbox */}
      <div className="flex items-start gap-3">
        {/* Large Tactile Complete Button (Touch target ≥ 36px with 44px hit area) */}
        <button
          onClick={() => onCompleteToggle && onCompleteToggle(activity)}
          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border transition-all cursor-pointer active:scale-90 ${
            isCompleted
              ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm shadow-emerald-200'
              : 'border-slate-300 bg-white text-transparent hover:border-indigo-500 hover:text-slate-300'
          }`}
          title={isCompleted ? 'Mark as Incomplete' : 'Mark as Completed'}
          aria-label={isCompleted ? 'Mark as Incomplete' : 'Mark as Completed'}
        >
          <Check className="h-4 w-4 stroke-[3]" />
        </button>

        <div className="flex-1 min-w-0">
          <h3
            className={`text-base font-bold leading-snug text-slate-900 transition-all ${
              isCompleted ? 'line-through text-slate-400 font-normal' : ''
            }`}
          >
            {activity.title}
          </h3>

          {activity.description && (
            <p className="mt-1 text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
              {activity.description}
            </p>
          )}

          {/* Clean Metadata Micro-Chips */}
          {activity.metadata && (
            <div className="mt-2.5 flex flex-wrap gap-1.5 text-[11px]">
              {activity.metadata.candidateName && (
                <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-blue-800 border border-blue-100 font-medium">
                  <UserCheck className="h-3 w-3 text-blue-600" />
                  <span>{activity.metadata.candidateName}</span>
                </span>
              )}
              {activity.metadata.candidateRole && (
                <span className="rounded-md bg-blue-50/70 px-2 py-0.5 text-blue-800 border border-blue-100/70 font-medium">
                  Role: {activity.metadata.candidateRole}
                </span>
              )}
              {activity.metadata.reportType && (
                <span className="rounded-md bg-amber-50 px-2 py-0.5 text-amber-800 border border-amber-200/70 font-medium">
                  Report: {activity.metadata.reportType}
                </span>
              )}
              {activity.metadata.statutoryType && (
                <span className="rounded-md bg-purple-50 px-2 py-0.5 text-purple-800 border border-purple-200 font-semibold">
                  Type: {activity.metadata.statutoryType}
                </span>
              )}
              {activity.metadata.payrollSubtype && (
                <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-emerald-800 border border-emerald-200 font-semibold">
                  Payroll: {activity.metadata.payrollSubtype.toUpperCase()}
                </span>
              )}
              {activity.metadata.budgetAllocated && activity.metadata.budgetAllocated > 0 && (
                <span className="rounded-md bg-rose-50 px-2 py-0.5 text-rose-800 border border-rose-200 font-semibold">
                  ₹{activity.metadata.budgetAllocated.toLocaleString()}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Warnings & Escalation Alerts */}
      {(longPending || longProcessing || activity.approverName || activity.postponeCount > 0) && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {/* Long Pending Alert */}
          {longPending && (
            <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-800 border border-rose-200 animate-pulse">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>Pending {getDaysDifference(activity.plannedDate)} days overdue</span>
            </span>
          )}

          {/* Long Processing Alert */}
          {longProcessing && (
            <span className="inline-flex items-center gap-1 rounded-md bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-800 border border-orange-200">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>Stalled {getDaysDifference(activity.updatedAt.slice(0, 10))} days</span>
            </span>
          )}

          {/* Postpone indicator */}
          {activity.postponeCount > 0 && (
            <span
              className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-800 border border-rose-200"
              title={activity.postponeReason || 'Postponed activity'}
            >
              <CalendarClock className="h-3 w-3 text-rose-600" />
              <span>Postponed ({activity.postponeCount}x)</span>
            </span>
          )}

          {/* Top-Level Approver Tag */}
          {activity.approverName && (
            <button
              onClick={() => onOpenApproval && onOpenApproval(activity)}
              className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors cursor-pointer"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
              <span>Sign-off: {activity.approverName}</span>
              {activity.approvalStatus === 'pending' && (
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping"></span>
              )}
            </button>
          )}
        </div>
      )}

      {/* Timing, Duration & Reminder Bar */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-100 text-xs text-slate-600">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Time planned */}
          <div className="flex items-center gap-1 font-medium">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span>Plan: {formatHours(activity.plannedHours)}</span>
            {activity.plannedStartTime && (
              <span className="text-slate-400">@{activity.plannedStartTime}</span>
            )}
          </div>

          {/* Actual Hours pill */}
          <div
            onClick={() => onUpdateActuals && onUpdateActuals(activity)}
            className="flex items-center gap-1 rounded-md bg-slate-100 hover:bg-slate-200/80 px-2 py-0.5 text-[11px] font-bold text-slate-700 cursor-pointer transition-colors"
            title="Click to log actual time spent"
          >
            <span>Actual: {formatHours(activity.actualHours)}</span>
          </div>

          {/* Reminder indicator */}
          {activity.hasReminder && (
            <span
              className="flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-800 border border-amber-200/60"
              title="Reminder enabled"
            >
              <Bell className="h-3 w-3 text-amber-600" />
              <span className="hidden sm:inline">Alert</span>
            </span>
          )}
        </div>

        {/* Date stamp */}
        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <Calendar className="h-3 w-3" />
          <span>{formatDate(activity.plannedDate)}</span>
        </div>
      </div>

      {/* Action Footer Buttons (Touch targets ≥ 40px, clear labels) */}
      <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-slate-100">
        <div className="flex items-center gap-1.5">
          {/* Update Actuals Button */}
          {onUpdateActuals && (
            <button
              onClick={() => onUpdateActuals(activity)}
              className="flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 active:scale-95 transition-all cursor-pointer"
            >
              <Clock className="h-3.5 w-3.5 text-indigo-600" />
              <span>Log Work</span>
            </button>
          )}

          {/* Postpone button */}
          {onPostpone && !isCompleted && (
            <button
              onClick={() => onPostpone(activity)}
              className="flex items-center gap-1 rounded-lg border border-slate-200/90 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
              title="Reschedule activity"
            >
              <CalendarClock className="h-3.5 w-3.5 text-slate-500" />
              <span>Postpone</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Edit */}
          {onEdit && (
            <button
              onClick={() => onEdit(activity)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all cursor-pointer"
              title="Edit Activity"
              aria-label="Edit Activity"
            >
              <Edit2 className="h-4 w-4" />
            </button>
          )}

          {/* Delete */}
          {onDelete && (
            <button
              onClick={() => onDelete(activity.id)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all cursor-pointer"
              title="Delete Activity"
              aria-label="Delete Activity"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

