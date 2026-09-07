import React, { useEffect, useState } from 'react';
import { 
  Clock, 
  Plus, 
  AlertTriangle, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  X, 
  MapPin, 
  User, 
  AlertCircle 
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../services/supabaseClient';
import { useAdminSession } from './AdminSessionContext';

interface TimetableSlot {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  subject_code: string;
  subject_name: string;
  room: string;
  faculty_name: string;
  slot_type: string;
  status: string;
}

export const AdminTimetable: React.FC = () => {
  const { role } = useAdminSession();
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [faculty, setFaculty] = useState<any[]>([]);
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);
  const [day, setDay] = useState('Monday');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [room, setRoom] = useState('Room 101');
  const [facultyName, setFacultyName] = useState('');
  const [slotType, setSlotType] = useState('Lecture');
  const [saving, setSaving] = useState(false);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const fetchData = async () => {
    if (!isSupabaseConfigured || !supabase) {
      setError('Supabase backend not configured');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [slotsRes, subRes, facRes] = await Promise.all([
        supabase.from('timetable_slots').select('*').order('start_time'),
        supabase.from('subjects').select('code, name'),
        supabase.from('profiles').select('full_name').eq('role', 'faculty'),
      ]);

      if (slotsRes.error) throw slotsRes.error;
      setSlots(slotsRes.data ?? []);
      setSubjects(subRes.data ?? []);
      setFaculty(facRes.data ?? []);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load timetable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingSlot(null);
    setDay(selectedDay);
    setStartTime('10:00');
    setEndTime('11:00');
    setSubjectCode(subjects[0]?.code ?? 'CS301');
    setSubjectName(subjects[0]?.name ?? 'Data Structures');
    setRoom('Room 101');
    setFacultyName(faculty[0]?.full_name ?? 'Dr. Sharma');
    setSlotType('Lecture');
    setConflictWarning(null);
    setFeedback(null);
    setModalOpen(true);
  };

  const openEditModal = (slot: TimetableSlot) => {
    setEditingSlot(slot);
    setDay(slot.day_of_week);
    setStartTime(slot.start_time);
    setEndTime(slot.end_time);
    setSubjectCode(slot.subject_code);
    setSubjectName(slot.subject_name);
    setRoom(slot.room);
    setFacultyName(slot.faculty_name);
    setSlotType(slot.slot_type);
    setConflictWarning(null);
    setFeedback(null);
    setModalOpen(true);
  };

  // Conflict Detection Algorithm
  const detectConflicts = (
    checkDay: string,
    checkStart: string,
    checkEnd: string,
    checkRoom: string,
    checkFaculty: string,
    excludeId?: string
  ): string | null => {
    for (const s of slots) {
      if (excludeId && s.id === excludeId) continue;
      if (s.day_of_week !== checkDay) continue;

      // Overlap condition: start < existingEnd && end > existingStart
      const overlaps = checkStart < s.end_time && checkEnd > s.start_time;
      if (overlaps) {
        if (s.room.toLowerCase() === checkRoom.toLowerCase()) {
          return `Room Conflict: ${s.room} is already booked for ${s.subject_name} (${s.start_time}–${s.end_time}).`;
        }
        if (s.faculty_name.toLowerCase() === checkFaculty.toLowerCase()) {
          return `Faculty Conflict: ${s.faculty_name} is already teaching ${s.subject_name} (${s.start_time}–${s.end_time}).`;
        }
      }
    }
    return null;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    // Check for conflicts
    const conflict = detectConflicts(
      day,
      startTime,
      endTime,
      room,
      facultyName,
      editingSlot?.id
    );
    if (conflict) {
      setConflictWarning(conflict);
      return;
    }

    setSaving(true);
    setConflictWarning(null);
    setFeedback(null);
    try {
      const payload = {
        day_of_week: day,
        start_time: startTime,
        end_time: endTime,
        subject_code: subjectCode,
        subject_name: subjectName,
        room,
        faculty_name: facultyName,
        slot_type: slotType,
        status: 'Upcoming',
      };

      if (editingSlot) {
        const { error: updErr } = await supabase
          .from('timetable_slots')
          .update(payload)
          .eq('id', editingSlot.id);
        if (updErr) throw updErr;
      } else {
        const { error: insErr } = await supabase.from('timetable_slots').insert(payload);
        if (insErr) throw insErr;
      }

      setFeedback('Timetable slot saved successfully!');
      setTimeout(() => setModalOpen(false), 1200);
      await fetchData();
    } catch (e: any) {
      setError(e.message ?? 'Failed to save timetable slot');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!supabase || !window.confirm('Delete this timetable slot?')) return;
    try {
      const { error: delErr } = await supabase.from('timetable_slots').delete().eq('id', id);
      if (delErr) throw delErr;
      await fetchData();
    } catch (e: any) {
      setError(e.message ?? 'Failed to delete slot');
    }
  };

  const filteredSlots = slots.filter((s) => s.day_of_week === selectedDay);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
            <Clock className="w-4 h-4" />
            <span>Master Schedule</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">Timetable Management</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Class schedules, classroom assignments, and automated room/faculty conflict detection.
          </p>
        </div>
        {(role === 'admin' || role === 'vice_principal') && (
          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 shadow-glow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Schedule Slot</span>
          </button>
        )}
      </div>

      {/* Day Selector Strip */}
      <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-2xl border border-slate-800 overflow-x-auto">
        {daysOfWeek.map((d) => (
          <button
            key={d}
            onClick={() => setSelectedDay(d)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
              selectedDay === d
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {d}
          </button>
        ))}
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
          <p className="text-xs text-slate-400">Loading schedule from Supabase...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSlots.length === 0 ? (
            <div className="glass-panel p-8 text-center text-xs text-slate-500 rounded-2xl border border-slate-800">
              No classes scheduled for {selectedDay}. Click "Add Schedule Slot" above.
            </div>
          ) : (
            filteredSlots.map((slot) => (
              <div
                key={slot.id}
                className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-800 flex items-center justify-between gap-4 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center shrink-0">
                    <span className="text-xs font-mono font-bold text-white block">{slot.start_time}</span>
                    <span className="text-[10px] font-mono text-slate-400">{slot.end_time}</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-blue-400">{slot.subject_code}</span>
                      <span className="text-sm font-bold text-white">{slot.subject_name}</span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {slot.slot_type}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2">
                      <span className="flex items-center gap-1.5 text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-blue-400" />
                        {slot.room}
                      </span>
                      <span className="flex items-center gap-1.5 text-slate-300">
                        <User className="w-3.5 h-3.5 text-indigo-400" />
                        {slot.faculty_name}
                      </span>
                    </div>
                  </div>
                </div>

                {(role === 'admin' || role === 'vice_principal') && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => openEditModal(slot)}
                      className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(slot.id)}
                      className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                {editingSlot ? 'Edit Schedule Slot' : 'Add Schedule Slot'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {conflictWarning && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{conflictWarning}</span>
              </div>
            )}

            {feedback && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{feedback}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Day</label>
                  <select
                    value={day}
                    onChange={(e) => setDay(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    {daysOfWeek.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Subject</label>
                <select
                  required
                  value={subjectCode}
                  onChange={(e) => {
                    setSubjectCode(e.target.value);
                    const sub = subjects.find((s) => s.code === e.target.value);
                    if (sub) setSubjectName(sub.name);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                >
                  {subjects.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.code} — {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Room</label>
                  <input
                    type="text"
                    required
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    placeholder="Room 204"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Faculty</label>
                  <input
                    type="text"
                    required
                    value={facultyName}
                    onChange={(e) => setFacultyName(e.target.value)}
                    placeholder="Prof. Verma"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Slot Type</label>
                <select
                  value={slotType}
                  onChange={(e) => setSlotType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="Lecture">Lecture</option>
                  <option value="Lab">Lab</option>
                  <option value="Tutorial">Tutorial</option>
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
                  {saving ? 'Validating…' : 'Save Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
