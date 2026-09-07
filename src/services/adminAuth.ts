import { supabase, isSupabaseConfigured } from './supabaseClient';

/** Roles permitted inside the Admin Portal. Students are never included. */
export type AdminRole = 'admin' | 'vice_principal' | 'faculty' | 'staff' | 'maintenance';

export const ADMIN_ROLES: readonly AdminRole[] = [
  'admin',
  'vice_principal',
  'faculty',
  'staff',
  'maintenance',
];

export function isAdminRole(role: string | null | undefined): role is AdminRole {
  return (
    role === 'admin' ||
    role === 'vice_principal' ||
    role === 'faculty' ||
    role === 'staff' ||
    role === 'maintenance'
  );
}

export interface AdminSignInResult {
  ok: boolean;
  role?: AdminRole;
  error?: string;
}

export interface VerifiedAdminSession {
  userId: string;
  email: string;
  role: AdminRole;
}

/**
 * REAL Supabase authentication for administrators.
 *
 * 1. Sign in through Supabase Auth (password is verified server-side;
 *    it is never stored anywhere on the client).
 * 2. Look up the caller's own profile row (RLS `profiles_select_own`
 *    guarantees a user can only ever read their own row here).
 * 3. Accept only administrative roles. Anything else — students,
 *    missing rows, lookup failures — signs the session back out and
 *    returns an error (fail closed).
 *
 * There is intentionally NO demo fallback and NO hardcoded password.
 */
export async function signInAdmin(email: string, password: string): Promise<AdminSignInResult> {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Backend is not configured.' };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error || !data.user) {
    return { ok: false, error: error?.message || 'Sign-in failed.' };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .maybeSingle();

  const role = (profile?.role ?? null) as string | null;
  if (profileError || !isAdminRole(role)) {
    try {
      await supabase.auth.signOut();
    } catch {
      /* ignore */
    }
    if (!profileError && role === 'student') {
      return { ok: false, error: 'Students cannot access the Admin Portal.' };
    }
    return { ok: false, error: 'No administrative role found for this account.' };
  }

  return { ok: true, role };
}

/**
 * Verify the current Supabase session AND the caller's administrative role.
 * Returns null when there is no session, the profile cannot be read, or the
 * role is not administrative (fail closed in every case).
 */
export async function getVerifiedAdminSession(): Promise<VerifiedAdminSession | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const role = (profile?.role ?? null) as string | null;
    if (!isAdminRole(role)) return null;
    return { userId: user.id, email: user.email ?? '', role };
  } catch {
    return null;
  }
}

/** End the administrator's Supabase session. */
export async function signOutAdmin(): Promise<void> {
  try {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
  } catch {
    /* ignore */
  }
}
