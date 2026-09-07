import React, { useEffect, useState } from 'react';
import { 
  Bell, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Clock 
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../services/supabaseClient';
import { useAdminSession } from './AdminSessionContext';

interface NotificationItem {
  id: string;
  student_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  action_url: string | null;
  created_at: string;
}

export const AdminNotifications: React.FC = () => {
  const { role } = useAdminSession();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Broadcast Form State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('general');
  const [targetStudentId, setTargetStudentId] = useState('all');
  const [sending, setSending] = useState(false);
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
      const [notifRes, studRes] = await Promise.all([
        supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(30),
        supabase.from('profiles').select('id, full_name, email').eq('role', 'student'),
      ]);

      if (notifRes.error) throw notifRes.error;
      setNotifications(notifRes.data ?? []);
      setStudents(studRes.data ?? []);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setSending(true);
    setFeedback(null);
    try {
      const recipients =
        targetStudentId === 'all'
          ? students.map((s) => s.id)
          : [targetStudentId];

      const rows = recipients.map((sId) => ({
        student_id: sId,
        title: title.trim(),
        message: message.trim(),
        type,
        is_read: false,
        action_url: null,
      }));

      const { error: insErr } = await supabase.from('notifications').insert(rows);
      if (insErr) throw insErr;

      setFeedback(`Broadcast delivered to ${recipients.length} student accounts!`);
      setTitle('');
      setMessage('');
      await fetchData();
    } catch (e: any) {
      setError(e.message ?? 'Failed to broadcast notification');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
            <Bell className="w-4 h-4" />
            <span>Alert Dispatch</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">Push Notifications</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time push alerts, academic reminders, and administrative broadcast triggers.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-rose-400 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Broadcast Form */}
        {(role === 'admin' || role === 'staff' || role === 'vice_principal') && (
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-blue-400" />
              <span>Broadcast Notification</span>
            </h3>

            {feedback && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{feedback}</span>
              </div>
            )}

            <form onSubmit={handleBroadcast} className="space-y-3.5">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Target Recipients</label>
                <select
                  value={targetStudentId}
                  onChange={(e) => setTargetStudentId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="all">Broadcast to All Students ({students.length})</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Notification Category</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="attendance">Attendance Alert</option>
                  <option value="deadline">Academic Deadline</option>
                  <option value="ticket">Helpdesk Update</option>
                  <option value="event">Campus Event</option>
                  <option value="general">General Notice</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Alert Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Mandatory Lab Attendance Today"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Message Body</label>
                <textarea
                  required
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Brief message text..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 shadow-glow-sm"
              >
                {sending ? 'Dispatching…' : 'Send Push Alert'}
              </button>
            </form>
          </div>
        )}

        {/* Notifications Feed */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-blue-400" />
            <span>Recent Notification Log ({notifications.length})</span>
          </h3>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-500">
              <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-2" />
              Loading alerts...
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1 text-xs hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                        {n.type}
                      </span>
                      <span>{n.title}</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(n.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed">{n.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
