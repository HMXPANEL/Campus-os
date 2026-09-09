-- CampusOS Admin — additive migration (verified 2026-09-09 against live schema).
--
-- ALREADY PRESENT in the live database (verified via the API — do NOT re-apply):
--   * app_role includes 'vice_principal'
--   * helpdesk_tickets.assignee_id UUID, helpdesk_tickets.closed_at TIMESTAMPTZ
--   * notices.audience_department_id / audience_semester / audience_section / scheduled_at
--   * events.is_published BOOLEAN
--   * teacher_subjects mapping table, admin_activity_log audit table
--
-- MISSING: the 'Assigned' and 'Closed' values of the ticket_status enum
-- (live rows only show Pending / In Progress / Resolved; ticket_step already
-- has 'Assigned'). The Admin Helpdesk writes these statuses, so apply this.
--
-- HOW TO APPLY (browser key cannot run DDL, so run this in the Supabase
-- Dashboard → SQL Editor; each statement separately — ALTER TYPE ... ADD VALUE
-- cannot run inside a transaction block):
--
--   ALTER TYPE ticket_status ADD VALUE IF NOT EXISTS 'Assigned';
--   ALTER TYPE ticket_status ADD VALUE IF NOT EXISTS 'Closed';

ALTER TYPE ticket_status ADD VALUE IF NOT EXISTS 'Assigned';
ALTER TYPE ticket_status ADD VALUE IF NOT EXISTS 'Closed';
