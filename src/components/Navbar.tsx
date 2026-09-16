'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Calendar,
  Clock,
  BarChart3,
  CalendarDays,
  Settings,
  Plus,
  Layers,
  Database,
  ShieldCheck,
  Building2,
  ChevronDown,
  Check,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { getAppwriteConfig } from '@/lib/appwrite';
import { formatDate, getTodayString } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useTenant } from '@/context/TenantContext';
import { ManageMembersModal } from '@/components/ManageMembersModal';

interface NavbarProps {
  onOpenNewActivity?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenNewActivity }) => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const {
    currentTenant,
    userMembership,
    organizations,
    switchTenant,
    createOrganization,
    isSuperAdmin,
    canCreateOrg,
    canManageMembers,
  } = useTenant();
  const [isAppwriteConfigured, setIsAppwriteConfigured] = useState(false);
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
  const [isManageMembersOpen, setIsManageMembersOpen] = useState(false);
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const orgDropdownRef = useRef<HTMLDivElement>(null);
  const today = getTodayString();

  useEffect(() => {
    const config = getAppwriteConfig();
    setIsAppwriteConfigured(config.isConfigured);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (orgDropdownRef.current && !orgDropdownRef.current.contains(event.target as Node)) {
        setIsOrgDropdownOpen(false);
        setIsCreatingOrg(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    await createOrganization(newOrgName.trim());
    setNewOrgName('');
    setIsCreatingOrg(false);
    setIsOrgDropdownOpen(false);
  };

  const navLinks = [
    { href: '/', label: 'Daily Plan', shortLabel: 'Today', icon: Calendar },
    { href: '/plan-vs-actual', label: 'Plan vs Actual', shortLabel: 'Vs Actual', icon: Clock },
    { href: '/approvals', label: 'Processing & Approvals', shortLabel: 'Approvals', icon: ShieldCheck },
    { href: '/schedule', label: 'Upcoming Schedule', shortLabel: 'Schedule', icon: CalendarDays },
    { href: '/analytics', label: 'Summaries & Aging', shortLabel: 'Analytics', icon: BarChart3 },
  ];

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md transition-all">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3.5 py-2.5 sm:px-6 sm:py-3">
          {/* Brand & Org Switcher */}
          <div className="flex items-center gap-4 sm:gap-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-200 transition-transform group-hover:scale-105 active:scale-95">
                <Layers className="h-5 w-5" />
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900">DWM</span>
                  <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] sm:text-xs font-bold text-indigo-700 border border-indigo-100/60">
                    WorkHub
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">Daily Work Management</p>
              </div>
            </Link>

            {/* Tenant / Organization Switcher Dropdown */}
            <div className="relative" ref={orgDropdownRef}>
              <button
                type="button"
                onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-all cursor-pointer shadow-2xs"
                data-testid="org-switcher-button"
              >
                <div className={`flex h-5 w-5 items-center justify-center rounded-md ${isSuperAdmin ? 'bg-purple-100 text-purple-700' : 'bg-indigo-100 text-indigo-700'}`}>
                  <Building2 className="h-3 w-3" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-semibold text-slate-800 text-[11px] sm:text-xs leading-none truncate max-w-[110px] sm:max-w-[150px]">
                    {currentTenant?.name || 'Default Organization'}
                  </span>
                  <span className={`text-[9px] uppercase tracking-wider font-extrabold mt-0.5 ${isSuperAdmin ? 'text-purple-600' : 'text-indigo-600'}`}>
                    {isSuperAdmin ? 'Super Admin' : userMembership?.role === 'admin' ? 'Org Admin' : userMembership?.role || 'Member'}
                  </span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 ml-0.5" />
              </button>

              {/* Organization Switcher Modal Dropdown */}
              {isOrgDropdownOpen && (
                <div className="absolute left-0 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200/60 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2 py-1.5 border-b border-slate-100 mb-1 flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Organizations ({organizations.length})</p>
                    {isSuperAdmin && (
                      <span className="rounded-full bg-purple-50 px-1.5 py-0.5 text-[9px] font-bold text-purple-700 border border-purple-100">
                        Super Admin Mode
                      </span>
                    )}
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {organizations.map((org) => {
                      const isSelected = org.id === currentTenant?.id || org.$id === currentTenant?.$id;
                      return (
                        <button
                          key={org.id || org.$id}
                          onClick={() => {
                            switchTenant(org.id || org.$id || 'org_default');
                            setIsOrgDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-medium transition-colors cursor-pointer ${
                            isSelected ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                          }`}
                          data-testid={`org-option-${org.slug || org.id}`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Building2 className={`h-3.5 w-3.5 shrink-0 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                            <span className="truncate">{org.name}</span>
                          </div>
                          {isSelected && <Check className="h-3.5 w-3.5 text-indigo-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-100 space-y-1">
                    {/* Manage Members (Accessible to Super Admin & Org Admin) */}
                    {canManageMembers && (
                      <button
                        onClick={() => {
                          setIsManageMembersOpen(true);
                          setIsOrgDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        data-testid="manage-members-btn"
                      >
                        <UserIcon className="h-3.5 w-3.5 text-slate-500" />
                        <span>Manage Team Members</span>
                      </button>
                    )}

                    {/* Create New Organization: STRICTLY restricted to Super Admin only */}
                    {canCreateOrg ? (
                      !isCreatingOrg ? (
                        <button
                          onClick={() => setIsCreatingOrg(true)}
                          className="w-full flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold text-purple-700 hover:bg-purple-50 transition-colors cursor-pointer"
                          data-testid="create-org-btn"
                        >
                          <Plus className="h-3.5 w-3.5 text-purple-600" />
                          <span>Create Organization (Super Admin)</span>
                        </button>
                      ) : (
                        <form onSubmit={handleCreateOrg} className="space-y-2 p-1">
                          <input
                            type="text"
                            value={newOrgName}
                            onChange={(e) => setNewOrgName(e.target.value)}
                            placeholder="e.g. Acme Health"
                            autoFocus
                            className="w-full rounded-md border border-purple-300 px-2 py-1 text-xs focus:border-purple-500 focus:outline-hidden"
                            data-testid="new-org-input"
                          />
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setIsCreatingOrg(false)}
                              className="rounded px-2 py-1 text-[11px] text-slate-500 hover:bg-slate-100"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={!newOrgName.trim()}
                              className="rounded bg-purple-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
                              data-testid="submit-new-org-btn"
                            >
                              Create Org
                            </button>
                          </div>
                        </form>
                      )
                    ) : (
                      <div className="px-2 py-1 text-[10px] text-slate-400 font-medium italic">
                        🔒 Organization creation requires Super Admin
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 bg-slate-100/70 p-1 rounded-xl border border-slate-200/50">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-500'}`} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Active Date Tag */}
            <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-slate-50/90 px-2.5 py-1.5 text-xs font-medium text-slate-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{formatDate(today)}</span>
            </div>

            {/* Appwrite Status Badge (Links to /settings for Super Admin, informational indicator for others) */}
            {isSuperAdmin ? (
              <Link
                href="/settings"
                title={isAppwriteConfigured ? 'Appwrite Cloud Connected (Click to Configure)' : 'Running on Local Storage (Click for Appwrite Setup)'}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-slate-50/80 px-2 sm:px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-all cursor-pointer"
                data-testid="appwrite-status-badge"
              >
                <Database className="h-3.5 w-3.5 text-slate-500" />
                <span className="hidden md:inline">{isAppwriteConfigured ? 'Appwrite Live' : 'Demo Mode'}</span>
                <span
                  className={`h-2 w-2 rounded-full ${
                    isAppwriteConfigured ? 'bg-emerald-500' : 'bg-amber-400'
                  }`}
                />
              </Link>
            ) : (
              <div
                title={isAppwriteConfigured ? 'Appwrite Cloud Connected' : 'Running on Demo Data'}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-slate-50/80 px-2 sm:px-2.5 py-1.5 text-xs font-medium text-slate-700"
                data-testid="appwrite-status-badge"
              >
                <Database className="h-3.5 w-3.5 text-slate-500" />
                <span className="hidden md:inline">{isAppwriteConfigured ? 'Appwrite Live' : 'Demo Mode'}</span>
                <span
                  className={`h-2 w-2 rounded-full ${
                    isAppwriteConfigured ? 'bg-emerald-500' : 'bg-amber-400'
                  }`}
                />
              </div>
            )}

            {/* Quick Action Button (Desktop & Mobile header) */}
            {onOpenNewActivity && (
              <button
                onClick={onOpenNewActivity}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 sm:px-3.5 text-xs sm:text-sm font-semibold text-white shadow-sm shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Activity</span>
                <span className="sm:hidden">Plan</span>
              </button>
            )}

            {/* Settings icon (Super Admin only) */}
            {isSuperAdmin && (
              <Link
                href="/settings"
                className={`rounded-lg p-2 transition-all ${
                  pathname === '/settings'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                }`}
                title="Settings & Appwrite Backend (Super Admin Only)"
                data-testid="settings-nav-btn"
              >
                <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
            )}

            {/* User Profile & Logout */}
            {user && (
              <div className="flex items-center gap-1.5 pl-1 sm:pl-2 border-l border-slate-200">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 text-indigo-800 font-bold text-xs uppercase shadow-2xs"
                  title={`${user.name} (${user.email})`}
                >
                  {user.name.slice(0, 2) || 'U'}
                </div>
                <button
                  onClick={() => logout()}
                  className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                  title="Sign Out"
                  aria-label="Sign Out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Fixed Bottom Navigation Dock (Thumb-friendly, ≥48px touch targets) */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t border-slate-200/90 bg-white/95 backdrop-blur-lg shadow-2xl shadow-slate-900/10 pb-safe"
      >
        <div className="grid grid-cols-5 items-center justify-around px-1 py-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative flex flex-col items-center justify-center py-1.5 min-h-[48px] rounded-xl transition-all ${
                  isActive
                    ? 'text-indigo-600 font-bold'
                    : 'text-slate-500 hover:text-slate-800 font-medium'
                }`}
              >
                {isActive && (
                  <span className="absolute top-0.5 h-1 w-8 rounded-full bg-indigo-600" />
                )}
                <Icon className={`h-5 w-5 mb-0.5 ${isActive ? 'text-indigo-600 scale-105' : 'text-slate-500'}`} />
                <span className="text-[10px] tracking-tight leading-none truncate max-w-[62px]">
                  {link.shortLabel}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Organization Members Management Modal (RBAC) */}
      <ManageMembersModal
        isOpen={isManageMembersOpen}
        onClose={() => setIsManageMembersOpen(false)}
      />
    </>
  );
};

