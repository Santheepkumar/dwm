import { ActivityCategory, ApproverOption } from './types';

export const CATEGORIES: { key: ActivityCategory; label: string; icon: string; color: string; badgeClass: string }[] = [
  { key: 'candidate_sourcing', label: 'Candidate Sourcing', icon: 'UserCheck', color: 'blue', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' },
  { key: 'reports', label: 'Reports', icon: 'FileText', color: 'amber', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' },
  { key: 'statutory', label: 'Statutory', icon: 'ShieldCheck', color: 'purple', badgeClass: 'bg-purple-50 text-purple-700 border-purple-200' },
  { key: 'payroll', label: 'Payroll', icon: 'CreditCard', color: 'emerald', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { key: 'engagement', label: 'Engagement & Events', icon: 'Sparkles', color: 'rose', badgeClass: 'bg-rose-50 text-rose-700 border-rose-200' },
  { key: 'general', label: 'General Activity', icon: 'Briefcase', color: 'slate', badgeClass: 'bg-slate-50 text-slate-700 border-slate-200' },
];

export const CATEGORY_STAGES: Record<ActivityCategory, { key: string; label: string }[]> = {
  candidate_sourcing: [
    { key: 'sourcing', label: 'Candidate Sourcing' },
    { key: 'follow_up', label: 'Follow Up' },
    { key: 'expected_joining', label: 'Expected Joining' },
    { key: 'joining', label: 'Joining' },
  ],
  reports: [
    { key: 'yet_to_prepare', label: 'Yet to Prepare' },
    { key: 'processing', label: 'Processing' },
    { key: 'submitted_for_approval', label: 'Submitted for Approval' },
    { key: 'completed', label: 'Completed' },
  ],
  statutory: [
    { key: 'yet_to_prepare', label: 'Yet to Prepare' },
    { key: 'processing', label: 'Processing' },
    { key: 'submitted_for_approval', label: 'Submitted for Approval' },
    { key: 'completed', label: 'Completed' },
  ],
  payroll: [
    { key: 'addition', label: 'Addition (New Joinee)' },
    { key: 'deletion', label: 'Deletion (Deductions/Errors)' },
    { key: 'separation', label: 'Separation (FnF/Exit)' },
    { key: 'transfer', label: 'Transfer (Inter-dept/Branch)' },
  ],
  engagement: [
    { key: 'ideation', label: 'Ideation & Concept' },
    { key: 'planning', label: 'Event Planning' },
    { key: 'execution', label: 'Execution & Day-of' },
    { key: 'completed', label: 'Post-event & Feedback' },
  ],
  general: [
    { key: 'not_started', label: 'Not Started' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'review', label: 'Review' },
    { key: 'completed', label: 'Completed' },
  ],
};

export const TOP_LEVEL_APPROVERS: ApproverOption[] = [
  { id: 'app_1', name: 'Rajesh Sharma', role: 'Managing Director / CEO', department: 'Executive', email: 'rajesh.sharma@company.com' },
  { id: 'app_2', name: 'Meera Nambiar', role: 'VP - Human Resources', department: 'Human Resources', email: 'meera.nambiar@company.com' },
  { id: 'app_3', name: 'Anand Kulkarni', role: 'Chief Financial Officer (CFO)', department: 'Finance & Accounts', email: 'anand.kulkarni@company.com' },
  { id: 'app_4', name: 'Pooja Verma', role: 'Director - Operations', department: 'Operations', email: 'pooja.verma@company.com' },
  { id: 'app_5', name: 'Vikram Sengupta', role: 'Head of Legal & Statutory Compliance', department: 'Legal', email: 'vikram.sengupta@company.com' },
];

export const STATUS_LABELS: Record<string, { label: string; badgeClass: string }> = {
  planned: { label: 'Planned', badgeClass: 'bg-slate-100 text-slate-700 border-slate-300' },
  under_processing: { label: 'Under Processing', badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  waiting_approval: { label: 'Waiting for Approval', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' },
  completed: { label: 'Completed', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  postponed: { label: 'Postponed', badgeClass: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export const PRIORITY_LABELS: Record<string, { label: string; dotClass: string }> = {
  low: { label: 'Low', dotClass: 'bg-slate-400' },
  medium: { label: 'Medium', dotClass: 'bg-blue-500' },
  high: { label: 'High', dotClass: 'bg-amber-500' },
  urgent: { label: 'Urgent', dotClass: 'bg-rose-500' },
};
