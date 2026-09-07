import React, { useEffect, useState } from 'react';
import { 
  BookOpen, 
  Plus, 
  Search, 
  AlertCircle, 
  Edit2, 
  X, 
  CheckCircle2
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../services/supabaseClient';
import { useAdminSession } from './AdminSessionContext';

interface Subject {
  id: string;
  code: string;
  name: string;
  credits: number;
  department_id: string | null;
  semester_id: string | null;
}

interface Department {
  id: string;
  code: string;
  name: string;
}

interface Semester {
  id: string;
  name: string;
}

export const AdminSubjects: React.FC = () => {
  const { role } = useAdminSession();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [credits, setCredits] = useState(3);
  const [deptId, setDeptId] = useState('');
  const [semId, setSemId] = useState('');
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
      const [subRes, deptRes, semRes] = await Promise.all([
        supabase.from('subjects').select('*').order('code'),
        supabase.from('departments').select('id, code, name').order('code'),
        supabase.from('semesters').select('id, name').order('name'),
      ]);

      if (subRes.error) throw subRes.error;
      setSubjects(subRes.data ?? []);
      setDepartments(deptRes.data ?? []);
      setSemesters(semRes.data ?? []);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingSubject(null);
    setCode('');
    setName('');
    setCredits(3);
    setDeptId(departments[0]?.id ?? '');
    setSemId(semesters[0]?.id ?? '');
    setFeedback(null);
    setModalOpen(true);
  };

  const openEditModal = (sub: Subject) => {
    setEditingSubject(sub);
    setCode(sub.code);
    setName(sub.name);
    setCredits(sub.credits);
    setDeptId(sub.department_id ?? '');
    setSemId(sub.semester_id ?? '');
    setFeedback(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        credits: Number(credits),
        department_id: deptId || null,
        semester_id: semId || null,
      };

      if (editingSubject) {
        const { error: updErr } = await supabase
          .from('subjects')
          .update(payload)
          .eq('id', editingSubject.id);
        if (updErr) throw updErr;
      } else {
        const { error: insErr } = await supabase.from('subjects').insert(payload);
        if (insErr) throw insErr;
      }

      setFeedback('Course saved successfully!');
      setTimeout(() => setModalOpen(false), 1000);
      await fetchData();
    } catch (e: any) {
      setError(e.message ?? 'Failed to save subject');
    } finally {
      setSaving(false);
    }
  };

  const deptMap = Object.fromEntries(departments.map((d) => [d.id, d.name]));
  const semMap = Object.fromEntries(semesters.map((s) => [s.id, s.name]));

  const filteredSubjects = subjects.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase());
    const matchesDept = selectedDept === 'all' || s.department_id === selectedDept;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
            <BookOpen className="w-4 h-4" />
            <span>Academic Curriculum</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">Courses & Subjects</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Credit allocations, course codes, and departmental academic syllabi.
          </p>
        </div>
        {(role === 'admin' || role === 'vice_principal') && (
          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 shadow-glow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Course</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search courses by code or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.code} — {d.name}
            </option>
          ))}
        </select>
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
          <p className="text-xs text-slate-400">Loading courses from Supabase...</p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 font-mono border-b border-slate-800">
                <tr>
                  <th className="p-3.5 font-semibold">Course Code</th>
                  <th className="p-3.5 font-semibold">Subject Title</th>
                  <th className="p-3.5 font-semibold">Department</th>
                  <th className="p-3.5 font-semibold">Semester</th>
                  <th className="p-3.5 font-semibold">Credits</th>
                  {(role === 'admin' || role === 'vice_principal') && (
                    <th className="p-3.5 font-semibold text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredSubjects.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-bold text-blue-400">{s.code}</td>
                    <td className="p-3.5 font-sans font-semibold text-white">{s.name}</td>
                    <td className="p-3.5 text-slate-300 font-sans">
                      {s.department_id ? deptMap[s.department_id] ?? 'Assigned' : 'General'}
                    </td>
                    <td className="p-3.5 text-slate-400">
                      {s.semester_id ? semMap[s.semester_id] ?? 'Sem 5' : 'All Semesters'}
                    </td>
                    <td className="p-3.5 text-slate-300">{s.credits} Credits</td>
                    {(role === 'admin' || role === 'vice_principal') && (
                      <td className="p-3.5 text-right font-sans">
                        <button
                          onClick={() => openEditModal(s)}
                          className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                {editingSubject ? 'Edit Course' : 'Create New Course'}
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
                <label className="block text-xs text-slate-400 mb-1">Course Code (e.g. CS302)</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="CS302"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 uppercase font-mono"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Course Title</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Database Management Systems"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Department</label>
                  <select
                    value={deptId}
                    onChange={(e) => setDeptId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.code}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Credits</label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={credits}
                    onChange={(e) => setCredits(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
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
                  {saving ? 'Saving…' : 'Save Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
