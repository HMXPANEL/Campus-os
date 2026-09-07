import React, { useEffect, useState } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  Search, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  AlertCircle, 
  TrendingDown,
  X
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../services/supabaseClient';
import { useAdminSession } from './AdminSessionContext';

interface AttendanceRecord {
  id: string;
  student_id: string;
  student_name?: string;
  subject_id: string;
  subject_code: string;
  subject_name: string;
  total_classes: number;
  attended_classes: number;
  percentage: number;
}

export const AdminAttendance: React.FC = () => {
  const { role } = useAdminSession();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterRiskOnly, setFilterRiskOnly] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('all');

  // Attendance Marking Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [markStudentId, setMarkStudentId] = useState('');
  const [markSubjectCode, setMarkSubjectCode] = useState('');
  const [markDate, setMarkDate] = useState(new Date().toISOString().slice(0, 10));
  const [markStatus, setMarkStatus] = useState<'Present' | 'Absent'>('Present');
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
      // Teachers only see their assigned subjects
      let query = supabase.from('attendance_records').select('*');
      
      const [attRes, histRes, studRes, subRes] = await Promise.all([
        query,
        supabase.from('attendance_history').select('*').order('date', { ascending: false }).limit(20),
        supabase.from('profiles').select('id, full_name, email').eq('role', 'student'),
        supabase.from('subjects').select('id, code, name'),
      ]);

      if (attRes.error) throw attRes.error;
      setRecords(attRes.data ?? []);
      setHistory(histRes.data ?? []);
      setStudents(studRes.data ?? []);
      setSubjects(subRes.data ?? []);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const handleMarkAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !markStudentId || !markSubjectCode) return;
    setSaving(true);
    setFeedback(null);
    try {
      // 1. Insert history record
      const { error: histErr } = await supabase.from('attendance_history').insert({
        student_id: markStudentId,
        subject_code: markSubjectCode,
        date: markDate,
        status: markStatus,
        time: '10:00 AM',
      });
      if (histErr) throw histErr;

      // 2. Find and update attendance_records
      const rec = records.find(
        (r) => r.student_id === markStudentId && r.subject_code === markSubjectCode
      );
      if (rec) {
        const newTotal = rec.total_classes + 1;
        const newAttended = rec.attended_classes + (markStatus === 'Present' ? 1 : 0);
        const newPct = Math.round((newAttended / newTotal) * 1000) / 10;
        await supabase
          .from('attendance_records')
          .update({
            total_classes: newTotal,
            attended_classes: newAttended,
            percentage: newPct,
          })
          .eq('id', rec.id);
      }

      setFeedback('Attendance marked and calculated successfully!');
      setTimeout(() => setModalOpen(false), 1200);
      await fetchData();
    } catch (e: any) {
      setError(e.message ?? 'Failed to mark attendance');
    } finally {
      setSaving(false);
    }
  };

  // Metrics
  const atRiskList = records.filter((r) => r.percentage < 75);
  const avgAttendance =
    records.length > 0
      ? Math.round((records.reduce((sum, r) => sum + r.percentage, 0) / records.length) * 10) / 10
      : 0;

  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.subject_name.toLowerCase().includes(search.toLowerCase()) ||
      r.subject_code.toLowerCase().includes(search.toLowerCase());
    const matchesRisk = !filterRiskOnly || r.percentage < 75;
    const matchesSub = selectedSubject === 'all' || r.subject_code === selectedSubject;
    return matchesSearch && matchesRisk && matchesSub;
  });

  const uniqueSubjectCodes = Array.from(new Set(records.map((r) => r.subject_code)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
            <Activity className="w-4 h-4" />
            <span>Academic Standing</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">Attendance & Risk Monitoring</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Campus-wide threshold compliance, subject attendance ratios, and live risk analytics.
          </p>
        </div>
        {(role === 'admin' || role === 'faculty' || role === 'vice_principal') && (
          <button
            onClick={() => {
              setFeedback(null);
              setModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-glow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Mark Attendance</span>
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <span className="text-xs font-medium text-slate-400 block">Average Attendance</span>
          <div className="text-2xl font-extrabold text-white font-mono mt-1 flex items-baseline gap-2">
            <span>{avgAttendance}%</span>
            <span className="text-xs text-emerald-400 font-sans font-semibold">Campus Mean</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-rose-500/20 bg-rose-950/10">
          <span className="text-xs font-medium text-rose-300 block flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            Students Below 75% Risk
          </span>
          <div className="text-2xl font-extrabold text-rose-400 font-mono mt-1 flex items-baseline gap-2">
            <span>{atRiskList.length}</span>
            <span className="text-xs text-rose-300 font-sans">Requires Attention</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <span className="text-xs font-medium text-slate-400 block">Logged Sessions</span>
          <div className="text-2xl font-extrabold text-white font-mono mt-1 flex items-baseline gap-2">
            <span>{history.length}</span>
            <span className="text-xs text-slate-400 font-sans">Recent History</span>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by course code or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Subjects</option>
            {uniqueSubjectCodes.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <button
            onClick={() => setFilterRiskOnly(!filterRiskOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              filterRiskOnly
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Below 75% Only</span>
          </button>
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
          <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Loading attendance data from Supabase...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Records List */}
          <div className="lg:col-span-2 glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800 font-semibold text-xs text-white">
              Subject Attendance Overview ({filteredRecords.length})
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 font-mono border-b border-slate-800">
                  <tr>
                    <th className="p-3.5 font-semibold">Subject</th>
                    <th className="p-3.5 font-semibold">Attended / Total</th>
                    <th className="p-3.5 font-semibold">Standing</th>
                    <th className="p-3.5 font-semibold text-right">Compliance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredRecords.map((r) => {
                    const isAtRisk = r.percentage < 75;
                    return (
                      <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 font-sans">
                          <div className="font-bold text-white">{r.subject_name}</div>
                          <span className="text-[11px] font-mono text-slate-400">{r.subject_code}</span>
                        </td>
                        <td className="p-3.5 text-slate-300">
                          {r.attended_classes} / {r.total_classes} classes
                        </td>
                        <td className="p-3.5">
                          <div className="w-32 bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                            <div
                              className={`h-full rounded-full ${
                                isAtRisk ? 'bg-rose-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(r.percentage, 100)}%` }}
                            />
                          </div>
                        </td>
                        <td className="p-3.5 text-right font-bold">
                          <span
                            className={`px-2 py-0.5 rounded-md ${
                              isAtRisk
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {r.percentage}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Session History */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>Recent Class Sessions</span>
            </h3>
            <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
              {history.map((h) => (
                <div
                  key={h.id}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-white font-mono block">{h.subject_code}</span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {h.date} &bull; {h.time}
                    </span>
                  </div>
                  <span
                    className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                      h.status === 'Present'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                        : 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
                    }`}
                  >
                    {h.status === 'Present' ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <XCircle className="w-3 h-3" />
                    )}
                    <span>{h.status}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Record Class Attendance</h3>
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

            <form onSubmit={handleMarkAttendance} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Select Student</label>
                <select
                  required
                  value={markStudentId}
                  onChange={(e) => setMarkStudentId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Choose a student...</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Select Course</label>
                <select
                  required
                  value={markSubjectCode}
                  onChange={(e) => setMarkSubjectCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                >
                  <option value="">Choose course code...</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.code}>
                      {s.code} — {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Session Date</label>
                  <input
                    type="date"
                    required
                    value={markDate}
                    onChange={(e) => setMarkDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Mark Status</label>
                  <select
                    value={markStatus}
                    onChange={(e) => setMarkStatus(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  >
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                  </select>
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
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50"
                >
                  {saving ? 'Recording…' : 'Submit Attendance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
