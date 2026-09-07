import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Award, 
  CheckSquare, 
  MapPin, 
  User, 
  CheckCircle2, 
  TrendingUp,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { useCampusStore } from '../../services/campusStore';

interface StudentDataViewProps {
  initialTab?: 'timetable' | 'grades' | 'deadlines';
}

export const StudentDataView: React.FC<StudentDataViewProps> = ({ initialTab = 'timetable' }) => {
  const store = useCampusStore();
  const timetable = store.getTimetable();
  const grades = store.getGrades();
  const deadlines = store.getDeadlines();
  const student = store.getStudent();

  // Exactly 3 Tabs
  const [activeTab, setActiveTab] = useState<'timetable' | 'grades' | 'deadlines'>(initialTab);

  // Timetable state
  const [selectedDay, setSelectedDay] = useState<string>('Monday');
  const [timetableMode, setTimetableMode] = useState<'timeline' | 'matrix'>('timeline');

  // Grades state
  const [selectedSemester, setSelectedSemester] = useState('Semester 5');

  // Deadlines state
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<'All' | 'Pending' | 'Completed'>('All');

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const filteredTimetable = timetable.filter(slot => slot.dayOfWeek === selectedDay);

  const filteredDeadlines = deadlines.filter(d => {
    const matchCategory = selectedCategory === 'All' || d.category === selectedCategory;
    const matchStatus = selectedStatus === 'All' || d.status === selectedStatus;
    return matchCategory && matchStatus;
  });

  return (
    <div className="space-y-4 sm:space-y-5 max-w-2xl mx-auto animate-fade-in pb-4">
      
      {/* Header & Mobile-First 3-Tab Pill Controller (No clipping) */}
      <div className="space-y-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Student Data
          </h1>
          <p className="text-xs text-slate-400">
            {student.department} &bull; {selectedSemester}
          </p>
        </div>

        {/* 3 Tabs Container with overflow-x-auto so it never clips on 360px */}
        <div className="grid grid-cols-3 bg-slate-900/90 p-1 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab('timetable')}
            className={`py-2 px-1 text-center rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'timetable'
                ? 'bg-blue-600 text-white shadow-glow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Timetable</span>
          </button>

          <button
            onClick={() => setActiveTab('grades')}
            className={`py-2 px-1 text-center rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'grades'
                ? 'bg-blue-600 text-white shadow-glow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Grades</span>
          </button>

          <button
            onClick={() => setActiveTab('deadlines')}
            className={`py-2 px-1 text-center rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'deadlines'
                ? 'bg-blue-600 text-white shadow-glow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Deadlines</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: TIMETABLE */}
      {/* ============================================================ */}
      {activeTab === 'timetable' && (
        <div className="space-y-3 sm:space-y-4 animate-fade-in">
          
          {/* Day selection strip */}
          <div className="flex items-center justify-between gap-2 bg-slate-900/80 p-2 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {daysOfWeek.map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedDay === day
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>

            <button
              onClick={() => setTimetableMode(m => m === 'timeline' ? 'matrix' : 'timeline')}
              className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-slate-950 text-slate-300 border border-slate-800 shrink-0"
            >
              {timetableMode === 'timeline' ? 'Matrix' : 'Timeline'}
            </button>
          </div>

          {/* Timeline View */}
          {timetableMode === 'timeline' ? (
            <div className="space-y-2.5 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
              {filteredTimetable.map((slot) => {
                const isCompleted = slot.status === 'Completed';
                const isNext = slot.subjectCode === 'CS302';

                return (
                  <div
                    key={slot.id}
                    className={`relative pl-8 p-3.5 sm:p-4 rounded-2xl border transition-all ${
                      isNext
                        ? 'bg-blue-950/20 border-blue-500/40 shadow-sm'
                        : 'bg-slate-900/80 border-slate-800'
                    }`}
                  >
                    <div className={`absolute left-2.5 top-5 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${
                      isCompleted ? 'bg-slate-500' : isNext ? 'bg-blue-500 ring-4 ring-blue-500/20' : 'bg-slate-600'
                    }`} />

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-white">{slot.startTime}–{slot.endTime}</span>
                        <span className="text-[10px] uppercase font-mono px-2 py-0.2 rounded bg-slate-800 text-slate-300">
                          {slot.type}
                        </span>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isCompleted
                          ? 'bg-slate-800 text-slate-400'
                          : isNext
                          ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {slot.status}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white mt-1.5">{slot.subjectName}</h3>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-2">
                      <span className="flex items-center gap-1 text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-blue-400" />
                        {slot.room}
                      </span>
                      <span className="flex items-center gap-1 text-slate-300">
                        <User className="w-3.5 h-3.5 text-blue-400" />
                        {slot.faculty}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Matrix View */
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono">
                    <th className="p-2">Slot</th>
                    <th className="p-2">Subject</th>
                    <th className="p-2">Room</th>
                    <th className="p-2">Faculty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredTimetable.map(s => (
                    <tr key={s.id} className="hover:bg-slate-800/40">
                      <td className="p-2 text-white font-bold">{s.startTime}</td>
                      <td className="p-2 font-sans font-semibold text-slate-200">{s.subjectName}</td>
                      <td className="p-2 text-slate-400">{s.room}</td>
                      <td className="p-2 text-slate-400 font-sans">{s.faculty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: GRADES */}
      {/* ============================================================ */}
      {activeTab === 'grades' && (
        <div className="space-y-3.5 animate-fade-in">
          
          {/* Semester Selector matching Screen 10 */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Academic Term</span>
            <div className="relative inline-block">
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="bg-slate-900 text-xs font-semibold text-white px-3 py-1.5 pr-7 rounded-xl border border-slate-800 appearance-none focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5'].map(sem => (
                  <option key={sem} value={sem}>{sem}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Compact CGPA Card matching Screen 10 */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-medium tracking-wider block">
                Cumulative Performance
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-0.5 flex items-baseline gap-1">
                <span>{student.cgpa}</span>
                <span className="text-xs font-normal text-slate-500">/ 10.0</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold mt-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Distinction ({selectedSemester})</span>
              </div>
            </div>

            {/* Mini visual bar chart */}
            <div className="flex items-end gap-1.5 h-12 pb-1 shrink-0 px-3 py-1 bg-slate-950/60 rounded-xl border border-slate-800/80">
              <div className="w-2.5 bg-blue-500/40 rounded-t h-6" title="Sem 1: 8.0" />
              <div className="w-2.5 bg-blue-500/60 rounded-t h-8" title="Sem 2: 8.2" />
              <div className="w-2.5 bg-blue-500/80 rounded-t h-9" title="Sem 3: 8.3" />
              <div className="w-2.5 bg-blue-500 rounded-t h-10" title="Sem 4: 8.4" />
              <div className="w-2.5 bg-emerald-500 rounded-t h-11" title="Sem 5 (Current): 8.4" />
            </div>
          </div>

          {/* AI Insight Badge */}
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-2 text-xs text-blue-300">
            <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
            <span><strong>AI Insight:</strong> Your strongest subject this semester is Data Structures (Grade A+).</span>
          </div>

          {/* Course Grades List */}
          <div className="space-y-2.5">
            {grades.map((grd) => (
              <div
                key={grd.id}
                className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-300">{grd.subjectCode}</span>
                    <span className="text-xs font-semibold text-white truncate">{grd.subjectName}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-1 flex items-center gap-3">
                    <span>Internal: {grd.internalMarks.score}/{grd.internalMarks.max}</span>
                    <span>&bull;</span>
                    <span>Exam: {grd.examMarks.score}/{grd.examMarks.max}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-base font-extrabold text-blue-400 font-mono block">
                    {grd.overallGrade}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {grd.gradePoints} pts
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: DEADLINES */}
      {/* ============================================================ */}
      {activeTab === 'deadlines' && (
        <div className="space-y-3 animate-fade-in">
          
          {/* Category & Status filter pills */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {['All', 'Assignment', 'Book', 'Form', 'Event'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 w-fit">
              {(['All', 'Pending', 'Completed'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    selectedStatus === st
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Deadlines List */}
          <div className="space-y-2.5">
            {filteredDeadlines.map((dl) => {
              const isCompleted = dl.status === 'Completed';

              return (
                <div
                  key={dl.id}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                    isCompleted
                      ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                      : 'bg-slate-900/80 border-slate-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => store.toggleDeadline(dl.id)}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center mt-0.5 transition-colors ${
                        isCompleted
                          ? 'bg-emerald-600 border-emerald-500 text-white'
                          : 'border-slate-600 hover:border-blue-400 text-transparent'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </button>

                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-semibold">
                          {dl.category}
                        </span>
                        {dl.priority === 'High' && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-500/15 text-rose-400 border border-rose-500/25">
                            High
                          </span>
                        )}
                      </div>

                      <h4 className={`text-xs sm:text-sm font-bold text-white ${isCompleted ? 'line-through text-slate-400' : ''}`}>
                        {dl.title}
                      </h4>

                      <span className="text-[10px] text-slate-400 font-mono block mt-1">
                        {dl.dueDate}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => store.toggleDeadline(dl.id)}
                    className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold shrink-0"
                  >
                    {isCompleted ? 'Undo' : 'Done'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
