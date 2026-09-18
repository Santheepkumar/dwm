export type ActivityCategory =
  | 'candidate_sourcing'
  | 'reports'
  | 'statutory'
  | 'payroll'
  | 'engagement'
  | 'general';

export type ActivityStatus =
  | 'planned'
  | 'under_processing'
  | 'waiting_approval'
  | 'completed'
  | 'postponed';

export type ActivityPriority = 'low' | 'medium' | 'high' | 'urgent';

export type ApprovalStatus = 'none' | 'pending' | 'approved' | 'rejected' | 'changes_requested';

export type UserRole = 'super_admin' | 'admin' | 'manager' | 'approver' | 'member';

export interface ApproverOption {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
}

export interface Organization {
  $id?: string;
  id: string;
  name: string;
  slug: string;
  plan: string;
  logoUrl?: string;
  ownerId: string;
  ownerEmail?: string;
  settings?: Record<string, any> | string;
  createdAt: string;
  updatedAt: string;
}

export interface Membership {
  $id?: string;
  id: string;
  tenantId: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: UserRole;
  department?: string;
  designation?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityMetadata {
  // Candidate Sourcing
  candidateName?: string;
  candidateRole?: string;
  candidateContact?: string;
  expectedJoiningDate?: string;
  ctcOffered?: string;

  // Reports
  reportType?: string;
  reportPeriod?: string;
  submittedTo?: string;

  // Statutory
  statutoryType?: 'PF' | 'ESI' | 'TDS' | 'PT' | 'GST' | 'Other';
  challanNumber?: string;
  filingDueDate?: string;

  // Payroll
  payrollSubtype?: 'addition' | 'deletion' | 'separation' | 'transfer';
  employeeId?: string;
  employeeName?: string;
  effectiveDate?: string;

  // Engagement
  eventVenue?: string;
  budgetAllocated?: number;
  expectedParticipants?: number;

  // Auto Carry-Forward Tracking
  isCarryForwarded?: boolean;
  carryForwardedFrom?: string;
  carryForwardCount?: number;
  lastRolloverAt?: string;

  [key: string]: any;
}

export interface Activity {
  $id?: string; // Appwrite document ID
  id: string;
  tenantId: string; // Tenant/Org Scoping ID
  title: string;
  description?: string;
  category: ActivityCategory;
  stage: string;
  status: ActivityStatus;
  priority: ActivityPriority;
  plannedDate: string; // YYYY-MM-DD
  plannedStartTime?: string; // HH:mm
  plannedHours: number;
  actualHours: number;
  actualNotes?: string;
  hasReminder: boolean;
  reminderTime?: string; // YYYY-MM-DDTHH:mm or HH:mm
  earlierReminderTime?: string; // Advance reminder for rescheduled tasks
  deadline?: string; // YYYY-MM-DDTHH:mm
  createdById?: string;
  assignedToId?: string;
  assignedToName?: string;
  approverId?: string;
  approverName?: string;
  approverRole?: string;
  approverEmail?: string;
  approvalStatus: ApprovalStatus;
  approvalNotes?: string;
  approvalDecisionDate?: string;
  postponeCount: number;
  postponeReason?: string;
  originalPlannedDate?: string;
  metadata?: ActivityMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityTransition {
  $id?: string;
  id: string;
  tenantId: string;
  activityId: string;
  fromStatus: ActivityStatus | string;
  toStatus: ActivityStatus | string;
  fromStage?: string;
  toStage?: string;
  changedById: string;
  changedByName: string;
  changedByEmail?: string;
  reason?: string;
  transitionDate: string;
  createdAt: string;
}

export interface ApprovalRequest {
  $id?: string;
  id: string;
  tenantId: string;
  activityId: string;
  activityTitle: string;
  requesterId: string;
  requesterName: string;
  approverId?: string;
  approverName: string;
  approverRole: string;
  approverEmail?: string;
  status: ApprovalStatus;
  deadline?: string;
  decisionNotes?: string;
  decisionDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DailySummaryMetric {
  totalPlanned: number;
  totalCompleted: number;
  totalUnderProcessing: number;
  totalWaitingApproval: number;
  totalPostponed: number;
  totalLongPending: number;
  totalLongProcessing: number;
  plannedHours: number;
  actualHours: number;
  efficiencyScore: number; // percentage
}

export interface AppwriteConfig {
  endpoint: string;
  projectId: string;
  databaseId: string;
  collectionId: string; // Default/Activities collection
  collections: {
    organizations: string;
    memberships: string;
    activities: string;
    activity_transitions: string;
    approval_requests: string;
  };
  isConfigured: boolean;
}

