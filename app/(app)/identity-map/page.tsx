import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Checkin, Pattern, Scan, Profile } from '@/types';
import { calculateStreak, averageStateScore } from '@/lib/utils/checkin';
import { IdentityMapCharts } from './charts';
import { PatternAnalyzeButton } from './pattern-analyze-button';
import { WeeklyReportCard } from './weekly-report-card';
import { canAccess } from '@/lib/utils/features';
import { Paywall } from '@/components/shared/paywall';

export default async function IdentityMapPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single<Profile>();

  if (!canAccess('identity_map', profile?.plan ?? 'free')) {
    return <Paywall feature="identity_map" />;
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

  const [checkinsRes, patternsRes, scanRes] = await Promise.all([
    supabase
      .from('checkins')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', thirtyDaysAgo)
      .order('date', { ascending: true }),
    supabase
      .from('patterns')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('frequency', { ascending: false }),
    supabase
      .from('scans')
      .select('*')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .limit(1)
      .single<Scan>(),
  ]);

  const checkins = (checkinsRes.data ?? []) as Checkin[];
  const patterns = (patternsRes.data ?? []) as Pattern[];
  const scan = scanRes.data;

  const streak = calculateStreak(checkins);
  const avgScore = averageStateScore(checkins) ?? 0;

  // Radar dimensions (0-10 scale)
  const radarData = buildRadarData(checkins, patterns, scan);

  // Line chart data: group by date, morning vs evening
  const lineData = buildLineData(checkins);

  // Heatmap: last 90 days
  const heatmapData = buildHeatmapData(checkins);

  return (
    <div>
      {/* Header */}
      <div className="animate-fade-up" style={{ marginBottom: '3rem' }}>
        <p style={mutedLabel}>IDENTITY MAP</p>
        <h1 style={pageTitle}>La tua mappa nel tempo</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Ultimi 30 giorni · {checkins.length} check-in · {streak} giorni streak
        </p>
      </div>

      {/* Charts */}
      <IdentityMapCharts
        lineData={lineData}
        radarData={radarData}
        avgScore={avgScore}
      />

      {/* Heatmap */}
      <div style={{ marginBottom: '3rem' }}>
        <p style={{ ...mutedLabel, marginBottom: '1.25rem' }}>Consistenza — ultimi 90 giorni</p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(13, 1fr)',
            gap: '3px',
            maxWidth: '560px',
          }}
        >
          {heatmapData.map((week, wi) => (
            <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {week.map((day, di) => (
                <div
                  key={di}
                  title={day.date}
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    borderRadius: '2px',
                    backgroundColor: day.count === 0
                      ? 'var(--border)'
                      : day.count === 1
                        ? 'rgba(201,169,110,0.35)'
                        : 'rgba(201,169,110,0.75)',
                  }}
                />
              ))}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'var(--border)' }} />
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginRight: '0.75rem' }}>Nessuno</span>
          <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'rgba(201,169,110,0.35)' }} />
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginRight: '0.75rem' }}>1</span>
          <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'rgba(201,169,110,0.75)' }} />
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>2</span>
        </div>
      </div>

      {/* Pattern cards */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <p style={mutedLabel}>Pattern attivi</p>
          <PatternAnalyzeButton hasEnoughData={checkins.length >= 3} />
        </div>

        {patterns.length === 0 ? (
          <div style={{
            padding: '2rem',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '3px',
            maxWidth: '480px',
          }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.7 }}>
              Nessun pattern identificato ancora.
              {checkins.length >= 3
                ? ' Clicca "Analizza pattern" per avviare l\'analisi.'
                : ` Completa almeno ${3 - checkins.length} check-in per attivare il riconoscimento.`}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {patterns.map(p => (
              <PatternCard key={p.id} pattern={p} />
            ))}
          </div>
        )}
      </div>

      <WeeklyReportCard />
    </div>
  );
}

// ─── Pattern Card ─────────────────────────────────────────────

function PatternCard({ pattern }: { pattern: Pattern }) {
  const colorMap: Record<string, string> = {
    shadow: 'var(--identita)',
    expansion: 'var(--pattern)',
    belief: 'var(--credenze)',
    state: 'var(--stato)',
  };
  const color = colorMap[pattern.type] ?? 'var(--gold)';

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderTop: `2px solid ${color}`,
      borderRadius: '3px',
      padding: '1.25rem 1.5rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <p style={{ fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color }}>
          {pattern.type}
        </p>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          ×{pattern.frequency}
        </span>
      </div>
      <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '0.95rem', fontWeight: 'normal', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
        {pattern.title}
      </h3>
      {pattern.description && (
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
          {pattern.description}
        </p>
      )}
      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
        Rilevato il {new Date(pattern.first_seen).toLocaleDateString('it-IT')}
      </p>
    </div>
  );
}

// ─── Data builders ────────────────────────────────────────────

function buildLineData(checkins: Checkin[]) {
  const byDate: Record<string, { morning?: number; evening?: number }> = {};

  for (const c of checkins) {
    if (!byDate[c.date]) byDate[c.date] = {};
    if (c.type === 'morning') byDate[c.date].morning = c.state_score ?? undefined;
    if (c.type === 'evening') byDate[c.date].evening = c.state_score ?? undefined;
  }

  return Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, vals]) => ({
      date: new Date(date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }),
      mattina: vals.morning,
      sera: vals.evening,
    }));
}

function buildRadarData(checkins: Checkin[], patterns: Pattern[], scan: Scan | null) {
  const avg = averageStateScore(checkins) ?? 0;
  const streak = calculateStreak(checkins);
  const consistenza = Math.min(10, (checkins.length / 30) * 10);

  return [
    { dimension: 'Stato', value: Math.round(avg * 10) / 10, fullMark: 10 },
    { dimension: 'Pattern', value: Math.min(10, patterns.length * 2.5), fullMark: 10 },
    { dimension: 'Credenze', value: scan?.analysis ? 7 : 0, fullMark: 10 },
    { dimension: 'Identità', value: Math.min(10, Math.round(consistenza * 10) / 10), fullMark: 10 },
  ];
}

function buildHeatmapData(checkins: Checkin[]) {
  // 90 days, organized in 13 weeks × 7 days
  const countByDate: Record<string, number> = {};
  for (const c of checkins) {
    countByDate[c.date] = (countByDate[c.date] ?? 0) + 1;
  }

  const days: Array<{ date: string; count: number }> = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const dateStr = d.toISOString().split('T')[0];
    days.push({ date: dateStr, count: Math.min(2, countByDate[dateStr] ?? 0) });
  }

  // Pad to multiple of 7 and split into weeks
  while (days.length % 7 !== 0) days.unshift({ date: '', count: -1 });

  const weeks: typeof days[] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return weeks;
}

// ─── Styles ───────────────────────────────────────────────────

const mutedLabel: React.CSSProperties = {
  fontSize: '0.7rem',
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
};

const pageTitle: React.CSSProperties = {
  fontFamily: 'Georgia, serif',
  fontSize: '2rem',
  fontWeight: 'normal',
  color: 'var(--text-primary)',
  marginBottom: '0.25rem',
};
