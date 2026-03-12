'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';

interface LineDataPoint {
  date: string;
  mattina?: number;
  sera?: number;
}

interface RadarDataPoint {
  dimension: string;
  value: number;
  fullMark: number;
}

interface Props {
  lineData: LineDataPoint[];
  radarData: RadarDataPoint[];
  avgScore: number;
}

const tooltipStyle = {
  backgroundColor: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '3px',
  fontFamily: 'Georgia, serif',
  fontSize: '0.8rem',
  color: 'var(--text-primary)',
};

export function IdentityMapCharts({ lineData, radarData, avgScore }: Props) {
  const hasLineData = lineData.length > 0;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 320px',
        gap: '1.5rem',
        marginBottom: '3rem',
        alignItems: 'start',
      }}
    >
      {/* Line chart */}
      <div style={chartCard}>
        <p style={chartLabel('var(--stato)')}>Stato interno — 30 giorni</p>
        {hasLineData ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={lineData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
              <XAxis
                dataKey="date"
                tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'Georgia, serif' }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[1, 10]}
                tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'Georgia, serif' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={{ color: 'var(--text-muted)', marginBottom: '4px' }}
                cursor={{ stroke: 'var(--border)', strokeWidth: 1 }}
              />
              <Line
                type="monotone"
                dataKey="mattina"
                stroke="var(--stato)"
                strokeWidth={1.5}
                dot={false}
                connectNulls={false}
                name="Mattina"
              />
              <Line
                type="monotone"
                dataKey="sera"
                stroke="var(--identita)"
                strokeWidth={1.5}
                dot={false}
                connectNulls={false}
                name="Sera"
                strokeDasharray="4 2"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState text="Completa i check-in per vedere il grafico" />
        )}
        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem' }}>
          <Legend color="var(--stato)" label="Mattina" />
          <Legend color="var(--identita)" label="Sera" dashed />
        </div>
      </div>

      {/* Radar chart */}
      <div style={chartCard}>
        <p style={chartLabel('var(--gold)')}>4 Dimensioni identitarie</p>
        <div style={{ textAlign: 'center' }}>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis
                dataKey="dimension"
                tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontFamily: 'Georgia, serif' }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 10]}
                tick={{ fill: 'var(--text-muted)', fontSize: 9 }}
                axisLine={false}
              />
              <Radar
                name="Identità"
                dataKey="value"
                stroke="var(--gold)"
                fill="var(--gold)"
                fillOpacity={0.12}
                strokeWidth={1.5}
              />
              <Tooltip contentStyle={tooltipStyle} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          Media stato: <span style={{ color: 'var(--gold)' }}>{avgScore || '—'}</span>/10
        </p>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────

function EmptyState({ text }: { text: string }) {
  return (
    <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{text}</p>
    </div>
  );
}

function Legend({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
      <div style={{
        width: '20px',
        height: '1.5px',
        backgroundColor: color,
        borderBottom: dashed ? `1.5px dashed ${color}` : 'none',
        backgroundImage: dashed ? 'none' : undefined,
      }} />
      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{label}</span>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const chartCard: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '3px',
  padding: '1.5rem',
};

function chartLabel(color: string): React.CSSProperties {
  return {
    fontSize: '0.65rem',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    color,
    marginBottom: '1.25rem',
  };
}
