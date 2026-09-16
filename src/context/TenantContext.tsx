'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Organization, Membership, UserRole } from '@/lib/types';
import { tenantService } from '@/services/tenantService';
import { useAuth } from './AuthContext';

interface TenantContextType {
  currentTenant: Organization | null;
  userMembership: Membership | null;
  organizations: Organization[];
  tenantMembers: Membership[];
  loading: boolean;
  isSuperAdmin: boolean;
  canCreateOrg: boolean;
  canManageMembers: boolean;
  switchTenant: (tenantId: string) => Promise<void>;
  createOrganization: (name: string, slug?: string) => Promise<Organization>;
  addMember: (memberData: {
    userName: string;
    userEmail: string;
    password?: string;
    role: UserRole;
    department?: string;
    designation?: string;
  }) => Promise<Membership>;
  removeMember: (membershipId: string) => Promise<boolean>;
  refreshTenants: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentTenant, setCurrentTenant] = useState<Organization | null>(null);
  const [userMembership, setUserMembership] = useState<Membership | null>(null);
  const [tenantMembers, setTenantMembers] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);

  const isSuperAdmin = tenantService.isSuperAdmin(user?.email, userMembership?.role);
  const canCreateOrg = tenantService.canCreateOrganization(user?.email, userMembership?.role);
  const canManageMembers = tenantService.canManageMembers(userMembership?.role, isSuperAdmin);

  const loadTenantData = useCallback(async (targetTenantId?: string) => {
    try {
      setLoading(true);
      const orgs = await tenantService.getOrganizations();
      setOrganizations(orgs);

      const activeId = targetTenantId || tenantService.getActiveTenantId();
      let activeOrg = orgs.find((o) => o.id === activeId || o.$id === activeId);

      if (!activeOrg && orgs.length > 0) {
        activeOrg = orgs[0];
      }

      if (activeOrg) {
        setCurrentTenant(activeOrg);
        const activeTenantId = activeOrg.id || activeOrg.$id || 'org_default';

        const membership = await tenantService.getUserMembership(
          activeTenantId,
          user?.id || 'user_admin',
          user?.email
        );
        setUserMembership(membership);

        const members = await tenantService.getMemberships(activeTenantId);
        setTenantMembers(members);
      }
    } catch (err) {
      console.error('Failed to load tenant context:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadTenantData();

    const handleTenantEvent = (e: any) => {
      const newTenantId = e.detail?.tenantId;
      loadTenantData(newTenantId);
    };

    const handleMembersEvent = () => {
      const activeTenantId = tenantService.getActiveTenantId();
      tenantService.getMemberships(activeTenantId).then(setTenantMembers);
    };

    window.addEventListener('dwm_tenant_changed', handleTenantEvent);
    window.addEventListener('dwm_members_changed', handleMembersEvent);
    return () => {
      window.removeEventListener('dwm_tenant_changed', handleTenantEvent);
      window.removeEventListener('dwm_members_changed', handleMembersEvent);
    };
  }, [loadTenantData]);

  const switchTenant = async (tenantId: string) => {
    tenantService.setActiveTenantId(tenantId);
    await loadTenantData(tenantId);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dwm_activities_changed'));
    }
  };

  const createOrganization = async (name: string, slug?: string) => {
    const org = await tenantService.createOrganization(name, slug, user?.email, userMembership?.role);
    await loadTenantData(org.id || org.$id);
    return org;
  };

  const addMember = async (memberData: {
    userName: string;
    userEmail: string;
    password?: string;
    role: UserRole;
    department?: string;
    designation?: string;
  }) => {
    const tenantId = currentTenant?.id || currentTenant?.$id || 'org_default';
    const newMember = await tenantService.addMember(tenantId, memberData);
    const updated = await tenantService.getMemberships(tenantId);
    setTenantMembers(updated);
    return newMember;
  };

  const removeMember = async (membershipId: string) => {
    const success = await tenantService.removeMember(membershipId);
    if (currentTenant) {
      const updated = await tenantService.getMemberships(currentTenant.id || currentTenant.$id || 'org_default');
      setTenantMembers(updated);
    }
    return success;
  };

  const refreshTenants = async () => {
    await loadTenantData();
  };

  return (
    <TenantContext.Provider
      value={{
        currentTenant,
        userMembership,
        organizations,
        tenantMembers,
        loading,
        isSuperAdmin,
        canCreateOrg,
        canManageMembers,
        switchTenant,
        createOrganization,
        addMember,
        removeMember,
        refreshTenants,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

