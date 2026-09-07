import { supabase, isSupabaseConfigured } from './supabaseClient';

/**
 * Admin-specific data access (Phase 2: dashboard aggregates + charts).
 *
 * Rules:
 * - Reads go straight to Supabase under the administrator's own session,
 *   so RLS staff/faculty policies constrain every row.
 * - NEVER uses mockData or the student offline fallback.
 * - Every function THROWS on error or when unconfigured (fail closed);
 *   callers render an error state instead of fallback data.
 */

function db() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase backend is not configured.');
  }
  return supabase;
}

export interface AdminUpcomingEvent {
  id: string;
  title: string;
  dateText: string;
  location: string;
  registeredCount: number;
  maxSeats: number;
}

export interface AdminDashboardMetrics {
  totalStudents: number;
  averageAttendance: number;
  atRiskCount: number;
  activeTickets: number;
  upcomingEvents: AdminUpcomingEvent[];
}

export interface AttendanceDistribution {
  range: string;
  count: number;
}

export interface TicketStatusData {
  status: string;
  count: number;
  color: string;
}

export interface EventRegistrationData {
  event: string;
  registered: number;
  capacity: number;
}

/**
 * Phase 2 dashboard metrics computed live from Supabase.
 * Active tickets = tickets not yet Resolved (Closed arrives in a later phase).
 */
export async function getDashboardMetrics(): Promise<AdminDashboardMetrics> {
  const client = db();

  const studentsRes = await client
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'student');
  if (studentsRes.error) throw studentsRes.error;

  const attendanceRes = await client.from('attendance_records').select('percentage');
  if (attendanceRes.error) throw attendanceRes.error;

  const ticketsRes = await client
    .from('helpdesk_tickets')
    .select('id', { count: 'exact', head: true })
    .not('status', 'in', '(Resolved,Closed)');
  if (ticketsRes.error) throw ticketsRes.error;

  const eventsRes = await client
    .from('events')
    .select('id, title, date_text, location, registered_count, max_seats')
    .eq('is_past', false)
    .order('created_at', { ascending: true })
    .limit(5);
  if (eventsRes.error) throw eventsRes.error;

  const percentages = (attendanceRes.data ?? []).map((r: { percentage: number }) => Number(r.percentage));
  const averageAttendance =
    percentages.length > 0
      ? Math.round((percentages.reduce((a, b) => a + b, 0) / percentages.length) * 10) / 10
      : 0;
  const atRiskCount = percentages.filter((p) => p < 75).length;

  return {
    totalStudents: studentsRes.count ?? 0,
    averageAttendance,
    atRiskCount,
    activeTickets: ticketsRes.count ?? 0,
    upcomingEvents: (eventsRes.data ?? []).map((e) => ({
      id: e.id as string,
      title: e.title as string,
      dateText: e.date_text as string,
      location: e.location as string,
      registeredCount: (e.registered_count ?? 0) as number,
      maxSeats: (e.max_seats ?? 0) as number,
    })),
  };
}

/**
 * Attendance distribution for bar chart: buckets of percentage ranges.
 */
export async function getAttendanceDistribution(): Promise<AttendanceDistribution[]> {
  const client = db();
  const { data, error } = await client.from('attendance_records').select('percentage');
  if (error) throw error;

  const buckets = [
    { range: '0-49%', min: 0, max: 49 },
    { range: '50-59%', min: 50, max: 59 },
    { range: '60-69%', min: 60, max: 69 },
    { range: '70-74%', min: 70, max: 74 },
    { range: '75-79%', min: 75, max: 79 },
    { range: '80-89%', min: 80, max: 89 },
    { range: '90-100%', min: 90, max: 100 },
  ];

  const attendancePctData = (data ?? []).map((r: { percentage: number }) => Number(r.percentage));
  return buckets.map((b) => ({
    range: b.range,
    count: attendancePctData.filter((p) => p >= b.min && p <= b.max).length,
  }));
}

/**
 * Ticket status distribution for pie chart.
 */
export async function getTicketStatusDistribution(): Promise<TicketStatusData[]> {
  const client = db();
  const { data, error } = await client
    .from('helpdesk_tickets')
    .select('status');
  if (error) throw error;

  const counts = (data ?? []).reduce((acc: Record<string, number>, row: { status: string }) => {
    acc[row.status] = (acc[row.status] ?? 0) + 1;
    return acc;
  }, {});

  const statusColors: Record<string, string> = {
    Pending: '#f59e0b',
    Assigned: '#8b5cf6',
    'In Progress': '#3b82f6',
    Resolved: '#22c55e',
    Closed: '#64748b',
  };

  return Object.entries(counts).map(([status, count]) => ({
    status,
    count,
    color: statusColors[status] ?? '#64748b',
  }));
}

/**
 * Event registration data for bar chart.
 */
export async function getEventRegistrationData(): Promise<EventRegistrationData[]> {
  const client = db();
  const { data, error } = await client
    .from('events')
    .select('title, registered_count, max_seats')
    .eq('is_past', false)
    .order('created_at', { ascending: true })
    .limit(6);
  if (error) throw error;

  return (data ?? []).map((e: any) => ({
    event: e.title.length > 20 ? e.title.slice(0, 20) + '…' : e.title,
    registered: e.registered_count ?? 0,
    capacity: e.max_seats ?? 0,
  }));
}
