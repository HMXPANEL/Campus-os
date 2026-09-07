import React, { useState } from 'react';
import { 
  X, 
  ChevronRight, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2
} from 'lucide-react';
import { useCampusStore } from '../../services/campusStore';
import { AttendanceRecord } from '../../types';
import { AttendanceDetailModal } from './AttendanceDetailModal';
import { AttendanceInsightsModal } from './AttendanceInsightsModal';

interface MyAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAskAI: (prompt: string) => void;
}

export const MyAttendanceModal: React.FC<MyAttendanceModalProps> = ({
  isOpen,
  onClose,
  onAskAI
}) => {
  const store = useCampusStore();
  const student = store.getStudent();
  const attendance = store.getAttendance();

  const [selectedSemester, setSelectedSemester] = useState('Semester 5');
  const [selectedPeriod, setSelectedPeriod] = useState<'All' | 'Month'>('All');
  const [activeDetailRecord, setActiveDetailRecord] = useState<AttendanceRecord | null>(null);
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl overflow-hidden animate-slide-up my-auto max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">My Attendance</h2>
            <p className="text-xs text-slate-400">Institutional records &bull; Verified</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsInsightsOpen(true)}
              className="px-2.5 py-1 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Insights</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          
          {/* Controls: Semester Dropdown & Period */}
          <div className="flex items-center justify-between gap-3">
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-blue-500"
            >
              <option value="Semester 5">Semester 5 (Current)</option>
              <option value="Semester 4">Semester 4 (Spring 2026)</option>
              <option value="Semester 3">Semester 3 (Fall 2025)</option>
            </select>

            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
              <button
                onClick={() => setSelectedPeriod('All')}
                className={`px-2.5 py-0.5 rounded-lg transition-colors font-medium ${
                  selectedPeriod === 'All' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400'
                }`}
              >
                All Time
              </button>
              <button
                onClick={() => setSelectedPeriod('Month')}
                className={`px-2.5 py-0.5 rounded-lg transition-colors font-medium ${
                  selectedPeriod === 'Month' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400'
                }`}
              >
                This Month
              </button>
            </div>
          </div>

          {/* Overall Attendance Summary Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 via-slate-950/60 to-slate-900/40 border border-blue-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-800"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-blue-500"
                    strokeDasharray={`${student.overallAttendance}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute font-extrabold text-sm text-white font-mono">
                  {student.overallAttendance}%
                </span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 uppercase font-medium tracking-wider block">
                  Overall Aggregate
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-bold text-white font-mono">
                    {student.totalClassesAttended}/{student.totalClassesHeld} Classes
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                    {student.attendanceMonthlyChange}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsInsightsOpen(true)}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 shrink-0"
            >
              <span>AI Insights</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Subject Attendance Cards */}
          <div className="space-y-2.5">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
              Registered Course Breakdowns
            </div>

            {attendance.map((sub) => {
              const isLow = sub.percentage < 75;

              return (
                <div
                  key={sub.id}
                  onClick={() => setActiveDetailRecord(sub)}
                  className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all flex flex-col justify-between group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-300">
                        {sub.subjectCode}
                      </span>
                      <span className="text-xs font-semibold text-white truncate group-hover:text-blue-400 transition-colors">
                        {sub.subjectName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-bold font-mono ${
                        isLow ? 'text-rose-400' : 'text-emerald-400'
                      }`}>
                        {sub.percentage}%
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-blue-400 transition-colors" />
                    </div>
                  </div>

                  {/* Visual Progress Track */}
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isLow ? 'bg-rose-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${sub.percentage}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>
                      {sub.attendedClasses} / {sub.totalClasses} classes attended
                    </span>

                    {isLow ? (
                      <span className="text-rose-400 font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Needs {sub.requiredClassesToReach75} classes
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Safe
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500 italic">
            Tap any course for full history & skip prediction
          </span>
          <button
            onClick={() => {
              onClose();
              onAskAI("Can I skip tomorrow's DBMS class?");
            }}
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            <span>Ask AI</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Sub-Modals */}
      <AttendanceDetailModal
        record={activeDetailRecord}
        onClose={() => setActiveDetailRecord(null)}
        onAskAI={onAskAI}
      />

      <AttendanceInsightsModal
        isOpen={isInsightsOpen}
        onClose={() => setIsInsightsOpen(false)}
        onAskAI={onAskAI}
      />
    </div>
  );
};
