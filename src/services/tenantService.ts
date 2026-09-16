import { Organization, Membership, UserRole } from '@/lib/types';
import { INITIAL_ORGANIZATIONS, INITIAL_MEMBERSHIPS } from '@/lib/sampleData';
import { getAppwriteConfig, getDatabases } from '@/lib/appwrite';
import { ID, Query } from 'appwrite';

const LOCAL_ORGS_KEY = 'dwm_organizations_data';
const LOCAL_MEMBERS_KEY = 'dwm_memberships_data';
const ACTIVE_TENANT_KEY = 'dwm_active_tenant_id';

function getLocalOrgs(): Organization[] {
  if (typeof window === 'undefined') return INITIAL_ORGANIZATIONS as Organization[];
  const stored = localStorage.getItem(LOCAL_ORGS_KEY);
  if (!stored) {
    localStorage.setItem(LOCAL_ORGS_KEY, JSON.stringify(INITIAL_ORGANIZATIONS));
    return INITIAL_ORGANIZATIONS as Organization[];
  }
  try {
    return JSON.parse(stored);
  } catch {
    return INITIAL_ORGANIZATIONS as Organization[];
  }
}

function saveLocalOrgs(orgs: Organization[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_ORGS_KEY, JSON.stringify(orgs));
    window.dispatchEvent(new CustomEvent('dwm_tenant_changed'));
  }
}

function getLocalMembers(): Membership[] {
  if (typeof window === 'undefined') return INITIAL_MEMBERSHIPS as Membership[];
  const stored = localStorage.getItem(LOCAL_MEMBERS_KEY);
  if (!stored) {
    localStorage.setItem(LOCAL_MEMBERS_KEY, JSON.stringify(INITIAL_MEMBERSHIPS));
    return INITIAL_MEMBERSHIPS as Membership[];
  }
  try {
    return JSON.parse(stored);
  } catch {
    return INITIAL_MEMBERSHIPS as Membership[];
  }
}

function saveLocalMembers(members: Membership[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_MEMBERS_KEY, JSON.stringify(members));
  }
}

const SUPER_ADMIN_EMAILS = [
  'developer.santheep@gmail.com',
  'admin@dwm.com',
  'superadmin@dwm.io',
];

export const tenantService = {
  getActiveTenantId(): string {
    if (typeof window === 'undefined') return 'org_default';
    return localStorage.getItem(ACTIVE_TENANT_KEY) || 'org_default';
  },

  setActiveTenantId(tenantId: string): void {
    if (typeof window !== 'undefined') {
      const current = localStorage.getItem(ACTIVE_TENANT_KEY);
      if (current === tenantId) return; // Prevent recursive loop
      localStorage.setItem(ACTIVE_TENANT_KEY, tenantId);
      window.dispatchEvent(new CustomEvent('dwm_tenant_changed', { detail: { tenantId } }));
    }
  },

  // RBAC Permission checks
  isSuperAdmin(userEmail?: string, role?: UserRole): boolean {
    if (role === 'super_admin') return true;
    if (userEmail && SUPER_ADMIN_EMAILS.includes(userEmail.toLowerCase().trim())) {
      return true;
    }
    return false;
  },

  canCreateOrganization(userEmail?: string, role?: UserRole): boolean {
    // Only super_admin can create organizations
    return this.isSuperAdmin(userEmail, role);
  },

  canManageMembers(role?: UserRole, isSuperAdmin?: boolean): boolean {
    // Both super_admin and organization admin can manage members
    return Boolean(isSuperAdmin || role === 'super_admin' || role === 'admin');
  },

  async getOrganizations(): Promise<Organization[]> {
    const config = getAppwriteConfig();
    if (config.isConfigured) {
      try {
        const db = getDatabases();
        const res = await db.listDocuments(
          config.databaseId,
          config.collections.organizations,
          [Query.limit(50), Query.orderAsc('name')]
        );
        if (res.documents.length > 0) {
          return res.documents.map((doc: any) => ({
            ...doc,
            id: doc.$id,
            createdAt: doc.$createdAt || doc.createdAt,
            updatedAt: doc.$updatedAt || doc.updatedAt,
          })) as Organization[];
        }
      } catch (e) {
        console.warn('Appwrite org fetch failed, using local fallback', e);
      }
    }
    return getLocalOrgs();
  },

  async getOrganization(id: string): Promise<Organization | null> {
    const orgs = await this.getOrganizations();
    return orgs.find((o) => o.id === id || o.$id === id) || null;
  },

  async createOrganization(
    name: string,
    slug?: string,
    ownerEmail?: string,
    creatorRole?: UserRole
  ): Promise<Organization> {
    // RBAC: Verify creator has permission
    if (!this.canCreateOrganization(ownerEmail, creatorRole)) {
      throw new Error('Access Denied: Only Super Admins can create new organizations.');
    }

    const now = new Date().toISOString();
    const cleanSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newOrg: Organization = {
      id: `org_${Date.now()}`,
      name,
      slug: cleanSlug,
      plan: 'enterprise',
      ownerId: 'user_current',
      ownerEmail: ownerEmail || 'developer.santheep@gmail.com',
      createdAt: now,
      updatedAt: now,
    };

    const config = getAppwriteConfig();
    if (config.isConfigured) {
      try {
        const db = getDatabases();
        const doc = await db.createDocument(
          config.databaseId,
          config.collections.organizations,
          ID.unique(),
          {
            name: newOrg.name,
            slug: newOrg.slug,
            plan: newOrg.plan,
            ownerId: newOrg.ownerId,
            ownerEmail: newOrg.ownerEmail,
          }
        );
        newOrg.$id = doc.$id;
        newOrg.id = doc.$id;
      } catch (err) {
        console.warn('Appwrite createOrganization failed, saving locally', err);
      }
    }

    const orgs = getLocalOrgs();
    saveLocalOrgs([...orgs, newOrg]);
    this.setActiveTenantId(newOrg.id);
    return newOrg;
  },

  async getMemberships(tenantId: string): Promise<Membership[]> {
    const config = getAppwriteConfig();
    if (config.isConfigured) {
      try {
        const db = getDatabases();
        const res = await db.listDocuments(
          config.databaseId,
          config.collections.memberships,
          [Query.equal('tenantId', tenantId), Query.limit(100)]
        );
        if (res.documents.length > 0) {
          return res.documents.map((doc: any) => ({
            ...doc,
            id: doc.$id,
            createdAt: doc.$createdAt || doc.createdAt,
            updatedAt: doc.$updatedAt || doc.updatedAt,
          })) as Membership[];
        }
      } catch (e) {
        console.warn('Appwrite membership fetch failed, using local', e);
      }
    }
    const all = getLocalMembers();
    return all.filter((m) => m.tenantId === tenantId);
  },

  async addMember(
    tenantId: string,
    member: {
      userName: string;
      userEmail: string;
      role: UserRole;
      department?: string;
      designation?: string;
    }
  ): Promise<Membership> {
    const now = new Date().toISOString();
    const newMembership: Membership = {
      id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      tenantId,
      userId: `user_${Date.now()}`,
      userName: member.userName,
      userEmail: member.userEmail,
      role: member.role,
      department: member.department || 'Operations',
      designation: member.designation || 'Specialist',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    const config = getAppwriteConfig();
    if (config.isConfigured) {
      try {
        const db = getDatabases();
        const doc = await db.createDocument(
          config.databaseId,
          config.collections.memberships,
          ID.unique(),
          {
            tenantId: newMembership.tenantId,
            userId: newMembership.userId,
            userName: newMembership.userName,
            userEmail: newMembership.userEmail,
            role: newMembership.role,
            department: newMembership.department,
            designation: newMembership.designation,
            isActive: true,
          }
        );
        newMembership.$id = doc.$id;
        newMembership.id = doc.$id;
      } catch (err) {
        console.warn('Appwrite addMember failed, saving locally', err);
      }
    }

    const all = getLocalMembers();
    saveLocalMembers([...all, newMembership]);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dwm_members_changed', { detail: { tenantId } }));
    }
    return newMembership;
  },

  async removeMember(membershipId: string): Promise<boolean> {
    const config = getAppwriteConfig();
    if (config.isConfigured) {
      try {
        const db = getDatabases();
        await db.deleteDocument(config.databaseId, config.collections.memberships, membershipId);
      } catch (err) {
        console.warn('Appwrite removeMember failed, removing locally', err);
      }
    }
    const all = getLocalMembers();
    const filtered = all.filter((m) => m.id !== membershipId && m.$id !== membershipId);
    saveLocalMembers(filtered);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dwm_members_changed'));
    }
    return true;
  },

  async getUserMembership(tenantId: string, userId: string, userEmail?: string): Promise<Membership | null> {
    const isSuper = this.isSuperAdmin(userEmail);
    const members = await this.getMemberships(tenantId);
    const found = members.find((m) => m.userId === userId || (userEmail && m.userEmail === userEmail));
    if (found) {
      if (isSuper) {
        return { ...found, role: 'super_admin' };
      }
      return found;
    }

    return {
      id: `mem_auto_${tenantId}`,
      tenantId,
      userId,
      userName: userEmail ? userEmail.split('@')[0] : 'Santheep',
      userEmail: userEmail || 'developer.santheep@gmail.com',
      role: isSuper ? 'super_admin' : 'admin',
      department: 'Executive Leadership',
      designation: isSuper ? 'Global Platform Super Admin' : 'Organization Administrator',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },
};
