import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, LogOut, Menu, ShieldCheck } from 'lucide-react';
import type { AdminRole } from '../../services/adminAuth';

interface AdminTopbarProps {
  role: AdminRole | null;
  onMenu: () => void;
  onSignOut: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Main Admin',
  vice_principal: 'Vice Principal',
  faculty: 'Teacher',
  staff: 'Staff',
  maintenance: 'Maintenance',
};

export const AdminTopbar: React.FC<AdminTopbarProps> = ({ role, onMenu, onSignOut }) => {
  return (
    <header className="sticky top-0 z-20 h-16 bg-[#080C14]/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenu}
          className="lg:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 min-w-0">
          <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
          <span className="text-sm font-semibold text-slate-200 truncate">Admin Console</span>
          {role && (
            <span className="hidden sm:inline text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold uppercase tracking-wider">
              {ROLE_LABELS[role] ?? role}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link
          to="/"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 text-xs transition-colors"
          title="Back to Student portal"
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Student Portal</span>
        </Link>
        <button
          onClick={onSignOut}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-300 hover:border-rose-500/40 transition-colors"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
