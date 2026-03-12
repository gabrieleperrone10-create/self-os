'use client';

import { useState, useEffect } from 'react';
import type { WeeklyReport } from '@/types';

export function WeeklyReportCard() {
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/ai/weekly-report')
      .then(r => r.json())
      .then((data: { reports?: WeeklyReport[] }) => {
        const reports = data.reports ?? [];
        // Check if there's a report for this week
        const now = new Date();
        const dayOfWeek = now.getDay();
        const diffToMonday = (dayOfWeek + 6) % 7;
        const monday = new Date(now);
        monday.setDate(now.getDate() - diffToMonday);
        const weekStart = monday.toISOString().split('T')[0];
        const thisWeek = reports.find(r => r.week_start === weekStart);
        setReport(thisWeek ?? reports[0] ?? null);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  async function generate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/weekly-report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const data = await res.json() as { report?: WeeklyReport; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Errore');
      setReport(data.report ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore');
    } finally {
      setGenerating(false);
    }
  }

  if (!loaded) return null;

  return (
    <div style={{ marginTop: '3rem', paddingTop: '2.5rem', borderTop: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <p style={mutedLabel}>Report settimanale</p>
        </div>
        <button
          onClick={generate}
          disabled={generating}
          style={generateBtn}
        >
          {generating ? 'Generando...' : report ? 'Rigenera' : 'Genera report'}
        </button>
      </div>

      {error && (
        <p style={{ fontSize: '0.8rem', color: '#B45454', marginBottom: '1rem' }}>{error}</p>
      )}

      {report ? (
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderLeft: '2px solid var(--credenze)',
            borderRadius: '3px',
            padding: '2rem 2.5rem',
          }}
        >
          <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <Stat label="Check-in" value={String(report.checkin_count)} />
            {report.avg_state_score !== null && (
              <Stat label="Stato medio" value={`${Number(report.avg_state_score).toFixed(1)}/10`} />
            )}
            <Stat label="Decisioni" value={String(report.decisions_count)} />
            <Stat label="Da visione" value={String(report.vision_decisions)} />
          </div>

          <p style={{ fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--credenze)', marginBottom: '1rem' }}>
            {formatWeek(report.week_start, report.week_end)}
          </p>

          <p
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: '0.95rem',
              lineHeight: 1.9,
              color: 'var(--text-primary)',
              whiteSpace: 'pre-line',
            }}
          >
            {report.ai_report}
          </p>
        </div>
      ) : (
        <div style={{
          padding: '2rem',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '3px',
        }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontFamily: 'Georgia, serif', lineHeight: 1.7 }}>
            Nessun report generato questa settimana.<br />
            Clicca &quot;Genera report&quot; per ricevere una riflessione sulla tua settimana.
          </p>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
        {label}
      </p>
      <p style={{ fontFamily: 'Georgia, serif', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
        {value}
      </p>
    </div>
  );
}

function formatWeek(start: string, end: string) {
  const s = new Date(start).toLocaleDateString('it-IT', { day: '2-digit', month: 'long' });
  const e = new Date(end).toLocaleDateString('it-IT', { day: '2-digit', month: 'long' });
  return `${s} — ${e}`;
}

const mutedLabel: React.CSSProperties = {
  fontSize: '0.7rem',
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
};

const generateBtn: React.CSSProperties = {
  padding: '0.4rem 1rem',
  background: 'transparent',
  border: '1px solid var(--credenze)',
  borderRadius: '3px',
  color: 'var(--credenze)',
  fontFamily: 'Georgia, serif',
  fontSize: '0.75rem',
  cursor: 'pointer',
  letterSpacing: '0.04em',
};
