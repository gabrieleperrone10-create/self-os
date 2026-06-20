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
    const fromHeader = auth.startsWith('Bearer ') ? auth.slice(7).trim() : auth.trim();
    const fromQuery  = new URL(request.url).searchParams.get('key') ?? '';
    const token      = fromHeader || fromQuery;
    if (!token) return NextResponse.json({ error: 'Token mancante' }, { status: 401 });

    const supabase = createAdminClient();

    const { data: conn } = await supabase
      .from('biometric_connections')
      .select('user_id')
      .eq('ingest_token', token)
      .maybeSingle();

    if (!conn) return NextResponse.json({ error: 'Token non valido' }, { status: 401 });

    const body = await request.json() as IngestPayload;
    const metrics = body?.data?.metrics;
    if (!Array.isArray(metrics)) {
      return NextResponse.json({ error: 'Formato non valido — atteso { data: { metrics: [...] } }' }, { status: 400 });
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
