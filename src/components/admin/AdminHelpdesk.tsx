import React, { useEffect, useState } from 'react';
import { 
  LifeBuoy, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ChevronRight, 
  X, 
  MapPin
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../services/supabaseClient';
import { useAdminSession } from './AdminSessionContext';

interface HelpdeskTicket {
  id: string;
  display_id: string;
  student_id: string;
  student_name: string;
  title: string;
  description: string;
  location: string;
  category: string;
  priority: string;
  status: 'Pending' | 'Assigned' | 'In Progress' | 'Resolved' | 'Closed';
  assignee_id: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

interface TimelineEntry {
  id: string;
  ticket_id: string;
  step: string;
  title: string;
  actor_name: string;
  created_at: string;
}

interface StaffMember {
  id: string;
  full_name: string;
  role: string;
  email: string;
}

export const AdminHelpdesk: React.FC = () => {
  const { role, session } = useAdminSession();
  const [tickets, setTickets] = useState<HelpdeskTicket[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Drawer / Triage state
  const [selectedTicket, setSelectedTicket] = useState<HelpdeskTicket | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [selectedAssignee, setSelectedAssignee] = useState<string>('');
  const [newStatus, setNewStatus] = useState<string>('');
  const [timelineNote, setTimelineNote] = useState<string>('');
  const [updating, setUpdating] = useState(false);
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
      let query = supabase.from('helpdesk_tickets').select('*').order('created_at', { ascending: false });

      // If role is maintenance, show only tickets assigned to them or unassigned
      if (role === 'maintenance' && session?.userId) {
        query = query.or(`assignee_id.eq.${session.userId},status.eq.Pending`);
      }

      const [tktRes, staffRes] = await Promise.all([
        query,
        supabase
          .from('profiles')
          .select('id, full_name, role, email')
          .in('role', ['staff', 'maintenance', 'admin']),
      ]);

      if (tktRes.error) throw tktRes.error;
      setTickets(tktRes.data ?? []);
      setStaffList(staffRes.data ?? []);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load helpdesk tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, [role, session]);

  const openTicketDrawer = async (ticket: HelpdeskTicket) => {
    setSelectedTicket(ticket);
    setSelectedAssignee(ticket.assignee_id ?? '');
    setNewStatus(ticket.status);
    setTimelineNote('');
    setFeedback(null);
    if (!supabase) return;

    try {
      const { data: tData } = await supabase
        .from('ticket_timeline')
        .select('*')
        .eq('ticket_id', ticket.id)
        .order('created_at', { ascending: true });
      setTimeline(tData ?? []);
    } catch (e) {
      console.warn('Could not load timeline:', e);
    }
  };

  const handleUpdateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !selectedTicket) return;
    setUpdating(true);
    setFeedback(null);
    try {
      const isClosing = newStatus === 'Closed' || newStatus === 'Resolved';
      const updates: any = {
        status: newStatus,
        assignee_id: selectedAssignee || null,
        updated_at: new Date().toISOString(),
      };
      if (isClosing) {
        updates.closed_at = new Date().toISOString();
      }

      const { error: updErr } = await supabase
        .from('helpdesk_tickets')
        .update(updates)
        .eq('id', selectedTicket.id);
      if (updErr) throw updErr;

      // Add timeline entry
      const actorName = session?.email ? session.email.split('@')[0] : 'Campus Admin';
      const stepTitle =
        timelineNote.trim() ||
        (newStatus !== selectedTicket.status
          ? `Status changed to ${newStatus}`
          : selectedAssignee !== selectedTicket.assignee_id
          ? 'Ticket reassigned'
          : 'Ticket updated');

      await supabase.from('ticket_timeline').insert({
        ticket_id: selectedTicket.id,
        step: newStatus,
        title: stepTitle,
        actor_name: actorName,
      });

      // Also log to admin_activity_log
      await supabase.from('admin_activity_log').insert({
        actor_id: session?.userId,
        action: 'UPDATE_TICKET',
        entity_type: 'helpdesk_ticket',
        entity_id: selectedTicket.id,
        metadata: {
          display_id: selectedTicket.display_id,
          status: newStatus,
          assignee_id: selectedAssignee,
        },
      });

      setFeedback('Ticket updated and timeline recorded!');
      await fetchData();
      // Refresh drawer
      const updatedTicket = { ...selectedTicket, ...updates };
      setSelectedTicket(updatedTicket);

      const { data: newTimeline } = await supabase
        .from('ticket_timeline')
        .select('*')
        .eq('ticket_id', selectedTicket.id)
        .order('created_at', { ascending: true });
      setTimeline(newTimeline ?? []);
    } catch (e: any) {
      setError(e.message ?? 'Failed to update ticket');
    } finally {
      setUpdating(false);
    }
  };

  const staffMap = Object.fromEntries(staffList.map((s) => [s.id, s.full_name]));

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.display_id.toLowerCase().includes(search.toLowerCase()) ||
      t.location.toLowerCase().includes(search.toLowerCase()) ||
      t.student_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <LifeBuoy className="w-4 h-4" />
            <span>Campus Operations</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">Helpdesk & Maintenance</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Issue triage, technician dispatch, live status workflow, and transparent audit trails.
          </p>
        </div>
        <div className="text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-2">
          <span>Active Tickets:</span>
          <span className="font-mono font-bold text-amber-400">
            {tickets.filter((t) => t.status !== 'Resolved' && t.status !== 'Closed').length}
          </span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search tickets by ID, room, issue, or student..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex items-center gap-1 overflow-x-auto">
          {['all', 'Pending', 'Assigned', 'In Progress', 'Resolved', 'Closed'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {st === 'all' ? 'All Tickets' : st}
            </button>
          ))}
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
          <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Loading tickets from Supabase...</p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 font-mono border-b border-slate-800">
                <tr>
                  <th className="p-3.5 font-semibold">Ticket</th>
                  <th className="p-3.5 font-semibold">Location</th>
                  <th className="p-3.5 font-semibold">Reported By</th>
                  <th className="p-3.5 font-semibold">Priority</th>
                  <th className="p-3.5 font-semibold">Assignee</th>
                  <th className="p-3.5 font-semibold">Status</th>
                  <th className="p-3.5 font-semibold text-right">Triage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      No helpdesk tickets found.
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((t) => {
                    const statusBg =
                      t.status === 'Pending'
                        ? 'bg-amber-500/15 text-amber-400 border-amber-500/25'
                        : t.status === 'Assigned'
                        ? 'bg-purple-500/15 text-purple-400 border-purple-500/25'
                        : t.status === 'In Progress'
                        ? 'bg-blue-500/15 text-blue-400 border-blue-500/25'
                        : t.status === 'Resolved'
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
                        : 'bg-slate-800 text-slate-400 border-slate-700';

                    return (
                      <tr
                        key={t.id}
                        onClick={() => openTicketDrawer(t)}
                        className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                      >
                        <td className="p-3.5 font-sans">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span className="font-mono text-blue-400">{t.display_id}</span>
                            <span>&bull;</span>
                            <span>{t.title}</span>
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono">{t.category}</span>
                        </td>
                        <td className="p-3.5 text-slate-300 font-sans">{t.location}</td>
                        <td className="p-3.5 text-slate-300 font-sans">{t.student_name}</td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              t.priority === 'High'
                                ? 'bg-rose-500/15 text-rose-400 border-rose-500/25'
                                : 'bg-slate-900 text-slate-400 border-slate-800'
                            }`}
                          >
                            {t.priority}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-300 font-sans">
                          {t.assignee_id ? staffMap[t.assignee_id] ?? 'Assigned' : 'Unassigned'}
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusBg}`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right font-sans">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-400 hover:text-blue-300">
                            <span>Triage</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Triage Slide-Over Drawer */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-slate-950 border-l border-slate-800 h-full overflow-y-auto p-6 space-y-6 shadow-2xl">
            {/* Drawer Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-blue-400 text-sm">
                    {selectedTicket.display_id}
                  </span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {selectedTicket.category}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white mt-1">{selectedTicket.title}</h2>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Reported by {selectedTicket.student_name}
                </p>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Location</span>
                <span className="font-bold text-white mt-0.5 block flex items-center gap-1 font-sans">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  {selectedTicket.location}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Priority</span>
                <span className="font-bold text-rose-400 mt-0.5 block">{selectedTicket.priority}</span>
              </div>
            </div>

            {/* Description */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1 text-xs">
              <span className="text-slate-400 font-medium block">Issue Description</span>
              <p className="text-white leading-relaxed">{selectedTicket.description}</p>
            </div>

            {feedback && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{feedback}</span>
              </div>
            )}

            {/* Triage Action Form */}
            {(role === 'admin' || role === 'staff' || role === 'maintenance') && (
              <form onSubmit={handleUpdateTicket} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Update Dispatch & Status
                </h3>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Assign Technician / Staff</label>
                  <select
                    value={selectedAssignee}
                    onChange={(e) => setSelectedAssignee(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Unassigned</option>
                    {staffList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.full_name} ({s.role.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Workflow Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Assigned">Assigned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Audit Note (Optional)</label>
                  <input
                    type="text"
                    value={timelineNote}
                    onChange={(e) => setTimelineNote(e.target.value)}
                    placeholder="e.g. Dispatched technician to check compressor..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={updating}
                  className="w-full py-2 px-4 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 shadow-glow-sm"
                >
                  {updating ? 'Saving Changes…' : 'Update Ticket & Record Audit'}
                </button>
              </form>
            )}

            {/* Audit Trail Timeline */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-400" />
                <span>Ticket Lifecycle Audit Trail</span>
              </h3>

              <div className="space-y-2 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                {timeline.map((entry) => (
                  <div
                    key={entry.id}
                    className="relative pl-7 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs"
                  >
                    <div className="absolute left-2 top-3 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-blue-500/20" />
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{entry.title}</span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">by {entry.actor_name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
