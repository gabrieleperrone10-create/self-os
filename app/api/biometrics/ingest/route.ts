export const maxDuration = 60;

import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Health Auto Export v2 con aggregateData=true usa Avg/Min/Max invece di qty
type MetricPoint = Record<string, unknown> & { date?: string; Date?: string };
type Metric = { name: string; units?: string; data?: MetricPoint[] };

function extractValue(point: MetricPoint): number | null {
  // v1: qty | v2 aggregate: Avg, avg, average | fallback: Min, Value, value
  const candidates = ['qty', 'Qty', 'Avg', 'avg', 'average', 'Average', 'Value', 'value', 'Min', 'min'];
  for (const key of candidates) {
    const v = point[key];
    if (typeof v === 'number' && isFinite(v)) return v;
    if (typeof v === 'string' && v.trim() !== '') {
      const n = parseFloat(v);
      if (isFinite(n)) return n;
    }
  }
  return null;
}

function extractDate(point: MetricPoint): Date | null {
  const raw = (point.date ?? point.Date ?? point['startDate'] ?? point['endDate']) as string | undefined;
  if (!raw) return null;
  const ts = new Date(raw);
  return isNaN(ts.getTime()) ? null : ts;
}

export async function POST(request: NextRequest) {
  try {
    const auth = request.headers.get('Authorization') ?? '';
    const fromHeader = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : auth.trim();
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

    const body = await request.json() as Record<string, unknown>;
    const dataBlock = (body?.data ?? body) as Record<string, unknown>;
    const metrics = Array.isArray(dataBlock?.metrics) ? (dataBlock.metrics as Metric[]) : null;

    if (!metrics) {
      console.error('[biometrics/ingest] formato non riconosciuto — keys:', Object.keys(body));
      return NextResponse.json({ error: 'Formato non valido', received_keys: Object.keys(body) }, { status: 400 });
    }

    const rows: Array<{
      user_id: string; source: string; metric: string;
      value: number; unit: string; recorded_at: string;
    }> = [];

    for (const metric of metrics) {
      if (!Array.isArray(metric.data)) continue;
      for (const point of metric.data) {
        const ts  = extractDate(point);
        const val = extractValue(point);
        if (!ts || val === null) continue;
        rows.push({
          user_id:     conn.user_id,
          source:      'apple_health',
          metric:      metric.name,
          value:       val,
          unit:        metric.units ?? '',
          recorded_at: ts.toISOString(),
        });
      }
    }

    for (let i = 0; i < rows.length; i += 500) {
      const { error } = await supabase
        .from('biometric_samples')
        .upsert(rows.slice(i, i + 500), {
          onConflict: 'user_id,source,metric,recorded_at',
          ignoreDuplicates: true,
        });
      if (error) throw error;
    }

    console.log(`[biometrics/ingest] ok — metrics: ${metrics.length}, imported: ${rows.length}`);
    return NextResponse.json({ ok: true, imported: rows.length });
  } catch (err) {
    console.error('[biometrics/ingest]', err);
    return NextResponse.json({ error: 'Errore' }, { status: 500 });
  }
}
