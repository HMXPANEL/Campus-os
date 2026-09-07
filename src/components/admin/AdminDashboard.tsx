import React, { useEffect, useState } from 'react';
import { AlertTriangle, GraduationCap, LifeBuoy, RefreshCw, TrendingUp, Users, BarChart3, Activity } from 'lucide-react';
import { getDashboardMetrics, type AdminDashboardMetrics, getAttendanceDistribution, getTicketStatusDistribution, getEventRegistrationData, type AttendanceDistribution, type TicketStatusData, type EventRegistrationData } from '../../services/adminApi';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const ATTENDANCE_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#16a34a'];

export const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [attendanceDist, setAttendanceDist] = useState<AttendanceDistribution[]>([]);
  const [ticketStatus, setTicketStatus] = useState<TicketStatusData[]>([]);
  const [eventRegData, setEventRegData] = useState<EventRegistrationData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [metricsData, attendanceDistData, ticketStatusData, eventRegData] = await Promise.all([
        getDashboardMetrics(),
        getAttendanceDistribution(),
        getTicketStatusDistribution(),
        getEventRegistrationData(),
      ]);
      setMetrics(metricsData);
      setAttendanceDist(attendanceDistData);
      setTicketStatus(ticketStatusData);
      setEventRegData(eventRegData);
    } catch (e) {
      setMetrics(null);
      setAttendanceDist([]);
      setTicketStatus([]);
      setEventRegData([]);
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

  const attendanceChart = attendanceDist.length > 0 ? (
    <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-4 h-4 text-blue-400" />
        <h2 className="text-sm font-bold text-white">Attendance Distribution</h2>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={attendanceDist} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis dataKey="range" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} width={80} />
            <Tooltip
              formatter={(value) => [String(value), 'records']}
              contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {attendanceDist.map((_, index) => (
                <Cell key={`cell-${index}`} fill={ATTENDANCE_COLORS[index % ATTENDANCE_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-slate-500 mt-2 text-center">Attendance records grouped by percentage range</p>
    </div>
  ) : null;

  const ticketStatusChart = ticketStatus.length > 0 ? (
    <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
      <div className="flex items-center gap-2 mb-4">
        <PieChart className="w-4 h-4 text-amber-400" />
        <h2 className="text-sm font-bold text-white">Ticket Status</h2>
      </div>
      <div className="h-64 flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={ticketStatus}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              dataKey="count"
              nameKey="status"
              label={({ payload }) => `${payload.status}: ${payload.count}`}
              labelLine={false}
            >
              {ticketStatus.map((entry) => (
                <Cell key={entry.status} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => [String(value), 'tickets']}
              contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  ) : null;

  const eventRegChart = eventRegData.length > 0 ? (
    <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4 text-pink-400" />
        <h2 className="text-sm font-bold text-white">Event Registrations</h2>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={eventRegData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis dataKey="event" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} width={120} />
            <Tooltip
              formatter={(value, name) => [String(value), name]}
              contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
            />
            <Legend />
            <Bar dataKey="registered" radius={[0, 4, 4, 0]} fill="#3b82f6" name="Registered" />
            <Bar dataKey="capacity" radius={[0, 4, 4, 0]} fill="#1e293b" name="Capacity" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  ) : null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Operations Overview</h1>
        <p className="text-xs text-slate-400 mt-1">Live campus metrics from Supabase · Phase 2</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {attendanceChart}
        {ticketStatusChart}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {eventRegChart}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-blue-400" />
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
      </div>

      <div className="flex items-center gap-2 text-[11px] text-slate-600">
        <GraduationCap className="w-3.5 h-3.5" />
        <span>Full management modules unlock in later phases — see the P-badge on each nav item.</span>
      </div>
    </div>
  );
};