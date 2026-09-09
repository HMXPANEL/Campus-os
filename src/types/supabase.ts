export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.5';
  };
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          student_no: string | null;
          email: string;
          full_name: string;
          department_id: string | null;
          year_text: string;
          semester_id: string | null;
          section: string;
          cgpa: number;
          phone: string | null;
          mentor: string | null;
          avatar_url: string | null;
          role: Database['public']['Enums']['app_role'];
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & {
          email: string;
          full_name: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
        Relationships: [];
      };
      departments: {
        Row: { id: string; code: string; name: string; created_at: string };
        Insert: { code: string; name: string };
        Update: Partial<Database['public']['Tables']['departments']['Row']>;
        Relationships: [];
      };
      semesters: {
        Row: {
          id: string;
          name: string;
          academic_year: string;
          is_current: boolean;
        };
        Insert: { name: string; academic_year?: string; is_current?: boolean };
        Update: Partial<Database['public']['Tables']['semesters']['Row']>;
        Relationships: [];
      };
      subjects: {
        Row: {
          id: string;
          code: string;
          name: string;
          credits: number;
          department_id: string | null;
          semester_id: string | null;
        };
        Insert: {
          code: string;
          name: string;
          credits: number;
          department_id?: string | null;
          semester_id?: string | null;
        };
        Update: Partial<Database['public']['Tables']['subjects']['Row']>;
        Relationships: [];
      };
      helpdesk_tickets: {
        Row: {
          id: string;
          display_id: string;
          student_id: string;
          student_name: string;
          title: string;
          description: string;
          location: string;
          category: Database['public']['Enums']['ticket_category'];
          priority: Database['public']['Enums']['ticket_priority'];
          status: Database['public']['Enums']['ticket_status'];
          assignee_id: string | null;
          closed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['helpdesk_tickets']['Row']> & {
          display_id: string;
          student_id: string;
          title: string;
          description: string;
          location: string;
        };
        Update: Partial<Database['public']['Tables']['helpdesk_tickets']['Row']>;
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          legacy_id: string | null;
          title: string;
          description: string;
          date_text: string;
          time_text: string;
          location: string;
          organizer: string;
          category: Database['public']['Enums']['event_category'];
          max_seats: number;
          registered_count: number;
          banner_image: string | null;
          tags: string[];
          is_past: boolean;
          is_published: boolean;
        };
        Insert: Partial<Database['public']['Tables']['events']['Row']> & {
          title: string;
          description: string;
          date_text: string;
          time_text: string;
          location: string;
          organizer: string;
          max_seats: number;
        };
        Update: Partial<Database['public']['Tables']['events']['Row']>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      current_user_role: {
        Args: never;
        Returns: Database['public']['Enums']['app_role'];
      };
    };
    Enums: {
      app_role: 'student' | 'faculty' | 'staff' | 'admin' | 'maintenance' | 'vice_principal';
      day_of_week: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
      slot_type: 'Lecture' | 'Lab' | 'Tutorial';
      slot_status: 'Upcoming' | 'Ongoing' | 'Completed';
      deadline_category: 'Assignment' | 'Book' | 'Form' | 'Event';
      deadline_priority: 'Low' | 'Medium' | 'High';
      deadline_status: 'Pending' | 'Completed';
      event_category: 'Technical' | 'Cultural' | 'Sports' | 'Workshop' | 'Competition' | 'Seminar';
      canteen_crowd: 'Low' | 'Moderate' | 'High';
      menu_category: 'Meals' | 'Snacks' | 'Beverages';
      facility_type: 'Library' | 'Study Room' | 'Lab' | 'Classroom' | 'Auditorium' | 'Sports';
      ticket_category:
        | 'Maintenance'
        | 'Electrical'
        | 'Water'
        | 'Cleaning'
        | 'Classroom Equipment'
        | 'Wi-Fi / IT'
        | 'Other';
      ticket_priority: 'Low' | 'Medium' | 'High';
      ticket_status: 'Pending' | 'Assigned' | 'In Progress' | 'Resolved' | 'Closed';
      ticket_step: 'Created' | 'Assigned' | 'In Progress' | 'Resolved';
      notification_type: 'attendance' | 'deadline' | 'ticket' | 'event' | 'transport' | 'general';
      attendance_mark: 'Present' | 'Absent';
    };
    CompositeTypes: { [_ in never]: never };
  };
};
