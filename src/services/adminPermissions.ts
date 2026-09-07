import type { AdminRole } from './adminAuth';

/**
 * Permission matrix for the Admin Portal (source: admin.md §4).
 * Enforcement happens in TWO places: AdminGuard/RoleGate in the UI and
 * RLS policies in Supabase. This file only describes who may SEE a module;
 * data access itself is always constrained by RLS on the backend.
 */

const ALL: readonly AdminRole[] = ['admin', 'vice_principal', 'faculty', 'staff', 'maintenance'];
const LEADERSHIP: readonly AdminRole[] = ['admin', 'vice_principal'];
const ACADEMIC: readonly AdminRole[] = ['admin', 'vice_principal', 'faculty'];
const OPERATIONS: readonly AdminRole[] = ['admin', 'vice_principal', 'staff'];
const SUPPORT: readonly AdminRole[] = ['admin', 'vice_principal', 'staff', 'maintenance', 'faculty'];
const ADMIN_ONLY: readonly AdminRole[] = ['admin'];

export interface AdminNavItem {
  path: string;
  label: string;
  icon: string;
  allowedRoles: readonly AdminRole[];
  phase: number;
}

export interface AdminNavSection {
  title: string | null;
  items: AdminNavItem[];
}

/** Single source of truth for admin navigation + per-route authorization. */
export const ADMIN_NAV: AdminNavSection[] = [
  {
    title: null,
    items: [{ path: '/admin', label: 'Dashboard', icon: 'dashboard', allowedRoles: ALL, phase: 1 }],
  },
  {
    title: 'Academic',
    items: [
      { path: '/admin/students', label: 'Students', icon: 'students', allowedRoles: ACADEMIC, phase: 4 },
      { path: '/admin/faculty', label: 'Faculty', icon: 'faculty', allowedRoles: LEADERSHIP, phase: 4 },
      { path: '/admin/departments', label: 'Departments', icon: 'departments', allowedRoles: LEADERSHIP, phase: 4 },
      { path: '/admin/subjects', label: 'Subjects', icon: 'subjects', allowedRoles: LEADERSHIP, phase: 4 },
      { path: '/admin/timetable', label: 'Timetable', icon: 'timetable', allowedRoles: ACADEMIC, phase: 6 },
      { path: '/admin/attendance', label: 'Attendance', icon: 'attendance', allowedRoles: ACADEMIC, phase: 5 },
      { path: '/admin/grades', label: 'Grades', icon: 'grades', allowedRoles: ACADEMIC, phase: 5 },
      { path: '/admin/deadlines', label: 'Deadlines', icon: 'deadlines', allowedRoles: ACADEMIC, phase: 4 },
    ],
  },
  {
    title: 'Campus',
    items: [
      { path: '/admin/events', label: 'Events', icon: 'events', allowedRoles: OPERATIONS, phase: 7 },
      { path: '/admin/facilities', label: 'Facilities', icon: 'facilities', allowedRoles: [...OPERATIONS, 'maintenance'], phase: 7 },
      { path: '/admin/library', label: 'Library', icon: 'library', allowedRoles: OPERATIONS, phase: 7 },
      { path: '/admin/transport', label: 'Transport', icon: 'transport', allowedRoles: OPERATIONS, phase: 7 },
      { path: '/admin/canteen', label: 'Canteen', icon: 'canteen', allowedRoles: OPERATIONS, phase: 7 },
    ],
  },
  {
    title: 'Support',
    items: [
      { path: '/admin/helpdesk', label: 'Helpdesk', icon: 'helpdesk', allowedRoles: SUPPORT, phase: 8 },
      { path: '/admin/notifications', label: 'Notifications', icon: 'notifications', allowedRoles: OPERATIONS, phase: 7 },
      { path: '/admin/notices', label: 'Notices', icon: 'notices', allowedRoles: OPERATIONS, phase: 7 },
    ],
  },
  {
    title: 'Administration',
    items: [
      { path: '/admin/users', label: 'Admin Users', icon: 'users', allowedRoles: ADMIN_ONLY, phase: 9 },
      { path: '/admin/roles', label: 'Roles & Permissions', icon: 'roles', allowedRoles: ADMIN_ONLY, phase: 9 },
      { path: '/admin/activity', label: 'Activity Log', icon: 'activity', allowedRoles: ADMIN_ONLY, phase: 10 },
    ],
  },
  {
    title: 'Intelligence',
    items: [{ path: '/admin/ai', label: 'Admin AI', icon: 'ai', allowedRoles: ALL, phase: 11 }],
  },
];

/** Flat path → allowed-roles lookup used by AdminGuard. */
export const ROUTE_ROLES: Record<string, readonly AdminRole[]> = Object.fromEntries(
  ADMIN_NAV.flatMap((section) => section.items.map((item) => [item.path, item.allowedRoles] as const))
);

/** Flat path → owning implementation phase (for honest placeholders). */
export const ROUTE_PHASES: Record<string, number> = Object.fromEntries(
  ADMIN_NAV.flatMap((section) => section.items.map((item) => [item.path, item.phase] as const))
);

/** Strictest fallback: unknown admin paths are admin-only (fail closed). */
export function allowedRolesForPath(pathname: string): readonly AdminRole[] {
  return ROUTE_ROLES[pathname] ?? ADMIN_ONLY;
}

export type AdminAccessDecision = 'pending' | 'allow' | 'to-login' | 'to-student';

/**
 * Pure access-decision function (unit-tested in isolation; used by AdminGuard).
 *
 * - session still verifying            → 'pending'  (render spinner, leak nothing)
 * - no session / role unverifiable     → 'to-login' (fail closed)
 * - verified admin role, route allowed → 'allow'
 * - verified but wrong role (incl. students, who can never hold a
 *   verified admin session)            → 'to-student'
 */
export function decideAdminAccess(args: {
  status: 'loading' | 'authed' | 'denied';
  role: AdminRole | null;
  pathname: string;
}): AdminAccessDecision {
  if (args.status === 'loading') return 'pending';
  if (args.status === 'denied' || !args.role) return 'to-login';
  return roleCanAccess(args.role, allowedRolesForPath(args.pathname)) ? 'allow' : 'to-student';
}

/** True when the role may access a module gated by `allowed`. */
export function roleCanAccess(role: AdminRole | null, allowed: readonly AdminRole[]): boolean {
  if (!role) return false;
  return allowed.includes(role);
}

/** Navigation sections filtered to what `role` may see. */
export function visibleNavForRole(role: AdminRole | null): AdminNavSection[] {
  if (!role) return [];
  return ADMIN_NAV.map((section) => ({
    ...section,
    items: section.items.filter((item) => roleCanAccess(role, item.allowedRoles)),
  })).filter((section) => section.items.length > 0);
}
