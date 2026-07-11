import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getViewContext } from '@/lib/supabase/view-context';
import Link from 'next/link';
import type { IdentityProfile } from '@/lib/ai/identity-profile';
import type { Checkin, Decision, Pattern } from '@/types';

export const dynamic = 'force-dynamic';

const SECTION_TITLES = ['IDENTITÀ IN AZIONE', 'PATTERN CONFERMATI', 'COSA SI STA MUOVENDO', 'LA TENSIONE CENTRALE'];

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Rende il testo del profilo: i 4 titoli di sezione come header, il resto come paragrafi. */
function ProfileText({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div>
      {lines.map((raw, i) => {
        const line = raw.replace(/\*\*/g, '').trim();
        if (!line || line === '---') return null;
        const isTitle = SECTION_TITLES.some(t => line.startsWith(t));
        return isTitle ? (
          <p key={i} style={{
            fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase',
            color: 'var(--gold)', margin: '1.75rem 0 0.6rem',
          }}>{line}</p>
        ) : (
          <p key={i} style={{
            fontFamily: 'Georgia, serif', fontSize: '0.92rem', lineHeight: 1.85,
            color: 'var(--text-primary)', marginBottom: '0.75rem',
          }}>{line}</p>
        );
      })}
    </div>
  );
}

function MetricCard({ label, now, before, unit, higherIsBetter = true }: {
  label: string; now: number | null; before: number | null; unit: string; higherIsBetter?: boolean;
}) {
  const delta = now !== null && before !== null ? now - before : null;
  const improved = delta !== null && (higherIsBetter ? delta > 0 : delta < 0);
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '3px',
      padding: '1.5rem', flex: 1, minWidth: '180px',
    }}>
      <p style={{ fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>{label}</p>
      <p style={{ fontFamily: 'Georgia, serif', fontSize: '1.75rem', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
        {now !== null ? `${now}${unit}` : '—'}
      </p>
      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
        {before !== null ? `30 giorni fa: ${before}${unit}` : 'nessun dato precedente'}
        {delta !== null && delta !== 0 && (
          <span style={{ color: improved ? 'var(--pattern)' : 'var(--text-muted)', marginLeft: '0.5rem' }}>
            {delta > 0 ? '+' : ''}{Math.round(delta * 10) / 10}{unit}
          </span>
        )}
      </p>
    </div>
  );
}

export default async function DistanzaPage() {
  const supabase = await createClient();
  const viewContext = await getViewContext(supabase);
  if (!viewContext) redirect('/login');
  const { viewUserId } = viewContext;

  const today = new Date().toISOString().split('T')[0];
  const d30 = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
  const d60 = new Date(Date.now() - 60 * 86400000).toISOString().split('T')[0];

  const [profilesRes, checkinsRes, decisionsRes, patternsRes] = await Promise.all([
    supabase.from('identity_profiles').select('*').eq('user_id', viewUserId)
      .order('version', { ascending: false }).limit(2),
    supabase.from('checkins').select('date, state_score').eq('user_id', viewUserId).gte('date', d60),
    supabase.from('decisions').select('created_at, origin').eq('user_id', viewUserId).gte('created_at', d60),
    supabase.from('patterns').select('*').eq('user_id', viewUserId),
  ]);

  const profiles = (profilesRes.data ?? []) as IdentityProfile[];
  const checkins = (checkinsRes.data ?? []) as Pick<Checkin, 'date' | 'state_score'>[];
  const decisions = (decisionsRes.data ?? []) as Pick<Decision, 'created_at' | 'origin'>[];
  const patterns = (patternsRes.data ?? []) as Pattern[];

  // Finestre: ultimi 30 giorni vs i 30 precedenti
  const inWindow = (date: string, from: string, to: string) => date >= from && date < to;
  const ckNow = checkins.filter(c => inWindow(c.date, d30, today + 'z'));
  const ckBefore = checkins.filter(c => inWindow(c.date, d60, d30));
  const avg = (xs: typeof ckNow) => xs.length > 0
    ? Math.round((xs.reduce((s, c) => s + (c.state_score ?? 0), 0) / xs.length) * 10) / 10
    : null;

  const decNow = decisions.filter(d => d.created_at >= d30);
  const decBefore = decisions.filter(d => d.created_at < d30);
  const visionPct = (xs: typeof decNow) => xs.length > 0
    ? Math.round((xs.filter(d => d.origin === 'vision').length / xs.length) * 100)
    : null;

  const activeNow = patterns.filter(p => p.is_active).length;
  const activeBefore = patterns.filter(p => p.first_seen <= d30).length;

  const [current, previous] = profiles;

  return (
    <div style={{ maxWidth: '1080px' }}>
      <div style={{ marginBottom: '0.75rem' }}>
        <h1 className="page-title-responsive" style={{ fontFamily: 'Georgia, serif', fontSize: '2rem', fontWeight: 'normal', color: 'var(--text-primary)' }}>
          Distanza
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.4rem' }}>
          Chi eri, chi sei. Misurato sui comportamenti, non sulle intenzioni.
        </p>
      </div>

      {/* Metriche derivate */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', margin: '2.5rem 0 3rem' }}>
        <MetricCard label="Stato medio" now={avg(ckNow)} before={avg(ckBefore)} unit="/10" />
        <MetricCard label="Decisioni da visione" now={visionPct(decNow)} before={visionPct(decBefore)} unit="%" />
        <MetricCard label="Pattern attivi" now={activeNow} before={activeBefore} unit="" higherIsBetter={false} />
      </div>

      {/* Confronto profili */}
      {!current ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '3px', padding: '2.5rem', maxWidth: '560px' }}>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '1.05rem', color: 'var(--text-primary)', lineHeight: 1.8, marginBottom: '1rem' }}>
            La prima fotografia non esiste ancora.
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.8, marginBottom: '1.5rem' }}>
            Il profilo identitario si costruisce dai check-in: ne servono almeno 5 negli ultimi 30 giorni.
            Poi si aggiorna da solo, e qui apparirà la distanza tra le versioni.
          </p>
          <Link href="/checkin" style={{ color: 'var(--gold)', fontSize: '0.85rem', textDecoration: 'none' }}>
            Fai un check-in →
          </Link>
        </div>
      ) : !previous ? (
        <>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: '2px solid var(--gold)', borderRadius: '3px', padding: '1.25rem 1.75rem', marginBottom: '2rem', maxWidth: '720px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.8 }}>
              Questa è la prima fotografia ({fmtDate(current.created_at)}). La prossima versione si genera
              automaticamente tra circa 7 giorni di check-in — da quel momento, qui vedrai le due affiancate.
            </p>
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '3px', padding: '2rem 2.25rem', maxWidth: '720px' }}>
            <p style={{ fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Profilo v{current.version} — {fmtDate(current.created_at)}
            </p>
            <ProfileText text={current.profile_text} />
          </div>
        </>
      ) : (
        <div className="distanza-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '3px', padding: '2rem 2.25rem', opacity: 0.75 }}>
            <p style={{ fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Chi eri — v{previous.version}, {fmtDate(previous.created_at)}
            </p>
            <ProfileText text={previous.profile_text} />
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--gold)', borderRadius: '3px', padding: '2rem 2.25rem' }}>
            <p style={{ fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '0.5rem' }}>
              Chi sei — v{current.version}, {fmtDate(current.created_at)}
            </p>
            <ProfileText text={current.profile_text} />
          </div>
        </div>
      )}
    </div>
  );
}
