import React, { useEffect, useState } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Pin, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  X
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../services/supabaseClient';
import { useAdminSession } from './AdminSessionContext';

interface Notice {
  id: string;
  title: string;
  body: string;
  audience: string;
  published_by: string;
  published_at: string;
  expires_at: string | null;
  is_pinned: boolean;
  audience_department_id: string | null;
  audience_semester: string | null;
  audience_section: string | null;
  scheduled_at: string | null;
}

export const AdminNotices: React.FC = () => {
  const { role } = useAdminSession();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Create Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetScope, setTargetScope] = useState<'all' | 'dept' | 'sem' | 'sec'>('all');
  const [deptId, setDeptId] = useState('');
  const [semester, setSemester] = useState('Semester 5');
  const [section, setSection] = useState('A');
  const [isPinned, setIsPinned] = useState(false);
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
      const [noticesRes, deptsRes] = await Promise.all([
        supabase.from('notices').select('*').order('is_pinned', { ascending: false }).order('published_at', { ascending: false }),
        supabase.from('departments').select('id, code, name'),
      ]);

      if (noticesRes.error) throw noticesRes.error;
      setNotices(noticesRes.data ?? []);
      setDepartments(deptsRes.data ?? []);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load notices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setSaving(true);
    setFeedback(null);
    try {
      const payload: any = {
        title: title.trim(),
        body: body.trim(),
        audience: targetScope === 'all' ? 'all' : targetScope,
        published_by: 'Registrar Office',
        published_at: new Date().toISOString(),
        is_pinned: isPinned,
        audience_department_id: targetScope === 'dept' ? deptId : null,
        audience_semester: targetScope === 'sem' ? semester : null,
        audience_section: targetScope === 'sec' ? section : null,
      };

      const { error: insErr } = await supabase.from('notices').insert(payload);
      if (insErr) throw insErr;

      setFeedback('Notice published and broadcast to students!');
      setTimeout(() => setModalOpen(false), 1200);
      await fetchData();
    } catch (e: any) {
      setError(e.message ?? 'Failed to publish notice');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!supabase || !window.confirm('Delete this notice?')) return;
    try {
      const { error: delErr } = await supabase.from('notices').delete().eq('id', id);
      if (delErr) throw delErr;
      await fetchData();
    } catch (e: any) {
      setError(e.message ?? 'Failed to delete notice');
    }
  };

  const deptMap = Object.fromEntries(departments.map((d) => [d.id, d.name]));

  const filteredNotices = notices.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.body.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
            <FileText className="w-4 h-4" />
            <span>Campus Broadcasts</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">Official Circulars & Notices</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Targeted announcements with department, semester, and section-specific visibility.
          </p>
        </div>
        {(role === 'admin' || role === 'staff' || role === 'vice_principal') && (
          <button
            onClick={() => {
              setTitle('');
              setBody('');
              setTargetScope('all');
              setDeptId(departments[0]?.id ?? '');
              setIsPinned(false);
              setFeedback(null);
              setModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 shadow-glow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Publish Notice</span>
          </button>
        )}
      </div>

      {/* Search */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search circulars by title or content..."
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
          <p className="text-xs text-slate-400">Loading notices from Supabase...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNotices.map((n) => {
            const targetLabel =
              n.audience === 'all'
                ? 'All Students'
                : n.audience_department_id
                ? `Dept: ${deptMap[n.audience_department_id] ?? 'Special'}`
                : n.audience_semester
                ? `${n.audience_semester}`
                : n.audience_section
                ? `Section ${n.audience_section}`
                : 'General';

            return (
              <div
                key={n.id}
                className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3 hover:border-slate-700 transition-colors flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/25 font-bold">
                        {targetLabel}
                      </span>
                      {n.is_pinned && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/25 flex items-center gap-1">
                          <Pin className="w-3 h-3" />
                          <span>Pinned</span>
                        </span>
                      )}
                    </div>
                    {(role === 'admin' || role === 'staff') && (
                      <button
                        onClick={() => handleDelete(n.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-white leading-snug">{n.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{n.body}</p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>By {n.published_by}</span>
                  <span>{new Date(n.published_at).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Publish Official Notice</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {feedback && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{feedback}</span>
              </div>
            )}

            <form onSubmit={handleCreateNotice} className="space-y-3.5">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Notice Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. End-Term Exam Form Submission Extended"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Notice Content</label>
                <textarea
                  required
                  rows={4}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write official announcement details..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Target Audience</label>
                <select
                  value={targetScope}
                  onChange={(e) => setTargetScope(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="all">Entire Campus (All Students)</option>
                  <option value="dept">Specific Department</option>
                  <option value="sem">Specific Semester</option>
                  <option value="sec">Specific Section</option>
                </select>
              </div>

              {targetScope === 'dept' && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Select Department</label>
                  <select
                    value={deptId}
                    onChange={(e) => setDeptId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.code} — {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {targetScope === 'sem' && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Select Semester</label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    {['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6'].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              )}

              {targetScope === 'sec' && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Section</label>
                  <input
                    type="text"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    placeholder="A"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono uppercase"
                  />
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pinCheck"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-800 text-blue-600 focus:ring-0"
                />
                <label htmlFor="pinCheck" className="text-xs text-slate-300">
                  Pin to top of Student Dashboard
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
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
                  {saving ? 'Publishing…' : 'Publish Circular'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
