import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopbar } from './AdminTopbar';
import { useAdminSession } from './AdminSessionContext';

/**
 * Desktop-first admin layout. Rendered only inside AdminGuard, so a
 * verified administrative session is guaranteed here.
 */
export const AdminShell: React.FC = () => {
  const { role, session, signOut } = useAdminSession();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-campus-bg text-campus-text flex antialiased selection:bg-blue-600 selection:text-white">
      <AdminSidebar
        role={role}
        userEmail={session?.email ?? ''}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onSignOut={handleSignOut}
      />

      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <AdminTopbar role={role} onMenu={() => setMobileOpen(true)} onSignOut={handleSignOut} />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
