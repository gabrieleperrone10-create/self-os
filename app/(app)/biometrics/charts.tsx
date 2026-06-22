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
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
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

function DateFilterBar({
  selectedDays, rangeFrom, rangeTo,
}: {
  selectedDays: number; rangeFrom: string; rangeTo: string;
}) {
  const router = useRouter();
  const [customFrom, setCustomFrom] = useState(rangeFrom);
  const [customTo,   setCustomTo]   = useState(rangeTo);
  const [showCustom, setShowCustom] = useState(false);

  function setPreset(days: number) {
    router.push(`/biometrics?days=${days}`);
  }

  function applyCustom() {
    if (customFrom && customTo && customFrom <= customTo) {
      router.push(`/biometrics?from=${customFrom}&to=${customTo}`);
    }
  }

  function setAll() {
    router.push('/biometrics?days=all');
  }

  const presets = [7, 30, 90] as const;
  const isAll = selectedDays >= 3650;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
      {presets.map(d => (
        <button
          key={d}
          onClick={() => setPreset(d)}
          style={{
            padding: '0.35rem 0.75rem',
            background: 'transparent',
            border: `1px solid ${selectedDays === d && !showCustom && !isAll ? 'var(--gold)' : 'var(--border)'}`,
            borderRadius: '3px',
            color: selectedDays === d && !showCustom && !isAll ? 'var(--gold)' : 'var(--text-muted)',
            fontFamily: 'Georgia, serif',
            fontSize: '0.75rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          {d}g
        </button>
      ))}
      <button
        onClick={setAll}
        style={{
          padding: '0.35rem 0.75rem',
          background: 'transparent',
          border: `1px solid ${isAll ? 'var(--gold)' : 'var(--border)'}`,
          borderRadius: '3px',
          color: isAll ? 'var(--gold)' : 'var(--text-muted)',
          fontFamily: 'Georgia, serif',
          fontSize: '0.75rem',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        Tutto
      </button>
      <button
        onClick={() => setShowCustom(v => !v)}
        style={{
          padding: '0.35rem 0.75rem',
          background: 'transparent',
          border: `1px solid ${showCustom ? 'var(--gold)' : 'var(--border)'}`,
          borderRadius: '3px',
          color: showCustom ? 'var(--gold)' : 'var(--text-muted)',
          fontFamily: 'Georgia, serif',
          fontSize: '0.75rem',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        Personalizzato
      </button>
      {showCustom && (
        <>
          <input
            type="date"
            value={customFrom}
            onChange={e => setCustomFrom(e.target.value)}
            style={dateInputStyle}
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>→</span>
          <input
            type="date"
            value={customTo}
            onChange={e => setCustomTo(e.target.value)}
            style={dateInputStyle}
          />
          <button
            onClick={applyCustom}
            style={{
              padding: '0.35rem 0.75rem',
              background: 'transparent',
              border: '1px solid var(--gold)',
              borderRadius: '3px',
              color: 'var(--gold)',
              fontFamily: 'Georgia, serif',
              fontSize: '0.75rem',
              cursor: 'pointer',
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
  padding: '0.3rem 0.5rem',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '3px',
  color: 'var(--text-secondary)',
  fontFamily: 'Georgia, serif',
  fontSize: '0.75rem',
  colorScheme: 'dark',
};

export function BiometricsCharts({
  hasBiometrics, dataDays, totalSamples, hasCalendar, hasHrv,
  selectedDays, rangeFrom, rangeTo,
  dailyHrv, dailyHr, dailySteps, dailySleep,
  hrvBaseline, correlations,
  todaySummary, allMetrics,
  initialInsight, insightVersion, insightCreatedAt,
}: Props) {
  const router = useRouter();
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  // Auto-refresh ogni 15 minuti (allineato con Health Auto Export)
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 15 * 60 * 1000);
    return () => clearInterval(id);
  }, [router]);

  // Sonno più recente disponibile (ore dormite l'ultima notte registrata)
  const latestSleep = dailySleep.length > 0 ? dailySleep[dailySleep.length - 1] : null;

  // Merge serie per il chart — usa intervallo corretto per x-axis
  const chartInterval = selectedDays > 30 ? Math.floor(selectedDays / 10) : selectedDays > 14 ? 3 : 0;

  const timeline = correlations.map(day => ({
    label: fmtShort(day.date),
    date: day.date,
    hrv:   day.hrv,
    hr:    day.hr,
    steps: day.steps,
  }));

  // Giorni con dati per non mostrare righe completamente vuote
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
            Biometrici e calendario — come il corpo risponde a ciò che fai
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          {totalSamples > 0 && (
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {totalSamples.toLocaleString('it-IT')} campioni in archivio
            </p>
          )}
          {hasBiometrics && samples_shown(correlations) === 0 && totalSamples > 0 && (
            <p style={{ fontSize: '0.7rem', color: '#B87171', marginTop: '0.2rem' }}>
              0 campioni nel range selezionato — prova a estendere il periodo
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

      {/* Avviso: nessun dato biometrico */}
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

      {/* Ultimo sync watch */}
      {hasBiometrics && <WatchSyncBadge lastWatchAt={todaySummary.lastWatchAt} />}

      {/* Summary cards */}
      {hasBiometrics && (
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <SummaryCard
            label="HRV recente"
            value={todaySummary.hrv}
            unit="ms"
            delta={todaySummary.hrv !== null && hrvBaseline !== null ? Math.round((todaySummary.hrv - hrvBaseline) * 10) / 10 : null}
            higherIsBetter
            empty="bracciale non sincronizzato"
            note={todaySummary.hrvDate && todaySummary.hrvDate < rangeTo ? 'ieri notte' : null}
          />
          <SummaryCard
            label="FC a riposo"
            value={todaySummary.hr}
            unit="bpm"
            higherIsBetter={false}
            empty="nessun dato"
            note={todaySummary.hrDate && todaySummary.hrDate < rangeTo ? 'ieri' : null}
          />
          <SummaryCard
            label="Sonno"
            value={latestSleep?.value ?? null}
            unit="h"
            higherIsBetter
            empty="nessun dato sonno"
            note={latestSleep && latestSleep.date < rangeTo ? 'ultima notte' : null}
          />
          <SummaryCard
            label="Passi"
            value={todaySummary.steps}
            unit=""
            empty="nessun dato"
            note={todaySummary.stepsDate && todaySummary.stepsDate < rangeTo ? 'ieri' : null}
          />
          {hrvBaseline !== null && (
            <SummaryCard label="Baseline HRV" value={hrvBaseline} unit="ms" />
          )}
        </div>
      )}

      {/* Timeline chart */}
      {hasBiometrics && timeline.length > 0 && (
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
                <XAxis
                  dataKey="label"
                  tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'Georgia, serif' }}
                  tickLine={false}
                  axisLine={false}
                  interval={chartInterval}
                />
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
              Nessun dato nel periodo — prova ad estendere il range
            </p>
          )}

          {/* Legenda */}
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            {dailyHrv.length > 0 && <LegendDot color="var(--pattern)" label="HRV (ms)" />}
            {dailyHr.length > 0  && <LegendDot color="var(--identita)" label="FC riposo (bpm)" />}
            {hrvBaseline !== null && <LegendDashed label={`Baseline ${hrvBaseline}ms`} />}
          </div>
        </div>
      )}

      {/* Correlazione giorni ↔ eventi */}
      {hasBiometrics && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '3px', overflow: 'hidden', marginBottom: '1.5rem' }}>
          <div style={{ padding: '1.25rem 1.5rem 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Corpo di oggi · cosa l&apos;ha preceduto (sera prima)
            </p>
            {daysEmpty > 0 && (
              <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                {daysEmpty} giorni senza dati nascosti
              </p>
            )}
          </div>

          {daysWithData.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Nessun dato nel periodo selezionato.<br />
                {totalSamples > 0 ? `Hai ${totalSamples.toLocaleString('it-IT')} campioni in archivio — prova a estendere il range (90g o personalizzato).` : 'Attendi il prossimo export di Health Auto Export.'}
              </p>
            </div>
          )}

          {daysWithData.slice().reverse().map((day, i) => {
            const positive = day.hrvDelta !== null && day.hrvDelta > 2;
            const negative = day.hrvDelta !== null && day.hrvDelta < -2;
            const isExpanded = expandedDay === day.date;

            return (
              <div key={day.date}>
                <div
                  onClick={() => setExpandedDay(isExpanded ? null : day.date)}
                  style={{
                    display: 'flex', gap: '1rem', alignItems: 'flex-start',
                    padding: '0.875rem 1.5rem',
                    borderTop: '1px solid var(--border)',
                    borderLeft: positive ? '3px solid var(--pattern)' : negative ? '3px solid #B87171' : '3px solid transparent',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Data */}
                  <div style={{ minWidth: '100px' }}>
                    <p style={{ fontFamily: 'Georgia, serif', fontSize: '0.82rem', color: 'var(--text-primary)' }}>{fmtDay(day.date)}</p>
                  </div>

                  {/* Biometrici */}
                  <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', flex: 1 }}>
                    {day.hrv !== null && (
                      <div>
                        <p style={{ fontSize: '0.58rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>HRV</p>
                        <p style={{ fontFamily: 'Georgia, serif', fontSize: '0.9rem', color: positive ? 'var(--pattern)' : negative ? '#B87171' : 'var(--text-primary)' }}>
                          {day.hrv}ms
                          {day.hrvDelta !== null && (
                            <span style={{ fontSize: '0.72rem', marginLeft: '0.3rem', color: 'var(--text-muted)' }}>
                              {day.hrvDelta > 0 ? '+' : ''}{day.hrvDelta}
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                    {day.hr !== null && (
                      <div>
                        <p style={{ fontSize: '0.58rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>FC</p>
                        <p style={{ fontFamily: 'Georgia, serif', fontSize: '0.9rem', color: 'var(--text-primary)' }}>{day.hr}bpm</p>
                      </div>
                    )}
                    {day.sleep !== null && (
                      <div>
                        <p style={{ fontSize: '0.58rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Sonno</p>
                        <p style={{ fontFamily: 'Georgia, serif', fontSize: '0.9rem', color: 'var(--text-primary)' }}>{day.sleep}h</p>
                      </div>
                    )}
                    {day.steps !== null && (
                      <div>
                        <p style={{ fontSize: '0.58rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Passi</p>
                        <p style={{ fontFamily: 'Georgia, serif', fontSize: '0.9rem', color: 'var(--text-primary)' }}>{day.steps.toLocaleString('it-IT')}</p>
                      </div>
                    )}
                  </div>

                  {/* Convergenza: stato dichiarato sera prima vs HRV delta di oggi */}
                  {(() => {
                    const declared = day.declaredBefore;
                    const delta = day.hrvDelta;
                    let convergenceLabel: string | null = null;
                    let convergenceColor: string | null = null;
                    if (declared !== null && delta !== null) {
                      if (declared <= 4 && delta < -2) {
                        convergenceLabel = 'il corpo ha seguito';
                        convergenceColor = '#B87171';
                      } else if (declared >= 7 && delta > 2) {
                        convergenceLabel = 'corpo in linea';
                        convergenceColor = 'var(--pattern)';
                      } else if (declared <= 4 && delta > 2) {
                        convergenceLabel = 'corpo in controtendenza';
                        convergenceColor = 'var(--gold)';
                      } else if (declared >= 7 && delta < -2) {
                        convergenceLabel = 'corpo in controtendenza';
                        convergenceColor = 'var(--gold)';
                      }
                    }
                    if (declared === null) return null;
                    return (
                      <div style={{ minWidth: '120px' }}>
                        <p style={{ fontSize: '0.58rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                          Sera prima: {declared}/10
                        </p>
                        {convergenceLabel && convergenceColor && (
                          <span style={{ fontSize: '0.72rem', color: convergenceColor }}>
                            {convergenceLabel}
                          </span>
                        )}
                      </div>
                    );
                  })()}

                  {/* Riepilogo eventi sera prima */}
                  {day.eventsBefore.length > 0 && (
                    <div style={{ minWidth: '180px', maxWidth: '280px' }}>
                      <p style={{ fontSize: '0.55rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                        Sera prima
                      </p>
                      {day.eventsBefore.slice(0, isExpanded ? day.eventsBefore.length : 2).map((ev, j) => (
                        <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem', flexWrap: 'wrap' }}>
                          <p style={{
                            fontSize: '0.73rem', color: 'var(--text-secondary)',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            maxWidth: '180px',
                          }}>
                            {ev.title}
                          </p>
                          <CategoryBadge category={ev.category} />
                        </div>
                      ))}
                      {!isExpanded && day.eventsBefore.length > 2 && (
                        <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>+{day.eventsBefore.length - 2} altri</p>
                      )}
                    </div>
                  )}

                  {/* Expand indicator */}
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginLeft: 'auto', alignSelf: 'center' }}>
                    {isExpanded ? '▲' : '▼'}
                  </span>
                </div>

                {/* Expanded day detail */}
                {isExpanded && (
                  <div style={{
                    padding: '0.75rem 1.5rem 1rem 1.5rem',
                    borderTop: '1px solid var(--border)',
                    background: 'rgba(255,255,255,0.015)',
                  }}>
                    <p style={{ fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                      {fmtFull(day.date)}
                    </p>
                    {day.eventsBefore.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {day.eventsBefore.map((ev, j) => (
                          <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <CategoryBadge category={ev.category} />
                            <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>{ev.title}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Nessun evento nel calendario la sera prima</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Interpretazione AI */}
      <BiometricsInsightButton
        hasBiometrics={hasBiometrics}
        initialInsight={initialInsight}
        version={insightVersion}
        createdAt={insightCreatedAt}
      />

      {/* Metriche disponibili */}
      {allMetrics.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <p style={{ fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
            Metriche in archivio ({allMetrics.length})
          </p>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {allMetrics.map(m => (
              <span key={m} style={{
                fontSize: '0.68rem', color: 'var(--text-muted)', background: 'var(--surface)',
                border: '1px solid var(--border)', borderRadius: '2px', padding: '0.15rem 0.45rem',
              }}>
                {m.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── WatchSyncBadge ───────────────────────────────────────────

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
    const diffMs = Date.now() - ts;
    const diffH = diffMs / 3600000;

    let text: string;
    if (diffH < 1)       text = 'watch sincronizzato < 1h fa';
    else if (diffH < 6)  text = `watch sincronizzato ${Math.floor(diffH)}h fa`;
    else if (diffH < 24) text = `watch: ultimo dato ${Math.floor(diffH)}h fa`;
    else {
      const d = Math.floor(diffH / 24);
      text = `watch: ultimo dato ${d} ${d === 1 ? 'giorno' : 'giorni'} fa`;
    }

    setLabel(text);
    setIsStale(diffH >= 4); // stale se più di 4h senza dati watch
  }, [lastWatchAt]);

  if (!label) return null;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.4rem',
      marginBottom: '0.75rem',
    }}>
      <span style={{
        display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%',
        background: isStale ? '#B87171' : 'var(--pattern)',
        flexShrink: 0,
      }} />
      <span style={{ fontSize: '0.72rem', color: isStale ? '#B87171' : 'var(--text-muted)' }}>
        {label}
      </span>
    </div>
  );
}

// ─── helpers ──────────────────────────────────────────────────

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
      <span style={{ display: 'inline-block', width: '12px', height: '0', border: '1px dashed rgba(201,169,110,0.5)' }} />
      {label}
    </span>
  );
}
