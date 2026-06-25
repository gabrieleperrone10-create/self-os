'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BiometricsInsightButton } from './insight-button';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '@/lib/calendar/categorize';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import type { DailyPoint, DailyCorrelation, TodaySummary } from './page';
import type { BiometricsInsight } from '@/lib/anthropic/schemas';

const DAYS_IT = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

function fmtDay(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return `${DAYS_IT[dt.getDay()]} ${d}/${m}`;
}

function fmtShort(dateStr: string) {
  const [, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(2026, m - 1, d);
  return `${DAYS_IT[dt.getDay()]} ${d}`;
}

function fmtFull(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('it-IT', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

const tooltipStyle = {
  backgroundColor: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '3px',
  fontFamily: 'Georgia, serif',
  fontSize: '0.8rem',
  color: 'var(--text-primary)',
};

// ─── Spiegazioni metriche ────────────────────────────────────

const METRIC_EXPLAIN = {
  hrv: {
    label: 'HRV — Variabilità Cardiaca',
    what: "Misura quanto varia il tempo tra un battito e l'altro — non la velocità del cuore, ma la sua flessibilità. È un segnale del sistema nervoso autonomo.",
    meaning: "Più alto = sistema nervoso adattabile, buon recupero. Più basso = il corpo sta gestendo qualcosa. Il delta (±) è rispetto alla tua media personale (baseline).",
  },
  hr: {
    label: 'FC — Frequenza Cardiaca a Riposo',
    what: 'Battiti al minuto a riposo, misurati dal sensore durante il sonno.',
    meaning: "Più bassa = cuore efficiente, buon recupero. Un aumento improvviso può segnalare stress accumulato, poco sonno, o inizio di malattia.",
  },
  sleep: {
    label: 'Sonno — Ore Totali',
    what: "Ore dormite nella notte che precede questo giorno. Dato da Apple Health.",
    meaning: "Principale modulatore dell'HRV: notti corte (<6h) o frammentate tendono a deprimere la variabilità cardiaca il giorno dopo.",
  },
  steps: {
    label: 'Passi — Movimento Giornaliero',
    what: 'Totale passi contati dal telefono o bracciale durante la giornata.',
    meaning: "Proxy grezzo: giornate sedentarie vs attive. Non distingue tra camminata attiva e spostamenti.",
  },
  convergence: {
    label: 'Convergenza — Corpo vs Mente',
    what: "Confronta il tuo stato dichiarato nel check-in serale (1-10) con la risposta del corpo misurata il giorno dopo (HRV rispetto alla baseline).",
    meaning: "Quando divergono, il corpo sta raccontando una storia diversa da quella che percepisci. Succede spesso dopo giornate intense mascherate da \"va tutto bene\".",
  },
} as const;

// ─── Types ───────────────────────────────────────────────────

type Props = {
  hasBiometrics: boolean;
  dataDays: number;
  totalSamples: number;
  hasCalendar: boolean;
  hasHrv: boolean;
  selectedDays: number;
  rangeFrom: string;
  rangeTo: string;
  dailyHrv: DailyPoint[];
  dailyHr: DailyPoint[];
  dailySteps: DailyPoint[];
  dailySleep: DailyPoint[];
  hrvBaseline: number | null;
  correlations: DailyCorrelation[];
  todaySummary: TodaySummary;
  allMetrics: string[];
  initialInsight: BiometricsInsight | null;
  insightVersion: number | null;
  insightCreatedAt: string | null;
};

// ─── Sub-components ──────────────────────────────────────────

function SummaryCard({
  label, value, unit, delta, higherIsBetter = true, empty, note,
}: {
  label: string; value: number | null; unit: string;
  delta?: number | null; higherIsBetter?: boolean; empty?: string; note?: string | null;
}) {
  const improved = delta != null && (higherIsBetter ? delta > 0 : delta < 0);
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: '3px', padding: '1.5rem', flex: 1, minWidth: '140px',
    }}>
      <p style={{ fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>{label}</p>
      {value !== null ? (
        <>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '1.9rem', color: 'var(--text-primary)', lineHeight: 1 }}>
            {typeof value === 'number' && value > 999 ? value.toLocaleString('it-IT') : value}
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginLeft: '0.3rem' }}>{unit}</span>
          </p>
          {delta != null && (
            <p style={{ fontSize: '0.72rem', color: improved ? 'var(--pattern)' : '#B87171', marginTop: '0.5rem' }}>
              {delta > 0 ? '+' : ''}{delta} {unit} vs baseline
            </p>
          )}
          {note && !delta && (
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{note}</p>
          )}
        </>
      ) : (
        <>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '1.9rem', color: 'var(--text-muted)', lineHeight: 1 }}>—</p>
          {empty && <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{empty}</p>}
        </>
      )}
    </div>
  );
}

function CategoryBadge({ category }: { category: string | null }) {
  if (!category) return null;
  const label = CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS];
  const color = CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS];
  if (!label) return null;
  return (
    <span style={{
      fontSize: '0.62rem', color, border: `1px solid ${color}`,
      borderRadius: '2px', padding: '0.1rem 0.35rem',
      letterSpacing: '0.06em', opacity: 0.85, whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}

function MetricDetail({ label, value, suffix, delta, explain }: {
  label: string; value: string; suffix?: string; delta?: number | null; explain: string;
}) {
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', minWidth: '48px' }}>
          {label}
        </span>
        <span style={{ fontFamily: 'Georgia, serif', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
          {value}
          {suffix && <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginLeft: '0.15rem' }}>{suffix}</span>}
          {delta != null && (
            <span style={{ fontSize: '0.72rem', marginLeft: '0.4rem', color: delta > 2 ? 'var(--pattern)' : delta < -2 ? '#B87171' : 'var(--text-muted)' }}>
              {delta > 0 ? '+' : ''}{delta} vs baseline
            </span>
          )}
        </span>
      </div>
      <p style={{
        fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.5,
        marginTop: '0.15rem', marginLeft: '48px', paddingLeft: '0.5rem',
        borderLeft: '1px solid var(--border)',
      }}>
        {explain}
      </p>
    </div>
  );
}

function DateFilterBar({
  selectedDays, rangeFrom, rangeTo,
}: {
  selectedDays: number; rangeFrom: string; rangeTo: string;
}) {
  const router = useRouter();
  const [customFrom, setCustomFrom] = useState(rangeFrom);
  const [customTo, setCustomTo] = useState(rangeTo);
  const [showCustom, setShowCustom] = useState(false);

  function setPreset(days: number) { router.push(`/biometrics?days=${days}`); }
  function applyCustom() {
    if (customFrom && customTo && customFrom <= customTo) {
      router.push(`/biometrics?from=${customFrom}&to=${customTo}`);
    }
  }
  function setAll() { router.push('/biometrics?days=all'); }

  const presets = [7, 30, 90] as const;
  const isAll = selectedDays >= 3650;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
      {presets.map(d => (
        <button
          key={d}
          onClick={() => setPreset(d)}
          style={{
            padding: '0.35rem 0.75rem', background: 'transparent',
            border: `1px solid ${selectedDays === d && !showCustom && !isAll ? 'var(--gold)' : 'var(--border)'}`,
            borderRadius: '3px',
            color: selectedDays === d && !showCustom && !isAll ? 'var(--gold)' : 'var(--text-muted)',
            fontFamily: 'Georgia, serif', fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s ease',
          }}
        >
          {d}g
        </button>
      ))}
      <button
        onClick={setAll}
        style={{
          padding: '0.35rem 0.75rem', background: 'transparent',
          border: `1px solid ${isAll ? 'var(--gold)' : 'var(--border)'}`,
          borderRadius: '3px', color: isAll ? 'var(--gold)' : 'var(--text-muted)',
          fontFamily: 'Georgia, serif', fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s ease',
        }}
      >
        Tutto
      </button>
      <button
        onClick={() => setShowCustom(v => !v)}
        style={{
          padding: '0.35rem 0.75rem', background: 'transparent',
          border: `1px solid ${showCustom ? 'var(--gold)' : 'var(--border)'}`,
          borderRadius: '3px', color: showCustom ? 'var(--gold)' : 'var(--text-muted)',
          fontFamily: 'Georgia, serif', fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s ease',
        }}
      >
        Personalizzato
      </button>
      {showCustom && (
        <>
          <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} style={dateInputStyle} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>→</span>
          <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} style={dateInputStyle} />
          <button
            onClick={applyCustom}
            style={{
              padding: '0.35rem 0.75rem', background: 'transparent',
              border: '1px solid var(--gold)', borderRadius: '3px', color: 'var(--gold)',
              fontFamily: 'Georgia, serif', fontSize: '0.75rem', cursor: 'pointer',
            }}
          >
            Applica
          </button>
        </>
      )}
    </div>
  );
}

const dateInputStyle: React.CSSProperties = {
  padding: '0.3rem 0.5rem', background: 'var(--surface)',
  border: '1px solid var(--border)', borderRadius: '3px',
  color: 'var(--text-secondary)', fontFamily: 'Georgia, serif',
  fontSize: '0.75rem', colorScheme: 'dark',
};

function WatchSyncBadge({ lastWatchAt }: { lastWatchAt: string | null }) {
  const [label, setLabel] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);

  useEffect(() => {
    if (!lastWatchAt) {
      setLabel('watch mai sincronizzato');
      setIsStale(true);
      return;
    }
    const ts = new Date(lastWatchAt).getTime();
    const diffH = (Date.now() - ts) / 3600000;
    let text: string;
    if (diffH < 1) text = 'watch sincronizzato < 1h fa';
    else if (diffH < 6) text = `watch sincronizzato ${Math.floor(diffH)}h fa`;
    else if (diffH < 24) text = `watch: ultimo dato ${Math.floor(diffH)}h fa`;
    else {
      const d = Math.floor(diffH / 24);
      text = `watch: ultimo dato ${d} ${d === 1 ? 'giorno' : 'giorni'} fa`;
    }
    setLabel(text);
    setIsStale(diffH >= 4);
  }, [lastWatchAt]);

  if (!label) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
      <span style={{
        display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%',
        background: isStale ? '#B87171' : 'var(--pattern)', flexShrink: 0,
      }} />
      <span style={{ fontSize: '0.72rem', color: isStale ? '#B87171' : 'var(--text-muted)' }}>{label}</span>
    </div>
  );
}

// ─── Convergence logic ───────────────────────────────────────

function getConvergence(declared: number | null, delta: number | null) {
  if (declared === null || delta === null) return null;
  if (declared <= 4 && delta < -2) return {
    label: 'il corpo ha seguito',
    color: '#B87171',
    detail: `Hai dichiarato ${declared}/10. Il corpo conferma: HRV ${delta}ms sotto la baseline. Mente e corpo sono allineati — entrambi segnalano difficoltà.`,
  };
  if (declared >= 7 && delta > 2) return {
    label: 'corpo in linea',
    color: 'var(--pattern)',
    detail: `Hai dichiarato ${declared}/10. Il corpo conferma: HRV +${delta}ms sopra la baseline. Ciò che percepisci corrisponde a ciò che il corpo registra.`,
  };
  if (declared <= 4 && delta > 2) return {
    label: 'corpo in controtendenza',
    color: 'var(--gold)',
    detail: `Hai dichiarato ${declared}/10, ma il corpo dice altro: HRV +${delta}ms sopra la baseline. Forse stai sottovalutando come stai — o il corpo non ha ancora reagito.`,
  };
  if (declared >= 7 && delta < -2) return {
    label: 'corpo in controtendenza',
    color: 'var(--gold)',
    detail: `Hai dichiarato ${declared}/10, ma il corpo dice altro: HRV ${delta}ms sotto la baseline. Forse stai ignorando un segnale — o mascherando il carico.`,
  };
  return null;
}

// ─── Main component ──────────────────────────────────────────

export function BiometricsCharts({
  hasBiometrics, dataDays, totalSamples, hasCalendar, hasHrv,
  selectedDays, rangeFrom, rangeTo,
  dailyHrv, dailyHr, dailySteps, dailySleep,
  hrvBaseline, correlations, todaySummary,
  allMetrics,
  initialInsight, insightVersion, insightCreatedAt,
}: Props) {
  const router = useRouter();
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [showRawData, setShowRawData] = useState(false);

  void allMetrics;

  useEffect(() => {
    const id = setInterval(() => router.refresh(), 15 * 60 * 1000);
    return () => clearInterval(id);
  }, [router]);

  const latestSleep = dailySleep.length > 0 ? dailySleep[dailySleep.length - 1] : null;
  const chartInterval = selectedDays > 30 ? Math.floor(selectedDays / 10) : selectedDays > 14 ? 3 : 0;

  const timeline = correlations.map(day => ({
    label: fmtShort(day.date),
    date: day.date,
    hrv: day.hrv,
    hr: day.hr,
    steps: day.steps,
  }));

  const daysWithData = correlations.filter(d =>
    d.hrv !== null || d.hr !== null || d.steps !== null || d.sleep !== null || d.eventsBefore.length > 0
  );
  const daysEmpty = correlations.length - daysWithData.length;

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
            Corpo
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Come il corpo risponde a ciò che fai — e cosa rivela di ciò che non ti dici
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          {totalSamples > 0 && (
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {totalSamples.toLocaleString('it-IT')} campioni
            </p>
          )}
          {hasBiometrics && samples_shown(correlations) === 0 && totalSamples > 0 && (
            <p style={{ fontSize: '0.7rem', color: '#B87171', marginTop: '0.2rem' }}>
              0 campioni nel range — prova a estendere il periodo
            </p>
          )}
        </div>
      </div>

      {/* Date filter */}
      <DateFilterBar selectedDays={selectedDays} rangeFrom={rangeFrom} rangeTo={rangeTo} />

      {/* Banner: storico limitato */}
      {hasBiometrics && dataDays < 7 && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '3px',
          padding: '0.875rem 1.25rem', marginBottom: '1.25rem',
          display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
        }}>
          <span style={{ color: 'var(--gold)', fontSize: '0.8rem', flexShrink: 0 }}>●</span>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
              Storico di {dataDays} {dataDays === 1 ? 'giorno' : 'giorni'} — l&apos;analisi migliorerà nel tempo
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Per importare lo storico Apple Health: apri Health Auto Export → seleziona l&apos;export → cerca <strong>Historical Export</strong> o <strong>Backfill</strong> e seleziona &quot;All data&quot;.
            </p>
          </div>
        </div>
      )}

      {/* Avviso: nessun dato */}
      {!hasBiometrics && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '3px', padding: '3rem 2rem', textAlign: 'center', marginBottom: '1.5rem' }}>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Nessun dato biometrico</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            Connetti Health Auto Export (iOS) e configura l&apos;endpoint REST.<br />
            Le istruzioni sono in <a href="/settings" style={{ color: 'var(--gold)', textDecoration: 'none' }}>Impostazioni → Connessioni dati</a>.
          </p>
        </div>
      )}

      {/* Avviso: no HRV */}
      {hasBiometrics && !hasHrv && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '3px',
          padding: '0.875rem 1.25rem', marginBottom: '1.25rem',
          display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
        }}>
          <span style={{ color: 'var(--gold)', fontSize: '0.8rem' }}>●</span>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
              Dati attività iPhone ricevuti ({allMetrics.length} metriche)
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              HRV arriverà quando il Hume Band sincronizza. Verifica in Salute → Cuore → HRV → Origini dati.
            </p>
          </div>
        </div>
      )}

      {/* Avviso: no calendario */}
      {hasBiometrics && !hasCalendar && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '3px',
          padding: '0.75rem 1.25rem', marginBottom: '1.25rem',
          display: 'flex', gap: '0.75rem', alignItems: 'center',
        }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Nessun evento nel periodo. Sincronizza in{' '}
            <a href="/settings" style={{ color: 'var(--gold)', textDecoration: 'none' }}>Impostazioni</a>.
          </span>
        </div>
      )}

      {/* Watch sync */}
      {hasBiometrics && <WatchSyncBadge lastWatchAt={todaySummary.lastWatchAt} />}

      {/* ══════ HERO: Interpretazione AI ══════ */}
      <BiometricsInsightButton
        hasBiometrics={hasBiometrics}
        initialInsight={initialInsight}
        version={insightVersion}
        createdAt={insightCreatedAt}
      />

      {/* ══════ MAIN: Convergenza giorno per giorno ══════ */}
      {hasBiometrics && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '3px', overflow: 'hidden', marginTop: '1.5rem' }}>
          <div style={{ padding: '1.25rem 1.5rem 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Corpo ↔ Mente — giorno per giorno
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {daysEmpty > 0 && (
                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  {daysEmpty} giorni senza dati nascosti
                </p>
              )}
              <button
                onClick={() => setShowGuide(!showGuide)}
                style={{
                  background: 'none', border: `1px solid ${showGuide ? 'var(--gold)' : 'var(--border)'}`,
                  borderRadius: '3px', color: showGuide ? 'var(--gold)' : 'var(--text-muted)',
                  fontSize: '0.65rem', cursor: 'pointer', padding: '0.15rem 0.5rem',
                  fontFamily: 'Georgia, serif', transition: 'all 0.2s ease',
                }}
              >
                {showGuide ? 'chiudi guida' : 'come leggere'}
              </button>
            </div>
          </div>

          {/* Guide */}
          {showGuide && (
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', background: 'rgba(201,169,110,0.03)' }}>
              <p style={{ fontFamily: 'Georgia, serif', fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.7, marginBottom: '1rem' }}>
                Ogni riga mostra un giorno. Il corpo di oggi viene confrontato con ciò che è successo la sera prima — eventi, stato dichiarato, sonno.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {Object.entries(METRIC_EXPLAIN).map(([key, info]) => (
                  <div key={key}>
                    <p style={{ fontSize: '0.72rem', color: 'var(--gold)', fontFamily: 'Georgia, serif', marginBottom: '0.15rem' }}>
                      {info.label}
                    </p>
                    <p style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {info.what}
                    </p>
                    <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.5, fontStyle: 'italic' }}>
                      {info.meaning}
                    </p>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Il bordo sinistro indica: <span style={{ color: 'var(--pattern)' }}>verde</span> = HRV sopra la tua media, <span style={{ color: '#B87171' }}>rosso</span> = sotto. Clicca una riga per i dettagli.
                </p>
              </div>
            </div>
          )}

          {/* Empty state */}
          {daysWithData.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Nessun dato nel periodo selezionato.<br />
                {totalSamples > 0 ? `Hai ${totalSamples.toLocaleString('it-IT')} campioni in archivio — prova a estendere il range.` : 'Attendi il prossimo export di Health Auto Export.'}
              </p>
            </div>
          )}

          {/* Day rows — convergence first */}
          {daysWithData.slice().reverse().map((day) => {
            const positive = day.hrvDelta !== null && day.hrvDelta > 2;
            const negative = day.hrvDelta !== null && day.hrvDelta < -2;
            const isExpanded = expandedDay === day.date;
            const conv = getConvergence(day.declaredBefore, day.hrvDelta);

            return (
              <div key={day.date}>
                <div
                  onClick={() => setExpandedDay(isExpanded ? null : day.date)}
                  style={{
                    display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
                    padding: '0.875rem 1.5rem',
                    borderTop: '1px solid var(--border)',
                    borderLeft: positive ? '3px solid var(--pattern)' : negative ? '3px solid #B87171' : '3px solid transparent',
                    cursor: 'pointer', transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Date */}
                  <div style={{ minWidth: '90px' }}>
                    <p style={{ fontFamily: 'Georgia, serif', fontSize: '0.82rem', color: 'var(--text-primary)' }}>{fmtDay(day.date)}</p>
                  </div>

                  {/* Convergence + compact metrics */}
                  <div style={{ flex: 1 }}>
                    {conv && (
                      <div style={{ marginBottom: '0.3rem' }}>
                        <span style={{ fontFamily: 'Georgia, serif', fontSize: '0.82rem', color: conv.color }}>
                          {conv.label}
                        </span>
                        {day.declaredBefore !== null && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                            sera prima: {day.declaredBefore}/10
                          </span>
                        )}
                      </div>
                    )}
                    {day.declaredBefore !== null && !conv && (
                      <div style={{ marginBottom: '0.3rem' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          sera prima: {day.declaredBefore}/10
                        </span>
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      {day.hrv !== null && (
                        <span style={{ fontSize: '0.75rem', color: positive ? 'var(--pattern)' : negative ? '#B87171' : 'var(--text-secondary)' }}>
                          HRV {day.hrv}ms
                          {day.hrvDelta !== null && (
                            <span style={{ fontSize: '0.68rem', marginLeft: '0.2rem', color: 'var(--text-muted)' }}>
                              ({day.hrvDelta > 0 ? '+' : ''}{day.hrvDelta})
                            </span>
                          )}
                        </span>
                      )}
                      {day.sleep !== null && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Sonno {day.sleep}h</span>
                      )}
                      {day.hr !== null && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>FC {day.hr}bpm</span>
                      )}
                      {day.steps !== null && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{day.steps.toLocaleString('it-IT')} passi</span>
                      )}
                    </div>
                  </div>

                  {/* Events count */}
                  {day.eventsBefore.length > 0 && (
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', alignSelf: 'center' }}>
                      {day.eventsBefore.length} {day.eventsBefore.length === 1 ? 'evento' : 'eventi'}
                    </span>
                  )}

                  <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', alignSelf: 'center' }}>
                    {isExpanded ? '▲' : '▼'}
                  </span>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div style={{
                    padding: '1rem 1.5rem 1.25rem', borderTop: '1px solid var(--border)',
                    background: 'rgba(255,255,255,0.015)',
                  }}>
                    <p style={{ fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                      {fmtFull(day.date)}
                    </p>

                    {/* Convergence detail */}
                    {day.declaredBefore !== null && (
                      <div style={{ marginBottom: '1.25rem' }}>
                        <p style={{ fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '0.4rem' }}>
                          Convergenza corpo ↔ mente
                        </p>
                        {conv ? (
                          <p style={{ fontFamily: 'Georgia, serif', fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.7 }}>
                            {conv.detail}
                          </p>
                        ) : (
                          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            Check-in serale: {day.declaredBefore}/10.
                            {day.hrvDelta !== null
                              ? ` HRV: ${day.hrvDelta > 0 ? '+' : ''}${day.hrvDelta}ms vs baseline. Variazione non significativa.`
                              : ' HRV non disponibile — serve il bracciale per il confronto.'}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Metrics with explanations */}
                    {(day.hrv !== null || day.hr !== null || day.sleep !== null || day.steps !== null) && (
                      <div style={{ marginBottom: '1.25rem' }}>
                        <p style={{ fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
                          Metriche
                        </p>
                        {day.hrv !== null && (
                          <MetricDetail label="HRV" value={`${day.hrv}`} suffix="ms" delta={day.hrvDelta} explain={METRIC_EXPLAIN.hrv.meaning} />
                        )}
                        {day.hr !== null && (
                          <MetricDetail label="FC" value={`${day.hr}`} suffix="bpm" explain={METRIC_EXPLAIN.hr.meaning} />
                        )}
                        {day.sleep !== null && (
                          <MetricDetail label="Sonno" value={`${day.sleep}`} suffix="h" explain={METRIC_EXPLAIN.sleep.meaning} />
                        )}
                        {day.steps !== null && (
                          <MetricDetail label="Passi" value={day.steps.toLocaleString('it-IT')} explain={METRIC_EXPLAIN.steps.meaning} />
                        )}
                      </div>
                    )}

                    {/* Events */}
                    {day.eventsBefore.length > 0 && (
                      <div>
                        <p style={{ fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                          Eventi la sera prima
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          {day.eventsBefore.map((ev, j) => (
                            <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              <CategoryBadge category={ev.category} />
                              <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>{ev.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {day.eventsBefore.length === 0 && day.declaredBefore === null && (
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Nessun evento e nessun check-in serale per questo giorno.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ══════ SECONDARY: Dati grezzi (collapsible) ══════ */}
      {hasBiometrics && (
        <div style={{ marginTop: '1.5rem' }}>
          <button
            onClick={() => setShowRawData(!showRawData)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '0.5rem 0', width: '100%', textAlign: 'left',
              fontFamily: 'Georgia, serif',
            }}
          >
            <span style={{ fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Dati grezzi e timeline
            </span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              {showRawData ? '▲' : '▼'}
            </span>
          </button>

          {showRawData && (
            <>
              {/* Summary cards */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem', marginTop: '0.75rem' }}>
                <SummaryCard
                  label="HRV recente" value={todaySummary.hrv} unit="ms"
                  delta={todaySummary.hrv !== null && hrvBaseline !== null ? Math.round((todaySummary.hrv - hrvBaseline) * 10) / 10 : null}
                  higherIsBetter empty="bracciale non sincronizzato"
                  note={todaySummary.hrvDate && todaySummary.hrvDate < rangeTo ? 'ieri notte' : null}
                />
                <SummaryCard
                  label="FC a riposo" value={todaySummary.hr} unit="bpm"
                  higherIsBetter={false} empty="nessun dato"
                  note={todaySummary.hrDate && todaySummary.hrDate < rangeTo ? 'ieri' : null}
                />
                <SummaryCard
                  label="Sonno" value={latestSleep?.value ?? null} unit="h"
                  higherIsBetter empty="nessun dato sonno"
                  note={latestSleep && latestSleep.date < rangeTo ? 'ultima notte' : null}
                />
                <SummaryCard
                  label="Passi" value={todaySummary.steps} unit=""
                  empty="nessun dato"
                  note={todaySummary.stepsDate && todaySummary.stepsDate < rangeTo ? 'ieri' : null}
                />
                {hrvBaseline !== null && (
                  <SummaryCard label="Baseline HRV" value={hrvBaseline} unit="ms" />
                )}
              </div>

              {/* Timeline chart */}
              {timeline.length > 0 && (
                <div style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: '3px', padding: '1.5rem', marginBottom: '1.5rem',
                }}>
                  <p style={{ fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                    Timeline — {selectedDays} giorni
                  </p>

                  {(dailyHrv.length > 0 || dailyHr.length > 0) ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <ComposedChart data={timeline} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                        <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" vertical={false} />
                        <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'Georgia, serif' }} tickLine={false} axisLine={false} interval={chartInterval} />
                        <YAxis yAxisId="hrv" orientation="left" tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'Georgia, serif' }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                        {dailyHr.length > 0 && (
                          <YAxis yAxisId="hr" orientation="right" tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'Georgia, serif' }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                        )}
                        <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: 'var(--border)' }} />
                        {hrvBaseline !== null && (
                          <ReferenceLine yAxisId="hrv" y={hrvBaseline} stroke="var(--gold)" strokeDasharray="3 3" strokeOpacity={0.4} />
                        )}
                        {dailyHrv.length > 0 && (
                          <Line yAxisId="hrv" type="monotone" dataKey="hrv" name="HRV (ms)" stroke="var(--pattern)" strokeWidth={1.5} dot={false} connectNulls={false} />
                        )}
                        {dailyHr.length > 0 && (
                          <Line yAxisId="hr" type="monotone" dataKey="hr" name="FC riposo (bpm)" stroke="var(--identita)" strokeWidth={1.5} dot={false} connectNulls={false} />
                        )}
                      </ComposedChart>
                    </ResponsiveContainer>
                  ) : dailySteps.length > 0 ? (
                    <ResponsiveContainer width="100%" height={160}>
                      <ComposedChart data={timeline} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                        <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" vertical={false} />
                        <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'Georgia, serif' }} tickLine={false} axisLine={false} interval={chartInterval} />
                        <YAxis yAxisId="s" tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'Georgia, serif' }} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Bar yAxisId="s" dataKey="steps" name="Passi" fill="var(--gold)" fillOpacity={0.3} radius={[2, 2, 0, 0]} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  ) : (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
                      Nessun dato nel periodo
                    </p>
                  )}

                  <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                    {dailyHrv.length > 0 && <LegendDot color="var(--pattern)" label="HRV (ms)" />}
                    {dailyHr.length > 0 && <LegendDot color="var(--identita)" label="FC riposo (bpm)" />}
                    {hrvBaseline !== null && <LegendDashed label={`Baseline ${hrvBaseline}ms`} />}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── helpers ─────────────────────────────────────────────────

function samples_shown(correlations: DailyCorrelation[]): number {
  return correlations.filter(d =>
    d.hrv !== null || d.hr !== null || d.steps !== null || d.sleep !== null
  ).length;
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
      <span style={{ display: 'inline-block', width: '12px', height: '2px', background: color }} />
      {label}
    </span>
  );
}

function LegendDashed({ label }: { label: string }) {
  return (
    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
      <span style={{ display: 'inline-block', width: '12px', height: '0', border: '1px dashed color-mix(in srgb, var(--gold) 50%, transparent)' }} />
      {label}
    </span>
  );
}
