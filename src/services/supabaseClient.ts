import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
// Accept either the legacy anon JWT or the modern publishable key.
const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined);

export const isSupabaseConfigured: boolean = Boolean(supabaseUrl && supabaseAnonKey);

let client: SupabaseClient | null = null;
if (isSupabaseConfigured) {
  client = createClient(supabaseUrl as string, supabaseAnonKey as string, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
} else if (import.meta.env.DEV) {
  console.warn(
    '[CampusOS] Supabase is not configured (missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). ' +
      'Campus data requires a connection — see .env.example.'
  );
}

/**
 * Supabase browser client using ONLY the publishable/anon key.
 * Never import the service-role key in frontend code.
 */
export const supabase: SupabaseClient | null = client;
