import React from 'react';
import { 
  GraduationCap, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight
} from 'lucide-react';

interface PortalSelectProps {
  onSelectStudent: () => void;
  onSelectAdmin: () => void;
}

export const PortalSelect: React.FC<PortalSelectProps> = ({ onSelectStudent, onSelectAdmin }) => {
  return (
    <div className="min-h-screen bg-campus-bg relative flex flex-col justify-between overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      {/* Subtle background ambient gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-indigo-600/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 max-w-5xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-glow-sm">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              CampusOS
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                v1.0
              </span>
            </span>
          </div>
        </div>
        <div className="text-xs text-campus-textMuted hidden sm:block">
          Smart Campus Operating System
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-4xl mx-auto w-full my-auto py-12 flex flex-col items-center text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-blue-400 text-xs font-medium mb-5 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>Smarter Attendance. Brighter Tomorrow.</span>
        </div>

        {/* Hero Title & Tagline */}
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white max-w-xl leading-tight">
          Choose Your Portal
        </h1>

        <p className="mt-2 text-sm sm:text-base text-campus-textMuted max-w-md">
          Access your role-specific experience on CampusOS.
        </p>

        {/* Portal Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-xl mt-8 text-left">
          {/* Student Portal Card */}
          <button
            onClick={onSelectStudent}
            className="group relative p-6 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-blue-950/30 border border-blue-500/30 hover:border-blue-400 hover:shadow-glow-sm transition-all duration-300 flex flex-col justify-between text-left overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-28 h-28 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-colors" />

            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 mb-4">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                  Student
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  Secure Sign-In
                </span>
              </div>
              <p className="mt-1.5 text-xs text-campus-textMuted leading-relaxed">
                Track attendance, classes, academic records, and campus services with your college credentials.
              </p>
            </div>

            <div className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-blue-400 group-hover:translate-x-1 transition-transform">
              <span>Enter Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>

          {/* Admin Portal Card */}
          <button
            onClick={onSelectAdmin}
            className="group relative p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-blue-500/40 transition-all duration-300 flex flex-col justify-between text-left overflow-hidden"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-200 group-hover:text-blue-400 transition-colors">
                  Admin
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                  Restricted
                </span>
              </div>
              <p className="mt-1.5 text-xs text-campus-textMuted leading-relaxed">
                Manage campus operations, faculty schedules, and administrative permissions.
              </p>
            </div>

            <div className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-blue-400 group-hover:translate-x-1 transition-transform">
              <span>Sign In with Admin Credentials</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>

        <p className="text-xs text-slate-500 mt-6">
          One campus. Many possibilities.
        </p>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-5xl mx-auto w-full text-center text-xs text-campus-textSubtle py-4 border-t border-slate-800/60">
        CampusOS Enterprise Edition &bull; Designed for Smart Universities &bull; All Rights Reserved
      </footer>
    </div>
  );
};
