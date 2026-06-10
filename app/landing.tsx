'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

// ─────────────────────────────────────────────────────────────────
// SELF OS — Landing
// Direzione: referto clinico notturno. La pagina non promette:
// dimostra il meccanismo. Il dato batte la dichiarazione.
// ─────────────────────────────────────────────────────────────────

const STRATA = [
  { id: '01', name: 'Stato', color: 'var(--gold)', desc: 'Come ti senti adesso. Il filtro percettivo da cui passa tutto il resto.' },
  { id: '02', name: 'Pattern', color: '#8B9E7A', desc: 'Cosa si ripete nei tuoi comportamenti — contesti diversi, stesso risultato.' },
  { id: '03', name: 'Credenze', color: '#7A8B9E', desc: 'Le storie invisibili che decidono al posto tuo, prima che tu decida.' },
  { id: '04', name: 'Identità', color: '#9E7A8B', desc: 'Chi credi di essere a un livello che non dichiari a nessuno. Nemmeno a te.' },
];

const NEGATIONS = [
  ['Non è un journal.', 'Un journal conserva ciò che dici di te. SELF OS osserva ciò che fai.'],
  ['Non è un habit tracker.', 'Le abitudini sono il sintomo. Il sistema mappa la struttura che le genera.'],
  ['Non ti dirà cosa fare.', 'Nessun consiglio, nessuna motivazione. Ti mostra chi stai essendo mentre lo fai.'],
];

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect(); } },
      { threshold: 0.18 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, shown };
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, shown } = useReveal();
  return (
    <div
      ref={ref}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'translateY(0)' : 'translateY(18px)',
        transition: `opacity 0.8s ease ${delay}ms, transform 0.8s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

export function LandingPage() {
  return (
    <div style={{ background: 'var(--background)', color: 'var(--text-primary)', minHeight: '100vh', overflowX: 'hidden' }}>
      <style>{`
        @keyframes lp-breathe { 0%, 100% { opacity: 0.35; } 50% { opacity: 1; } }
        @keyframes lp-rise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        .lp-rise { animation: lp-rise 0.9s ease both; }
        .lp-d1 { animation-delay: 0.15s; } .lp-d2 { animation-delay: 0.35s; }
        .lp-d3 { animation-delay: 0.55s; } .lp-d4 { animation-delay: 0.8s; }
        .lp-pulse { animation: lp-breathe 4.5s ease-in-out infinite; }
        .lp-cta { transition: background 0.4s ease, color 0.4s ease; }
        .lp-cta:hover { background: var(--gold); color: #0A0806 !important; }
        .lp-stratum { transition: transform 0.5s ease; }
        .lp-stratum:hover { transform: translateX(6px); }
        .lp-distanza-grid { display: grid; grid-template-columns: 1fr 1px 1fr; gap: 2.5rem; }
        .lp-specimen-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; align-items: start; }
        @media (max-width: 768px) {
          .lp-section { padding: 5rem 1.5rem !important; }
          .lp-distanza-grid { grid-template-columns: 1fr !important; gap: 1.5rem; }
          .lp-distanza-divider { display: none; }
          .lp-specimen-grid { grid-template-columns: 1fr !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .lp-rise, .lp-pulse { animation: none !important; opacity: 1 !important; }
          .lp-stratum, .lp-cta { transition: none !important; }
        }
      `}</style>

      {/* ── Nav ───────────────────────────────────────────── */}
      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '1.75rem 2.5rem', borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, background: 'rgba(10,8,6,0.92)', backdropFilter: 'blur(8px)', zIndex: 50,
      }}>
        <span style={{ fontFamily: 'Georgia, serif', fontSize: '0.95rem', letterSpacing: '0.18em', color: 'var(--gold)' }}>
          SELF OS
        </span>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <Link href="/login" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', textDecoration: 'none', letterSpacing: '0.05em' }}>
            Accedi
          </Link>
          <Link href="/signup" className="lp-cta" style={{
            fontSize: '0.82rem', color: 'var(--gold)', textDecoration: 'none', letterSpacing: '0.05em',
            border: '1px solid var(--gold)', borderRadius: '3px', padding: '0.5rem 1.25rem',
          }}>
            Inizia lo scan
          </Link>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="lp-section" style={{ padding: '9rem 2.5rem 7rem', maxWidth: '1060px', margin: '0 auto' }}>
        <p className="lp-rise" style={{
          fontSize: '0.68rem', letterSpacing: '0.32em', textTransform: 'uppercase',
          color: 'var(--text-muted)', marginBottom: '2.5rem',
        }}>
          Il primo sistema operativo per l&apos;identità umana
        </p>

        <h1 className="lp-rise lp-d1" style={{
          fontFamily: 'Georgia, serif', fontWeight: 'normal',
          fontSize: 'clamp(2.4rem, 6vw, 4.6rem)', lineHeight: 1.12,
          maxWidth: '880px', marginBottom: '2.5rem',
        }}>
          Sai cosa vuoi diventare.<br />
          <span style={{ color: 'var(--text-secondary)' }}>Non sai chi stai essendo</span>
          <span className="lp-pulse" style={{ color: 'var(--gold)' }}> adesso.</span>
        </h1>

        <p className="lp-rise lp-d2" style={{
          fontSize: '1.02rem', color: 'var(--text-secondary)', lineHeight: 1.9,
          maxWidth: '560px', marginBottom: '3.5rem',
        }}>
          SELF OS osserva i tuoi comportamenti reali — non le tue intenzioni — e
          ti restituisce l&apos;unica cosa che nessuno strumento ti ha mai dato:
          evidenza di chi sei mentre vivi.
        </p>

        <div className="lp-rise lp-d3" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href="/signup" className="lp-cta" style={{
            fontFamily: 'Georgia, serif', fontSize: '0.95rem', color: 'var(--gold)',
            border: '1px solid var(--gold)', borderRadius: '3px',
            padding: '0.9rem 2.5rem', textDecoration: 'none', letterSpacing: '0.04em',
          }}>
            Inizia lo scan iniziale
          </Link>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            150 domande. Una volta sola. Nessun giudizio.
          </span>
        </div>

        {/* Filo oro — battito lento dello strumento */}
        <div className="lp-rise lp-d4" style={{ marginTop: '6rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div className="lp-pulse" style={{ height: '1px', flex: 1, background: 'linear-gradient(90deg, var(--gold), transparent)' }} />
          <span style={{ fontFamily: "'Courier New', monospace", fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
            sistema in osservazione
          </span>
        </div>
      </section>

      {/* ── I 4 strati ────────────────────────────────────── */}
      <section className="lp-section" style={{ padding: '7rem 2.5rem', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1060px', margin: '0 auto' }}>
          <Reveal>
            <p style={{ fontSize: '0.68rem', letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              La mappa
            </p>
            <h2 style={{ fontFamily: 'Georgia, serif', fontWeight: 'normal', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', marginBottom: '4rem', maxWidth: '620px', lineHeight: 1.3 }}>
              Quattro strati. Quelli sopra li conosci.
              Quelli sotto decidono.
            </h2>
          </Reveal>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {STRATA.map((s, i) => (
              <Reveal key={s.id} delay={i * 120}>
                <div className="lp-stratum" style={{
                  display: 'flex', gap: '2rem', alignItems: 'baseline',
                  padding: '2rem 0 2rem 2rem', borderTop: '1px solid var(--border)',
                  borderLeft: `2px solid ${s.color}`,
                  marginBottom: '0.5rem',
                }}>
                  <span style={{ fontFamily: "'Courier New', monospace", fontSize: '0.7rem', color: s.color, letterSpacing: '0.15em', flexShrink: 0 }}>
                    {s.id}
                  </span>
                  <div>
                    <h3 style={{ fontFamily: 'Georgia, serif', fontWeight: 'normal', fontSize: '1.25rem', color: s.color, marginBottom: '0.5rem' }}>
                      {s.name}
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.8, maxWidth: '520px' }}>
                      {s.desc}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Il campione (evidenza, non teorie) ────────────── */}
      <section className="lp-section" style={{ padding: '7rem 2.5rem', borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div style={{ maxWidth: '1060px', margin: '0 auto' }}>
          <Reveal>
            <p style={{ fontSize: '0.68rem', letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Evidenza, non teorie
            </p>
            <h2 style={{ fontFamily: 'Georgia, serif', fontWeight: 'normal', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', marginBottom: '4rem', maxWidth: '640px', lineHeight: 1.3 }}>
              Così funziona, su dati veri.
            </h2>
          </Reveal>

          <div className="lp-specimen-grid">
            {/* I dati grezzi */}
            <Reveal delay={100}>
              <div style={{ fontFamily: "'Courier New', monospace", fontSize: '0.78rem', lineHeight: 2.1, color: 'var(--text-secondary)' }}>
                <p style={{ color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '1rem' }}>// check-in, 9 giorni</p>
                <p>lun &nbsp;— &quot;oggi finisco la pagina del funnel&quot;</p>
                <p>mar &nbsp;— &quot;il funnel, sempre quello&quot;</p>
                <p>gio &nbsp;— &quot;devo chiudere il funnel&quot;</p>
                <p style={{ color: 'var(--text-muted)' }}>ven &nbsp;— (nessun check-in)</p>
                <p>sab &nbsp;— &quot;questa settimana riparto&quot;</p>
                <p style={{ color: 'var(--gold)' }}>mer &nbsp;— &quot;devo sistemare l&apos;esecuzione generale&quot;</p>
              </div>
            </Reveal>

            {/* Lo specchio */}
            <Reveal delay={250}>
              <div style={{ borderLeft: '2px solid var(--gold)', paddingLeft: '2rem' }}>
                <p style={{ fontSize: '0.68rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '1.25rem' }}>
                  Lo specchio
                </p>
                <p style={{ fontFamily: 'Georgia, serif', fontSize: '1.15rem', lineHeight: 1.9, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
                  «Sei alla sesta menzione dello stesso compito. E il linguaggio si sta
                  allargando: da &quot;la pagina del funnel&quot; a &quot;l&apos;esecuzione generale&quot;.
                  Quando un compito diventa un concetto, di solito ti stai allontanando — non avvicinando.»
                </p>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.8 }}>
                  Nessun consiglio. Nessuna motivazione. Solo ciò che i tuoi dati mostrano,
                  con le tue parole esatte.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Cosa non è ────────────────────────────────────── */}
      <section className="lp-section" style={{ padding: '7rem 2.5rem', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1060px', margin: '0 auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem' }}>
            {NEGATIONS.map(([title, body], i) => (
              <Reveal key={title} delay={i * 120}>
                <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'baseline', flexWrap: 'wrap' }}>
                  <h3 style={{
                    fontFamily: 'Georgia, serif', fontWeight: 'normal',
                    fontSize: 'clamp(1.3rem, 2.5vw, 1.7rem)', color: 'var(--text-primary)',
                    minWidth: '280px', flex: '0 0 auto',
                  }}>
                    {title}
                  </h3>
                  <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.85, maxWidth: '480px', flex: 1 }}>
                    {body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── La distanza ───────────────────────────────────── */}
      <section className="lp-section" style={{ padding: '7rem 2.5rem', borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div style={{ maxWidth: '1060px', margin: '0 auto' }}>
          <Reveal>
            <p style={{ fontSize: '0.68rem', letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              La misura del cambiamento
            </p>
            <h2 style={{ fontFamily: 'Georgia, serif', fontWeight: 'normal', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', marginBottom: '4rem', maxWidth: '640px', lineHeight: 1.3 }}>
              Tra trenta giorni potrai leggere la distanza
              tra chi eri e chi sei.
            </h2>
          </Reveal>

          <Reveal delay={150}>
            <div className="lp-distanza-grid">
              <div style={{ opacity: 0.55 }}>
                <p style={{ fontFamily: "'Courier New', monospace", fontSize: '0.68rem', letterSpacing: '0.15em', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  PROFILO v1 — GIORNO 0
                </p>
                <p style={{ fontFamily: 'Georgia, serif', fontSize: '1rem', lineHeight: 1.9, color: 'var(--text-secondary)' }}>
                  Ti definisci «colui che porta a termine» — ma il completamento, nei
                  dati, non compare. Operi dalla testa, con uno stato che non sai
                  localizzare nel corpo.
                </p>
              </div>
              <div className="lp-distanza-divider" style={{ background: 'var(--border)' }} />
              <div>
                <p style={{ fontFamily: "'Courier New', monospace", fontSize: '0.68rem', letterSpacing: '0.15em', color: 'var(--gold)', marginBottom: '1rem' }}>
                  PROFILO v2 — GIORNO 30
                </p>
                <p style={{ fontFamily: 'Georgia, serif', fontSize: '1rem', lineHeight: 1.9, color: 'var(--text-primary)' }}>
                  Un mese fa il funnel era «l&apos;esecuzione generale». Ora è di nuovo un
                  compito con un nome. Due completamenti registrati. La distanza non è
                  un&apos;impressione: è scritta.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── CTA finale ────────────────────────────────────── */}
      <section className="lp-section" style={{ padding: '8rem 2.5rem', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
        <Reveal>
          <h2 style={{
            fontFamily: 'Georgia, serif', fontWeight: 'normal',
            fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', lineHeight: 1.25,
            maxWidth: '720px', margin: '0 auto 3rem',
          }}>
            Hai smesso di cercare strategie migliori.<br />
            <span style={{ color: 'var(--text-secondary)' }}>Inizia a chiederti chi stai essendo.</span>
          </h2>
          <Link href="/signup" className="lp-cta" style={{
            display: 'inline-block', fontFamily: 'Georgia, serif', fontSize: '1rem',
            color: 'var(--gold)', border: '1px solid var(--gold)', borderRadius: '3px',
            padding: '1rem 3rem', textDecoration: 'none', letterSpacing: '0.04em',
          }}>
            Inizia lo scan iniziale
          </Link>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '1.5rem' }}>
            Gratuito. I tuoi dati restano tuoi — esportabili e cancellabili, sempre.
          </p>
        </Reveal>
      </section>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer style={{
        borderTop: '1px solid var(--border)', padding: '2.5rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem',
      }}>
        <span style={{ fontFamily: 'Georgia, serif', fontSize: '0.8rem', letterSpacing: '0.15em', color: 'var(--text-muted)' }}>
          SELF OS
        </span>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          Non è terapia né un dispositivo medico. Se stai attraversando un momento difficile,
          parlane con qualcuno: Telefono Amico Italia — 800 274 274.
        </p>
      </footer>
    </div>
  );
}
