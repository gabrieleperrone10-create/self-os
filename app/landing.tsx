'use client';

/**
 * SELF OS Landing Page
 * Design Read: clinical-psychological tool for introspective professionals.
 * Dark editorial. Georgia serif. The loop IS the hero.
 * Skills applied: design-taste-frontend (VARIANCE=6, MOTION=5, DENSITY=3)
 *                 high-end-visual-design (spatial rhythm, macro-whitespace)
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';

// ─── Loop diagram — the central visual metaphor ───────────────────────────────

const LOOP_NODES: {
  cx: number; cy: number;
  label: string; sub: string;
  textX: number; textY: number;
  anchor: 'middle' | 'start' | 'end';
  color: string;
}[] = [
  { cx: 0,    cy: -130, label: 'Trigger',    sub: 'cosa lo attiva',        textX: 0,     textY: -152, anchor: 'middle', color: '#C9A96E' },
  { cx: 130,  cy: 0,    label: 'Sensazione', sub: 'cosa senti nel corpo',  textX: 152,   textY: 4,    anchor: 'start',  color: '#8B9E7A' },
  { cx: 0,    cy: 130,  label: 'Azione',     sub: 'cosa fai automaticamente', textX: 0, textY: 156,  anchor: 'middle', color: '#7A8B9E' },
  { cx: -130, cy: 0,    label: 'Identità',   sub: 'cosa conferma di te',   textX: -152,  textY: 4,    anchor: 'end',    color: '#9E7A8B' },
];

function LoopDiagram({ r = 200 }: { r?: number }) {
  const scale = r / 200;
  const vbSize = 240 * scale;
  return (
    <svg
      viewBox={`${-vbSize} ${-vbSize * 0.9} ${vbSize * 2} ${vbSize * 1.8}`}
      width={r * 2}
      height={r * 1.8}
      aria-label="Il ciclo comportamentale che si ripete"
      style={{ overflow: 'visible', maxWidth: '100%' }}
    >
      {/* Outer dim ring — context */}
      <circle cx="0" cy="0" r="130" fill="none" stroke="#1E1812" strokeWidth="1.5" />

      {/* Dashed directional */}
      <circle cx="0" cy="0" r="130" fill="none"
        stroke="#C9A96E" strokeWidth="0.7" strokeDasharray="4 12" opacity="0.25" />

      {/* Spoke lines from center */}
      {LOOP_NODES.map((n, i) => (
        <line key={`spoke${i}`} x1="0" y1="0" x2={n.cx} y2={n.cy}
          stroke={n.color} strokeWidth="0.4" opacity="0.15" />
      ))}

      {/* Node outer glow ring */}
      {LOOP_NODES.map((n, i) => (
        <circle key={`og${i}`} cx={n.cx} cy={n.cy} r="18"
          fill={n.color} opacity="0.08" />
      ))}

      {/* Node inner glow */}
      {LOOP_NODES.map((n, i) => (
        <circle key={`ig${i}`} cx={n.cx} cy={n.cy} r="10"
          fill={n.color} opacity="0.12" />
      ))}

      {/* Node dot */}
      {LOOP_NODES.map((n, i) => (
        <circle key={`nd${i}`} cx={n.cx} cy={n.cy} r="5"
          fill={n.color} />
      ))}

      {/* Labels — main */}
      {LOOP_NODES.map((n, i) => (
        <text key={`lbl${i}`} x={n.textX} y={n.textY}
          textAnchor={n.anchor} fill={n.color}
          fontSize="12" fontFamily="Georgia, serif" fontWeight="normal">
          {n.label}
        </text>
      ))}

      {/* Labels — sub */}
      {LOOP_NODES.map((n, i) => (
        <text key={`sub${i}`} x={n.textX} y={n.textY + 16}
          textAnchor={n.anchor} fill="#4A4035"
          fontSize="9.5" fontFamily="Georgia, serif">
          {n.sub}
        </text>
      ))}

      {/* Center dot */}
      <circle cx="0" cy="0" r="3" fill="#2A2318" stroke="#C9A96E" strokeWidth="0.7" />

      {/* Animated cursor — glow trail */}
      <circle cx="0" cy="-130" r="12" fill="#C9A96E" opacity="0.15">
        <animateTransform attributeName="transform" type="rotate"
          from="0 0 0" to="360 0 0" dur="8s" repeatCount="indefinite" />
      </circle>
      {/* Animated cursor — main */}
      <circle cx="0" cy="-130" r="5.5" fill="#C9A96E">
        <animateTransform attributeName="transform" type="rotate"
          from="0 0 0" to="360 0 0" dur="8s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

// ─── Subtle background pulse — behind hero ────────────────────────────────────

function HeroPulse() {
  return (
    <div aria-hidden="true" style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'none', overflow: 'hidden',
    }}>
      <svg viewBox="-500 -500 1000 1000" style={{ width: '80%', height: '80%', maxWidth: '700px' }}>
        {[0, -4, -8, -12].map((delay, i) => (
          <circle key={i} cx="0" cy="0" r="100" fill="none"
            stroke="#C9A96E" strokeWidth="0.5"
            className="hero-ring"
            style={{ '--ring-delay': `${delay}s` } as React.CSSProperties} />
        ))}
      </svg>
    </div>
  );
}

// ─── Hero word reveal ─────────────────────────────────────────────────────────

function HeroWord({ word, delay }: { word: string; delay: number }) {
  return (
    <span className="hero-word" style={{ '--delay': `${delay}s` } as React.CSSProperties}>
      {word}
    </span>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function LandingPage() {
  const [navSolid, setNavSolid] = useState(false);

  useEffect(() => {
    const fn = () => setNavSolid(window.scrollY > 60);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-scroll-enhanced', '');
    const obs = new IntersectionObserver(
      es => es.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('revealed'); obs.unobserve(e.target); }
      }),
      { threshold: 0.08, rootMargin: '0px 0px -20px 0px' }
    );
    document.querySelectorAll('.sr').forEach(el => obs.observe(el));
    return () => { obs.disconnect(); document.documentElement.removeAttribute('data-scroll-enhanced'); };
  }, []);

  return (
    <div style={{ background: 'var(--background)' }}>

      {/* ── Nav ───────────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '1.25rem clamp(1.5rem, 5vw, 4rem)',
        background: navSolid ? 'rgba(10,8,6,0.96)' : 'transparent',
        borderBottom: navSolid ? '1px solid var(--border)' : '1px solid transparent',
        backdropFilter: navSolid ? 'blur(12px)' : 'none',
        transition: 'background 0.5s ease, border-color 0.5s ease',
      }}>
        <span style={{
          fontFamily: 'Georgia, serif', fontSize: '0.8rem',
          color: 'var(--gold)', letterSpacing: '0.2em', textTransform: 'uppercase',
        }}>
          SELF OS
        </span>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <Link href="/login" style={{
            fontFamily: 'Georgia, serif', fontSize: '0.85rem',
            color: 'var(--text-muted)', textDecoration: 'none',
          }}>
            Accedi
          </Link>
          <Link href="/signup" style={{
            fontFamily: 'Georgia, serif', fontSize: '0.82rem',
            color: 'var(--gold)', textDecoration: 'none',
            border: '1px solid rgba(201,169,110,0.45)',
            padding: '0.45rem 1.1rem', borderRadius: '2px', letterSpacing: '0.04em',
          }}>
            Inizia →
          </Link>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════════════════
          HERO — Il loop è il visual principale, non un'appendice
      ═══════════════════════════════════════════════════════════════════ */}
      <section style={{
        position: 'relative', overflow: 'hidden',
        minHeight: '100svh', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: 'clamp(7rem, 13vh, 10rem) clamp(1.5rem, 5vw, 4rem) clamp(4rem, 7vh, 6rem)',
        textAlign: 'center',
      }}>
        <HeroPulse />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Loop diagram — prominente, centrato */}
          <div className="hero-sub" style={{ marginBottom: 'clamp(2.5rem, 5vh, 4rem)' }}>
            <LoopDiagram r={180} />
          </div>

          {/* Headline — sotto il loop */}
          <h1 style={{
            fontFamily: 'Georgia, serif', fontWeight: 'normal',
            fontSize: 'clamp(2rem, 4.5vw, 3.75rem)',
            lineHeight: 1.15, letterSpacing: '-0.02em',
            color: 'var(--text-primary)',
            maxWidth: '18ch', margin: '0 auto', textWrap: 'balance',
          }}>
            <HeroWord word="Chi" delay={0} />{' '}
            <HeroWord word="sei" delay={0.12} />{' '}
            <HeroWord word="sotto" delay={0.24} />{' '}
            <HeroWord word="le" delay={0.36} />{' '}
            <HeroWord word="strategie" delay={0.48} />{' '}
            <span style={{ color: 'var(--text-muted)' }}>
              <HeroWord word="che" delay={0.60} />{' '}
              <HeroWord word="hai" delay={0.72} />{' '}
              <HeroWord word="provato." delay={0.84} />
            </span>
          </h1>

          {/* Sub */}
          <p className="hero-cta" style={{
            fontFamily: 'Georgia, serif', fontSize: 'clamp(0.9rem, 1.5vw, 1.05rem)',
            color: 'var(--text-secondary)', lineHeight: 1.85,
            maxWidth: '46ch', margin: '2rem auto 2.75rem',
          }}>
            Mappatura psicologica attraverso i tuoi comportamenti reali. Scan iniziale, check-in quotidiani, esperimenti nel Lab.
          </p>

          {/* CTAs */}
          <div className="hero-cta" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/signup" style={{
              fontFamily: 'Georgia, serif', fontSize: '0.9rem', letterSpacing: '0.05em',
              color: 'var(--gold)', border: '1px solid var(--gold)',
              padding: '0.875rem 2.25rem', borderRadius: '2px', textDecoration: 'none',
            }}>
              Inizia il percorso →
            </Link>
            <Link href="/login" style={{
              fontFamily: 'Georgia, serif', fontSize: '0.9rem',
              color: 'var(--text-muted)', border: '1px solid var(--border)',
              padding: '0.875rem 1.75rem', borderRadius: '2px', textDecoration: 'none',
            }}>
              Accedi
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          STATEMENT — surface background, grande dichiarazione
      ═══════════════════════════════════════════════════════════════════ */}
      <section style={{
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{
          maxWidth: '1100px', margin: '0 auto',
          padding: 'clamp(5rem, 10vh, 9rem) clamp(1.5rem, 5vw, 4rem)',
        }}>
          <p className="sr" style={{
            fontFamily: 'Georgia, serif', fontWeight: 'normal',
            fontSize: 'clamp(1.6rem, 3.5vw, 2.75rem)',
            color: 'var(--text-primary)', lineHeight: 1.35,
            maxWidth: '26ch', textWrap: 'balance',
            marginBottom: '2.25rem',
          }}>
            Sai già cosa dovresti fare. Il pattern che ti tiene fermo opera sotto quello che riesci a vedere di te stesso.
          </p>
          <p className="sr" style={{
            fontFamily: 'Georgia, serif', fontSize: '1.05rem',
            color: 'var(--text-secondary)', lineHeight: 1.9, maxWidth: '50ch',
            '--reveal-delay': '0.12s',
          } as React.CSSProperties}>
            Hai già usato le strategie. Il ciclo che le vanifica opera prima della decisione: negli stati emotivi, nei comportamenti automatici, nelle credenze che non hai mai scelto. SELF OS porta quel ciclo in superficie.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          4 LIVELLI — ogni livello con tint del proprio colore
      ═══════════════════════════════════════════════════════════════════ */}
      <section>
        {[
          {
            label: 'Stato',    color: '#C9A96E', bg: 'rgba(201,169,110,0.035)', delay: '0s',
            desc: 'Come filtri la realtà in questo momento. Il punto di partenza di ogni scelta — quello che cambia tutto il resto.',
          },
          {
            label: 'Pattern',  color: '#8B9E7A', bg: 'rgba(139,158,122,0.035)', delay: '0s',
            desc: 'Cosa si ripete automaticamente nei tuoi comportamenti. Spesso invisibile a chi lo vive. Sempre operativo.',
          },
          {
            label: 'Credenze', color: '#7A8B9E', bg: 'rgba(122,139,158,0.035)', delay: '0s',
            desc: 'Le storie che hai su te stesso. Quelle che non hai mai deciso di credere, ma che governano ogni decisione.',
          },
          {
            label: 'Identità', color: '#9E7A8B', bg: 'rgba(158,122,139,0.035)', delay: '0s',
            desc: 'Chi credi di essere a un livello inconscio. La radice di tutto il resto. Il punto da cui parte il cambiamento che tiene.',
          },
        ].map((level, i) => (
          <div
            key={level.label}
            className="sr level-row-v2"
            style={{
              background: level.bg,
              borderBottom: '1px solid var(--border)',
              padding: 'clamp(2.25rem, 4.5vh, 3.5rem) clamp(1.5rem, 5vw, 4rem)',
              '--reveal-delay': `${i * 0.09}s`,
            } as React.CSSProperties}
          >
            {/* Label col */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className="level-dot" style={{
                display: 'block', width: '8px', height: '8px',
                borderRadius: '50%', background: level.color, flexShrink: 0,
                '--pulse-delay': `${i * 0.75}s`,
              } as React.CSSProperties} />
              <p style={{
                fontFamily: 'Georgia, serif',
                fontSize: 'clamp(1.1rem, 2vw, 1.5rem)',
                color: level.color, margin: 0, letterSpacing: '-0.01em',
              }}>
                {level.label}
              </p>
            </div>
            {/* Desc col */}
            <p style={{
              fontFamily: 'Georgia, serif', fontSize: '1rem',
              color: 'var(--text-secondary)', lineHeight: 1.85, margin: 0,
            }}>
              {level.desc}
            </p>
          </div>
        ))}
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          IL SISTEMA — 4 passi in griglia, surface bg
      ═══════════════════════════════════════════════════════════════════ */}
      <section style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{
          maxWidth: '1100px', margin: '0 auto',
          padding: 'clamp(4.5rem, 9vh, 8rem) clamp(1.5rem, 5vw, 4rem)',
        }}>
          {/* Grid bordata — 4 colonne */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            border: '1px solid var(--border)',
          }}>
            {[
              { color: '#C9A96E', title: 'Scan',     desc: '150 domande, una volta sola. Mappa archetipo, loop comportamentali e credenze limitanti con precisione.' },
              { color: '#8B9E7A', title: 'Check-in', desc: 'Mattina e sera. Il sistema rileva le ripetizioni nei tuoi dati e genera riflessioni sui pattern reali.' },
              { color: '#7A8B9E', title: 'Lab',      desc: 'Ogni pattern diventa un esperimento: trigger specifico, scarico corporeo, azione diversa. 7 giorni.' },
              { color: '#9E7A8B', title: 'Mappa',    desc: 'Il profilo identitario nel tempo. La distanza tra chi eri 30 giorni fa e chi sei adesso.' },
            ].map((step, i) => (
              <div
                key={step.title}
                className="sr"
                style={{
                  padding: 'clamp(1.75rem, 3vw, 2.5rem)',
                  borderRight: i < 3 ? '1px solid var(--border)' : 'none',
                  '--reveal-delay': `${i * 0.09}s`,
                } as React.CSSProperties}
              >
                <span style={{
                  display: 'inline-block', width: '6px', height: '6px',
                  borderRadius: '50%', background: step.color,
                  marginBottom: '1.5rem',
                }} />
                <p style={{
                  fontFamily: 'Georgia, serif', fontSize: '1.1rem',
                  color: 'var(--text-primary)', marginBottom: '0.875rem',
                }}>
                  {step.title}
                </p>
                <p style={{
                  fontFamily: 'Georgia, serif', fontSize: '0.875rem',
                  color: 'var(--text-secondary)', lineHeight: 1.85,
                }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          CTA FINALE — ampio respiro, headline dominante
      ═══════════════════════════════════════════════════════════════════ */}
      <section style={{
        minHeight: '65vh', display: 'flex', alignItems: 'center',
      }}>
        <div style={{
          maxWidth: '1100px', margin: '0 auto', width: '100%',
          padding: 'clamp(5rem, 10vh, 8rem) clamp(1.5rem, 5vw, 4rem)',
        }}>
          <h2 className="sr" style={{
            fontFamily: 'Georgia, serif', fontWeight: 'normal',
            fontSize: 'clamp(2.75rem, 7vw, 6rem)',
            lineHeight: 1.05, letterSpacing: '-0.03em',
            color: 'var(--text-primary)',
            marginBottom: 'clamp(2.5rem, 5vh, 4rem)',
            textWrap: 'balance', maxWidth: '14ch',
          }}>
            Apri il sistema.
          </h2>
          <div className="sr" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', '--reveal-delay': '0.15s' } as React.CSSProperties}>
            <Link href="/signup" style={{
              fontFamily: 'Georgia, serif', fontSize: '0.95rem', letterSpacing: '0.05em',
              color: 'var(--gold)', border: '1px solid var(--gold)',
              padding: '1rem 2.5rem', borderRadius: '2px', textDecoration: 'none',
            }}>
              Inizia il percorso →
            </Link>
            <Link href="/login" style={{
              fontFamily: 'Georgia, serif', fontSize: '0.95rem',
              color: 'var(--text-muted)', border: '1px solid var(--border)',
              padding: '1rem 1.75rem', borderRadius: '2px', textDecoration: 'none',
            }}>
              Accedi
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid var(--border)' }}>
        <div style={{
          maxWidth: '1100px', margin: '0 auto',
          padding: '1.75rem clamp(1.5rem, 5vw, 4rem)',
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', flexWrap: 'wrap', gap: '1rem',
        }}>
          <span style={{
            fontFamily: 'Georgia, serif', fontSize: '0.78rem',
            color: 'var(--gold)', letterSpacing: '0.2em', textTransform: 'uppercase',
          }}>
            SELF OS
          </span>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Sistema Operativo Identitario
          </p>
        </div>
      </footer>

    </div>
  );
}
