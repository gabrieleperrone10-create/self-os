'use client';

import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Dot,
} from 'recharts';
import type { StatReadout } from '@/lib/stats/engine';
import { buildReadoutCopy } from '@/lib/stats/copy';
import { CONDITION_COLOR } from '@/lib/stats/colors';
import { formatPeriodLabel, formatPeriodTick, type Period } from '@/lib/stats/period';
import { ReadoutCard } from './readout-card';

type Point = { periodStart: string; value: number; estimated: boolean };

const tooltipStyle = {
  backgroundColor: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '3px',
  fontFamily: 'Georgia, serif',
  fontSize: '0.8rem',
  color: 'var(--text-primary)',
};

export function StatChart({
  points,
  readouts,
  period,
  unit,
  target,
}: {
  points: Point[];
  readouts: StatReadout[];
  period: Period;
  unit: string | null;
  target: number | null;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const index = selected ?? points.length - 1;
  const readout = readouts[index] ?? null;

  const data = points.map((p, i) => ({
    i,
    date: formatPeriodTick(period, p.periodStart),
    fullDate: formatPeriodLabel(period, p.periodStart),
    value: p.value,
    estimated: p.estimated,
    color: readouts[i]?.condition ? CONDITION_COLOR[readouts[i]!.condition!.condition] : 'var(--text-muted)',
  }));

  const copy = readout
    ? buildReadoutCopy(readout, { unit })
    : buildReadoutCopy({ condition: null, trend: null, divergence: 'no_trend', formula: null, provisional: true }, { unit });

  // L'asse Y inquadra i dati, non parte da zero. Una massa grassa che oscilla tra
  // 18,0 e 18,5 su un asse 0–20 è una riga piatta invisibile in cima al grafico:
  // il modulo legge movimenti, non grandezze assolute. Il target, se c'è, deve
  // restare dentro l'inquadratura.
  const domain = niceDomain(
    target !== null ? [...points.map((p) => p.value), target] : points.map((p) => p.value),
  );

  const periodLabel = points[index]
    ? formatPeriodLabel(period, points[index].periodStart)
    : 'In raccolta';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '3px', padding: '1.25rem 1.25rem 0.5rem' }}>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
            <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
            <YAxis
              domain={domain}
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={44}
            />
            {target !== null && (
              <ReferenceLine y={target} stroke="var(--text-muted)" strokeDasharray="3 3" />
            )}
            <Tooltip
              contentStyle={tooltipStyle}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.fullDate ?? ''}
              formatter={(value?: number) => [unit && value !== undefined ? `${value} ${unit}` : (value ?? ''), 'valore']}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--gold)"
              strokeWidth={1.5}
              // La render-prop dei punti rimonta la Line a ogni selezione: con
              // l'animazione attiva il tracciato resta a stroke-dasharray 0 e la
              // linea non compare mai. Il design system non prevede comunque un
              // disegno progressivo (§ animazioni: fade + translateY, mai frenetico).
              isAnimationActive={false}
              dot={(props: { cx?: number; cy?: number; payload?: { i: number; color: string; estimated: boolean } }) => {
                const { cx, cy, payload } = props;
                if (cx === undefined || cy === undefined || !payload) return <g key={props.payload?.i} />;
                const isSelected = payload.i === index;
                return (
                  <Dot
                    key={payload.i}
                    cx={cx}
                    cy={cy}
                    r={isSelected ? 5 : 3.5}
                    fill={payload.color}
                    stroke={payload.estimated ? 'var(--text-muted)' : 'none'}
                    strokeDasharray={payload.estimated ? '2 1' : undefined}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelected(payload.i)}
                  />
                );
              }}
              activeDot={{ r: 5, onClick: (_: unknown, ev: { payload?: { i: number } }) => setSelected(ev.payload?.i ?? null) }}
            />
          </LineChart>
        </ResponsiveContainer>
        {selected !== null && selected !== points.length - 1 && (
          <button onClick={() => setSelected(null)} style={backToTodayBtn}>
            → torna al periodo corrente
          </button>
        )}
      </div>

      <ReadoutCard copy={copy} periodLabel={periodLabel} />
    </div>
  );
}

/** Estremi "tondi" che inquadrano i dati con un margine, senza ancorarsi allo zero. */
function niceDomain(values: number[]): [number, number] {
  if (values.length === 0) return [0, 1];
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = hi - lo || Math.abs(hi) || 1;
  const pad = span * 0.2;
  const min = lo - pad;
  const max = hi + pad;
  const step = Math.pow(10, Math.floor(Math.log10(max - min))) / 2;
  return [Math.floor(min / step) * step, Math.ceil(max / step) * step];
}

const backToTodayBtn: React.CSSProperties = {
  display: 'block', margin: '0.25rem 0 0.75rem', fontSize: '0.72rem',
  color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer',
  fontFamily: 'Georgia, serif', padding: 0,
};
