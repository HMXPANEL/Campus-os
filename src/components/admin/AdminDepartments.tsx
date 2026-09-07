import React, { useEffect, useState } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  AlertCircle, 
  Edit2, 
  GraduationCap, 
  BookOpen, 
  X, 
  CheckCircle2 
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../services/supabaseClient';
import { useAdminSession } from './AdminSessionContext';

interface Department {
  id: string;
  code: string;
  name: string;
  created_at: string;
}

export const AdminDepartments: React.FC = () => {
  const { role } = useAdminSession();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});
  const [subjectCounts, setSubjectCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Create / Edit modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptCode, setDeptCode] = useState('');
  const [deptName, setDeptName] = useState('');
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
      const [deptRes, profRes, subRes] = await Promise.all([
        supabase.from('departments').select('*').order('code'),
        supabase.from('profiles').select('department_id').eq('role', 'student'),
        supabase.from('subjects').select('department_id'),
      ]);

      if (deptRes.error) throw deptRes.error;
      setDepartments(deptRes.data ?? []);

      // Calculate counts
      const sCounts: Record<string, number> = {};
      (profRes.data ?? []).forEach((p: any) => {
        if (p.department_id) sCounts[p.department_id] = (sCounts[p.department_id] ?? 0) + 1;
      });
      setStudentCounts(sCounts);

      const subCounts: Record<string, number> = {};
      (subRes.data ?? []).forEach((s: any) => {
        if (s.department_id) subCounts[s.department_id] = (subCounts[s.department_id] ?? 0) + 1;
      });
      setSubjectCounts(subCounts);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingDept(null);
    setDeptCode('');
    setDeptName('');
    setFeedback(null);
    setModalOpen(true);
  };

  const openEditModal = (dept: Department) => {
    setEditingDept(dept);
    setDeptCode(dept.code);
    setDeptName(dept.name);
    setFeedback(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setSaving(true);
    setError(null);
    try {
      if (editingDept) {
        const { error: updErr } = await supabase
          .from('departments')
          .update({ code: deptCode.trim().toUpperCase(), name: deptName.trim() })
          .eq('id', editingDept.id);
        if (updErr) throw updErr;
      } else {
        const { error: insErr } = await supabase
          .from('departments')
          .insert({ code: deptCode.trim().toUpperCase(), name: deptName.trim() });
        if (insErr) throw insErr;
      }
      setFeedback('Department saved successfully!');
      setTimeout(() => setModalOpen(false), 1000);
      await fetchData();
    } catch (e: any) {
      setError(e.message ?? 'Failed to save department');
    } finally {
      setSaving(false);
    }
  };

  const filteredDepts = departments.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
            <Building2 className="w-4 h-4" />
            <span>Academic Structure</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">Departments</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            College faculties, engineering branches, and administrative department codes.
          </p>
        </div>
        {(role === 'admin' || role === 'vice_principal') && (
          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 shadow-glow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Department</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search departments by code or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
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
          <p className="text-xs text-slate-400">Loading departments from Supabase...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDepts.map((d) => {
            const countStudents = studentCounts[d.id] ?? 0;
            const countSubjects = subjectCounts[d.id] ?? 0;

            return (
              <div
                key={d.id}
                className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-mono font-bold text-blue-400 uppercase bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                      {d.code}
                    </span>
                    <h3 className="text-base font-bold text-white mt-2">{d.name}</h3>
                  </div>
                  {(role === 'admin' || role === 'vice_principal') && (
                    <button
                      onClick={() => openEditModal(d)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/60">
                    <span className="text-slate-400 flex items-center gap-1 text-[10px] uppercase font-mono">
                      <GraduationCap className="w-3 h-3 text-blue-400" />
                      Students
                    </span>
                    <span className="font-mono font-bold text-white text-sm mt-0.5 block">
                      {countStudents}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/60">
                    <span className="text-slate-400 flex items-center gap-1 text-[10px] uppercase font-mono">
                      <BookOpen className="w-3 h-3 text-indigo-400" />
                      Courses
                    </span>
                    <span className="font-mono font-bold text-white text-sm mt-0.5 block">
                      {countSubjects}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                {editingDept ? 'Edit Department' : 'Create Department'}
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
                <label className="block text-xs text-slate-400 mb-1">Department Code (e.g. CSE)</label>
                <input
                  type="text"
                  required
                  value={deptCode}
                  onChange={(e) => setDeptCode(e.target.value)}
                  placeholder="CSE"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 uppercase font-mono"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Department Name</label>
                <input
                  type="text"
                  required
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  placeholder="Computer Science & Engineering"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
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
                  {saving ? 'Saving…' : 'Save Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
