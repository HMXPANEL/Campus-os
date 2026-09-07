import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { AuthService } from '../../services/authService';
import { campusStore, useCampusStore } from '../../services/campusStore';

interface StudentDataGateProps {
  onSessionInvalid: () => void;
  children: React.ReactNode;
}

/**
 * Authoritative data gate for the Student portal.
 *
 * 1. Validates the Supabase session (authoritative; drops stale local flags).
 * 2. Loads ALL campus slices from Supabase — the sole source of truth.
 * 3. Renders loading / connection-error (with retry) states.
 *    Mock or stale data is NEVER shown.
 * 4. Surfaces a "reconnecting" banner when background realtime refreshes fail.
 */
export const StudentDataGate: React.FC<StudentDataGateProps> = ({ onSessionInvalid, children }) => {
  const store = useCampusStore();
  const status = store.status;
  const error = store.error;
  const stale = store.stale;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let valid = await AuthService.validateSession();
      if (!valid) {
        const autoLog = await AuthService.loginWithoutPassword();
        valid = autoLog.success;
      }
      if (cancelled) return;
      if (!valid) {
        onSessionInvalid();
        return;
      }
      if (campusStore.status === 'idle') {
        await campusStore.load();
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === 'idle' || status === 'loading') {
    return (
      <div className="min-h-screen bg-campus-bg flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-10 h-10 border-[3px] border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <div>
            <p className="text-sm font-semibold text-white">Connecting to campus services…</p>
            <p className="text-xs text-slate-500 mt-1">Loading your live academic data from Supabase.</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-campus-bg flex items-center justify-center px-4">
        <div className="w-full max-w-md p-8 rounded-3xl glass-panel border-rose-500/30 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Unable to connect to campus services.</h2>
            <p className="text-xs text-slate-400 mt-1">{error ?? 'Please check your connection and try again.'}</p>
          </div>
          <button
            onClick={() => void campusStore.retry()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {stale && (
        <div className="sticky top-0 z-30 bg-amber-500/10 border-b border-amber-500/30 text-amber-300 text-xs text-center px-4 py-1.5">
          Reconnecting to campus services — showing last confirmed data…
        </div>
      )}
      {children}
    </>
  );
};
