import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Search, 
  Edit2, 
  AlertCircle, 
  CheckCircle2, 
  X
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../services/supabaseClient';
import { useAdminSession } from './AdminSessionContext';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  department_id: string | null;
  phone: string | null;
  created_at: string;
}

export const AdminUsers: React.FC = () => {
  const { role: currentRole, session } = useAdminSession();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Role Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [assignedRole, setAssignedRole] = useState('staff');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchData = async () => {
    if (!isSupabaseConfigured || !supabase) {
      setError('Supabase backend not configured');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: uErr } = await supabase
        .from('profiles')
        .select('*')
        .neq('role', 'student')
        .order('full_name');

      if (uErr) throw uErr;
      setUsers(data ?? []);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load administrative users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const openEditModal = (u: UserProfile) => {
    setSelectedUser(u);
    setAssignedRole(u.role);
    setFeedback(null);
    setModalOpen(true);
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !selectedUser) return;
    setSaving(true);
    setFeedback(null);
    try {
      const { error: updErr } = await supabase
        .from('profiles')
        .update({ role: assignedRole })
        .eq('id', selectedUser.id);
      if (updErr) throw updErr;

      // Log in admin_activity_log
      await supabase.from('admin_activity_log').insert({
        actor_id: session?.userId,
        action: 'CHANGE_ROLE',
        entity_type: 'profile',
        entity_id: selectedUser.id,
        metadata: {
          previous_role: selectedUser.role,
          new_role: assignedRole,
          target_email: selectedUser.email,
        },
      });

      setFeedback('User role updated and logged to audit trail!');
      setTimeout(() => setModalOpen(false), 1200);
      await fetchData();
    } catch (e: any) {
      setError(e.message ?? 'Failed to update user role');
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter((u) =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
            <Users className="w-4 h-4" />
            <span>Identity & Access</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">Staff & Admin Users</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Role delegation, administrative privilege assignment, and account governance.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search users by name, email, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
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
          <p className="text-xs text-slate-400">Loading user directory from Supabase...</p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 font-mono border-b border-slate-800">
                <tr>
                  <th className="p-3.5 font-semibold">User</th>
                  <th className="p-3.5 font-semibold">Role</th>
                  <th className="p-3.5 font-semibold">Contact</th>
                  <th className="p-3.5 font-semibold">Created</th>
                  {currentRole === 'admin' && (
                    <th className="p-3.5 font-semibold text-right">Role Management</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredUsers.map((u) => {
                  const roleBadge =
                    u.role === 'admin'
                      ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                      : u.role === 'vice_principal'
                      ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                      : u.role === 'faculty'
                      ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                      : u.role === 'maintenance'
                      ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      : 'bg-slate-800 text-slate-300 border-slate-700';

                  return (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 font-sans">
                        <div className="font-bold text-white">{u.full_name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${roleBadge}`}>
                          {u.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-400">{u.phone ?? 'N/A'}</td>
                      <td className="p-3.5 text-slate-400">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      {currentRole === 'admin' && (
                        <td className="p-3.5 text-right font-sans">
                          <button
                            onClick={() => openEditModal(u)}
                            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors inline-flex items-center gap-1"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Change Role</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Modify User Role</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <span className="text-slate-400 block">Target Account</span>
              <span className="font-bold text-white mt-0.5 block">{selectedUser.full_name}</span>
              <span className="text-slate-500 font-mono text-[11px] block">{selectedUser.email}</span>
            </div>

            {feedback && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{feedback}</span>
              </div>
            )}

            <form onSubmit={handleSaveRole} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Administrative Role</label>
                <select
                  value={assignedRole}
                  onChange={(e) => setAssignedRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                >
                  <option value="admin">admin (Main Admin)</option>
                  <option value="vice_principal">vice_principal (Vice Principal)</option>
                  <option value="faculty">faculty (Teacher)</option>
                  <option value="staff">staff (Operational Staff)</option>
                  <option value="maintenance">maintenance (Facility Maintenance)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50"
                >
                  {saving ? 'Updating…' : 'Confirm Role Change'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
