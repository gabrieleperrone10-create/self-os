export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getViewContext } from '@/lib/supabase/view-context';
import { checkAiQuota, quotaExceededBody } from '@/lib/ai/usage';
import { generateStatProgram, NoProgramError } from '@/lib/ai/stat-program';

const NO_PROGRAM_MESSAGE: Record<string, string> = {
  no_data: 'Servono almeno due periodi registrati per scrivere un programma.',
  divergence:
    'Condizione e tendenza divergono: la lettura corretta è non applicare nessuna formula in questo periodo. La scheda lo spiega già.',
};

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const viewContext = await getViewContext(supabase);
    if (!viewContext) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    if (viewContext.isImpersonating) {
      return NextResponse.json({ error: 'Sola lettura in modalità Entra come utente' }, { status: 403 });
    }

    const { realUserId } = viewContext;
    const quota = await checkAiQuota(supabase, realUserId);
    if (!quota.allowed) return NextResponse.json(quotaExceededBody(quota), { status: 429 });

    const { key } = await request.json() as { key?: string };
    if (!key) return NextResponse.json({ error: 'Stat non specificata' }, { status: 400 });

    const row = await generateStatProgram(supabase, realUserId, key);
    return NextResponse.json({ program: row });
  } catch (err) {
    if (err instanceof NoProgramError) {
      return NextResponse.json({ error: NO_PROGRAM_MESSAGE[err.reason] }, { status: 422 });
    }
    console.error('[stat-program]', err);
    return NextResponse.json({ error: 'Programma non disponibile' }, { status: 500 });
  }
}
