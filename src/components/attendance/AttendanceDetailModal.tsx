import React from 'react';
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  TrendingDown, 
  TrendingUp, 
  Calendar, 
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { AttendanceRecord } from '../../types';

interface AttendanceDetailModalProps {
  record: AttendanceRecord | null;
  onClose: () => void;
  onAskAI: (prompt: string) => void;
}

export const AttendanceDetailModal: React.FC<AttendanceDetailModalProps> = ({
  record,
  onClose,
  onAskAI
}) => {
  if (!record) return null;

  const isLow = record.percentage < 75;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl overflow-hidden animate-slide-up">
        
        {/* Background glow */}
        <div className={`absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl pointer-events-none ${
          isLow ? 'bg-rose-500/15' : 'bg-emerald-500/15'
        }`} />

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-blue-400 border border-slate-700">
                {record.subjectCode}
              </span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                isLow 
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              }`}>
                {record.status}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1">{record.subjectName}</h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Big Percentage & Metric Grid */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 mb-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider block">Attendance Rate</span>
            <div className="text-3xl font-extrabold text-white font-mono flex items-baseline gap-1.5 mt-0.5">
              <span className={isLow ? 'text-rose-400' : 'text-emerald-400'}>
                {record.percentage}%
              </span>
              <span className="text-xs font-normal text-slate-500">/ 100%</span>
            </div>
            <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
              {isLow ? (
                <>
                  <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-rose-300 font-medium">Below 75% cutoff</span>
                </>
              ) : (
                <>
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300 font-medium">Safe from debarment</span>
                </>
              )}
            </span>
          </div>

          <div className="text-right space-y-1 text-xs border-l border-slate-800/80 pl-4 font-mono">
            <div>
              <span className="text-slate-500">Attended: </span>
              <span className="font-bold text-emerald-400">{record.attendedClasses}</span>
            </div>
            <div>
              <span className="text-slate-500">Missed: </span>
              <span className="font-bold text-rose-400">{record.missedClasses}</span>
            </div>
            <div className="pt-1 border-t border-slate-800 text-slate-300">
              <span className="text-slate-500">Total: </span>
              <span className="font-bold text-white">{record.totalClasses}</span>
            </div>
          </div>
        </div>

        {/* Actionable Requirement Card */}
        {isLow && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-4 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-300 leading-relaxed">
              <strong>Requirement:</strong> You must attend your next{' '}
              <span className="font-bold underline text-white font-mono">{record.requiredClassesToReach75} consecutive classes</span>{' '}
              to reach the mandatory 75% threshold.
            </div>
          </div>
        )}

        {/* Recent Class History Timeline */}
        <div className="mb-4">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <span>Recent Sessions</span>
          </h4>

          <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
            {record.recentHistory.map((item, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/60 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  {item.status === 'Present' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <div>
                    <span className="font-semibold text-slate-200 block text-[11px] leading-tight">
                      {item.topic}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {item.date} &bull; {item.day}
                    </span>
                  </div>
                </div>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  item.status === 'Present'
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-rose-500/10 text-rose-400'
                }`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Action Button */}
        <button
          onClick={() => {
            onClose();
            onAskAI(`Can I skip tomorrow's ${record.subjectName} class?`);
          }}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-glow-sm transition-all flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>Ask AI: Can I skip tomorrow's class?</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
