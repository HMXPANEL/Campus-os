import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  Search, 
  AlertCircle, 
  RefreshCw 
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../services/supabaseClient';

interface ActivityLog {
  id: string;
  actor_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata: any;
  created_at: string;
}

export const AdminActivity: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    if (!isSupabaseConfigured || !supabase) {
      setError('Supabase backend not configured');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: aErr } = await supabase
        .from('admin_activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (aErr) throw aErr;
      setLogs(data ?? []);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchLogs();
  }, []);

  const filteredLogs = logs.filter((l) =>
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.entity_type.toLowerCase().includes(search.toLowerCase()) ||
    JSON.stringify(l.metadata ?? {}).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
            <TrendingUp className="w-4 h-4" />
            <span>Audit & Compliance</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">Admin Activity Log</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Immutable audit trail tracking administrative mutations and operations.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Filter audit events by action, entity, or payload..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-rose-400 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="glass-panel rounded-2xl border border-slate-800 p-12 text-center">
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Loading audit log from Supabase...</p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 font-mono border-b border-slate-800">
                <tr>
                  <th className="p-3.5 font-semibold">Action</th>
                  <th className="p-3.5 font-semibold">Entity Type</th>
                  <th className="p-3.5 font-semibold">Actor ID</th>
                  <th className="p-3.5 font-semibold">Metadata Details</th>
                  <th className="p-3.5 font-semibold text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500 font-sans">
                      No audit events recorded yet. Mutations to tickets, roles, and attendance will appear here.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20">
                          {l.action}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-300">{l.entity_type}</td>
                      <td className="p-3.5 text-slate-500 text-[11px] truncate max-w-[120px]">
                        {l.actor_id}
                      </td>
                      <td className="p-3.5 text-slate-400 text-[11px]">
                        <pre className="inline bg-slate-950 px-2 py-1 rounded border border-slate-800/80">
                          {JSON.stringify(l.metadata)}
                        </pre>
                      </td>
                      <td className="p-3.5 text-right text-slate-400">
                        {new Date(l.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
