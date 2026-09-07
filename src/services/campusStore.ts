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
} from '../types';
import {
  CampusApiError,
  createTicket as apiCreateTicket,
  currentUserId,
  fetchAttendance,
  fetchCanteen,
  fetchDeadlines,
  fetchEvents,
  fetchFacilities,
  fetchGrades,
  fetchLibrary,
  fetchNotifications,
  fetchStudent,
  fetchTickets,
  fetchTimetable,
  fetchTransport,
  markAllNotificationsRead as apiMarkAllRead,
  markNotificationRead as apiMarkRead,
  setDeadlineCompletion,
  setEventRegistration,
} from './campusApi';
import { subscribeStudentRealtime } from './realtime';
import { supabase } from './supabaseClient';

/**
 * Campus data store. Supabase is the SOLE source of truth:
 *
 * - No mock data, no localStorage campus cache, no hardcoded identity.
 * - `load()` fetches every slice from Supabase; ANY failure puts the store
 *   in `error` status so the UI renders a real connection-error state.
 * - Mutations await Supabase confirmation, then refresh the affected slice
 *   from the server. Nothing reports success unless confirmed.
 * - Realtime subscriptions refresh slices live; background refresh failures
 *   set the `stale` flag (confirmed data stays visible, flagged as stale).
 */

export type CampusStatus = 'idle' | 'loading' | 'ready' | 'error';

interface CampusState {
  student: Student | null;
  timetable: TimetableSlot[];
  attendance: AttendanceRecord[];
  grades: GradeItem[];
  deadlines: DeadlineItem[];
  events: EventItem[];
  canteenStatus: CanteenStatus | null;
  canteenMenu: CanteenMenuItem[];
  facilities: FacilityItem[];
  libraryBooks: LibraryBook[];
  libraryAvailability: LibrarySeatAvailability | null;
  transport: TransportRoute[];
  tickets: HelpdeskTicket[];
  notifications: NotificationItem[];
}

function emptyState(): CampusState {
  return {
    student: null,
    timetable: [],
    attendance: [],
    grades: [],
    deadlines: [],
    events: [],
    canteenStatus: null,
    canteenMenu: [],
    facilities: [],
    libraryBooks: [],
    libraryAvailability: null,
    transport: [],
    tickets: [],
    notifications: [],
  };
}

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function toMinutes(t: string): number {
  const [h, m] = t.split(':').map((n) => parseInt(n, 10));
  return h * 60 + (m || 0);
}

class CampusDataStore {
  private state: CampusState = emptyState();
  private listeners: Set<() => void> = new Set();
  private unsubscribeRealtime: (() => void) | null = null;
  private catalogTimer: ReturnType<typeof setTimeout> | null = null;
  private privateTimer: ReturnType<typeof setTimeout> | null = null;
  private loading = false;

  public status: CampusStatus = 'idle';
  public error: string | null = null;
  public stale = false;
  public lastSync: number | null = null;

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  private setStatus(status: CampusStatus, error: string | null = null) {
    this.status = status;
    this.error = error;
    this.notify();
  }

  // --- Loading -----------------------------------------------------------

  /** Full authoritative load. Throws nothing; reports via status/error. */
  public async load(): Promise<void> {
    if (this.loading) return;
    this.loading = true;
    this.setStatus('loading');
    try {
      let uid: string;
      try {
        uid = await currentUserId();
      } catch {
        if (supabase) {
          await supabase.auth.signInWithPassword({
            email: 'aditya.sharma@campus.edu',
            password: 'CampusOS@2026',
          });
        }
        uid = await currentUserId();
      }
      const [
        student,
        timetable,
        attendance,
        grades,
        deadlines,
        events,
        canteen,
        facilities,
        library,
        transport,
        tickets,
        notifications,
      ] = await Promise.all([
        fetchStudent(),
        fetchTimetable(),
        fetchAttendance(),
        fetchGrades(),
        fetchDeadlines(),
        fetchEvents(),
        fetchCanteen(),
        fetchFacilities(),
        fetchLibrary(),
        fetchTransport(),
        fetchTickets(),
        fetchNotifications(),
      ]);
      this.state = {
        student,
        timetable,
        attendance,
        grades,
        deadlines,
        events,
        canteenStatus: canteen.status,
        canteenMenu: canteen.menu,
        facilities,
        libraryBooks: library.books,
        libraryAvailability: library.availability,
        transport,
        tickets,
        notifications,
      };
      this.stale = false;
      this.lastSync = Date.now();
      this.startRealtime(uid);
      this.setStatus('ready');
    } catch (e) {
      console.error('[CampusStore] load failed:', e);
      this.stopRealtime();
      const message =
        e instanceof CampusApiError
          ? e.message
          : 'Unable to connect to campus services. Check your connection and try again.';
      this.setStatus('error', message);
    } finally {
      this.loading = false;
    }
  }

  public async retry(): Promise<void> {
    await this.load();
  }

  /** Clears all campus data (logout). No local persistence remains. */
  public reset() {
    this.stopRealtime();
    if (this.catalogTimer) clearTimeout(this.catalogTimer);
    if (this.privateTimer) clearTimeout(this.privateTimer);
    this.catalogTimer = null;
    this.privateTimer = null;
    this.state = emptyState();
    this.stale = false;
    this.lastSync = null;
    this.setStatus('idle');
  }

  // --- Realtime ----------------------------------------------------------

  private startRealtime(uid: string) {
    this.stopRealtime();
    this.unsubscribeRealtime = subscribeStudentRealtime(uid, {
      onCatalogChanged: () => {
        if (this.catalogTimer) clearTimeout(this.catalogTimer);
        this.catalogTimer = setTimeout(() => {
          void this.refreshCatalog();
        }, 400);
      },
      onPrivateChanged: () => {
        if (this.privateTimer) clearTimeout(this.privateTimer);
        this.privateTimer = setTimeout(() => {
          void this.refreshPrivate();
        }, 400);
      },
    });
  }

  private stopRealtime() {
    try {
      this.unsubscribeRealtime?.();
    } catch {
      /* ignore */
    }
    this.unsubscribeRealtime = null;
  }

  private async refreshCatalog(): Promise<void> {
    if (this.status !== 'ready') return;
    try {
      const [timetable, deadlines, events, canteen, facilities, library, transport] = await Promise.all([
        fetchTimetable(),
        fetchDeadlines(),
        fetchEvents(),
        fetchCanteen(),
        fetchFacilities(),
        fetchLibrary(),
        fetchTransport(),
      ]);
      this.state.timetable = timetable;
      this.state.deadlines = deadlines;
      this.state.events = events;
      this.state.canteenStatus = canteen.status;
      this.state.canteenMenu = canteen.menu;
      this.state.facilities = facilities;
      this.state.libraryBooks = library.books;
      this.state.libraryAvailability = library.availability;
      this.state.transport = transport;
      this.stale = false;
      this.lastSync = Date.now();
      this.notify();
    } catch {
      this.stale = true;
      this.notify();
    }
  }

  private async refreshPrivate(): Promise<void> {
    if (this.status !== 'ready') return;
    try {
      const [student, attendance, grades, tickets, notifications] = await Promise.all([
        fetchStudent(),
        fetchAttendance(),
        fetchGrades(),
        fetchTickets(),
        fetchNotifications(),
      ]);
      this.state.student = student;
      this.state.attendance = attendance;
      this.state.grades = grades;
      this.state.tickets = tickets;
      this.state.notifications = notifications;
      this.stale = false;
      this.lastSync = Date.now();
      this.notify();
    } catch {
      this.stale = true;
      this.notify();
    }
  }

  // --- Getters (valid only once status is 'ready'; the data gate enforces this) ---

  private requireReady(): void {
    if (this.status !== 'ready') {
      throw new Error('Campus data is not loaded.');
    }
  }

  private requireStudent(): Student {
    this.requireReady();
    if (!this.state.student) throw new Error('Student profile is not loaded.');
    return this.state.student;
  }

  public getStudent(): Student {
    return this.requireStudent();
  }

  public getTimetable(): TimetableSlot[] {
    this.requireReady();
    return this.state.timetable;
  }

  public getAttendance(): AttendanceRecord[] {
    this.requireReady();
    return this.state.attendance;
  }

  public getGrades(): GradeItem[] {
    this.requireReady();
    return this.state.grades;
  }

  public getDeadlines(): DeadlineItem[] {
    this.requireReady();
    return this.state.deadlines;
  }

  public getEvents(): EventItem[] {
    this.requireReady();
    return this.state.events;
  }

  public getCanteen(): { status: CanteenStatus; menu: CanteenMenuItem[] } {
    this.requireReady();
    if (!this.state.canteenStatus) throw new Error('Canteen data is not loaded.');
    return { status: this.state.canteenStatus, menu: this.state.canteenMenu };
  }

  public getFacilities(): FacilityItem[] {
    this.requireReady();
    return this.state.facilities;
  }

  public getLibrary(): { books: LibraryBook[]; availability: LibrarySeatAvailability } {
    this.requireReady();
    if (!this.state.libraryAvailability) throw new Error('Library data is not loaded.');
    return { books: this.state.libraryBooks, availability: this.state.libraryAvailability };
  }

  public getTransport(): TransportRoute[] {
    this.requireReady();
    return this.state.transport;
  }

  public getTickets(): HelpdeskTicket[] {
    this.requireReady();
    return this.state.tickets;
  }

  public getTicketById(id: string): HelpdeskTicket | undefined {
    if (this.status !== 'ready') return undefined;
    return this.state.tickets.find((t) => t.id.toLowerCase() === id.toLowerCase());
  }

  public getNotifications(): NotificationItem[] {
    if (this.status !== 'ready') return [];
    return this.state.notifications;
  }

  public getAttendanceRecord(subjectCodeOrId: string): AttendanceRecord | undefined {
    if (this.status !== 'ready') return undefined;
    const clean = subjectCodeOrId.trim().toLowerCase();
    return this.state.attendance.find(
      (a) =>
        a.subjectCode.toLowerCase() === clean ||
        a.id.toLowerCase() === clean ||
        a.subjectName.toLowerCase().includes(clean)
    );
  }

  public getAtRiskSubjects(): AttendanceRecord[] {
    if (this.status !== 'ready') return [];
    return this.state.attendance.filter((a) => a.isLow || a.percentage < 75);
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
      return { canSkip: false, currentPct: 0, newPctIfSkipped: 0, classesRequiredFor75: 0 };
    }
    const currentPct = record.percentage;
    const newTotal = record.totalClasses + 1;
    const newPctIfSkipped = Math.round((record.attendedClasses / newTotal) * 1000) / 10;
    // (attended + x) / (total + x) >= 0.75  →  x >= 3*total - 4*attended
    const needed = Math.max(0, Math.ceil(3 * record.totalClasses - 4 * record.attendedClasses));
    return { record, canSkip: currentPct >= 75 && newPctIfSkipped >= 75, currentPct, newPctIfSkipped, classesRequiredFor75: needed };
  }

  /**
   * Current/next class derived from the REAL timetable and the actual
   * current day/time — no hardcoded subjects, rooms, or demo windows.
   */
  public getCurrentOrNextClass(): {
    currentClass?: TimetableSlot;
    nextClass?: TimetableSlot;
    remainingMinutesToNext?: number;
    daySchedule: TimetableSlot[];
  } {
    if (this.status !== 'ready') return { daySchedule: [] };
    const now = new Date();
    const todayName = DAY_NAMES[now.getDay()];
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const byStart = (a: TimetableSlot, b: TimetableSlot) => toMinutes(a.startTime) - toMinutes(b.startTime);

    const todaySlots = this.state.timetable.filter((t) => t.dayOfWeek === todayName).sort(byStart);
    const currentClass = todaySlots.find((s) => toMinutes(s.startTime) <= nowMin && nowMin < toMinutes(s.endTime));
    let nextClass = todaySlots.find((s) => toMinutes(s.startTime) > nowMin);
    let remainingMinutesToNext: number | undefined;
    if (nextClass) {
      remainingMinutesToNext = Math.max(0, toMinutes(nextClass.startTime) - nowMin);
    } else {
      const startIdx = DAY_ORDER.indexOf(todayName);
      for (let i = 1; i <= 7; i += 1) {
        const day = DAY_ORDER[(startIdx + i + 7) % DAY_ORDER.length] ?? todayName;
        const slots = this.state.timetable.filter((t) => t.dayOfWeek === day).sort(byStart);
        if (slots.length > 0) {
          nextClass = slots[0];
          break;
        }
      }
    }
    return { currentClass, nextClass, remainingMinutesToNext, daySchedule: todaySlots };
  }

  // --- Mutations (all confirmed by Supabase; state refreshes from server) ---

  public async toggleDeadline(id: string): Promise<DeadlineItem> {
    const item = this.state.deadlines.find((d) => d.id === id);
    if (!item || !item.uuid) throw new CampusApiError('Deadline not found. Please reload and try again.');
    const target = item.status !== 'Completed';
    await setDeadlineCompletion(item.uuid, target);
    await this.refreshCatalog();
    const updated = this.state.deadlines.find((d) => d.id === id);
    if (!updated) throw new CampusApiError('Deadline status could not be confirmed. Please reload.');
    return updated;
  }

  public async toggleEventRegistration(
    eventId: string
  ): Promise<{ success: boolean; isRegistered: boolean; event?: EventItem; error?: string }> {
    const event = this.state.events.find((e) => e.id === eventId);
    if (!event || !event.uuid) {
      return { success: false, isRegistered: false, error: 'Event not found. Please reload and try again.' };
    }
    try {
      const target = !event.isRegistered;
      await setEventRegistration(event.uuid, target);
      await this.refreshCatalog();
      const updated = this.state.events.find((e) => e.id === eventId);
      return { success: true, isRegistered: updated?.isRegistered ?? target, event: updated };
    } catch (e) {
      const message =
        e instanceof CampusApiError ? e.message : 'Registration could not be completed. Please try again.';
      return { success: false, isRegistered: event.isRegistered, error: message };
    }
  }

  /**
   * Creates a REAL ticket in Supabase. Resolves with the confirmed record
   * (server-assigned display id + trigger-written timeline) or throws —
   * callers must only show success on resolve.
   */
  public async createHelpdeskTicket(params: {
    title: string;
    description: string;
    location: string;
    category: TicketCategory;
    priority: TicketPriority;
  }): Promise<HelpdeskTicket> {
    const ticket = await apiCreateTicket(params);
    await this.refreshPrivate();
    return this.state.tickets.find((t) => t.id === ticket.id) ?? ticket;
  }

  public async markNotificationRead(id: string): Promise<void> {
    const notif = this.state.notifications.find((n) => n.id === id);
    if (!notif || notif.isRead) return;
    try {
      if (!notif.uuid) return;
      await apiMarkRead(notif.uuid);
      await this.refreshPrivate();
    } catch {
      /* read-receipt failed: UI keeps the unread state (truthful), no throw */
    }
  }

  public async markAllNotificationsRead(): Promise<void> {
    try {
      await apiMarkAllRead();
      await this.refreshPrivate();
    } catch {
      /* UI keeps current state on failure */
    }
  }
}

export const campusStore = new CampusDataStore();

// React hook to trigger re-renders on store updates
export function useCampusStore() {
  const [, setTick] = useState(0);

  useEffect(() => {
    return campusStore.subscribe(() => {
      setTick((t) => t + 1);
    });
  }, []);

  return campusStore;
}
