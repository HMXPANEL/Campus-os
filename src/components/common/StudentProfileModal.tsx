import React from 'react';
import { 
  X, 
  LogOut, 
  GraduationCap, 
  Mail, 
  Award, 
  Activity, 
  ShieldCheck,
  Phone,
  UserCheck
} from 'lucide-react';
import { useCampusStore } from '../../services/campusStore';

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({ isOpen, onClose, onLogout }) => {
  const store = useCampusStore();
  const student = store.getStudent();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl overflow-hidden animate-slide-up">
        
        {/* Background ambient accents */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header / Digital ID Banner */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <img
              src={student.avatarUrl}
              alt={student.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-500 shadow-glow-sm"
            />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
              <ShieldCheck className="w-3 h-3 text-white" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-white">{student.name}</h3>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {student.id}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{student.department}</p>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
              <span>{student.year} ({student.semester})</span>
              <span>&bull;</span>
              <span>Section {student.section}</span>
            </div>
          </div>
        </div>

        {/* Academic Overview Metrics */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/90 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Cumulative CGPA</span>
              <div className="text-lg font-bold text-white flex items-baseline gap-1">
                {student.cgpa}
                <span className="text-xs font-normal text-slate-500">/ 10.0</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/90 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Attendance</span>
              <div className="text-lg font-bold text-white flex items-baseline gap-1">
                {student.overallAttendance}%
                <span className="text-xs font-normal text-emerald-400">Good</span>
              </div>
            </div>
          </div>
        </div>

        {/* Read-Only Details List */}
        <div className="space-y-2.5 bg-slate-950/40 rounded-2xl p-4 border border-slate-800/70 text-xs">
          <div className="flex items-center justify-between py-1 border-b border-slate-800/50">
            <span className="text-slate-400 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-slate-500" /> College Email
            </span>
            <span className="font-mono text-slate-200">{student.email}</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-800/50">
            <span className="text-slate-400 flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-slate-500" /> Mobile Contact
            </span>
            <span className="font-mono text-slate-200">{student.phone || '+91 98765 43210'}</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-800/50">
            <span className="text-slate-400 flex items-center gap-2">
              <UserCheck className="w-3.5 h-3.5 text-slate-500" /> Faculty Mentor
            </span>
            <span className="text-slate-200 font-medium">{student.mentor || 'Dr. Anand Verma'}</span>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="text-slate-400 flex items-center gap-2">
              <GraduationCap className="w-3.5 h-3.5 text-slate-500" /> Degree Program
            </span>
            <span className="text-slate-200">B.Tech Computer Science (2024–2028)</span>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 italic mt-3 text-center">
          Academic records are managed centrally by the Registrar. Information cannot be self-modified.
        </p>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-800">
          <span className="text-xs text-slate-500">
            CampusOS Session Active
          </span>
          <button
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
