import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAdminSession } from './AdminSessionContext';
import { decideAdminAccess } from '../../services/adminPermissions';

/**
 * Layout-route guard for the entire /admin branch (except /admin/login).
 * Backend truth comes from Supabase Auth + the profiles role lookup;
 * this component only routes on that verified result. Students typing an
 * admin URL manually always land back on the Student portal.
 */
export const AdminGuard: React.FC = () => {
  const { status, role } = useAdminSession();
  const location = useLocation();

  const decision = decideAdminAccess({ status, role, pathname: location.pathname });

  if (decision === 'pending') {
    return (
      <div className="min-h-screen bg-campus-bg flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400 text-sm">
          <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <span>Verifying administrator session…</span>
        </div>
      </div>
    );
  }

  if (decision === 'to-login') {
    return <Navigate to="/admin/login" replace />;
  }

  if (decision === 'to-student') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
