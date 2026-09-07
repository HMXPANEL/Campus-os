import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  getVerifiedAdminSession,
  signOutAdmin,
  type AdminRole,
  type VerifiedAdminSession,
} from '../../services/adminAuth';

export type AdminSessionStatus = 'loading' | 'authed' | 'denied';

interface AdminSessionValue {
  status: AdminSessionStatus;
  session: VerifiedAdminSession | null;
  role: AdminRole | null;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AdminSessionContext = createContext<AdminSessionValue>({
  status: 'loading',
  session: null,
  role: null,
  refresh: () => Promise.resolve(),
  signOut: () => Promise.resolve(),
});

export const useAdminSession = (): AdminSessionValue => useContext(AdminSessionContext);

/**
 * Verifies the Supabase session + administrative role once per mount and
 * exposes the result to the whole /admin branch. Anything unverifiable
 * resolves to `denied` (fail closed).
 */
export const AdminSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<AdminSessionStatus>('loading');
  const [session, setSession] = useState<VerifiedAdminSession | null>(null);

  const refresh = useCallback(async () => {
    setStatus('loading');
    const verified = await getVerifiedAdminSession();
    if (verified) {
      setSession(verified);
      setStatus('authed');
    } else {
      setSession(null);
      setStatus('denied');
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signOut = useCallback(async () => {
    await signOutAdmin();
    setSession(null);
    setStatus('denied');
  }, []);

  return (
    <AdminSessionContext.Provider
      value={{ status, session, role: session?.role ?? null, refresh, signOut }}
    >
      {children}
    </AdminSessionContext.Provider>
  );
};
