import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Client con service role — SOLO per route cron/webhook server-side.
 * Bypassa RLS: mai usarlo in percorsi guidati da input utente.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

export type AdminClient = ReturnType<typeof createAdminClient>;
