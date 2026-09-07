import React, { useEffect, useState } from 'react';
import { 
  Award, 
  Search, 
  Plus, 
  Edit2, 
  AlertCircle, 
  X, 
  CheckCircle2
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../services/supabaseClient';
import { useAdminSession } from './AdminSessionContext';

interface GradeItem {
  id: string;
  student_id: string;
  student_name?: string;
  subject_id: string;
  subject_code: string;
  subject_name: string;
  semester_id: string | null;
  internal_score: number;
  internal_max: number;
  exam_score: number;
  exam_max: number;
  overall_grade: string;
  grade_points: number;
}

export const AdminGrades: React.FC = () => {
  const { role } = useAdminSession();
  const [grades, setGrades] = useState<GradeItem[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');

  // Grade Entry Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<GradeItem | null>(null);
  const [studentId, setStudentId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [internalScore, setInternalScore] = useState(35);
  const [internalMax, setInternalMax] = useState(40);
  const [examScore, setExamScore] = useState(80);
  const [examMax, setExamMax] = useState(100);
  const [overallGrade, setOverallGrade] = useState('A');
  const [gradePoints, setGradePoints] = useState(9.0);
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
      const [grdRes, studRes, subRes] = await Promise.all([
        supabase.from('grades').select('*').order('subject_code'),
        supabase.from('profiles').select('id, full_name, email').eq('role', 'student'),
        supabase.from('subjects').select('id, code, name'),
      ]);

      if (grdRes.error) throw grdRes.error;
      setGrades(grdRes.data ?? []);
      setStudents(studRes.data ?? []);
      setSubjects(subRes.data ?? []);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load grades directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingGrade(null);
    setStudentId(students[0]?.id ?? '');
    setSubjectId(subjects[0]?.id ?? '');
    setInternalScore(35);
    setInternalMax(40);
    setExamScore(80);
    setExamMax(100);
    setOverallGrade('A');
    setGradePoints(9.0);
    setFeedback(null);
    setModalOpen(true);
  };

  const openEditModal = (g: GradeItem) => {
    setEditingGrade(g);
    setStudentId(g.student_id);
    setSubjectId(g.subject_id);
    setInternalScore(g.internal_score);
    setInternalMax(g.internal_max);
    setExamScore(g.exam_score);
    setExamMax(g.exam_max);
    setOverallGrade(g.overall_grade);
    setGradePoints(g.grade_points);
    setFeedback(null);
    setModalOpen(true);
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setSaving(true);
    setFeedback(null);
    try {
      const sub = subjects.find((s) => s.id === subjectId);
      const payload = {
        student_id: studentId,
        subject_id: subjectId,
        subject_code: sub?.code ?? 'CS300',
        subject_name: sub?.name ?? 'Course',
        internal_score: Number(internalScore),
        internal_max: Number(internalMax),
        exam_score: Number(examScore),
        exam_max: Number(examMax),
        overall_grade: overallGrade,
        grade_points: Number(gradePoints),
      };

      if (editingGrade) {
        const { error: updErr } = await supabase
          .from('grades')
          .update(payload)
          .eq('id', editingGrade.id);
        if (updErr) throw updErr;
      } else {
        const { error: insErr } = await supabase.from('grades').insert(payload);
        if (insErr) throw insErr;
      }

      setFeedback('Grade recorded successfully!');
      setTimeout(() => setModalOpen(false), 1200);
      await fetchData();
    } catch (e: any) {
      setError(e.message ?? 'Failed to save grade');
    } finally {
      setSaving(false);
    }
  };

  const studMap = Object.fromEntries(students.map((s) => [s.id, s.full_name]));

  const filteredGrades = grades.filter((g) => {
    const matchesSearch =
      g.subject_name.toLowerCase().includes(search.toLowerCase()) ||
      g.subject_code.toLowerCase().includes(search.toLowerCase());
    const matchesSub = selectedSubject === 'all' || g.subject_code === selectedSubject;
    return matchesSearch && matchesSub;
  });

  const uniqueSubjects = Array.from(new Set(grades.map((g) => g.subject_code)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-400">
            <Award className="w-4 h-4" />
            <span>Academic Performance</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">Grades & Marks Entry</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Internal assessments, final examinations, and letter grade distributions.
          </p>
        </div>
        {(role === 'admin' || role === 'faculty' || role === 'vice_principal') && (
          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-glow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Record Grade</span>
          </button>
        )}
      </div>

      {/* Filter and Search */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by course code or subject title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Courses</option>
          {uniqueSubjects.map((c) => (
            <option key={c} value={c}>
              {c}
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
          <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Loading student grades from Supabase...</p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 font-mono border-b border-slate-800">
                <tr>
                  <th className="p-3.5 font-semibold">Course</th>
                  <th className="p-3.5 font-semibold">Student</th>
                  <th className="p-3.5 font-semibold">Internal Assessment</th>
                  <th className="p-3.5 font-semibold">Exam Score</th>
                  <th className="p-3.5 font-semibold">Letter Grade</th>
                  <th className="p-3.5 font-semibold">Grade Points</th>
                  {(role === 'admin' || role === 'faculty' || role === 'vice_principal') && (
                    <th className="p-3.5 font-semibold text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredGrades.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-sans">
                      <div className="font-bold text-white">{g.subject_name}</div>
                      <span className="text-[11px] font-mono text-blue-400">{g.subject_code}</span>
                    </td>
                    <td className="p-3.5 font-sans text-slate-300">
                      {studMap[g.student_id] ?? 'Aditya Sharma'}
                    </td>
                    <td className="p-3.5 text-slate-300">
                      {g.internal_score} / {g.internal_max}
                    </td>
                    <td className="p-3.5 text-slate-300">
                      {g.exam_score} / {g.exam_max}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20">
                        {g.overall_grade}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-slate-200">{g.grade_points.toFixed(1)}</td>
                    {(role === 'admin' || role === 'faculty' || role === 'vice_principal') && (
                      <td className="p-3.5 text-right font-sans">
                        <button
                          onClick={() => openEditModal(g)}
                          className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
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
                {editingGrade ? 'Update Course Grade' : 'Record Student Grade'}
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

            <form onSubmit={handleSaveGrade} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Student</label>
                <select
                  required
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Course</label>
                <select
                  required
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} — {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Internal Score</label>
                  <input
                    type="number"
                    value={internalScore}
                    onChange={(e) => setInternalScore(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Exam Score</label>
                  <input
                    type="number"
                    value={examScore}
                    onChange={(e) => setExamScore(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Letter Grade</label>
                  <select
                    value={overallGrade}
                    onChange={(e) => setOverallGrade(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  >
                    {['A+', 'A', 'B+', 'B', 'C', 'F'].map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Grade Points (1-10)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={gradePoints}
                    onChange={(e) => setGradePoints(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
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
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save Grade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
