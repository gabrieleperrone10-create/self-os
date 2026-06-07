import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Signal } from '@/types';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    const { data, error } = await supabase
      .from('signals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return NextResponse.json({ signals: (data ?? []) as Signal[] });
  } catch (err) {
    console.error('[signals GET]', err);
    return NextResponse.json({ error: 'Errore' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    const body = await request.json() as { content: string; state_score: number };
    const { content, state_score } = body;

    if (!content?.trim() || content.length > 300) {
      return NextResponse.json({ error: 'Contenuto non valido' }, { status: 400 });
    }
    if (!state_score || state_score < 1 || state_score > 10) {
      return NextResponse.json({ error: 'Stato non valido' }, { status: 400 });
    }

    const { data: signal, error } = await supabase
      .from('signals')
      .insert({ user_id: user.id, content: content.trim(), state_score })
      .select()
      .single<Signal>();

    if (error) throw error;

    // Trigger AI analysis async (non-blocking — user sees signal immediately)
    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/ai/analyze-signal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: request.headers.get('cookie') ?? '' },
      body: JSON.stringify({ signalId: signal.id }),
    }).catch(() => {});

    return NextResponse.json({ signal });
  } catch (err) {
    console.error('[signals POST]', err);
    return NextResponse.json({ error: 'Salvataggio fallito' }, { status: 500 });
  }
}
