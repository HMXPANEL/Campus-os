import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

export interface StudentRealtimeHooks {
  onCatalogChanged: () => void;
  onPrivateChanged: () => void;
}

/**
 * Live synchronization for the Student portal over Supabase Realtime
 * (postgres_changes). RLS still applies: the server only delivers rows the
 * signed-in student is allowed to read. No polling, no fake realtime.
 *
 * - Catalog tables (public reads): any change refreshes shared data.
 * - Private tables: filtered to student_id = caller where the column exists;
 *   tables without that column (ticket_timeline, attendance_history) rely on
 *   RLS row filtering instead.
 * - The returned function unsubscribes and must be called on logout/unmount.
 */

const CATALOG_TABLES = [
  'events',
  'timetable_slots',
  'deadlines',
  'canteens',
  'canteen_menu_items',
  'facilities',
  'library_books',
  'library_status',
  'transport_routes',
  'notices',
  'subjects',
  'departments',
  'semesters',
];

const PRIVATE_FILTERED_TABLES = [
  'enrollments',
  'attendance_records',
  'grades',
  'deadline_completions',
  'event_registrations',
  'helpdesk_tickets',
  'notifications',
  'library_loans',
  'profiles',
];

const PRIVATE_RLS_ONLY_TABLES = ['attendance_history', 'ticket_timeline'];

export function subscribeStudentRealtime(userId: string, hooks: StudentRealtimeHooks): () => void {
  if (!supabase) return () => {};
  let channel: RealtimeChannel | null = supabase.channel(`campus-student-${userId}`);

  try {
    for (const table of CATALOG_TABLES) {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        () => hooks.onCatalogChanged()
      );
    }
    for (const table of PRIVATE_FILTERED_TABLES) {
      const filter = table === 'profiles' ? `id=eq.${userId}` : `student_id=eq.${userId}`;
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter },
        () => hooks.onPrivateChanged()
      );
    }
    for (const table of PRIVATE_RLS_ONLY_TABLES) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, () =>
        hooks.onPrivateChanged()
      );
    }
    channel.subscribe();
  } catch {
    channel = null;
  }

  return () => {
    try {
      if (channel && supabase) {
        void supabase.removeChannel(channel);
      }
    } catch {
      /* ignore */
    }
    channel = null;
  };
}

/**
 * Live synchronization for the Admin portal over Supabase Realtime
 * (postgres_changes). RLS still applies: the server only delivers rows the
 * signed-in administrator is allowed to read. No polling, no fake realtime.
 *
 * Example flows covered:
 * - Student creates a ticket        → Admin Helpdesk refreshes
 * - Admin changes ticket status     → Student portal refreshes (student hook)
 * - Teacher updates attendance      → Student + Admin dashboard refresh
 * - Admin publishes event/notice    → Student portal refreshes (student hook)
 * - Student registers for an event  → Admin dashboard refreshes
 *
 * The returned function unsubscribes and must be called on unmount.
 */
export function subscribeAdminRealtime(tables: string[], onChange: () => void): () => void {
  if (!supabase) return () => {};
  let channel: RealtimeChannel | null = supabase.channel(`campus-admin-${tables.join('-')}`);

  try {
    for (const table of tables) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => onChange());
    }
    channel.subscribe();
  } catch {
    channel = null;
  }

  return () => {
    try {
      if (channel && supabase) {
        void supabase.removeChannel(channel);
      }
    } catch {
      /* ignore */
    }
    channel = null;
  };
}
