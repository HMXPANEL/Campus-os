import { supabase, isSupabaseConfigured, DEMO_PROFILE_ID } from './supabaseClient';
import type {
  AttendanceRecord,
  CanteenMenuItem,
  CanteenStatus,
  DeadlineItem,
  EventItem,
  FacilityItem,
  GradeItem,
  HelpdeskTicket,
  LibraryBook,
  LibrarySeatAvailability,
  NotificationItem,
  Student,
  TimetableSlot,
  TransportRoute,
} from '../types';

function timeToHHMM(t: string): string {
  return t.slice(0, 5);
}

function fmtDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

async function activeStudentId(): Promise<string> {
  // Prefer the authenticated Supabase user's profile id; fall back to the demo profile.
  try {
    if (supabase) {
      const { data } = await supabase.auth.getUser();
      if (data.user?.id) return data.user.id;
    }
  } catch {
    /* ignore - offline fallback */
  }
  return DEMO_PROFILE_ID;
}

export async function fetchStudent(): Promise<Student | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const sid = await activeStudentId();
  // Try the authenticated/demostudent profile; fall back to demo row for anon catalog access.
  let row: any = null;
  const attempt = await supabase
    .from('profiles')
    .select('id, student_no, email, full_name, year_text, section, cgpa, phone, mentor, avatar_url, department_id, semester_id, departments(name), semesters(name)')
    .eq('id', sid)
    .maybeSingle();
  row = attempt.data;
  if (!row) {
    const demo = await supabase
      .from('profiles')
      .select('id, student_no, email, full_name, year_text, section, cgpa, phone, mentor, avatar_url, department_id, semester_id, departments(name), semesters(name)')
      .eq('id', DEMO_PROFILE_ID)
      .maybeSingle();
    row = demo.data;
  }
  if (!row) return null;

  const deptName: string =
    (Array.isArray(row.departments) ? row.departments[0]?.name : (row.departments as any)?.name) ||
    'Computer Science & Engineering';
  const semName: string =
    (Array.isArray(row.semesters) ? row.semesters[0]?.name : (row.semesters as any)?.name) ||
    'Semester 5';

  // Aggregates for the hero card
  let attended = 0;
  let held = 0;
  let atRisk = 0;
  try {
    const att = await supabase.from('attendance_records').select('attended, total, percentage').eq('student_id', row.id);
    for (const r of att.data ?? []) {
      attended += r.attended ?? 0;
      held += r.total ?? 0;
      if ((r.percentage ?? 0) < 75) atRisk += 1;
    }
  } catch {
    /* keep zeros */
  }

  return {
    id: row.student_no ?? row.id.slice(0, 7).toUpperCase(),
    name: row.full_name,
    email: row.email,
    department: deptName,
    year: row.year_text ?? '3rd Year',
    semester: semName,
    section: row.section ?? 'A',
    cgpa: Number(row.cgpa ?? 0),
    overallAttendance: held > 0 ? Math.round((attended / held) * 1000) / 10 : 0,
    attendanceMonthlyChange: '+2.1% this month',
    totalClassesAttended: attended,
    totalClassesMissed: Math.max(0, held - attended),
    totalClassesHeld: held,
    atRiskSubjectsCount: atRisk,
    avatarUrl:
      row.avatar_url ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    phone: row.phone ?? undefined,
    mentor: row.mentor ?? undefined,
  };
}

export async function fetchTimetable(): Promise<TimetableSlot[] | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase
    .from('timetable_slots')
    .select('legacy_id, subject_code, subject_name, day, start_time, end_time, room, faculty_name, slot_type, status')
    .order('day', { ascending: true })
    .order('start_time', { ascending: true });
  if (error || !data) return null;
  return data.map((r: any, i: number) => ({
    id: r.legacy_id ?? `tt-${i}`,
    dayOfWeek: r.day,
    startTime: timeToHHMM(String(r.start_time)),
    endTime: timeToHHMM(String(r.end_time)),
    subjectCode: r.subject_code,
    subjectName: r.subject_name,
    room: r.room,
    faculty: r.faculty_name,
    status: r.status,
    type: r.slot_type,
  }));
}

export async function fetchAttendance(): Promise<AttendanceRecord[] | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const sid = await activeStudentId();
  const tryIds = sid === DEMO_PROFILE_ID ? [sid] : [sid, DEMO_PROFILE_ID];
  for (const id of tryIds) {
    const { data, error } = await supabase
      .from('attendance_records')
      .select(
        'id, attended, missed, total, percentage, is_low, health_status, required_to_75, trend, last_updated, subjects(code, name), attendance_history(class_date, day_text, mark, topic)'
      )
      .eq('student_id', id)
      .order('id');
    if (!error && data && data.length > 0) {
      return data.map((r: any) => ({
        id: r.id,
        subjectCode: r.subjects?.code ?? '—',
        subjectName: r.subjects?.name ?? '—',
        attendedClasses: r.attended,
        missedClasses: r.missed,
        totalClasses: r.total,
        percentage: Number(r.percentage),
        isLow: Boolean(r.is_low),
        status: r.health_status,
        requiredClassesToReach75: r.required_to_75 ?? 0,
        lastUpdated: r.last_updated ? fmtDateTime(r.last_updated) : 'Recently',
        trend: r.trend ?? '+0.0%',
        recentHistory: (r.attendance_history ?? [])
          .slice()
          .sort((a: any, b: any) => (a.class_date < b.class_date ? 1 : -1))
          .slice(0, 5)
          .map((h: any) => ({
            date: new Date(h.class_date).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
            day: h.day_text,
            status: h.mark as 'Present' | 'Absent',
            topic: h.topic,
          })),
      }));
    }
  }
  return null;
}

export async function fetchGrades(): Promise<GradeItem[] | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const sid = await activeStudentId();
  for (const id of sid === DEMO_PROFILE_ID ? [sid] : [sid, DEMO_PROFILE_ID]) {
    const { data, error } = await supabase
      .from('grades')
      .select('id, credits, internal_score, internal_max, exam_score, exam_max, grade, grade_points, remarks, subjects(code, name)')
      .eq('student_id', id);
    if (!error && data && data.length > 0) {
      return data.map((g: any) => ({
        id: g.id,
        subjectCode: g.subjects?.code ?? '—',
        subjectName: g.subjects?.name ?? '—',
        credits: g.credits,
        internalMarks: { score: g.internal_score, max: g.internal_max },
        examMarks: { score: g.exam_score, max: g.exam_max },
        overallGrade: g.grade,
        gradePoints: g.grade_points,
        remarks: g.remarks ?? undefined,
      }));
    }
  }
  return null;
}

export async function fetchDeadlines(): Promise<DeadlineItem[] | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const sid = await activeStudentId();
  const { data, error } = await supabase
    .from('deadlines')
    .select('id, legacy_id, title, category, due_text, priority, status, course_code, description, deadline_completions(student_id, is_completed)')
    .order('created_at', { ascending: true });
  if (error || !data) return null;
  return data.map((d: any) => {
    const mine = (d.deadline_completions ?? []).find((c: any) => c.student_id === sid);
    const completed = mine ? Boolean(mine.is_completed) : d.status === 'Completed';
    return {
      id: d.legacy_id ?? d.id,
      title: d.title,
      category: d.category,
      dueDate: d.due_text,
      priority: d.priority,
      status: completed ? 'Completed' : 'Pending',
      courseCode: d.course_code ?? undefined,
      description: d.description ?? undefined,
    } as DeadlineItem;
  });
}

export async function fetchEvents(): Promise<EventItem[] | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const sid = await activeStudentId();
  const { data, error } = await supabase
    .from('events')
    .select('id, legacy_id, title, description, date_text, time_text, location, organizer, category, registration_deadline_text, max_seats, registered_count, banner_image, tags, is_past')
    .order('is_past', { ascending: true })
    .order('created_at', { ascending: true });
  if (error || !data) return null;
  let myRegs = new Set<string>();
  try {
    const regs = await supabase.from('event_registrations').select('event_id').eq('student_id', sid);
    myRegs = new Set((regs.data ?? []).map((r: any) => r.event_id));
  } catch {
    /* anon users cannot read registrations - all unregistered */
  }
  return data.map((e: any) => ({
    id: e.legacy_id ?? e.id,
    title: e.title,
    description: e.description,
    date: e.date_text,
    time: e.time_text,
    location: e.location,
    organizer: e.organizer,
    category: e.category,
    isRegistered: myRegs.has(e.id),
    registrationDeadline: e.registration_deadline_text ?? '',
    maxSeats: e.max_seats,
    registeredCount: e.registered_count,
    bannerImage: e.banner_image ?? '',
    tags: e.tags ?? [],
    isPast: Boolean(e.is_past),
  }));
}

export async function fetchCanteen(): Promise<{ status: CanteenStatus; menu: CanteenMenuItem[] } | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data: canteens } = await supabase.from('canteens').select('*').limit(1);
  const canteen = (canteens ?? [])[0];
  if (!canteen) return null;
  const { data: menu } = await supabase.from('canteen_menu_items').select('*').eq('canteen_id', canteen.id);
  return {
    status: {
      canteenName: canteen.name,
      crowdLevel: canteen.crowd_level,
      estimatedWaitMinutes: canteen.wait_minutes,
      isOpen: canteen.is_open,
      openingHours: canteen.opening_hours,
    },
    menu: (menu ?? []).map((m: any) => ({
      id: m.legacy_id ?? m.id,
      canteenName: canteen.name,
      name: m.name,
      price: Number(m.price),
      category: m.category,
      isAvailable: m.is_available,
      preparationTimeMin: m.prep_minutes,
      calories: m.calories ?? undefined,
    })),
  };
}

export async function fetchFacilities(): Promise<FacilityItem[] | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase.from('facilities').select('*');
  if (error || !data) return null;
  return data.map((f: any) => ({
    id: f.legacy_id ?? f.id,
    name: f.name,
    type: f.type,
    location: f.location,
    capacity: f.capacity,
    availableSeats: f.available_seats,
    occupancyPercentage: f.occupancy_pct,
    openingHours: f.opening_hours,
    amenities: f.amenities ?? [],
    walkTimeFromRoom204Min: f.walk_minutes,
  }));
}

export async function fetchLibrary(): Promise<{ books: LibraryBook[]; availability: LibrarySeatAvailability } | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const sid = await activeStudentId();
  const { data: books, error } = await supabase.from('library_books').select('*');
  if (error || !books) return null;
  let loans: any[] = [];
  try {
    const res = await supabase.from('library_loans').select('book_id, borrowed_date, return_date, is_overdue').eq('student_id', sid).is('returned_at', null);
    loans = res.data ?? [];
  } catch {
    loans = [];
  }
  const byBook = new Map(loans.map((l: any) => [l.book_id, l]));
  const { data: statusRows } = await supabase.from('library_status').select('*').limit(1);
  const s = (statusRows ?? [])[0];
  return {
    books: books.map((b: any) => {
      const loan = byBook.get(b.id);
      return {
        id: b.legacy_id ?? b.id,
        title: b.title,
        author: b.author,
        isbn: b.isbn,
        isAvailable: b.available_copies > 0,
        totalCopies: b.total_copies,
        availableCopies: b.available_copies,
        category: b.category,
        borrowedByStudent: loan
          ? { borrowedDate: loan.borrowed_date, returnDate: loan.return_date, isOverdue: Boolean(loan.is_overdue) }
          : undefined,
      } as LibraryBook;
    }),
    availability: {
      totalSeats: s?.total_seats ?? 250,
      occupiedSeats: s?.occupied_seats ?? 100,
      availablePercentage: s?.available_pct ?? 60,
      quietZoneAvailability: s?.quiet_zone_pct ?? 68,
      discussionRoomAvailability: s?.discussion_pct ?? 45,
    },
  };
}

export async function fetchTransport(): Promise<TransportRoute[] | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase.from('transport_routes').select('*');
  if (error || !data) return null;
  return data.map((t: any) => ({
    id: t.legacy_id ?? t.id,
    routeNumber: t.route_number,
    name: t.name,
    currentStatus: t.current_status,
    stops: t.stops ?? [],
    nextBusArrivalMinutes: t.next_arrival_min,
    departureTime: t.departure_time_text,
    frequencyMinutes: t.frequency_min,
  }));
}

export async function fetchTickets(): Promise<HelpdeskTicket[] | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const sid = await activeStudentId();
  // Authenticated users hit RLS owner policies; anon falls back to demo rows intentionally denied -> return null.
  const { data: session } = await supabase.auth.getSession();
  const effectiveId = session.session?.user.id ?? (sid === DEMO_PROFILE_ID ? null : sid);
  const queryId = effectiveId ?? DEMO_PROFILE_ID;
  // Anon catalog policy denies ticket reads, so only attempt when a session exists or demo fallback desired.
  if (!session.session) return null;
  const { data, error } = await supabase
    .from('helpdesk_tickets')
    .select('id, display_id, student_id, student_name, title, description, location, category, priority, status, created_at, updated_at, ticket_timeline(step, timestamp_text, note, created_at)')
    .eq('student_id', queryId)
    .order('created_at', { ascending: false });
  if (error || !data) return null;
  return data.map((t: any) => ({
    id: t.display_id,
    studentId: t.student_id === DEMO_PROFILE_ID ? 'CS23045' : t.student_id.slice(0, 7).toUpperCase(),
    studentName: t.student_name,
    title: t.title,
    description: t.description,
    location: t.location,
    category: t.category,
    priority: t.priority,
    status: t.status,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
    timeline: (t.ticket_timeline ?? [])
      .slice()
      .sort((a: any, b: any) => (a.created_at < b.created_at ? -1 : 1))
      .map((s: any) => ({ step: s.step, timestamp: s.timestamp_text || fmtDateTime(s.created_at), note: s.note ?? undefined })),
  }));
}

export async function fetchNotifications(): Promise<NotificationItem[] | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) return null;
  const sid = session.session.user.id;
  const { data, error } = await supabase
    .from('notifications')
    .select('id, legacy_id, title, message, type, is_read, action_view, action_tab, action_id, created_at')
    .eq('student_id', sid)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error || !data) return null;
  return data.map((n: any) => ({
    id: n.legacy_id ?? n.id,
    title: n.title,
    message: n.message,
    timestamp: fmtDateTime(n.created_at),
    isRead: Boolean(n.is_read),
    type: n.type,
    actionLink: n.action_view ? { view: n.action_view, tab: n.action_tab ?? undefined, id: n.action_id ?? undefined } : undefined,
  }));
}
