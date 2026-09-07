import React from 'react';
import { useAdminSession } from './AdminSessionContext';
import { roleCanAccess } from '../../services/adminPermissions';
import type { AdminRole } from '../../services/adminAuth';

interface RoleGateProps {
  allow: readonly AdminRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Renders `children` only when the verified admin session holds one of the
 * `allow` roles. This gates UI visibility; data access remains enforced by
 * RLS on the backend regardless of what is rendered.
 */
export const RoleGate: React.FC<RoleGateProps> = ({ allow, children, fallback = null }) => {
  const { status, role } = useAdminSession();
  if (status !== 'authed' || !roleCanAccess(role, allow)) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
};
