import { cookies } from 'next/headers';
import type { createClient } from '@/lib/supabase/server';
import type { Profile, UserRole } from '@/types';

type ServerClient = Awaited<ReturnType<typeof createClient>>;

export const IMPERSONATE_COOKIE = 'impersonate_user_id';

export interface ViewContext {
  realUserId: string;
  realRole: UserRole;
  viewUserId: string;
  viewProfile: Profile | null;
  isImpersonating: boolean;
}

/**
 * Risolve "chi sta guardando" vs "di chi sono i dati mostrati".
 * Se l'utente reale è admin e ha impostato il cookie impersonate_user_id
 * (via /api/admin/impersonate) su un profilo esistente diverso dal proprio,
 * viewUserId punta a quel profilo — sempre in sola lettura lato UI.
 * Le policy RLS admin_reads_all_* (is_admin(), basato su auth.uid() reale)
 * permettono all'admin di leggere quei dati indipendentemente dal cookie.
 */
export async function getViewContext(supabase: ServerClient): Promise<ViewContext | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: realProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>();

  const realRole = realProfile?.role ?? 'user';

  if (realRole === 'admin') {
    const cookieStore = await cookies();
    const impersonateId = cookieStore.get(IMPERSONATE_COOKIE)?.value;

    if (impersonateId && impersonateId !== user.id) {
      const { data: viewProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', impersonateId)
        .single<Profile>();

      if (viewProfile) {
        return {
          realUserId: user.id,
          realRole,
          viewUserId: impersonateId,
          viewProfile,
          isImpersonating: true,
        };
      }
    }
  }

  return {
    realUserId: user.id,
    realRole,
    viewUserId: user.id,
    viewProfile: realProfile ?? null,
    isImpersonating: false,
  };
}
