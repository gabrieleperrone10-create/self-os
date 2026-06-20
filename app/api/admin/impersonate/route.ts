import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { IMPERSONATE_COOKIE } from '@/lib/supabase/view-context';
import type { Profile } from '@/types';

/** "Entra come utente": imposta il cookie httpOnly letto da getViewContext. Solo admin. */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single<Pick<Profile, 'role'>>();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    const body = await request.json() as { userId?: string };
    if (!body.userId) {
      return NextResponse.json({ error: 'userId mancante' }, { status: 400 });
    }

    const { data: target } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', body.userId)
      .single<Pick<Profile, 'id'>>();

    if (!target) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(IMPERSONATE_COOKIE, body.userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 12,
    });
    return response;
  } catch (err) {
    console.error('[admin/impersonate POST]', err);
    return NextResponse.json({ error: 'Errore' }, { status: 500 });
  }
}

/** Esce dalla modalità "Entra come utente". */
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(IMPERSONATE_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
