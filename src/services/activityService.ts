import { Activity, ActivityCategory, ActivityStatus, ActivityTransition, ApprovalRequest } from '@/lib/types';
import { INITIAL_ACTIVITIES, getSampleActivities } from '@/lib/sampleData';
import { getAppwriteConfig, getDatabases } from '@/lib/appwrite';
import { tenantService } from './tenantService';
import { ID, Query } from 'appwrite';

const LOCAL_STORAGE_KEY = 'dwm_activities_data';
const LOCAL_TRANSITIONS_KEY = 'dwm_transitions_data';
const LOCAL_APPROVALS_KEY = 'dwm_approvals_data';

// Helper to filter out system attributes and pass only defined schema attributes to Appwrite
function toAppwritePayload(activity: Partial<Activity>): Record<string, any> {
  const allowedKeys = [
    'tenantId',
    'title',
    'description',
    'category',
    'stage',
    'status',
    'priority',
    'plannedDate',
    'plannedStartTime',
    'plannedHours',
    'actualHours',
    'actualNotes',
    'hasReminder',
    'reminderTime',
    'earlierReminderTime',
    'deadline',
    'createdById',
    'assignedToId',
    'assignedToName',
    'approverId',
    'approverName',
    'approverRole',
    'approverEmail',
    'approvalStatus',
    'approvalNotes',
    'approvalDecisionDate',
    'postponeCount',
    'postponeReason',
    'originalPlannedDate',
  ];

  const payload: Record<string, any> = {};

  for (const key of allowedKeys) {
    if ((activity as any)[key] !== undefined) {
      payload[key] = (activity as any)[key];
    }
  }

  // Ensure tenantId exists
  if (!payload.tenantId) {
    payload.tenantId = tenantService.getActiveTenantId();
  }

  // Handle metadata JSON stringifying
  if (activity.metadata !== undefined) {
    payload.metadata =
      typeof activity.metadata === 'string'
        ? activity.metadata
        : JSON.stringify(activity.metadata || {});
  }

  return payload;
}

// Helper to get local data
function getLocalActivities(): Activity[] {
  if (typeof window === 'undefined') {
    return getSampleActivities();
  }
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!stored) {
    const fresh = getSampleActivities();
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(fresh));
    return fresh;
  }
  try {
    const parsed = JSON.parse(stored);
    // Ensure all activities have tenantId
    return parsed.map((a: any) => ({
      ...a,
      tenantId: a.tenantId || 'org_default',
    }));
  } catch (e) {
    console.error('Failed to parse local storage activities', e);
    return getSampleActivities();
  }
}

// Helper to save local data
function saveLocalActivities(activities: Activity[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(activities));
    window.dispatchEvent(new CustomEvent('dwm_activities_changed'));
  }
}

// Local transitions helper
function getLocalTransitions(): ActivityTransition[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(LOCAL_TRANSITIONS_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveLocalTransitions(transitions: ActivityTransition[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_TRANSITIONS_KEY, JSON.stringify(transitions));
  }
}

// Local approvals helper
function getLocalApprovals(): ApprovalRequest[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(LOCAL_APPROVALS_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveLocalApprovals(approvals: ApprovalRequest[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_APPROVALS_KEY, JSON.stringify(approvals));
  }
}

export const activityService = {
  // Log transition record
  async logTransition(transition: Omit<ActivityTransition, 'id' | 'createdAt'>): Promise<void> {
    const now = new Date().toISOString();
    const entry: ActivityTransition = {
      ...transition,
      id: `trans_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: now,
    };

    const config = getAppwriteConfig();
    if (config.isConfigured) {
      try {
        const db = getDatabases();
        await db.createDocument(
          config.databaseId,
          config.collections.activity_transitions,
          ID.unique(),
          {
            tenantId: entry.tenantId,
            activityId: entry.activityId,
            fromStatus: entry.fromStatus,
            toStatus: entry.toStatus,
            fromStage: entry.fromStage || '',
            toStage: entry.toStage || '',
            changedById: entry.changedById || 'user_current',
            changedByName: entry.changedByName || 'System / User',
            changedByEmail: entry.changedByEmail || '',
            reason: entry.reason || '',
            transitionDate: entry.transitionDate || now,
          }
        );
      } catch (err) {
        console.warn('Appwrite log transition failed, saving locally', err);
      }
    }

    const transitions = getLocalTransitions();
    saveLocalTransitions([entry, ...transitions]);
  },

  // Fetch all transitions for an activity
  async getTransitionsByActivityId(activityId: string): Promise<ActivityTransition[]> {
    const config = getAppwriteConfig();
    if (config.isConfigured) {
      try {
        const db = getDatabases();
        const res = await db.listDocuments(
          config.databaseId,
          config.collections.activity_transitions,
          [Query.equal('activityId', activityId), Query.limit(50), Query.orderDesc('$createdAt')]
        );
        if (res.documents.length > 0) {
          return res.documents.map((doc: any) => ({
            ...doc,
            id: doc.$id,
            createdAt: doc.$createdAt || doc.createdAt,
          })) as ActivityTransition[];
        }
      } catch (e) {
        console.warn('Appwrite transitions fetch failed, falling back to local', e);
      }
    }
    const all = getLocalTransitions();
    return all.filter((t) => t.activityId === activityId);
  },

  // Fetch approval requests
  async getApprovalRequests(tenantId?: string): Promise<ApprovalRequest[]> {
    const activeTenantId = tenantId || tenantService.getActiveTenantId();
    const config = getAppwriteConfig();
    if (config.isConfigured) {
      try {
        const db = getDatabases();
        const res = await db.listDocuments(
          config.databaseId,
          config.collections.approval_requests,
          [Query.equal('tenantId', activeTenantId), Query.limit(50), Query.orderDesc('$createdAt')]
        );
        if (res.documents.length > 0) {
          return res.documents.map((doc: any) => ({
            ...doc,
            id: doc.$id,
            createdAt: doc.$createdAt || doc.createdAt,
            updatedAt: doc.$updatedAt || doc.updatedAt,
          })) as ApprovalRequest[];
        }
      } catch (e) {
        console.warn('Appwrite approvals fetch failed, falling back to local', e);
      }
    }
    const all = getLocalApprovals();
    return all.filter((a) => a.tenantId === activeTenantId);
  },

  // Fetch all activities scoped by active tenant
  async getAll(tenantId?: string): Promise<Activity[]> {
    const activeTenantId = tenantId || tenantService.getActiveTenantId();
    const config = getAppwriteConfig();
    if (config.isConfigured) {
      try {
        const db = getDatabases();
        const response = await db.listDocuments(
          config.databaseId,
          config.collectionId,
          [Query.equal('tenantId', activeTenantId), Query.limit(100), Query.orderDesc('$createdAt')]
        );
        return response.documents.map((doc: any) => ({
          ...doc,
          id: doc.$id,
          tenantId: doc.tenantId || activeTenantId,
          createdAt: doc.$createdAt || doc.createdAt || new Date().toISOString(),
          updatedAt: doc.$updatedAt || doc.updatedAt || new Date().toISOString(),
          metadata: doc.metadata ? (typeof doc.metadata === 'string' ? JSON.parse(doc.metadata) : doc.metadata) : {},
        })) as Activity[];
      } catch (error) {
        console.warn('Appwrite fetch failed, falling back to local data:', error);
      }
    }
    const all = getLocalActivities();
    return all.filter((act) => act.tenantId === activeTenantId);
  },

  // Fetch activities for a specific date
  async getByDate(date: string, tenantId?: string): Promise<Activity[]> {
    const all = await this.getAll(tenantId);
    return all.filter((act) => act.plannedDate === date);
  },

  // Fetch single activity
  async getById(id: string): Promise<Activity | null> {
    const all = await this.getAll();
    return all.find((act) => act.id === id || act.$id === id) || null;
  },

  // Create new activity
  async create(data: Omit<Activity, 'id' | 'createdAt' | 'updatedAt' | 'postponeCount'>): Promise<Activity> {
    const now = new Date().toISOString();
    const activeTenantId = data.tenantId || tenantService.getActiveTenantId();
    const newActivity: Activity = {
      ...data,
      tenantId: activeTenantId,
      id: `act_${Date.now()}`,
      postponeCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    const config = getAppwriteConfig();
    if (config.isConfigured) {
      try {
        const db = getDatabases();
        const payload = toAppwritePayload(newActivity);

        const doc = await db.createDocument(
          config.databaseId,
          config.collectionId,
          ID.unique(),
          payload
        );
        newActivity.$id = doc.$id;
        newActivity.id = doc.$id;
        newActivity.createdAt = doc.$createdAt || now;
        newActivity.updatedAt = doc.$updatedAt || now;
      } catch (err: any) {
        console.error('❌ Appwrite createDocument failed:', err);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('dwm_appwrite_error', {
              detail: {
                action: 'create',
                message: err.message || 'Failed to create document in Appwrite',
                code: err.code,
                type: err.type,
              },
            })
          );
        }
      }
    }

    const localList = getLocalActivities();
    saveLocalActivities([newActivity, ...localList]);

    // Record initial state transition
    await this.logTransition({
      tenantId: newActivity.tenantId,
      activityId: newActivity.id,
      fromStatus: 'none',
      toStatus: newActivity.status,
      fromStage: 'initial',
      toStage: newActivity.stage,
      changedById: newActivity.createdById || 'user_admin',
      changedByName: 'Creator (Admin)',
      reason: 'Initial Activity Planned',
      transitionDate: now,
    });

    return newActivity;
  },

  // Update activity
  async update(id: string, updates: Partial<Activity>, transitionReason?: string): Promise<Activity | null> {
    const now = new Date().toISOString();
    const current = await this.getById(id);
    const config = getAppwriteConfig();

    if (config.isConfigured) {
      try {
        const db = getDatabases();
        const payload = toAppwritePayload(updates);
        await db.updateDocument(config.databaseId, config.collectionId, id, payload);
      } catch (err: any) {
        console.error('❌ Appwrite updateDocument failed:', err);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('dwm_appwrite_error', {
              detail: {
                action: 'update',
                message: err.message || 'Failed to update document in Appwrite',
                code: err.code,
                type: err.type,
              },
            })
          );
        }
      }
    }

    const localList = getLocalActivities();
    const index = localList.findIndex((item) => item.id === id || item.$id === id);
    if (index === -1) return null;

    const updatedItem: Activity = {
      ...localList[index],
      ...updates,
      updatedAt: now,
    };

    localList[index] = updatedItem;
    saveLocalActivities(localList);

    // If status or stage changed, record transition
    if (
      current &&
      (updates.status && updates.status !== current.status ||
        updates.stage && updates.stage !== current.stage ||
        transitionReason)
    ) {
      await this.logTransition({
        tenantId: updatedItem.tenantId,
        activityId: updatedItem.id,
        fromStatus: current.status,
        toStatus: updatedItem.status,
        fromStage: current.stage,
        toStage: updatedItem.stage,
        changedById: 'user_admin',
        changedByName: 'User / Approver',
        reason: transitionReason || updates.postponeReason || updates.approvalNotes || 'Status updated',
        transitionDate: now,
      });
    }

    return updatedItem;
  },

  // Delete activity
  async delete(id: string): Promise<boolean> {
    const config = getAppwriteConfig();
    if (config.isConfigured) {
      try {
        const db = getDatabases();
        await db.deleteDocument(config.databaseId, config.collectionId, id);
      } catch (err: any) {
        console.error('❌ Appwrite deleteDocument failed:', err);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('dwm_appwrite_error', {
              detail: {
                action: 'delete',
                message: err.message || 'Failed to delete document in Appwrite',
                code: err.code,
                type: err.type,
              },
            })
          );
        }
      }
    }

    const localList = getLocalActivities();
    const filtered = localList.filter((item) => item.id !== id && item.$id !== id);
    saveLocalActivities(filtered);
    return true;
  },

  // Feature 3: Postpone activity with reason and advance reminder
  async postpone(
    id: string,
    newDate: string,
    reason: string,
    earlierReminderTime?: string
  ): Promise<Activity | null> {
    const current = await this.getById(id);
    if (!current) return null;

    return this.update(
      id,
      {
        plannedDate: newDate,
        originalPlannedDate: current.originalPlannedDate || current.plannedDate,
        postponeCount: (current.postponeCount || 0) + 1,
        postponeReason: reason,
        status: 'postponed',
        hasReminder: true,
        earlierReminderTime: earlierReminderTime || `${newDate}T09:00`,
        reminderTime: `${newDate}T10:00`,
      },
      `Postponed to ${newDate}. Reason: ${reason}`
    );
  },

  // Feature 2: Update actual work done vs planned
  async updateActualWork(
    id: string,
    actualHours: number,
    actualNotes: string,
    markCompleted: boolean
  ): Promise<Activity | null> {
    const updates: Partial<Activity> = {
      actualHours,
      actualNotes,
    };
    if (markCompleted) {
      updates.status = 'completed';
    }
    return this.update(id, updates, markCompleted ? 'Marked Completed after Work Log' : 'Actual work hours logged');
  },

  // Feature 4: Top level approval workflow actions
  async submitForApproval(
    id: string,
    approverName: string,
    approverRole: string,
    deadline?: string
  ): Promise<Activity | null> {
    const now = new Date().toISOString();
    const current = await this.getById(id);
    const tenantId = current?.tenantId || tenantService.getActiveTenantId();

    const approvalReq: ApprovalRequest = {
      id: `appr_${Date.now()}`,
      tenantId,
      activityId: id,
      activityTitle: current?.title || 'Activity Review',
      requesterId: 'user_admin',
      requesterName: 'Santheep (Admin)',
      approverName,
      approverRole,
      status: 'pending',
      deadline: deadline || undefined,
      createdAt: now,
      updatedAt: now,
    };

    const config = getAppwriteConfig();
    if (config.isConfigured) {
      try {
        const db = getDatabases();
        await db.createDocument(
          config.databaseId,
          config.collections.approval_requests,
          ID.unique(),
          {
            tenantId: approvalReq.tenantId,
            activityId: approvalReq.activityId,
            activityTitle: approvalReq.activityTitle,
            requesterId: approvalReq.requesterId,
            requesterName: approvalReq.requesterName,
            approverName: approvalReq.approverName,
            approverRole: approvalReq.approverRole,
            status: approvalReq.status,
            deadline: approvalReq.deadline || '',
          }
        );
      } catch (err) {
        console.warn('Appwrite approval request create failed, saving locally', err);
      }
    }

    const approvals = getLocalApprovals();
    saveLocalApprovals([approvalReq, ...approvals]);

    return this.update(
      id,
      {
        status: 'waiting_approval',
        stage: 'submitted_for_approval',
        approverName,
        approverRole,
        deadline: deadline || undefined,
        approvalStatus: 'pending',
      },
      `Submitted for Executive Approval to ${approverName} (${approverRole})`
    );
  },

  async respondToApproval(
    id: string,
    decision: 'approved' | 'rejected' | 'changes_requested',
    approvalNotes?: string
  ): Promise<Activity | null> {
    const now = new Date().toISOString();
    let nextStatus: ActivityStatus = 'waiting_approval';
    if (decision === 'approved') {
      nextStatus = 'completed';
    } else if (decision === 'changes_requested') {
      nextStatus = 'under_processing';
    }

    // Update local approvals state
    const approvals = getLocalApprovals();
    const updatedApprovals = approvals.map((a) => {
      if (a.activityId === id && a.status === 'pending') {
        return {
          ...a,
          status: decision,
          decisionNotes: approvalNotes || '',
          decisionDate: now,
          updatedAt: now,
        };
      }
      return a;
    });
    saveLocalApprovals(updatedApprovals);

    return this.update(
      id,
      {
        approvalStatus: decision,
        approvalNotes: approvalNotes || '',
        approvalDecisionDate: now,
        status: nextStatus,
      },
      `Approval decision recorded: ${decision.toUpperCase()}${approvalNotes ? `. Notes: ${approvalNotes}` : ''}`
    );
  },

  // Reset demo data
  resetDemoData(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(getSampleActivities()));
      window.dispatchEvent(new CustomEvent('dwm_activities_changed'));
    }
  },

  // Export JSON
  exportData(): string {
    const list = getLocalActivities();
    return JSON.stringify(list, null, 2);
  },

  // Import JSON
  importData(jsonContent: string): boolean {
    try {
      const parsed = JSON.parse(jsonContent);
      if (Array.isArray(parsed)) {
        saveLocalActivities(parsed);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },
};

