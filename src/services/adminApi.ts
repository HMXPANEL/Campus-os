import { supabase, isSupabaseConfigured } from './supabaseClient';

/**
 * Admin-specific data access (Phase 1: dashboard aggregates only).
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

/**
 * Phase 1 dashboard metrics computed live from Supabase.
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
    .neq('status', 'Resolved');
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
