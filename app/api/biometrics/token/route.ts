export const maxDuration = 10;

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET — restituisce (o crea) il token di ingest per Health Auto Export
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    const { data: existing } = await supabase
      .from('biometric_connections')
      .select('ingest_token')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ token: (existing as { ingest_token: string }).ingest_token });
    }

    const { data: created, error } = await supabase
      .from('biometric_connections')
      .insert({ user_id: user.id })
      .select('ingest_token')
      .single();

    if (error) throw error;
    return NextResponse.json({ token: (created as { ingest_token: string }).ingest_token });
  } catch (err) {
    console.error('[biometrics/token]', err);
    return NextResponse.json({ error: 'Errore' }, { status: 500 });
  }
}
