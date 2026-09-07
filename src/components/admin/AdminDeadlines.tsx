import React, { useEffect, useState } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Calendar, 
  AlertCircle, 
  X, 
  CheckCircle2 
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../services/supabaseClient';
import { useAdminSession } from './AdminSessionContext';

interface Deadline {
  id: string;
  title: string;
  category: string;
  due_date_text: string;
  due_at: string | null;
  priority: string;
  status: string;
  subject_code: string | null;
}

export const AdminDeadlines: React.FC = () => {
  const { role } = useAdminSession();
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDeadline, setEditingDeadline] = useState<Deadline | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Assignment');
  const [dueDateText, setDueDateText] = useState('Tomorrow, 11:59 PM');
  const [priority, setPriority] = useState('High');
  const [subjectCode, setSubjectCode] = useState('CS302');
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
      const { data, error: dErr } = await supabase
        .from('deadlines')
        .select('*')
        .order('created_at', { ascending: false });
      if (dErr) throw dErr;
      setDeadlines(data ?? []);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load deadlines');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingDeadline(null);
    setTitle('');
    setCategory('Assignment');
    setDueDateText('Tomorrow, 11:59 PM');
    setPriority('High');
    setSubjectCode('CS302');
    setFeedback(null);
    setModalOpen(true);
  };

  const openEditModal = (d: Deadline) => {
    setEditingDeadline(d);
    setTitle(d.title);
    setCategory(d.category);
    setDueDateText(d.due_date_text);
    setPriority(d.priority);
    setSubjectCode(d.subject_code ?? '');
    setFeedback(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setSaving(true);
    setFeedback(null);
    try {
      const payload = {
        title: title.trim(),
        category,
        due_date_text: dueDateText.trim(),
        priority,
        subject_code: subjectCode.trim() || null,
        status: 'Pending',
      };

      if (editingDeadline) {
        const { error: updErr } = await supabase
          .from('deadlines')
          .update(payload)
          .eq('id', editingDeadline.id);
        if (updErr) throw updErr;
      } else {
        const { error: insErr } = await supabase.from('deadlines').insert(payload);
        if (insErr) throw insErr;
      }

      setFeedback('Deadline saved successfully!');
      setTimeout(() => setModalOpen(false), 1200);
      await fetchData();
    } catch (e: any) {
      setError(e.message ?? 'Failed to save deadline');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!supabase || !window.confirm('Delete this deadline?')) return;
    try {
      const { error: delErr } = await supabase.from('deadlines').delete().eq('id', id);
      if (delErr) throw delErr;
      await fetchData();
    } catch (e: any) {
      setError(e.message ?? 'Failed to delete deadline');
    }
  };

  const filteredDeadlines = deadlines.filter((d) => {
    const matchesSearch = d.title.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'All' || d.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
            <CheckSquare className="w-4 h-4" />
            <span>Academic Milestones</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">Deadlines & Deliverables</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Assignment submissions, form deadlines, and library book return dates.
          </p>
        </div>
        {(role === 'admin' || role === 'faculty' || role === 'vice_principal') && (
          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 shadow-glow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Deadline</span>
          </button>
        )}
      </div>

      {/* Filter and Search */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search deadlines by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex items-center gap-1 overflow-x-auto">
          {['All', 'Assignment', 'Book', 'Form', 'Event'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat}
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
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Loading deadlines from Supabase...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDeadlines.map((d) => (
            <div
              key={d.id}
              className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                      {d.category}
                    </span>
                    {d.priority === 'High' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/25">
                        High Priority
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-white">{d.title}</h3>
                  <p className="text-xs text-slate-400 font-mono flex items-center gap-1.5 mt-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-400" />
                    <span>{d.due_date_text}</span>
                  </p>
                </div>

                {(role === 'admin' || role === 'faculty' || role === 'vice_principal') && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(d)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(d.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                {editingDeadline ? 'Edit Deadline' : 'Add New Deadline'}
              </h3>
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

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Deliverable Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. DBMS Assignment 3"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="Assignment">Assignment</option>
                    <option value="Book">Book</option>
                    <option value="Form">Form</option>
                    <option value="Event">Event</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Due Date Text</label>
                <input
                  type="text"
                  required
                  value={dueDateText}
                  onChange={(e) => setDueDateText(e.target.value)}
                  placeholder="Tomorrow, 11:59 PM"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
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
                  {saving ? 'Saving…' : 'Save Deadline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
