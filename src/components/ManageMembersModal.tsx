'use client';

import React, { useState } from 'react';
import { X, Users, UserPlus, Trash2, Shield, Briefcase, Mail, Building, Key, Eye, EyeOff, Sparkles, CheckCircle2, Copy } from 'lucide-react';
import { UserRole } from '@/lib/types';
import { useTenant } from '@/context/TenantContext';

interface ManageMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ManageMembersModal: React.FC<ManageMembersModalProps> = ({ isOpen, onClose }) => {
  const { currentTenant, tenantMembers, addMember, removeMember, isSuperAdmin } = useTenant();

  const [isAdding, setIsAdding] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('member');
  const [department, setDepartment] = useState('Operations');
  const [designation, setDesignation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<{ email: string; pass: string; name: string; role: string } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let generated = 'Dwm!';
    for (let i = 0; i < 8; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(generated);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userEmail.trim()) {
      setError('Please provide member name and email.');
      return;
    }

    if (password && password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const usedPassword = password || `Dwm${Math.floor(100000 + Math.random() * 900000)}!`;
      await addMember({
        userName: userName.trim(),
        userEmail: userEmail.trim().toLowerCase(),
        password: usedPassword,
        role,
        department: department.trim() || 'Operations',
        designation: designation.trim() || 'Team Member',
      });

      setSuccessNotice({
        email: userEmail.trim().toLowerCase(),
        pass: usedPassword,
        name: userName.trim(),
        role,
      });

      setUserName('');
      setUserEmail('');
      setPassword('');
      setRole('member');
      setDepartment('Operations');
      setDesignation('');
      setIsAdding(false);
    } catch (err: any) {
      setError(err.message || 'Failed to add member');
    } finally {
      setSubmitting(false);
    }
  };

  const copyCredentials = () => {
    if (!successNotice) return;
    navigator.clipboard.writeText(
      `DWM Login Credentials:\nEmail: ${successNotice.email}\nPassword: ${successNotice.pass}\nURL: ${window.location.origin}/login`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const getRoleBadge = (memberRole: string) => {
    switch (memberRole) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'admin':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'manager':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'approver':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-hidden animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200/90 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Organization Team Members
              </h3>
              <p className="text-xs text-slate-500">
                {currentTenant?.name || 'Current Organization'} • Role-Based Access Control (RBAC)
              </p>
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
              ⚠️ {error}
            </div>
          )}

          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Members ({tenantMembers.length})
            </span>
            {!isAdding && (
              <button
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-all cursor-pointer shadow-xs"
                data-testid="add-member-toggle-btn"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Add Member</span>
              </button>
            )}
          </div>

          {/* Add Member Form */}
          {isAdding && (
            <form onSubmit={handleAddMember} className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                  <UserPlus className="h-3.5 w-3.5 text-indigo-600" />
                  Add New Organization Member
                </span>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="e.g. Priyan Sharma"
                    className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs focus:border-indigo-500 focus:outline-hidden"
                    data-testid="member-name-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="priyan@acmecorp.com"
                    className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs focus:border-indigo-500 focus:outline-hidden"
                    data-testid="member-email-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Organization Role *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs focus:border-indigo-500 focus:outline-hidden"
                    data-testid="member-role-select"
                  >
                    <option value="member">Member (Logs work & executes tasks)</option>
                    <option value="manager">Manager (Plans activities & oversees pipeline)</option>
                    <option value="approver">Approver (Reviews & approves requests)</option>
                    <option value="admin">Admin (Manages organization members & settings)</option>
                    {isSuperAdmin && (
                      <option value="super_admin">Super Admin (Global access)</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. HR / Payroll / Finance"
                    className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1">
                      <Key className="h-3 w-3 text-indigo-600" />
                      <span>Initial Login Password</span>
                      <span className="text-[10px] text-slate-400 font-normal">(optional, min 8 chars)</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                    >
                      <Sparkles className="h-3 w-3" />
                      <span>Generate</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password or leave blank to auto-generate"
                      minLength={8}
                      className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 pr-9 text-xs focus:border-indigo-500 focus:outline-hidden font-mono"
                      data-testid="member-password-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  <p className="mt-1 text-[10px] text-slate-500">
                    ⚡ Automated 1-Step Provisioning: Creates both an Appwrite Auth account and tenant membership.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200/60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
                  data-testid="submit-member-btn"
                >
                  {submitting ? 'Creating Account...' : 'Add Member & Create Account'}
                </button>
              </div>
            </form>
          )}

          {/* Success Credentials Banner */}
          {successNotice && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200" data-testid="member-credentials-notice">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Account & Membership Created Successfully!</span>
                </div>
                <button
                  onClick={() => setSuccessNotice(null)}
                  className="text-emerald-700 hover:text-emerald-900 p-0.5 rounded-md"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="bg-white/80 rounded-lg p-2.5 border border-emerald-200/60 flex items-center justify-between text-xs">
                <div className="space-y-0.5 font-mono text-[11px]">
                  <div><span className="text-slate-500 font-sans">User:</span> <strong className="text-slate-800">{successNotice.name}</strong> ({successNotice.role})</div>
                  <div><span className="text-slate-500 font-sans">Email:</span> <strong className="text-slate-900">{successNotice.email}</strong></div>
                  <div><span className="text-slate-500 font-sans">Password:</span> <strong className="text-indigo-700">{successNotice.pass}</strong></div>
                </div>
                <button
                  type="button"
                  onClick={copyCredentials}
                  className="flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-700 transition-colors shadow-2xs cursor-pointer shrink-0"
                >
                  <Copy className="h-3 w-3" />
                  <span>{copied ? 'Copied!' : 'Copy Credentials'}</span>
                </button>
              </div>
              <p className="text-[10px] text-emerald-800">
                Share these credentials with the team member so they can immediately sign in at <code className="font-mono bg-emerald-100 px-1 py-0.5 rounded">/login</code>.
              </p>
            </div>
          )}

          {/* Members List */}
          <div className="space-y-2">
            {tenantMembers.map((member) => (
              <div
                key={member.id || member.$id}
                className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 hover:bg-white transition-colors"
                data-testid={`member-row-${member.userEmail}`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-800 font-bold text-xs uppercase shadow-2xs">
                    {member.userName.slice(0, 2) || 'U'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 text-xs sm:text-sm">
                        {member.userName}
                      </span>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getRoleBadge(member.role)}`}>
                        {member.role.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        <span>{member.userEmail}</span>
                      </span>
                      {member.department && (
                        <span className="flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          <span>{member.department}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {member.role !== 'super_admin' && (
                  <button
                    onClick={() => removeMember(member.id || member.$id || '')}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                    title="Remove Member"
                    aria-label="Remove Member"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3.5 border-t border-slate-100 bg-slate-50/70 rounded-b-2xl">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-300 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
