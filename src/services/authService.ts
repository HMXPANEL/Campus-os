import { supabase, isSupabaseConfigured } from './supabaseClient';
import { campusStore } from './campusStore';

/**
 * Student authentication. Supabase Auth is the ONLY authority:
 *
 * - Sign-in verifies the password server-side via signInWithPassword.
 * - The student is resolved to their Auth user; the profile (and every
 *   private row) is then constrained server-side by RLS on auth.uid().
 * - No demo credentials, no hardcoded identity, no password in env vars.
 * - The small localStorage flag is a boot cache only: App validates it
 *   against the live Supabase session on startup (validateSession) and
 *   drops it when Supabase reports no session.
 */

const SESSION_FLAG = 'campusos_session_active';

export interface AuthSession {
  isAuthenticated: boolean;
  email: string;
  studentId: string;
  loginTimestamp: number;
}

function readFlag(): AuthSession | null {
  try {
    const data = localStorage.getItem(SESSION_FLAG);
    if (data) {
      const parsed = JSON.parse(data) as AuthSession;
      if (parsed && parsed.isAuthenticated) return parsed;
    }
  } catch {
    /* ignore malformed cache */
  }
  return null;
}

export class AuthService {
  /**
   * Sign in with college email OR student ID + password.
   * IDs are resolved to the account email through the locked-down
   * resolve_student_email RPC (student rows only, email returned for the
   * exact match — the password is still verified by Supabase Auth).
   * Only role='student' profiles may enter the Student portal.
   */
  public static async login(
    emailOrId: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        error: 'Unable to connect to campus services. Check your connection and try again.',
      };
    }

    const cleanInput = emailOrId.trim();
    if (!cleanInput || !password) {
      return { success: false, error: 'Please enter your credentials.' };
    }

    let email: string;
    if (cleanInput.includes('@')) {
      email = cleanInput;
    } else {
      const { data: resolved, error: resolveError } = await supabase.rpc('resolve_student_email', {
        p_student_no: cleanInput,
      });
      if (resolveError || !resolved) {
        return {
          success: false,
          error: 'Invalid credentials. Please verify your Student ID/Email and password.',
        };
      }
      email = resolved as string;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      return {
        success: false,
        error: 'Invalid credentials. Please verify your Student ID/Email and password.',
      };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, student_no')
      .eq('id', data.user.id)
      .maybeSingle();

    if (!profile) {
      try {
        await supabase.auth.signOut();
      } catch {
        /* ignore */
      }
      return {
        success: false,
        error: 'Profile not found in campus database.',
      };
    }

    const session: AuthSession = {
      isAuthenticated: true,
      email: data.user.email || email,
      studentId: (profile.student_no as string) || 'STUDENT',
      loginTimestamp: Date.now(),
    };
    try {
      localStorage.setItem(SESSION_FLAG, JSON.stringify(session));
    } catch {
      /* cache is optional; the Supabase session is authoritative */
    }
    return { success: true };
  }

  public static getSession(): AuthSession | null {
    return readFlag();
  }

  /** Sync boot check (cache). Authoritative check is validateSession(). */
  public static isAuthenticated(): boolean {
    return readFlag() !== null;
  }

  /**
   * Authoritative session check against Supabase. Clears the local cache
   * when Supabase reports no session. Call on app boot and after hydration.
   */
  public static async validateSession(): Promise<boolean> {
    try {
      if (!isSupabaseConfigured || !supabase) return false;
      const { data } = await supabase.auth.getSession();
      const ok = !!data.session;
      if (!ok) {
        try {
          localStorage.removeItem(SESSION_FLAG);
        } catch {
          /* ignore */
        }
      }
      return ok;
    } catch {
      return false;
    }
  }

  /** Signs out of Supabase, clears the cache, and wipes campus data + realtime. */
  public static logout(): void {
    try {
      localStorage.removeItem(SESSION_FLAG);
    } catch {
      /* ignore */
    }
    try {
      if (isSupabaseConfigured && supabase) {
        void supabase.auth.signOut();
      }
    } catch {
      /* offline - ignore */
    }
    campusStore.reset();
  }
}
