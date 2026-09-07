import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  Award,
  Bell,
  BookOpen,
  Building2,
  Bus,
  Calendar,
  CheckSquare,
  ClipboardList,
  Clock,
  Database,
  FileText,
  Flame,
  GraduationCap,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  MapPin,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { visibleNavForRole } from '../../services/adminPermissions';
import type { AdminRole } from '../../services/adminAuth';

const ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  students: GraduationCap,
  faculty: UserCheck,
  departments: Building2,
  subjects: BookOpen,
  timetable: Clock,
  attendance: Activity,
  grades: Award,
  deadlines: CheckSquare,
  events: Calendar,
  facilities: MapPin,
  library: Database,
  transport: Bus,
  canteen: Flame,
  helpdesk: LifeBuoy,
  notifications: Bell,
  notices: FileText,
  users: Users,
  roles: ShieldCheck,
  activity: TrendingUp,
  ai: Sparkles,
};

interface AdminSidebarProps {
  role: AdminRole | null;
  userEmail: string;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onSignOut: () => void;
}

/**
 * Desktop-first admin navigation. Only modules the current role may access
 * are rendered (UI gating — RLS remains the data enforcer).
 */
export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  role,
  userEmail,
  mobileOpen,
  onCloseMobile,
  onSignOut,
}) => {
  const sections = visibleNavForRole(role);

  const body = (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-glow-sm">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-extrabold text-base tracking-tight text-white">CampusOS Admin</div>
          <p className="text-[11px] text-slate-400 font-medium truncate">Campus Operations & Intelligence</p>
        </div>
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.title ?? 'main'}>
            {section.title && (
              <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {section.title}
              </div>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = ICONS[item.icon] ?? ClipboardList;
                const isIndex = item.path === '/admin';
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={isIndex}
                    onClick={onCloseMobile}
                    className={({ isActive }) =>
                      `w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-glow-sm font-semibold'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {item.phase > 1 && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 border border-slate-700">
                        P{item.phase}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-slate-800/80 space-y-2">
        <div className="px-2 text-[11px] text-slate-500 truncate" title={userEmail}>
          {userEmail}
        </div>
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex flex-col w-64 bg-[#0A0E1A] border-r border-slate-800/80 sticky top-0 h-screen z-30 shrink-0">
        {body}
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/70" onClick={onCloseMobile} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-[#0A0E1A] border-r border-slate-800 shadow-2xl">
            {body}
          </aside>
        </div>
      )}
    </>
  );
};

export function AdminSidebarFallbackIcon(): React.ReactNode {
  return <AlertTriangle className="w-4 h-4" />;
}
