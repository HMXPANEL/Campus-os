import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Construction } from 'lucide-react';

interface AdminPlaceholderProps {
  title: string;
  phase: number;
  description?: string;
}

/**
 * Honest stand-in for Phase 2+ modules. Rendered inside the guarded shell,
 * so it is only ever visible to roles allowed on the route.
 */
export const AdminPlaceholder: React.FC<AdminPlaceholderProps> = ({ title, phase, description }) => {
  return (
    <div className="max-w-xl mx-auto mt-10 p-8 rounded-3xl glass-panel text-center space-y-4 animate-fade-in">
      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mx-auto">
        <Construction className="w-6 h-6" />
      </div>
      <div>
        <h1 className="text-xl font-bold text-white">{title}</h1>
        <p className="text-xs text-slate-400 mt-1">
          {description ?? 'Full management interface arrives in a later implementation phase.'}
        </p>
      </div>
      <span className="inline-block text-[11px] font-mono px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
        Scheduled · Phase {phase}
      </span>
      <div>
        <Link
          to="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    </div>
  );
};
