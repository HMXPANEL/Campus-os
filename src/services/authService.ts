import { supabase, isSupabaseConfigured } from './supabaseClient';

const AUTH_KEY = 'campusos_auth_session';

export interface AuthSession {
  isAuthenticated: boolean;
  email: string;
  studentId: string;
  loginTimestamp: number;
}

export class AuthService {
  public static getSession(): AuthSession | null {
    try {
      const data = localStorage.getItem(AUTH_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Could not read session:', e);
    }
    return null;
  }

  public static login(emailOrId: string, password: string): { success: boolean; error?: string } {
    const validEmail = import.meta.env.VITE_DEMO_STUDENT_EMAIL || 'aditya.sharma@campus.edu';
    const validId = import.meta.env.VITE_DEMO_STUDENT_ID || 'CS23045';
    const validPassword = import.meta.env.VITE_DEMO_STUDENT_PASSWORD || 'CampusOS@2026';

    const cleanInput = emailOrId.trim().toLowerCase();
    const isEmailMatch = cleanInput === validEmail.toLowerCase();
    const isIdMatch = cleanInput === validId.toLowerCase();

    if ((isEmailMatch || isIdMatch) && password === validPassword) {
      const session: AuthSession = {
        isAuthenticated: true,
        email: validEmail,
        studentId: validId,
        loginTimestamp: Date.now()
      };
      localStorage.setItem(AUTH_KEY, JSON.stringify(session));
      return { success: true };
    }

    return {
      success: false,
      error: 'Invalid credentials. Please verify your Student ID/Email and password.'
    };
  }

  public static logout(): void {
    localStorage.removeItem(AUTH_KEY);
    // Best-effort Supabase sign-out (never blocks local logout).
    try {
      if (isSupabaseConfigured && supabase) {
        void supabase.auth.signOut();
      }
    } catch {
      /* offline - ignore */
    }
  }

  /**
   * Resolve any accepted login identifier to the email Supabase Auth needs.
   * Safe by construction: it only maps between the already-public configured
   * demo identity values (both are shown on the login screen and shipped in
   * the bundle via .env). It never queries other students' rows (anon RLS
   * denies profiles reads) and never exposes any email the caller didn't
   * already provide or that isn't the configured demo identity.
   * Returns null when the identifier cannot be resolved (link is skipped).
   */
  private static resolveSupabaseEmail(emailOrId: string): string | null {
    const demoEmail = import.meta.env.VITE_DEMO_STUDENT_EMAIL || 'aditya.sharma@campus.edu';
    const demoId = import.meta.env.VITE_DEMO_STUDENT_ID || 'CS23045';

    const cleanInput = emailOrId.trim();
    if (cleanInput.includes('@')) {
      return cleanInput;
    }
    if (cleanInput.toLowerCase() === demoId.toLowerCase()) {
      return demoEmail;
    }
    return null;
  }

  /**
   * Best-effort Supabase Auth link for the demo session.
   * Accepts either the student email or the student ID (e.g. CS23045):
   * IDs are resolved to the configured demo email, then the SAME
   * signInWithPassword flow runs, establishing the SAME authenticated
   * Supabase session (same auth.users UUID) either way. RLS owner policies
   * then unlock the student's private data during hydration.
   * The local demo login always succeeds offline; failures here are
   * swallowed so the app keeps working on the offline dataset.
   */
  public static linkSupabaseSession(emailOrId: string, password: string): void {
    try {
      if (!isSupabaseConfigured || !supabase) return;
      const email = this.resolveSupabaseEmail(emailOrId);
      if (!email) return;
      void supabase.auth.signInWithPassword({ email, password }).then(({ error }) => {
        if (error && import.meta.env.DEV) {
          console.info('[CampusOS] Supabase Auth not linked (using offline demo session):', error.message);
        }
      });
    } catch {
      /* ignore */
    }
  }

  /** Full Supabase-backed sign-in (used once Auth users are provisioned). */
  public static async loginWithSupabase(
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase is not configured.' };
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error || !data.user) {
      return { success: false, error: error?.message || 'Supabase sign-in failed.' };
    }
    const session: AuthSession = {
      isAuthenticated: true,
      email: data.user.email || email.trim(),
      studentId: (data.user.user_metadata?.student_no as string) || 'CS23045',
      loginTimestamp: Date.now(),
    };
    localStorage.setItem(AUTH_KEY, JSON.stringify(session));
    return { success: true };
  }

  public static isAuthenticated(): boolean {
    const session = this.getSession();
    return !!session && session.isAuthenticated;
  }
}
