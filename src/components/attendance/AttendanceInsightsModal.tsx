import React from 'react';
import { 
  X, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  BellRing, 
  Video, 
  CalendarDays
} from 'lucide-react';
import { useCampusStore } from '../../services/campusStore';

interface AttendanceInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAskAI: (prompt: string) => void;
}

export const AttendanceInsightsModal: React.FC<AttendanceInsightsModalProps> = ({
  isOpen,
  onClose,
  onAskAI
}) => {
  const store = useCampusStore();
  const atRisk = store.getAtRiskSubjects();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl overflow-hidden animate-slide-up">
        
        {/* Background ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-blue-600/15 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Attendance Insights</h3>
              <p className="text-[11px] text-slate-400">CampusOS AI Diagnostics</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Risk Banner */}
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 mb-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-rose-300">
              Your attendance is at risk in {atRisk.length} subjects
            </h4>
            <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
              {atRisk.map(a => `${a.subjectName} (${a.percentage}%)`).join(' and ')} are currently below the university's 75% requirement.
            </p>
          </div>
        </div>

        {/* Subject Risk Badges */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {atRisk.map((subj) => (
            <div
              key={subj.id}
              className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between"
            >
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono block">{subj.subjectCode}</span>
                <span className="text-xs font-bold text-white block truncate">{subj.subjectName}</span>
              </div>
              <span className="text-sm font-extrabold text-rose-400 font-mono">
                {subj.percentage}%
              </span>
            </div>
          ))}
        </div>

        {/* AI Recommendations List */}
        <div className="space-y-2 mb-5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
            AI Strategic Recommendations
          </div>

          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-start gap-2.5 text-xs text-slate-200">
            <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block text-white">
                {atRisk.length > 0
                  ? `Attend your next ${atRisk[0].requiredClassesToReach75} ${atRisk[0].subjectName} classes`
                  : 'Keep your attendance streak going'}
              </span>
              <span className="text-[11px] text-slate-400">
                {atRisk.length > 0
                  ? `Halts further decline and moves you toward the 75% requirement (currently ${atRisk[0].percentage}%).`
                  : 'All subjects currently meet the 75% requirement.'}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-start gap-2.5 text-xs text-slate-200">
            <CalendarDays className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block text-white">Avoid missing consecutive sessions</span>
              <span className="text-[11px] text-slate-400">Missing 2 back-to-back lectures triggers parent SMS alert.</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-start gap-2.5 text-xs text-slate-200">
            <Video className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block text-white">Use weekend remedial sessions</span>
              <span className="text-[11px] text-slate-400">Ask your faculty mentor about compensation lectures for weak subjects.</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-start gap-2.5 text-xs text-slate-200">
            <BellRing className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block text-white">Set timetable push reminders</span>
              <span className="text-[11px] text-slate-400">CampusOS can alert you before your morning lectures.</span>
            </div>
          </div>
        </div>

        {/* Action Button: Ask AI */}
        <div className="pt-2 border-t border-slate-800/80">
          <button
            onClick={() => {
              onClose();
              onAskAI("Can I skip tomorrow's DBMS class?");
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-glow-sm transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>Ask: Can I skip tomorrow's DBMS class?</span>
            </div>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
