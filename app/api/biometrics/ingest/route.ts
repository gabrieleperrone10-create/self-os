export const maxDuration = 60;

import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

type MetricPoint = { date: string; qty: number };
type Metric = { name: string; units: string; data: MetricPoint[] };
type IngestPayload = { data: { metrics: Metric[] } };

// Chiamato da Health Auto Export su iPhone (nessuna sessione browser).
// Accetta il token in tre forme per compatibilità con l'app:
//   Authorization: Bearer TOKEN
//   Authorization: TOKEN
//   ?key=TOKEN  (query param)
export async function POST(request: NextRequest) {
  try {
    const auth = request.headers.get('Authorization') ?? '';
    const fromHeader = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : auth.trim();
    const fromQuery  = new URL(request.url).searchParams.get('key') ?? '';
    const token      = fromHeader || fromQuery;

    console.log('[biometrics/ingest] auth header:', JSON.stringify(auth));
    console.log('[biometrics/ingest] token extracted:', JSON.stringify(token));

    if (!token) return NextResponse.json({ error: 'Token mancante' }, { status: 401 });

    const supabase = createAdminClient();

    const { data: conn } = await supabase
      .from('biometric_connections')
      .select('user_id')
      .eq('ingest_token', token)
      .maybeSingle();

    if (!conn) {
      console.error('[biometrics/ingest] token non trovato nel DB:', JSON.stringify(token));
      return NextResponse.json({ error: 'Token non valido' }, { status: 401 });
    }

    const body = await request.json() as Record<string, unknown>;

    // Health Auto Export v2 può mandare { data: { metrics } } oppure { metrics } direttamente
    const dataBlock = (body?.data ?? body) as Record<string, unknown>;
    const metrics = Array.isArray(dataBlock?.metrics) ? dataBlock.metrics as Metric[] : null;

    // Log temporaneo per debug struttura payload
    console.log('[biometrics/ingest] keys:', Object.keys(body));
    console.log('[biometrics/ingest] dataBlock keys:', Object.keys(dataBlock));
    console.log('[biometrics/ingest] metrics count:', metrics?.length ?? 'non trovato');
    if (metrics?.[0]) console.log('[biometrics/ingest] sample metric:', JSON.stringify(metrics[0]).slice(0, 200));

    if (!metrics) {
      console.error('[biometrics/ingest] formato non riconosciuto:', JSON.stringify(body).slice(0, 500));
      return NextResponse.json({ error: 'Formato non valido', received_keys: Object.keys(body) }, { status: 400 });
    }

    const rows: Array<{
      user_id: string;
      source: string;
      metric: string;
      value: number;
      unit: string;
      recorded_at: string;
    }> = [];

    for (const metric of metrics) {
      if (!Array.isArray(metric.data)) continue;
      for (const point of metric.data) {
        const ts = new Date(point.date);
        if (isNaN(ts.getTime())) continue;
        rows.push({
          user_id:     conn.user_id,
          source:      'apple_health',
          metric:      metric.name,
          value:       point.qty,
          unit:        metric.units ?? '',
          recorded_at: ts.toISOString(),
        });
      }
    }

    // Batch da 500 per evitare payload troppo grandi
    for (let i = 0; i < rows.length; i += 500) {
      const { error } = await supabase
        .from('biometric_samples')
        .upsert(rows.slice(i, i + 500), {
          onConflict: 'user_id,source,metric,recorded_at',
          ignoreDuplicates: true,
        });
      if (error) throw error;
    }

    return NextResponse.json({ ok: true, imported: rows.length });
  } catch (err) {
    console.error('[biometrics/ingest]', err);
    return NextResponse.json({ error: 'Errore' }, { status: 500 });
  }
}
