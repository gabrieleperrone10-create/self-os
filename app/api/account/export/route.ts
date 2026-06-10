import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Tabelle con dati dell'utente (user_id) — RLS garantisce che la query
// di sessione veda solo i propri dati
const USER_TABLES = [
  'scans', 'checkins', 'patterns', 'decisions', 'signals',
  'experiments', 'experiment_entries', 'weekly_reports',
  'monthly_letters', 'identity_profiles', 'ai_usage',
] as const;

/** Export GDPR: tutti i dati dell'utente in un unico JSON scaricabile. */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles').select('*').eq('id', user.id).single();

    const exportData: Record<string, unknown> = {
      exported_at: new Date().toISOString(),
      profile,
    };

    // Tabelle nuove potrebbero non esistere ancora sul DB live: fail-open per tabella
    await Promise.all(USER_TABLES.map(async table => {
      try {
        const { data } = await supabase.from(table).select('*').eq('user_id', user.id);
        exportData[table] = data ?? [];
      } catch {
        exportData[table] = [];
      }
    }));

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="selfos-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (err) {
    console.error('[account-export]', err);
    return NextResponse.json({ error: 'Export non disponibile' }, { status: 500 });
  }
}
