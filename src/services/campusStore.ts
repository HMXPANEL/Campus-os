import { useState, useEffect } from 'react';
import {
  Student,
  TimetableSlot,
  AttendanceRecord,
  GradeItem,
  DeadlineItem,
  EventItem,
  CanteenMenuItem,
  CanteenStatus,
  FacilityItem,
  LibraryBook,
  LibrarySeatAvailability,
  TransportRoute,
  HelpdeskTicket,
  NotificationItem,
  TicketCategory,
  TicketPriority,
  TicketStatus
} from '../types';
import {
  INITIAL_STUDENT,
  INITIAL_TIMETABLE,
  INITIAL_ATTENDANCE,
  INITIAL_GRADES,
  INITIAL_DEADLINES,
  INITIAL_EVENTS,
  INITIAL_CANTEEN_STATUS,
  INITIAL_CANTEEN_MENU,
  INITIAL_FACILITIES,
  INITIAL_LIBRARY_BOOKS,
  INITIAL_LIBRARY_AVAILABILITY,
  INITIAL_TRANSPORT,
  INITIAL_HELPDESK_TICKETS,
  INITIAL_NOTIFICATIONS
} from './mockData';
import { isSupabaseConfigured } from './supabaseClient';

interface CampusState {
  student: Student;
  timetable: TimetableSlot[];
  attendance: AttendanceRecord[];
  grades: GradeItem[];
  deadlines: DeadlineItem[];
  events: EventItem[];
  canteenStatus: CanteenStatus;
  canteenMenu: CanteenMenuItem[];
  facilities: FacilityItem[];
  libraryBooks: LibraryBook[];
  libraryAvailability: LibrarySeatAvailability;
  transport: TransportRoute[];
  tickets: HelpdeskTicket[];
  notifications: NotificationItem[];
}

const STORAGE_KEY = 'campusos_store_v1';

class CampusDataStore {
  private state: CampusState;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): CampusState {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Could not read CampusOS state from localStorage:', e);
    }
    return {
      student: INITIAL_STUDENT,
      timetable: INITIAL_TIMETABLE,
      attendance: INITIAL_ATTENDANCE,
      grades: INITIAL_GRADES,
      deadlines: INITIAL_DEADLINES,
      events: INITIAL_EVENTS,
      canteenStatus: INITIAL_CANTEEN_STATUS,
      canteenMenu: INITIAL_CANTEEN_MENU,
      facilities: INITIAL_FACILITIES,
      libraryBooks: INITIAL_LIBRARY_BOOKS,
      libraryAvailability: INITIAL_LIBRARY_AVAILABILITY,
      transport: INITIAL_TRANSPORT,
      tickets: INITIAL_HELPDESK_TICKETS,
      notifications: INITIAL_NOTIFICATIONS
    };
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to save CampusOS state to localStorage:', e);
    }
    this.notify();
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }

  // --- Getters ---

  public getStudent(): Student {
    return this.state.student;
  }

  public getTimetable(): TimetableSlot[] {
    return this.state.timetable;
  }

  public getAttendance(): AttendanceRecord[] {
    return this.state.attendance;
  }

  public getGrades(): GradeItem[] {
    return this.state.grades;
  }

  public getDeadlines(): DeadlineItem[] {
    return this.state.deadlines;
  }

  public getEvents(): EventItem[] {
    return this.state.events;
  }

  public getCanteen(): { status: CanteenStatus; menu: CanteenMenuItem[] } {
    return {
      status: this.state.canteenStatus,
      menu: this.state.canteenMenu
    };
  }

  public getFacilities(): FacilityItem[] {
    return this.state.facilities;
  }

  public getLibrary(): { books: LibraryBook[]; availability: LibrarySeatAvailability } {
    return {
      books: this.state.libraryBooks,
      availability: this.state.libraryAvailability
    };
  }

  public getTransport(): TransportRoute[] {
    return this.state.transport;
  }

  public getTickets(): HelpdeskTicket[] {
    return this.state.tickets;
  }

  public getTicketById(id: string): HelpdeskTicket | undefined {
    return this.state.tickets.find(t => t.id.toLowerCase() === id.toLowerCase());
  }

  public getNotifications(): NotificationItem[] {
    return this.state.notifications;
  }

  public getAttendanceRecord(subjectCodeOrId: string): AttendanceRecord | undefined {
    const clean = subjectCodeOrId.trim().toLowerCase();
    return this.state.attendance.find(
      a => a.subjectCode.toLowerCase() === clean || 
           a.id.toLowerCase() === clean || 
           a.subjectName.toLowerCase().includes(clean)
    );
  }

  public getAtRiskSubjects(): AttendanceRecord[] {
    return this.state.attendance.filter(a => a.isLow || a.percentage < 75);
  }

  public calculateSkipImpact(subjectCode: string): {
    record?: AttendanceRecord;
    canSkip: boolean;
    currentPct: number;
    newPctIfSkipped: number;
    classesRequiredFor75: number;
  } {
    const record = this.getAttendanceRecord(subjectCode);
    if (!record) {
      return {
        canSkip: false,
        currentPct: 0,
        newPctIfSkipped: 0,
        classesRequiredFor75: 0
      };
    }

    const currentPct = record.percentage;
    const newTotal = record.totalClasses + 1;
    const newAttended = record.attendedClasses;
    const newPctIfSkipped = Math.round((newAttended / newTotal) * 1000) / 10; // e.g. 66.7%

    // Calculate consecutive classes needed to reach 75%
    // (attended + x) / (total + x) >= 0.75
    // attended + x >= 0.75 * total + 0.75 * x
    // 0.25 * x >= 0.75 * total - attended
    // x >= (0.75 * total - attended) / 0.25 = 3 * total - 4 * attended
    const needed = Math.max(0, Math.ceil(3 * record.totalClasses - 4 * record.attendedClasses));

    return {
      record,
      canSkip: currentPct >= 75 && newPctIfSkipped >= 75,
      currentPct,
      newPctIfSkipped,
      classesRequiredFor75: needed
    };
  }

  // Dynamic next/current class calculation
  public getCurrentOrNextClass(): {
    currentClass?: TimetableSlot;
    nextClass?: TimetableSlot;
    remainingMinutesToNext?: number;
    daySchedule: TimetableSlot[];
  } {
    // We base calculations on Monday slots for deterministic hackathon demo or current day
    const daySchedule = this.state.timetable.filter(t => t.dayOfWeek === 'Monday');
    
    // In demo flow: Next class is DBMS at 10:30 AM Room 204 Prof Verma
    const nextClass = daySchedule.find(t => t.subjectCode === 'CS302') || daySchedule[1];
    const currentClass = daySchedule.find(t => t.subjectCode === 'CS301');

    return {
      currentClass,
      nextClass,
      remainingMinutesToNext: 120, // 2 hours window for the demo
      daySchedule
    };
  }

  // --- Mutations ---

  public toggleDeadline(id: string): DeadlineItem | undefined {
    const item = this.state.deadlines.find(d => d.id === id);
    if (!item) return undefined;

    item.status = item.status === 'Completed' ? 'Pending' : 'Completed';
    this.persist();
    return item;
  }

  public toggleEventRegistration(eventId: string): { success: boolean; isRegistered: boolean; event?: EventItem } {
    const event = this.state.events.find(e => e.id === eventId);
    if (!event) return { success: false, isRegistered: false };

    event.isRegistered = !event.isRegistered;
    if (event.isRegistered) {
      event.registeredCount = Math.min(event.maxSeats, event.registeredCount + 1);
      this.addNotification({
        title: 'Event Registration Confirmed',
        message: `You are successfully registered for "${event.title}". Venue: ${event.location}.`,
        type: 'event',
        actionLink: { view: 'events', id: event.id }
      });
    } else {
      event.registeredCount = Math.max(0, event.registeredCount - 1);
    }

    this.persist();
    return { success: true, isRegistered: event.isRegistered, event };
  }

  public createHelpdeskTicket(params: {
    title: string;
    description: string;
    location: string;
    category: TicketCategory;
    priority: TicketPriority;
  }): HelpdeskTicket {
    // Generate sequential or realistic ID starting with HD-1042
    let nextIdNumber = 1042;
    const existingIds = this.state.tickets
      .map(t => parseInt(t.id.replace('HD-', ''), 10))
      .filter(n => !isNaN(n));
    
    if (existingIds.length > 0) {
      nextIdNumber = Math.max(...existingIds) + 1;
    }

    const newTicketId = `HD-${nextIdNumber}`;
    const nowIso = new Date().toISOString();
    const formattedDate = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });

    const newTicket: HelpdeskTicket = {
      id: newTicketId,
      studentId: this.state.student.id,
      studentName: this.state.student.name,
      title: params.title,
      description: params.description,
      location: params.location,
      category: params.category,
      priority: params.priority,
      status: 'Pending',
      createdAt: nowIso,
      updatedAt: nowIso,
      timeline: [
        {
          step: 'Created',
          timestamp: formattedDate,
          note: `Issue reported by ${this.state.student.name}`
        }
      ]
    };

    this.state.tickets.unshift(newTicket);

    // Also push a notification
    this.addNotification({
      title: `Ticket Logged: ${newTicketId}`,
      message: `Your issue regarding "${params.title}" at ${params.location} is logged. Status: Pending.`,
      type: 'ticket',
      actionLink: { view: 'helpdesk', id: newTicketId }
    });

    this.persist();
    return newTicket;
  }

  public updateTicketStatus(id: string, status: TicketStatus, note?: string): HelpdeskTicket | undefined {
    const ticket = this.getTicketById(id);
    if (!ticket) return undefined;

    ticket.status = status;
    ticket.updatedAt = new Date().toISOString();
    const formattedDate = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });

    ticket.timeline.push({
      step: status === 'In Progress' ? 'In Progress' : status === 'Resolved' ? 'Resolved' : 'Assigned',
      timestamp: formattedDate,
      note: note || `Ticket status updated to ${status}`
    });

    this.addNotification({
      title: `Ticket ${id} ${status}`,
      message: note || `Your ticket regarding "${ticket.title}" is now ${status}.`,
      type: 'ticket',
      actionLink: { view: 'helpdesk', id }
    });

    this.persist();
    return ticket;
  }

  public addNotification(notif: {
    title: string;
    message: string;
    type: NotificationItem['type'];
    actionLink?: NotificationItem['actionLink'];
  }) {
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: notif.title,
      message: notif.message,
      timestamp: 'Just now',
      isRead: false,
      type: notif.type,
      actionLink: notif.actionLink
    };
    this.state.notifications.unshift(newNotif);
    this.persist();
  }

  public markNotificationRead(id: string) {
    const notif = this.state.notifications.find(n => n.id === id);
    if (notif && !notif.isRead) {
      notif.isRead = true;
      this.persist();
    }
  }

  public markAllNotificationsRead() {
    this.state.notifications.forEach(n => { n.isRead = true; });
    this.persist();
  }

  public resetToDefaults() {
    localStorage.removeItem(STORAGE_KEY);
    this.state = this.loadState();
    this.persist();
  }

  /**
   * Pull public catalog + demo-student data from Supabase and replace the
   * matching local slices. Offline-first: any fetch that fails (or RLS-denied
   * for anon, e.g. tickets/notifications) keeps the local mock data, so the
   * UI never breaks. Authenticated sessions unlock owner-scoped rows.
   */
  public async hydrateFromSupabase(): Promise<{ applied: string[]; skipped: string[] }> {
    const applied: string[] = [];
    const skipped: string[] = [];
    if (!isSupabaseConfigured) {
      return { applied, skipped: ['supabase-not-configured'] };
    }
    try {
      const api = await import('./campusApi');
      const [student, timetable, attendance, grades, deadlines, events, canteen, facilities, library, transport] =
        await Promise.all([
          api.fetchStudent().catch(() => null),
          api.fetchTimetable().catch(() => null),
          api.fetchAttendance().catch(() => null),
          api.fetchGrades().catch(() => null),
          api.fetchDeadlines().catch(() => null),
          api.fetchEvents().catch(() => null),
          api.fetchCanteen().catch(() => null),
          api.fetchFacilities().catch(() => null),
          api.fetchLibrary().catch(() => null),
          api.fetchTransport().catch(() => null),
        ]);

      if (student) { this.state.student = student; applied.push('student'); } else skipped.push('student');
      if (timetable && timetable.length > 0) { this.state.timetable = timetable; applied.push('timetable'); } else skipped.push('timetable');
      if (attendance && attendance.length > 0) { this.state.attendance = attendance; applied.push('attendance'); } else skipped.push('attendance');
      if (grades && grades.length > 0) { this.state.grades = grades; applied.push('grades'); } else skipped.push('grades');
      if (deadlines && deadlines.length > 0) { this.state.deadlines = deadlines; applied.push('deadlines'); } else skipped.push('deadlines');
      if (events && events.length > 0) { this.state.events = events; applied.push('events'); } else skipped.push('events');
      if (canteen) { this.state.canteenStatus = canteen.status; this.state.canteenMenu = canteen.menu; applied.push('canteen'); } else skipped.push('canteen');
      if (facilities && facilities.length > 0) { this.state.facilities = facilities; applied.push('facilities'); } else skipped.push('facilities');
      if (library) { this.state.libraryBooks = library.books; this.state.libraryAvailability = library.availability; applied.push('library'); } else skipped.push('library');
      if (transport && transport.length > 0) { this.state.transport = transport; applied.push('transport'); } else skipped.push('transport');

      // Owner-scoped slices require an authenticated session (anon is RLS-denied by design).
      const [tickets, notifications] = await Promise.all([
        api.fetchTickets().catch(() => null),
        api.fetchNotifications().catch(() => null),
      ]);
      if (tickets && tickets.length > 0) { this.state.tickets = tickets; applied.push('tickets'); } else skipped.push('tickets(auth-required)');
      if (notifications && notifications.length > 0) { this.state.notifications = notifications; applied.push('notifications'); } else skipped.push('notifications(auth-required)');

      this.persist();
    } catch (e) {
      console.warn('[CampusOS] Supabase hydrate failed, keeping offline data:', e);
      skipped.push('hydrate-error');
    }
    return { applied, skipped };
  }
}

export const campusStore = new CampusDataStore();

// React hook to trigger re-renders on store updates
export function useCampusStore() {
  const [, setTick] = useState(0);

  useEffect(() => {
    return campusStore.subscribe(() => {
      setTick(t => t + 1);
    });
  }, []);

  return campusStore;
}
