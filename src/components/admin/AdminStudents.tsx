import React, { useEffect, useState } from 'react';
import { 
  GraduationCap, 
  Search, 
  AlertCircle, 
  ChevronRight, 
  X, 
  Activity, 
  Award, 
  LifeBuoy
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../services/supabaseClient';

interface StudentProfile {
  id: string;
  email: string;
  full_name: string;
  student_no: string | null;
  role: string;
  department_id: string | null;
  year_text: string;
  section: string;
  cgpa: number;
  phone: string | null;
  mentor: string | null;
  created_at: string;
}

interface Department {
  id: string;
  code: string;
  name: string;
}

export const AdminStudents: React.FC = () => {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);

  // Deep-dive data for selected student
  const [studentAttendance, setStudentAttendance] = useState<any[]>([]);
  const [studentGrades, setStudentGrades] = useState<any[]>([]);
  const [studentTickets, setStudentTickets] = useState<any[]>([]);
  const [drawerLoading, setDrawerLoading] = useState(false);

  const fetchData = async () => {
    if (!isSupabaseConfigured || !supabase) {
      setError('Supabase backend not configured');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [studentsRes, deptsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('role', 'student')
          .order('full_name', { ascending: true }),
        supabase
          .from('departments')
          .select('id, code, name')
          .order('code', { ascending: true }),
      ]);

      if (studentsRes.error) throw studentsRes.error;
      if (deptsRes.error) throw deptsRes.error;

      setStudents(studentsRes.data ?? []);
      setDepartments(deptsRes.data ?? []);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load students directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const openStudentDrawer = async (student: StudentProfile) => {
    setSelectedStudent(student);
    setDrawerLoading(true);
    if (!supabase) return;
    try {
      const [attRes, grdRes, tktRes] = await Promise.all([
        supabase.from('attendance_records').select('*').eq('student_id', student.id),
        supabase.from('grades').select('*').eq('student_id', student.id),
        supabase.from('helpdesk_tickets').select('*').eq('student_id', student.id),
      ]);
      setStudentAttendance(attRes.data ?? []);
      setStudentGrades(grdRes.data ?? []);
      setStudentTickets(tktRes.data ?? []);
    } catch (e) {
      console.warn('Could not load student deep-dive:', e);
    } finally {
      setDrawerLoading(false);
    }
  };

  const deptMap = Object.fromEntries(departments.map((d) => [d.id, d.name]));

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      (s.student_no && s.student_no.toLowerCase().includes(search.toLowerCase()));
    const matchesDept = selectedDept === 'all' || s.department_id === selectedDept;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
            <GraduationCap className="w-4 h-4" />
            <span>Academic Directory</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">Student Management</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Verified student profiles, department enrollments, and academic standings.
          </p>
        </div>
        <div className="text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-2">
          <span>Active Students:</span>
          <span className="font-mono font-bold text-white">{students.length}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, email, or student ID..."
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

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-rose-400 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="glass-panel rounded-2xl border border-slate-800 p-12 text-center">
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Loading student directory from Supabase...</p>
        </div>
      )}

      {/* Students Data Table */}
      {!loading && !error && (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 font-mono border-b border-slate-800">
                <tr>
                  <th className="p-3.5 font-semibold">Student</th>
                  <th className="p-3.5 font-semibold">Student ID</th>
                  <th className="p-3.5 font-semibold">Department</th>
                  <th className="p-3.5 font-semibold">Year & Sec</th>
                  <th className="p-3.5 font-semibold">CGPA</th>
                  <th className="p-3.5 font-semibold">Mentor</th>
                  <th className="p-3.5 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      No students found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s) => (
                    <tr
                      key={s.id}
                      onClick={() => openStudentDrawer(s)}
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="p-3.5">
                        <div className="font-semibold text-white">{s.full_name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{s.email}</div>
                      </td>
                      <td className="p-3.5 font-mono text-slate-300 font-bold">
                        {s.student_no ?? '—'}
                      </td>
                      <td className="p-3.5 text-slate-300">
                        {s.department_id ? deptMap[s.department_id] ?? 'Assigned' : 'General'}
                      </td>
                      <td className="p-3.5 text-slate-400 font-mono">
                        {s.year_text} &bull; Sec {s.section}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-blue-400">
                        {s.cgpa ? s.cgpa.toFixed(2) : '—'}
                      </td>
                      <td className="p-3.5 text-slate-400">
                        {s.mentor ?? 'Not Assigned'}
                      </td>
                      <td className="p-3.5 text-right">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-400 hover:text-blue-300">
                          <span>Details</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Student Deep-Dive Slide-Over Drawer */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-slate-950 border-l border-slate-800 h-full overflow-y-auto p-6 space-y-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-mono font-bold text-blue-400">
                  Student Record &bull; {selectedStudent.student_no ?? 'ID Pending'}
                </span>
                <h2 className="text-xl font-bold text-white mt-1">{selectedStudent.full_name}</h2>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{selectedStudent.email}</p>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Academic Info Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Department</span>
                <span className="font-semibold text-white mt-0.5 block">
                  {selectedStudent.department_id ? deptMap[selectedStudent.department_id] ?? 'Assigned' : 'General'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Cumulative GPA</span>
                <span className="font-mono font-bold text-blue-400 text-base mt-0.5 block">
                  {selectedStudent.cgpa ? selectedStudent.cgpa.toFixed(2) : '—'} / 10.0
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Academic Class</span>
                <span className="font-semibold text-white mt-0.5 block">
                  {selectedStudent.year_text} (Sec {selectedStudent.section})
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Faculty Mentor</span>
                <span className="font-semibold text-white mt-0.5 block">
                  {selectedStudent.mentor ?? 'Unassigned'}
                </span>
              </div>
            </div>

            {drawerLoading ? (
              <div className="py-8 text-center text-xs text-slate-500">
                <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-2" />
                Loading academic breakdown...
              </div>
            ) : (
              <>
                {/* Attendance Breakdown */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-white">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span>Attendance Records ({studentAttendance.length})</span>
                  </div>
                  {studentAttendance.length === 0 ? (
                    <p className="text-xs text-slate-500 p-3 bg-slate-900/50 rounded-xl border border-slate-800/80">
                      No attendance records found for this student.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {studentAttendance.map((a) => (
                        <div
                          key={a.id}
                          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-semibold text-white block">{a.subject_name ?? a.subject_code}</span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {a.attended_classes} attended / {a.total_classes} total
                            </span>
                          </div>
                          <span
                            className={`font-mono font-bold px-2 py-0.5 rounded-md ${
                              a.percentage < 75
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {a.percentage}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Grades Breakdown */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-white">
                    <Award className="w-4 h-4 text-indigo-400" />
                    <span>Semester Grades ({studentGrades.length})</span>
                  </div>
                  {studentGrades.length === 0 ? (
                    <p className="text-xs text-slate-500 p-3 bg-slate-900/50 rounded-xl border border-slate-800/80">
                      No grades recorded for this student yet.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {studentGrades.map((g) => (
                        <div
                          key={g.id}
                          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-semibold text-white block">{g.subject_name ?? g.subject_code}</span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              Internal: {g.internal_score}/{g.internal_max} &bull; Exam: {g.exam_score}/{g.exam_max}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-sm text-blue-400">
                            {g.overall_grade ?? '—'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Helpdesk Tickets */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-white">
                    <LifeBuoy className="w-4 h-4 text-amber-400" />
                    <span>Logged Helpdesk Tickets ({studentTickets.length})</span>
                  </div>
                  {studentTickets.length === 0 ? (
                    <p className="text-xs text-slate-500 p-3 bg-slate-900/50 rounded-xl border border-slate-800/80">
                      No tickets raised by this student.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {studentTickets.map((t) => (
                        <div
                          key={t.id}
                          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-semibold text-white block">{t.title}</span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {t.display_id} &bull; {t.location}
                            </span>
                          </div>
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                            {t.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};