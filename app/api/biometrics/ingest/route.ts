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

// Il sonno non è un singolo numero: HAE manda un oggetto per notte con più campi
// (asleep, inBed, core, deep, rem, awake…). Non avendo certezza dei nomi esatti,
// estraiamo OGNI campo numerico come sotto-metrica namespacata `sleep_<campo>`,
// così il DB rivela da solo cosa HAE invia davvero. Salta le chiavi non-valore.
const SLEEP_SKIP_KEYS = new Set([
  'date', 'Date', 'startDate', 'endDate', 'source', 'Source', 'id',
  'sleepStart', 'sleepEnd', 'inBedStart', 'inBedEnd',
]);

function extractSleepRows(point: MetricPoint): Array<{ suffix: string; value: number }> {
  const out: Array<{ suffix: string; value: number }> = [];
  for (const [key, v] of Object.entries(point)) {
    if (SLEEP_SKIP_KEYS.has(key)) continue;
    if (typeof v === 'number' && isFinite(v)) out.push({ suffix: key, value: v });
    else if (typeof v === 'string' && v.trim() !== '') {
      const n = parseFloat(v);
      if (isFinite(n)) out.push({ suffix: key, value: n });
    }
  }
  return out;
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

    // Diagnostica: per ogni metrica conta i punti ricevuti vs importati, così
    // un export rivela quali metriche (es. sleep_analysis) vengono scartate
    // perché il loro payload non espone un valore numerico riconosciuto.
    const perMetric: Record<string, { received: number; imported: number }> = {};

    const isSleep = (name: string) => name === 'sleep_analysis' || name === 'sleep';

    for (const metric of metrics) {
      if (!Array.isArray(metric.data)) continue;
      const stat = perMetric[metric.name] ?? { received: 0, imported: 0 };
      for (const point of metric.data) {
        stat.received++;
        const ts = extractDate(point);
        if (!ts) continue;

        if (isSleep(metric.name)) {
          // Sonno: estrai tutti i campi numerici come sleep_<campo>
          const sleepRows = extractSleepRows(point);
          if (sleepRows.length === 0) continue;
          stat.imported++;
          for (const { suffix, value } of sleepRows) {
            rows.push({
              user_id:     conn.user_id,
              source:      'apple_health',
              metric:      `sleep_${suffix}`,
              value,
              unit:        'h',
              recorded_at: ts.toISOString(),
            });
          }
          continue;
        }

        const val = extractValue(point);
        if (val === null) continue;
        stat.imported++;
        rows.push({
          user_id:     conn.user_id,
          source:      'apple_health',
          metric:      metric.name,
          value:       val,
          unit:        metric.units ?? '',
          recorded_at: ts.toISOString(),
        });
      }
      perMetric[metric.name] = stat;
    }

    // Logga le metriche ricevute ma scartate del tutto (campione di chiavi incluso)
    const dropped = Object.entries(perMetric).filter(([, s]) => s.imported === 0 && s.received > 0);
    if (dropped.length > 0) {
      const sample = metrics.find(m => m.name === dropped[0][0])?.data?.[0];
      console.warn('[biometrics/ingest] metriche SCARTATE:', dropped.map(([n, s]) => `${n}(${s.received})`).join(', '),
        '| esempio chiavi:', sample ? Object.keys(sample).join(',') : 'n/a');
    }

    // ignoreDuplicates: false → ON CONFLICT DO UPDATE: aggiorna value e unit
    // così i totali giornalieri progressivi (passi, calorie) si aggiornano
    // ad ogni export di Health Auto Export invece di restare statici
    for (let i = 0; i < rows.length; i += 500) {
      const { error } = await supabase
        .from('biometric_samples')
        .upsert(rows.slice(i, i + 500), {
          onConflict: 'user_id,source,metric,recorded_at',
          ignoreDuplicates: false,
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
