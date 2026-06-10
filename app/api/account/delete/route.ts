import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Cancellazione account GDPR — irreversibile.
 * Richiede conferma esplicita nel body. Cancella i dati di ogni tabella
 * (non ci si affida solo al CASCADE), poi il profilo, poi l'utente auth.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    const body = await request.json() as { confirm?: string };
    if (body.confirm !== 'ELIMINA') {
      return NextResponse.json({ error: 'Conferma mancante' }, { status: 400 });
    }

    const admin = createAdminClient();

    // Ordine: prima le tabelle figlie, poi le relazioni coach, poi il profilo
    const tables = [
      'ai_usage', 'identity_profiles', 'monthly_letters', 'weekly_reports',
      'experiment_entries', 'experiments', 'signals', 'decisions',
      'patterns', 'checkins', 'scans',
    ];
    for (const table of tables) {
      try {
        await admin.from(table).delete().eq('user_id', user.id);
      } catch (err) {
        console.error(`[account-delete] ${table}:`, err);
      }
    }
    try {
      await admin.from('coach_clients').delete().or(`client_id.eq.${user.id},coach_id.eq.${user.id}`);
    } catch (err) {
      console.error('[account-delete] coach_clients:', err);
    }
    await admin.from('profiles').delete().eq('id', user.id);

    const { error: authError } = await admin.auth.admin.deleteUser(user.id);
    if (authError) throw authError;

    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error('[account-delete]', err);
    return NextResponse.json({ error: 'Cancellazione fallita' }, { status: 500 });
  }
}
