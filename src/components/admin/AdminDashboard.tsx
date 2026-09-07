import React, { useEffect, useState } from 'react';
import { AlertTriangle, Calendar, GraduationCap, LifeBuoy, RefreshCw, TrendingUp, Users } from 'lucide-react';
import { getDashboardMetrics, type AdminDashboardMetrics } from '../../services/adminApi';

/**
 * Phase 1 Admin Dashboard: five live metrics from Supabase.
 * Fail-closed: errors render an error state — never mock data, never the
 * student offline fallback.
 */
export const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setMetrics(await getDashboardMetrics());
    } catch (e) {
      setMetrics(null);
      setError(e instanceof Error ? e.message : 'Could not load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400 text-sm gap-3">
        <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        <span>Loading live campus metrics…</span>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="max-w-xl mx-auto mt-10 p-8 rounded-3xl glass-panel border-rose-500/30 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Dashboard unavailable</h2>
        <p className="text-xs text-slate-400">{error ?? 'Metrics could not be loaded.'}</p>
        <button
          onClick={() => void load()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  const cards = [
    {
      label: 'Total Students',
      value: String(metrics.totalStudents),
      sub: 'Enrolled profiles',
      icon: Users,
      accent: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    },
    {
      label: 'Average Attendance',
      value: `${metrics.averageAttendance}%`,
      sub: 'Across all records',
      icon: TrendingUp,
      accent: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      label: 'Attendance Risk',
      value: String(metrics.atRiskCount),
      sub: 'Records below 75%',
      icon: AlertTriangle,
      accent: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    },
    {
      label: 'Active Helpdesk Tickets',
      value: String(metrics.activeTickets),
      sub: 'Unresolved campus issues',
      icon: LifeBuoy,
      accent: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Operations Overview</h1>
        <p className="text-xs text-slate-400 mt-1">Live campus metrics from Supabase · Phase 1</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-400">{card.label}</span>
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${card.accent}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-white font-mono tracking-tight">{card.value}</div>
              <div className="text-[11px] text-slate-500 mt-1">{card.sub}</div>
            </div>
          );
        })}
      </div>

      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-bold text-white">Upcoming Events</h2>
        </div>
        {metrics.upcomingEvents.length === 0 ? (
          <p className="text-xs text-slate-500">No upcoming events published.</p>
        ) : (
          <div className="divide-y divide-slate-800/70">
            {metrics.upcomingEvents.map((event) => (
              <div key={event.id} className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{event.title}</div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    {event.dateText} &bull; {event.location}
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 font-mono shrink-0">
                  {event.registeredCount}/{event.maxSeats}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 text-[11px] text-slate-600">
        <GraduationCap className="w-3.5 h-3.5" />
        <span>Full management modules unlock in later phases — see the P-badge on each nav item.</span>
      </div>
    </div>
  );
};
