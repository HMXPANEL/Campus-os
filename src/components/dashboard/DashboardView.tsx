import React, { useState } from 'react';
import { 
  Sparkles, 
  Clock, 
  MapPin, 
  User, 
  ArrowRight, 
  AlertTriangle, 
  Calendar, 
  ChevronRight, 
  TrendingUp, 
  Flame
} from 'lucide-react';
import { useCampusStore } from '../../services/campusStore';
import { NavSection } from '../../types';
import { MyAttendanceModal } from '../attendance/MyAttendanceModal';
import { AttendanceInsightsModal } from '../attendance/AttendanceInsightsModal';

interface DashboardViewProps {
  onNavigate: (section: NavSection, meta?: { tab?: string; id?: string; initialPrompt?: string }) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const store = useCampusStore();
  const student = store.getStudent();
  const deadlines = store.getDeadlines();
  const events = store.getEvents();
  const { nextClass } = store.getCurrentOrNextClass();

  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isInsightsModalOpen, setIsInsightsModalOpen] = useState(false);
  const [aiInput, setAiInput] = useState('');

  const atRiskList = store.getAtRiskSubjects();
  const pendingDeadlines = deadlines.filter(d => d.status === 'Pending').slice(0, 2);
  const upcomingEvents = events.slice(0, 2);
  const { daySchedule: todaySlots } = store.getCurrentOrNextClass();

  const handleAiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (aiInput.trim()) {
      onNavigate('ai', { initialPrompt: aiInput.trim() });
    }
  };

  const handlePrompt = (prompt: string) => {
    onNavigate('ai', { initialPrompt: prompt });
  };

  return (
    <div className="space-y-4 sm:space-y-5 max-w-2xl mx-auto animate-fade-in pb-4">
      
      {/* ============================================================ */}
      {/* 1. GREETING & HEADER INFO */}
      {/* ============================================================ */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Good morning, {student.name.split(' ')[0]}!</span>
            <span>👋</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            {student.year} &bull; {student.department.split('&')[0].trim()} &bull; Section {student.section}
          </p>
        </div>

        <button
          onClick={() => setIsAttendanceModalOpen(true)}
          className="text-xs px-3 py-1.5 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 font-semibold transition-all flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden sm:inline">My Attendance</span>
          <span className="sm:hidden font-mono font-bold">{student.overallAttendance}%</span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* 2. MAIN HERO ATTENDANCE CARD (CIRCULAR RING HERO) */}
      {/* ============================================================ */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#0E1528] via-slate-900 to-slate-950 border border-slate-800 p-5 sm:p-6 shadow-2xl">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6">
          {/* Circular Progress Ring Gauge */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              {/* Track */}
              <path
                className="text-slate-800"
                strokeWidth="3.2"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              {/* Active Ring */}
              <path
                className="text-blue-500 transition-all duration-1000 ease-out"
                strokeDasharray={`${student.overallAttendance}, 100`}
                strokeWidth="3.2"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>

            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
                {student.overallAttendance}%
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Overall</span>
            </div>
          </div>

          {/* Metrics & Action Details */}
          <div className="flex-1 w-full text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1.5">
              <h2 className="text-base font-bold text-white tracking-tight">
                Overall Attendance
              </h2>
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" />
                <span>{student.attendanceMonthlyChange}</span>
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Classes attended vs total conducted sessions:
            </p>

            {/* Classes Breakdown Stats */}
            <div className="grid grid-cols-3 gap-2 my-3 p-2.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-center font-mono">
              <div>
                <span className="text-xs font-bold text-emerald-400 block">{student.totalClassesAttended}</span>
                <span className="text-[10px] text-slate-500 uppercase">Attended</span>
              </div>
              <div className="border-x border-slate-800">
                <span className="text-xs font-bold text-rose-400 block">{student.totalClassesMissed}</span>
                <span className="text-[10px] text-slate-500 uppercase">Missed</span>
              </div>
              <div>
                <span className="text-xs font-bold text-white block">{student.totalClassesHeld}</span>
                <span className="text-[10px] text-slate-500 uppercase">Total</span>
              </div>
            </div>

            {/* Bottom Action Strip */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-amber-400 font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{atRiskList.length} subjects need attention</span>
              </span>

              <button
                onClick={() => setIsAttendanceModalOpen(true)}
                className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 group transition-colors"
              >
                <span>View Details</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. ATTENDANCE AT RISK CARD (ACTIONABLE RECOVERY) */}
      {/* ============================================================ */}
      {atRiskList.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-950/25 via-slate-900/90 to-slate-900/60 border border-rose-500/30 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
                  Attendance At Risk
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {atRiskList.map(a => `${a.subjectCode} (${a.percentage}%)`).join(' &bull; ')}
                </span>
              </div>
              <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                Attend your next <strong className="text-white font-bold underline">{atRiskList[0].requiredClassesToReach75} {atRiskList[0].subjectName} classes</strong> to move closer to the 75% requirement.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsInsightsModalOpen(true)}
            className="self-end sm:self-auto px-3.5 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors shrink-0"
          >
            <span>See Recommendations</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. NEXT CLASS CARD */}
      {/* ============================================================ */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>

          {nextClass ? (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                Next Class
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                Upcoming
              </span>
            </div>

            <h3 className="text-base font-bold text-white">
              {nextClass.subjectName} ({nextClass.subjectCode})
            </h3>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1.5">
              <span className="flex items-center gap-1 text-slate-300">
                <Clock className="w-3 h-3 text-blue-400" />
                {nextClass.startTime} – {nextClass.endTime}
              </span>
              <span className="flex items-center gap-1 text-slate-300">
                <MapPin className="w-3 h-3 text-blue-400" />
                {nextClass.room}
              </span>
              <span className="flex items-center gap-1 text-slate-300">
                <User className="w-3 h-3 text-blue-400" />
                {nextClass.faculty}
              </span>
            </div>
          </div>
          ) : (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                Next Class
              </span>
            </div>
            <h3 className="text-base font-bold text-white">
              No more classes scheduled
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Check your full timetable for upcoming days.
            </p>
          </div>
          )}
        </div>

        <button
          onClick={() => onNavigate('student-data', { tab: 'timetable' })}
          className="self-end sm:self-auto text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 shrink-0"
        >
          <span>Full Timetable</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ============================================================ */}
      {/* 5. AI RECOMMENDATION COMPACT CARD (live next class + top deadline) */}
      {/* ============================================================ */}
      {(nextClass || pendingDeadlines.length > 0) && (
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-950/30 via-slate-900/90 to-blue-950/30 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1">
              <span>CampusOS AI noticed something</span>
            </span>
            <p className="text-xs text-slate-200 mt-1 leading-relaxed">
              {nextClass && pendingDeadlines.length > 0 && (
                <>You have <strong>{nextClass.subjectName}</strong> coming up and <strong>{pendingDeadlines[0].title}</strong> is still pending.</>
              )}
              {nextClass && pendingDeadlines.length === 0 && (
                <>You have <strong>{nextClass.subjectName}</strong> coming up. Ask AI to help you prepare.</>
              )}
              {!nextClass && pendingDeadlines.length > 0 && (
                <><strong>{pendingDeadlines[0].title}</strong> is still pending. Ask AI to help you plan.</>
              )}
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('ai', { initialPrompt: "I have 2 hours before my next class. Help me decide what to do." })}
          className="self-end sm:self-auto px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-glow-sm transition-all flex items-center gap-1.5 shrink-0"
        >
          <span>Help me plan</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
      )}

      {/* ============================================================ */}
      {/* 6. TODAY'S CLASSES (DAILY TIMETABLE TIMELINE) */}
      {/* ============================================================ */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Today's Classes</h3>
            <span className="text-[11px] text-slate-400 font-mono">{new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
          <button
            onClick={() => onNavigate('student-data', { tab: 'timetable' })}
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            <span>View Full</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
          {todaySlots.map((slot) => {
            const isCompleted = slot.status === 'Completed';
            const isNext = nextClass !== undefined && slot.id === nextClass.id;

            return (
              <div
                key={slot.id}
                className={`relative pl-8 p-3 rounded-xl border transition-all flex items-center justify-between ${
                  isNext
                    ? 'bg-blue-950/20 border-blue-500/40'
                    : 'bg-slate-950/50 border-slate-800/80'
                }`}
              >
                {/* Timeline status dot */}
                <div className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${
                  isCompleted ? 'bg-slate-500' : isNext ? 'bg-blue-500 ring-4 ring-blue-500/20' : 'bg-slate-600'
                }`} />

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white font-mono">{slot.startTime}–{slot.endTime}</span>
                    <span className="text-xs font-semibold text-slate-200 truncate">{slot.subjectName}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>{slot.room}</span>
                    <span>&bull;</span>
                    <span>{slot.faculty}</span>
                  </div>
                </div>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  isCompleted
                    ? 'bg-slate-800 text-slate-400'
                    : isNext
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {slot.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 7. UPCOMING DEADLINES & EVENTS GRID */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Deadlines Box */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Deadlines</span>
              </h3>
              <button
                onClick={() => onNavigate('student-data', { tab: 'deadlines' })}
                className="text-[11px] font-semibold text-blue-400 hover:text-blue-300"
              >
                View all
              </button>
            </div>

            <div className="space-y-2">
              {pendingDeadlines.map(d => (
                <div key={d.id} className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-white truncate">{d.title}</span>
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
                      {d.priority}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                    {d.dueDate}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Events Box */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-purple-400" />
                <span>Campus Events</span>
              </h3>
              <button
                onClick={() => onNavigate('events')}
                className="text-[11px] font-semibold text-blue-400 hover:text-blue-300"
              >
                Explore
              </button>
            </div>

            <div className="space-y-2">
              {upcomingEvents.map(e => (
                <div key={e.id} className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-white truncate">{e.title}</span>
                    <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400 shrink-0">
                      {e.category}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                    {e.date} &bull; {e.location}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 8. QUICK ASK AI BAR & CHIPS */}
      {/* ============================================================ */}
      <div className="pt-1">
        <form onSubmit={handleAiSubmit} className="relative">
          <input
            type="text"
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            placeholder="Ask CampusOS anything... ('Can I skip tomorrow's class?')"
            className="w-full pl-4 pr-12 py-3 bg-slate-900/90 border border-slate-800 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors shadow-inner"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-sm transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="flex items-center gap-2 mt-2.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          {[
            "Can I skip tomorrow's DBMS class?",
            "Why is my attendance low?",
            "What should I do between classes?",
            "What deadlines do I have?"
          ].map((promptText, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handlePrompt(promptText)}
              className="px-3 py-1 rounded-xl bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800/90 whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3 h-3 text-blue-400" />
              <span>{promptText}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Modals */}
      <MyAttendanceModal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        onAskAI={(prompt) => {
          setIsAttendanceModalOpen(false);
          onNavigate('ai', { initialPrompt: prompt });
        }}
      />

      <AttendanceInsightsModal
        isOpen={isInsightsModalOpen}
        onClose={() => setIsInsightsModalOpen(false)}
        onAskAI={(prompt) => {
          setIsInsightsModalOpen(false);
          onNavigate('ai', { initialPrompt: prompt });
        }}
      />
    </div>
  );
};
