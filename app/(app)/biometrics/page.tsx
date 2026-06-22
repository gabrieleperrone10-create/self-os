export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getViewContext } from '@/lib/supabase/view-context';
import { BiometricsCharts } from './charts';
import { BiometricsComingSoon } from './coming-soon';
import { categorizeEvent } from '@/lib/calendar/categorize';
import { fetchLatestBiometricsInsight } from '@/lib/ai/biometrics-insight';

type Sample = { metric: string; value: number; unit: string | null; recorded_at: string };
type CalEvent = { id: string; title: string; start_at: string; end_at: string | null };

const HRV_KEYS   = new Set(['heart_rate_variability_sdnn', 'heart_rate_variability', 'hrv']);
const HR_KEYS    = new Set(['resting_heart_rate', 'heart_rate', 'walking_heart_rate_average']);
const STEP_KEYS  = new Set(['step_count']);
// HAE manda il sonno come sleep_totalSleep (ore dormite/notte) — è la metrica canonica.
// Le altre restano per compatibilità futura con formati diversi.
const SLEEP_KEYS = new Set(['sleep_totalSleep', 'sleep_analysis', 'asleep', 'in_bed', 'sleep_in_bed', 'time_in_bed']);

function round1(n: number) { return Math.round(n * 10) / 10; }
function mean(vals: number[]) { return vals.reduce((s, v) => s + v, 0) / vals.length; }

// Converte recorded_at UTC → data italiana YYYY-MM-DD
function toRomeDate(ts: string): string {
  return new Date(ts).toLocaleDateString('sv', { timeZone: 'Europe/Rome' });
}

function romeToday(): string {
  return new Date().toLocaleDateString('sv', { timeZone: 'Europe/Rome' });
}

function romeDateNDaysAgo(n: number): string {
  return new Date(Date.now() - n * 86400000).toLocaleDateString('sv', { timeZone: 'Europe/Rome' });
}

function prevDay(date: string): string {
  return new Date(new Date(date + 'T12:00:00Z').getTime() - 86400000)
    .toLocaleDateString('sv', { timeZone: 'Europe/Rome' });
}

function aggregateByDay(
  samples: Sample[],
  keys: Set<string>,
  mode: 'avg' | 'sum' = 'avg',
): Array<{ date: string; value: number }> {
  const byDay = new Map<string, number[]>();
  for (const s of samples) {
    if (!keys.has(s.metric)) continue;
    const day = toRomeDate(s.recorded_at);
    const arr = byDay.get(day) ?? [];
    arr.push(s.value);
    byDay.set(day, arr);
  }
  return [...byDay.entries()]
    .map(([date, vals]) => ({
      date,
      value: mode === 'avg'
        ? round1(mean(vals))
        : Math.round(vals.reduce((s, v) => s + v, 0)),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export type DailyPoint = { date: string; value: number };

export type DailyCorrelation = {
  date: string;              // giorno del corpo (D)
  hrv: number | null;
  hrvDelta: number | null;
  hr: number | null;
  steps: number | null;
  sleep: number | null;      // ore dormite la notte D-1→D (entrando nel giorno D)
  // Ciò che ha PRECEDUTO il corpo di questo giorno (sera di D-1) — principio del ritardo
  eventsBefore: Array<{ title: string; category: string | null }>;
  declaredBefore: number | null;  // stato dichiarato la sera di D-1 (1-10)
};

export type TodaySummary = {
  hrv: number | null;
  hrvDate: string | null;   // data della lettura HRV (potrebbe essere ieri)
  hr: number | null;
  hrDate: string | null;    // data della lettura FC
  steps: number | null;
  stepsDate: string | null; // data dei passi (potrebbero non essere di oggi)
  lastWatchAt: string | null; // ISO timestamp dell'ultimo dato watch (HRV o FC)
};

export const PRESET_DAYS = [7, 30, 90] as const;
export type PresetDays = typeof PRESET_DAYS[number];

export default async function BiometricsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string; from?: string; to?: string }>;
}) {
  const supabase = await createClient();
  const viewContext = await getViewContext(supabase);
  if (!viewContext) redirect('/login');
  const { viewUserId } = viewContext;

  // Gate: solo admin sui propri dati vede i biometrici.
  // Se si impersona un utente normale (isImpersonating=true) mostriamo il coming soon
  // esattamente come lo vedrebbe quell'utente.
  if (viewContext.realRole !== 'admin' || viewContext.isImpersonating) {
    return <BiometricsComingSoon />;
  }

  const params = await searchParams;

  // Risolve il range selezionato
  const today = romeToday();
  let rangeFrom: string;
  let rangeTo: string = today;
  let selectedDays: number;

  if (params.from && params.to) {
    rangeFrom    = params.from;
    rangeTo      = params.to;
    const ms     = new Date(rangeTo).getTime() - new Date(rangeFrom).getTime();
    selectedDays = Math.max(1, Math.round(ms / 86400000));
  } else if (params.days === 'all') {
    selectedDays = 3650; // 10 anni — mostra tutto
    rangeFrom    = romeDateNDaysAgo(3650);
  } else {
    selectedDays = Math.min(3650, Math.max(7, parseInt(params.days ?? '30', 10)));
    rangeFrom    = romeDateNDaysAgo(selectedDays);
  }

  // Supabase max_rows=1000 è un hard cap per request — aggiriamolo con
  // pagination parallela: prima fetch count+eventi, poi tutte le pagine insieme.
  const PAGE = 1000;

  const [totalRes, eventsRes] = await Promise.all([
    supabase
      .from('biometric_samples')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', viewUserId),
    supabase
      .from('calendar_events')
      .select('id, title, start_at, end_at')
      .eq('user_id', viewUserId)
      .gte('start_at', rangeFrom + 'T00:00:00Z')
      .lte('start_at', rangeTo   + 'T23:59:59Z')
      .order('start_at', { ascending: true }),
  ]);

  const totalSamples = totalRes.count ?? 0;
  const events       = (eventsRes.data ?? []) as CalEvent[];

  // Insight biometrico persistito (versionato) — mostrato sempre, non più effimero
  const persistedInsight = await fetchLatestBiometricsInsight(supabase, viewUserId);

  // Fetch tutte le pagine in parallelo (max 20 pagine = 20k righe)
  const pageCount = Math.min(20, Math.max(1, Math.ceil(totalSamples / PAGE)));
  const samplesPages = await Promise.all(
    Array.from({ length: pageCount }, (_, i) =>
      supabase
        .from('biometric_samples')
        .select('metric, value, unit, recorded_at')
        .eq('user_id', viewUserId)
        .order('recorded_at', { ascending: false })
        .range(i * PAGE, (i + 1) * PAGE - 1)
    )
  );
  const allSamples = samplesPages.flatMap(r => (r.data ?? []) as Sample[]);

  // Filtra campioni per il range selezionato (confronto su date italiane)
  const samples = allSamples.filter(s => {
    const d = toRomeDate(s.recorded_at);
    return d >= rangeFrom && d <= rangeTo;
  });

  // Daily series per il range selezionato
  const allDailyHrv   = aggregateByDay(samples, HRV_KEYS);
  const allDailyHr    = aggregateByDay(samples, HR_KEYS);
  const allDailySteps = aggregateByDay(samples, STEP_KEYS, 'sum');
  const allDailySleep = aggregateByDay(samples, SLEEP_KEYS);

  // Baseline HRV su tutti i campioni disponibili (non limitata al range)
  const baseHrvByDay = aggregateByDay(allSamples, HRV_KEYS);
  const hrvBaseline  = baseHrvByDay.length > 0
    ? round1(mean(baseHrvByDay.map(d => d.value)))
    : null;

  // HRV e FC: misurazioni notturne/quotidiane che potrebbero non avere ancora
  // il timestamp di "oggi" (es. HRV misurato a notte = still June 19 in UTC).
  // Usiamo il valore più recente disponibile, qualunque sia il giorno.
  const latestHrv   = allDailyHrv.length   > 0 ? allDailyHrv[allDailyHrv.length - 1]     : null;
  const latestHr    = allDailyHr.length    > 0 ? allDailyHr[allDailyHr.length - 1]       : null;
  // Passi: più recente disponibile (come HRV/FC — il filtro date è a parte)
  const latestSteps = allDailySteps.length > 0 ? allDailySteps[allDailySteps.length - 1] : null;

  // Ultimo timestamp raw di un dato watch (HRV o FC a riposo) — per mostrare "ultimo sync"
  const watchSamples = allSamples
    .filter(s => HRV_KEYS.has(s.metric) || s.metric === 'resting_heart_rate')
    .sort((a, b) => b.recorded_at.localeCompare(a.recorded_at));
  const lastWatchAt = watchSamples[0]?.recorded_at ?? null;

  // Genera tutti i giorni nel range selezionato
  const daysInRange = Array.from({ length: selectedDays + 1 }, (_, i) => {
    const d = new Date(new Date(rangeFrom + 'T12:00:00Z').getTime() + i * 86400000);
    return d.toLocaleDateString('sv', { timeZone: 'Europe/Rome' });
  }).filter(d => d <= today);

  // Raggruppa eventi per giorno con categoria
  const eventsByDay = new Map<string, Array<{ title: string; category: string | null }>>();
  for (const e of events) {
    const day = toRomeDate(e.start_at);
    const arr = eventsByDay.get(day) ?? [];
    if (e.title) arr.push({ title: e.title, category: categorizeEvent(e.title) });
    eventsByDay.set(day, arr);
  }

  const { data: checkinRows } = await supabase
    .from('checkins')
    .select('date, state_score')
    .eq('user_id', viewUserId)
    .eq('type', 'evening')
    .gte('date', rangeFrom)
    .lte('date', rangeTo);
  const declaredByDay = new Map<string, number>();
  for (const c of (checkinRows ?? []) as Array<{ date: string; state_score: number }>) {
    declaredByDay.set(c.date, c.state_score);
  }

  const correlations: DailyCorrelation[] = daysInRange.map(date => {
    const hrv    = allDailyHrv.find(d => d.date === date)?.value    ?? null;
    const hr     = allDailyHr.find(d => d.date === date)?.value     ?? null;
    const steps  = allDailySteps.find(d => d.date === date)?.value  ?? null;
    const sleep  = allDailySleep.find(d => d.date === date)?.value  ?? null;
    const hrvDelta = hrv !== null && hrvBaseline !== null ? round1(hrv - hrvBaseline) : null;
    const before = prevDay(date);
    return {
      date, hrv, hrvDelta, hr, steps, sleep,
      eventsBefore: eventsByDay.get(before) ?? [],
      declaredBefore: declaredByDay.get(before) ?? null,
    };
  });

  const allMetrics  = [...new Set(allSamples.map(s => s.metric))].sort();
  const hasHrv      = allDailyHrv.length > 0;
  const dataDays    = Math.max(allDailySteps.length, allDailyHrv.length, allDailyHr.length);

  return (
    <BiometricsCharts
      hasBiometrics={samples.length > 0 || totalSamples > 0}
      dataDays={dataDays}
      totalSamples={totalSamples}
      hasCalendar={events.length > 0}
      hasHrv={hasHrv}
      selectedDays={selectedDays}
      rangeFrom={rangeFrom}
      rangeTo={rangeTo}
      dailyHrv={allDailyHrv}
      dailyHr={allDailyHr}
      dailySteps={allDailySteps}
      dailySleep={allDailySleep}
      hrvBaseline={hrvBaseline}
      correlations={correlations}
      todaySummary={{
        hrv: latestHrv?.value ?? null,
        hrvDate: latestHrv?.date ?? null,
        hr: latestHr?.value ?? null,
        hrDate: latestHr?.date ?? null,
        steps: latestSteps?.value ?? null,
        stepsDate: latestSteps?.date ?? null,
        lastWatchAt,
      }}
      allMetrics={allMetrics}
      initialInsight={persistedInsight?.insight ?? null}
      insightVersion={persistedInsight?.version ?? null}
      insightCreatedAt={persistedInsight?.created_at ?? null}
    />
  );
}
