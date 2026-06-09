'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import type { ScanReport } from '@/types/scan';

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, visible };
}

function useCounter(target: number, duration = 1500, active = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active) return;
    let start: number | null = null;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);

    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setCount(Math.round(ease(progress) * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, active]);

  return count;
}

// ─── Animated wrapper ─────────────────────────────────────────────────────────

function AnimatedBlock({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, visible } = useInView();
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ─── Section divider ──────────────────────────────────────────────────────────

function SectionDivider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '4rem 0' }}>
      <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, #1E1C22)' }} />
      <span style={{ color: '#C9A96E', fontSize: '0.5rem', letterSpacing: '0.3em' }}>✦</span>
      <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to left, transparent, #1E1C22)' }} />
    </div>
  );
}

// ─── Block header ─────────────────────────────────────────────────────────────

function BlockHeader({ number, title, color }: { number: string; title: string; color: string }) {
  return (
    <div style={{ marginBottom: '2.5rem' }}>
      <p style={{
        fontFamily: 'var(--font-dm-sans), sans-serif',
        fontSize: '0.6rem',
        letterSpacing: '0.25em',
        textTransform: 'uppercase',
        color,
        marginBottom: '0.5rem',
      }}>
        {number}
      </p>
      <h2 style={{
        fontFamily: 'var(--font-playfair), Georgia, serif',
        fontSize: '1.4rem',
        fontWeight: 400,
        color: '#F5F0E8',
        letterSpacing: '-0.01em',
      }}>
        {title}
      </h2>
    </div>
  );
}

// ─── Spiral badge ─────────────────────────────────────────────────────────────

const SPIRAL_COLORS: Record<string, string> = {
  Beige: '#C8B89A',
  Viola: '#8B7AAA',
  Rosso: '#AA5A5A',
  Blu: '#5A7AAA',
  Arancione: '#E8A045',
  Verde: '#6B9E6B',
  Giallo: '#D4C547',
  Turchese: '#5AABB5',
  Corallo: '#E07A5F',
  Ultravioletto: '#9B7FA8',
};

function SpiralBadge({ level }: { level: string }) {
  const color = SPIRAL_COLORS[level] ?? '#C9A96E';
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.4rem 1rem',
      borderRadius: '2px',
      border: `1px solid ${color}`,
      background: `${color}12`,
    }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{
        fontFamily: 'var(--font-dm-sans), sans-serif',
        fontSize: '0.7rem',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color,
      }}>
        Spirale {level}
      </span>
    </div>
  );
}

// ─── Block 1: Progress ring + archetypes ──────────────────────────────────────

function ProgressRing({ score, color, size = 120, strokeWidth = 6 }: {
  score: number; color: string; size?: number; strokeWidth?: number;
}) {
  const { ref, visible } = useInView();
  const count = useCounter(score, 1500, visible);
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  const dash = visible ? (score / 100) * circ : 0;

  return (
    <div ref={ref} style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1E1C22" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ - dash}
          style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.16,1,0.3,1)' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column',
      }}>
        <span style={{
          fontFamily: 'var(--font-playfair), Georgia, serif',
          fontSize: size > 100 ? '1.4rem' : '1rem',
          color,
          lineHeight: 1,
        }}>
          {count}
        </span>
        <span style={{
          fontFamily: 'var(--font-dm-sans), sans-serif',
          fontSize: '0.55rem',
          color: '#4A4035',
          letterSpacing: '0.1em',
        }}>%</span>
      </div>
    </div>
  );
}

const ARCHETYPE_COLORS: Record<string, string> = {
  S1: '#9E7A8B', S2: '#7A8B9E', S3: '#8B9E7A', S4: '#C9A96E',
  S5: '#C9A96E', S6: '#9E7A8B', S7: '#7A8B9E', S8: '#8B9E7A',
  S9: '#C9A96E', S10: '#C9A96E', S11: '#9E7A8B', S12: '#8B9E7A',
};

function Block1Archetypes({ report }: { report: ScanReport }) {
  const primaryColor = ARCHETYPE_COLORS[report.archetype_primary?.id ?? ''] ?? '#C9A96E';
  const secondaryColor = ARCHETYPE_COLORS[report.archetype_secondary?.id ?? ''] ?? '#7A8B9E';
  const tertiaryColor = report.archetype_tertiary
    ? (ARCHETYPE_COLORS[report.archetype_tertiary.id] ?? '#4A4035')
    : '#4A4035';

  return (
    <div>
      <BlockHeader number="Blocco 01" title="Il tuo Profilo Identitario" color={primaryColor} />

      {/* Primary — large card with ring */}
      <AnimatedBlock>
        <div className="archetype-primary-card" style={{
          background: '#0F0E12',
          border: `1px solid ${primaryColor}30`,
          borderTop: `2px solid ${primaryColor}`,
          borderRadius: '3px',
          padding: '2rem',
          marginBottom: '1rem',
        }}>
          <ProgressRing score={report.archetype_primary.score} color={primaryColor} size={120} />
          <div style={{ flex: 1 }}>
            <p style={{
              fontFamily: 'var(--font-dm-sans), sans-serif',
              fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase',
              color: primaryColor, marginBottom: '0.4rem',
            }}>
              Archetipo Primario
            </p>
            <h3 style={{
              fontFamily: 'var(--font-playfair), Georgia, serif',
              fontSize: '1.3rem', fontWeight: 400,
              color: '#F5F0E8', marginBottom: '0.75rem',
            }}>
              {report.archetype_primary.title}
            </h3>
            <p style={{
              fontFamily: 'var(--font-dm-sans), sans-serif',
              fontSize: '0.875rem', color: '#A89880', lineHeight: 1.75,
            }}>
              {report.archetype_primary.description}
            </p>
          </div>
        </div>
      </AnimatedBlock>

      {/* Secondary + Tertiary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { data: report.archetype_secondary, label: 'Archetipo Secondario', color: secondaryColor },
          ...(report.archetype_tertiary ? [{ data: report.archetype_tertiary, label: 'Archetipo Terziario', color: tertiaryColor }] : []),
        ].map(({ data, label, color }, i) => (
          <AnimatedBlock key={i} delay={i * 100}>
            <div style={{
              background: '#0F0E12',
              border: '1px solid #1E1C22',
              borderRadius: '3px',
              padding: '1.5rem',
              display: 'flex',
              gap: '1.25rem',
              alignItems: 'flex-start',
            }}>
              <ProgressRing score={data.score} color={color} size={72} strokeWidth={4} />
              <div style={{ flex: 1 }}>
                <p style={{
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                  fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase',
                  color: '#4A4035', marginBottom: '0.3rem',
                }}>
                  {label}
                </p>
                <p style={{
                  fontFamily: 'var(--font-playfair), Georgia, serif',
                  fontSize: '1rem', fontWeight: 400, color: '#F5F0E8', marginBottom: '0.4rem',
                }}>
                  {data.title}
                </p>
                <p style={{
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                  fontSize: '0.8rem', color: '#A89880', lineHeight: 1.65,
                }}>
                  {data.description}
                </p>
              </div>
            </div>
          </AnimatedBlock>
        ))}
      </div>

      {/* Spiral badge */}
      {report.spiral_level && (
        <AnimatedBlock delay={200}>
          <div style={{
            padding: '1.25rem 1.5rem',
            border: '1px solid #1E1C22',
            borderRadius: '3px',
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            flexWrap: 'wrap',
          }}>
            <SpiralBadge level={report.spiral_level} />
            {report.spiral_description && (
              <p style={{
                fontFamily: 'var(--font-dm-sans), sans-serif',
                fontSize: '0.85rem', color: '#A89880', lineHeight: 1.6,
              }}>
                {report.spiral_description}
              </p>
            )}
          </div>
        </AnimatedBlock>
      )}
    </div>
  );
}

// ─── Block 2: Ouroboros loop SVG ──────────────────────────────────────────────

const LOOP_COLORS = ['#8B4A4A', '#8B6A4A', '#4A4A5A'];
const LOOP_STEPS = ['Trigger', 'Pensiero', 'Comportamento', 'Risultato', 'Rinforzo'] as const;

function OuroborosLoop({ loop, color, isActive }: {
  loop: ScanReport['loop_primary'];
  color: string;
  isActive: boolean;
}) {
  // 5 nodes at 72° intervals, starting from top (-90°)
  const R = 110;
  const CX = 140;
  const CY = 140;
  const nodeR = 6;
  const svgSize = 280;

  const nodes = LOOP_STEPS.map((_, i) => {
    const angle = (i * 72 - 90) * (Math.PI / 180);
    return { x: CX + R * Math.cos(angle), y: CY + R * Math.sin(angle) };
  });

  // Arc path between two points (large arc=0, sweep=1 clockwise)
  const arc = (from: { x: number; y: number }, to: { x: number; y: number }) =>
    `M ${from.x} ${from.y} A ${R} ${R} 0 0 1 ${to.x} ${to.y}`;

  // Total arc circumference approximation for dasharray animation
  const arcLen = R * (72 * Math.PI / 180); // arc for 72°

  const stepValues = [loop.trigger, loop.thought, loop.behavior, loop.result, loop.reinforcement];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
        <svg viewBox={`0 0 ${svgSize} ${svgSize}`} width={svgSize} height={svgSize} style={{ overflow: 'visible' }}>
          {/* 4 solid arcs + 1 dashed return arc (Rinforzo → Trigger) */}
          {nodes.map((n, i) => {
            const next = nodes[(i + 1) % 5];
            const isReturn = i === 4; // Rinforzo → Trigger
            const strokeDash = arcLen;
            return (
              <path
                key={i}
                d={arc(n, next)}
                fill="none"
                stroke={color}
                strokeWidth={isReturn ? 1.5 : 2}
                strokeDasharray={isReturn ? '4 6' : undefined}
                strokeLinecap="round"
                opacity={isReturn ? 0.5 : 0.8}
                style={!isReturn ? {
                  strokeDasharray: `${strokeDash}`,
                  strokeDashoffset: isActive ? 0 : strokeDash,
                  transition: `stroke-dashoffset 0.8s ease ${i * 0.2}s`,
                } : undefined}
              />
            );
          })}

          {/* Return arrow head */}
          <defs>
            <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
              <path d="M 0 0 L 6 3 L 0 6 Z" fill={color} opacity={0.5} />
            </marker>
          </defs>

          {/* Node circles */}
          {nodes.map((n, i) => (
            <g key={i}>
              <circle cx={n.x} cy={n.y} r={nodeR + 4} fill={`${color}15`} />
              <circle cx={n.x} cy={n.y} r={nodeR} fill="#08070A" stroke={color} strokeWidth={1.5} />
              <circle
                cx={n.x} cy={n.y} r={nodeR - 2}
                fill={color}
                opacity={isActive ? 1 : 0}
                style={{ transition: `opacity 0.4s ease ${i * 0.15 + 0.5}s` }}
              />
            </g>
          ))}

          {/* Center label */}
          <text
            x={CX} y={CY - 8}
            textAnchor="middle"
            fill="#4A4035"
            fontSize="9"
            fontFamily="var(--font-dm-sans), sans-serif"
            letterSpacing="2"
            textDecoration="none"
            style={{ textTransform: 'uppercase' }}
          >
            AREA
          </text>
          <text
            x={CX} y={CY + 8}
            textAnchor="middle"
            fill="#A89880"
            fontSize="11"
            fontFamily="var(--font-playfair), Georgia, serif"
          >
            {loop.area}
          </text>
        </svg>
      </div>

      {/* Step grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        {LOOP_STEPS.map((step, i) => (
          <div key={step} style={{
            display: 'flex',
            gap: '1.25rem',
            padding: '0.875rem 0',
            borderBottom: i < 4 ? '1px solid #1E1C22' : 'none',
            opacity: isActive ? 1 : 0,
            transform: isActive ? 'translateX(0)' : 'translateX(-8px)',
            transition: `opacity 0.5s ease ${i * 0.1 + 0.3}s, transform 0.5s ease ${i * 0.1 + 0.3}s`,
          }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: color, flexShrink: 0, marginTop: '0.3rem',
              opacity: 0.7,
            }} />
            <div>
              <span style={{
                fontFamily: 'var(--font-dm-sans), sans-serif',
                fontSize: '0.6rem', letterSpacing: '0.18em',
                textTransform: 'uppercase', color: '#4A4035',
                display: 'block', marginBottom: '0.2rem',
              }}>
                {step}
              </span>
              <span style={{
                fontFamily: 'var(--font-dm-sans), sans-serif',
                fontSize: '0.875rem', color: '#A89880', lineHeight: 1.65,
              }}>
                {stepValues[i]}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Block2Loops({ report }: { report: ScanReport }) {
  const loops = [
    { data: report.loop_primary, label: 'Loop Primario' },
    { data: report.loop_secondary, label: 'Loop Secondario' },
    ...(report.loop_tertiary ? [{ data: report.loop_tertiary, label: 'Loop Terziario' }] : []),
  ];

  return (
    <div>
      <BlockHeader number="Blocco 02" title="La Mappa dei Loop" color="#8B9E7A" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
        {loops.map(({ data, label }, i) => {
          const color = LOOP_COLORS[i] ?? LOOP_COLORS[2];
          return (
            <AnimatedBlock key={i} delay={i * 150}>
              <div style={{
                background: '#0F0E12',
                border: '1px solid #1E1C22',
                borderTop: `2px solid ${color}`,
                borderRadius: '3px',
                padding: '2rem',
              }}>
                <p style={{
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                  fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase',
                  color, marginBottom: '0.3rem',
                }}>
                  {label}
                </p>
                <p style={{
                  fontFamily: 'var(--font-playfair), Georgia, serif',
                  fontSize: '1.1rem', fontWeight: 400, color: '#F5F0E8', marginBottom: '2rem',
                }}>
                  {data.area}
                </p>
                <LoopWithVisibility loop={data} color={color} />
              </div>
            </AnimatedBlock>
          );
        })}
      </div>
    </div>
  );
}

// Wrapper so each Ouroboros tracks its own visibility
function LoopWithVisibility({ loop, color }: { loop: ScanReport['loop_primary']; color: string }) {
  const { ref, visible } = useInView(0.2);
  return (
    <div ref={ref}>
      <OuroborosLoop loop={loop} color={color} isActive={visible} />
    </div>
  );
}

// ─── Block 3: Beliefs ─────────────────────────────────────────────────────────

function Block3Beliefs({ report }: { report: ScanReport }) {
  return (
    <div>
      <BlockHeader number="Blocco 03" title="Le Credenze Fondanti" color="#7A8B9E" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* Primary limiting belief */}
        {report.belief_limiting_primary && (
          <AnimatedBlock>
            <div style={{
              background: '#0F0E12',
              borderLeft: '3px solid #7A8B9E',
              padding: '1.75rem 2rem',
            }}>
              <p style={{
                fontFamily: 'var(--font-dm-sans), sans-serif',
                fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase',
                color: '#7A8B9E', marginBottom: '0.75rem',
              }}>
                Credenza Limitante Primaria
              </p>
              <p style={{
                fontFamily: 'var(--font-playfair), Georgia, serif',
                fontSize: '1.1rem', fontStyle: 'italic',
                color: '#F5F0E8', lineHeight: 1.8, marginBottom: '1rem',
              }}>
                &ldquo;{report.belief_limiting_primary.text}&rdquo;
              </p>
              <p style={{
                fontFamily: 'var(--font-dm-sans), sans-serif',
                fontSize: '0.78rem', color: '#4A4035', lineHeight: 1.6,
              }}>
                Origine: {report.belief_limiting_primary.origin}
              </p>
            </div>
          </AnimatedBlock>
        )}

        {/* Secondary limiting belief */}
        {report.belief_limiting_secondary && (
          <AnimatedBlock delay={100}>
            <div style={{
              background: '#0F0E12',
              borderLeft: '3px solid #4A4A5A',
              padding: '1.75rem 2rem',
            }}>
              <p style={{
                fontFamily: 'var(--font-dm-sans), sans-serif',
                fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase',
                color: '#6A6A8A', marginBottom: '0.75rem',
              }}>
                Credenza Limitante Secondaria
              </p>
              <p style={{
                fontFamily: 'var(--font-playfair), Georgia, serif',
                fontSize: '1.1rem', fontStyle: 'italic',
                color: '#F5F0E8', lineHeight: 1.8, marginBottom: '1rem',
              }}>
                &ldquo;{report.belief_limiting_secondary.text}&rdquo;
              </p>
              <p style={{
                fontFamily: 'var(--font-dm-sans), sans-serif',
                fontSize: '0.78rem', color: '#4A4035', lineHeight: 1.6,
              }}>
                Origine: {report.belief_limiting_secondary.origin}
              </p>
            </div>
          </AnimatedBlock>
        )}

        {/* Resource belief */}
        {report.belief_resource && (
          <AnimatedBlock delay={200}>
            <div style={{
              background: 'rgba(107, 158, 107, 0.05)',
              border: '1px solid rgba(107, 158, 107, 0.25)',
              borderRadius: '3px',
              padding: '1.75rem 2rem',
            }}>
              <p style={{
                fontFamily: 'var(--font-dm-sans), sans-serif',
                fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase',
                color: '#6B9E6B', marginBottom: '0.75rem',
              }}>
                Credenza Risorsa
              </p>
              <p style={{
                fontFamily: 'var(--font-playfair), Georgia, serif',
                fontSize: '1.05rem', fontStyle: 'italic',
                color: '#F5F0E8', lineHeight: 1.8,
              }}>
                &ldquo;{report.belief_resource.text}&rdquo;
              </p>
            </div>
          </AnimatedBlock>
        )}
      </div>
    </div>
  );
}

// ─── Block 4: Radar chart ─────────────────────────────────────────────────────

const LIFE_AREAS = [
  'Salute & Corpo',
  'Relazioni & Amore',
  'Famiglia',
  'Business & Carriera',
  'Finanze & Abbondanza',
  'Crescita Personale',
  'Divertimento & Creatività',
  'Contributo & Scopo',
];

function RadarChart({ scores, expansionAreas, loopAreas, isActive }: {
  scores: number[];
  expansionAreas: string[];
  loopAreas: string[];
  isActive: boolean;
}) {
  const N = 8;
  const CX = 200;
  const CY = 200;
  const maxR = 140;
  const levels = [0.25, 0.5, 0.75, 1];

  const angleOf = (i: number) => (i * (2 * Math.PI) / N) - Math.PI / 2;

  const pointAt = (i: number, r: number) => ({
    x: CX + r * Math.cos(angleOf(i)),
    y: CY + r * Math.sin(angleOf(i)),
  });

  // Clamp scores 0–10 to fraction 0–1
  const fractions = scores.map(s => Math.max(0.05, Math.min(1, s / 10)));

  const dataPoints = fractions.map((f, i) => pointAt(i, f * maxR));
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  const gridPath = (fraction: number) =>
    Array.from({ length: N }, (_, i) => pointAt(i, fraction * maxR))
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ') + ' Z';

  return (
    <svg viewBox="0 0 400 400" style={{ width: '100%', maxWidth: '380px', margin: '0 auto', display: 'block' }}>
      {/* Grid rings */}
      {levels.map(l => (
        <path key={l} d={gridPath(l)} fill="none" stroke="#1E1C22" strokeWidth={1} />
      ))}

      {/* Axis lines */}
      {Array.from({ length: N }, (_, i) => {
        const outer = pointAt(i, maxR);
        return <line key={i} x1={CX} y1={CY} x2={outer.x} y2={outer.y} stroke="#1E1C22" strokeWidth={1} />;
      })}

      {/* Data polygon */}
      <path
        d={dataPath}
        fill="#C9A96E14"
        stroke="#C9A96E"
        strokeWidth={1.5}
        opacity={isActive ? 1 : 0}
        style={{ transition: 'opacity 1s ease 0.3s' }}
      />

      {/* Data points colored by expansion/loop */}
      {dataPoints.map((p, i) => {
        const area = LIFE_AREAS[i];
        const isExpansion = expansionAreas.includes(area);
        const isLoop = loopAreas.includes(area);
        const dotColor = isExpansion ? '#6B9E6B' : isLoop ? '#9E7A8B' : '#C9A96E';
        return (
          <circle
            key={i} cx={p.x} cy={p.y} r={4}
            fill={dotColor} opacity={isActive ? 1 : 0}
            style={{ transition: `opacity 0.4s ease ${i * 0.08 + 0.5}s` }}
          />
        );
      })}

      {/* Labels */}
      {LIFE_AREAS.map((area, i) => {
        const labelR = maxR + 22;
        const pos = pointAt(i, labelR);
        const angle = angleOf(i) * (180 / Math.PI);
        const isRight = Math.cos(angleOf(i)) > 0.1;
        const isLeft = Math.cos(angleOf(i)) < -0.1;
        const anchor = isRight ? 'start' : isLeft ? 'end' : 'middle';

        const areaColor = expansionAreas.includes(area) ? '#6B9E6B'
          : loopAreas.includes(area) ? '#9E7A8B'
          : '#4A4035';

        return (
          <text
            key={i}
            x={pos.x} y={pos.y}
            textAnchor={anchor}
            fill={areaColor}
            fontSize="8.5"
            fontFamily="var(--font-dm-sans), sans-serif"
            dominantBaseline="middle"
          >
            {area}
          </text>
        );
      })}
    </svg>
  );
}

function Block4Wheel({ report, radarScores }: { report: ScanReport; radarScores: number[] }) {
  const { ref, visible } = useInView(0.2);

  return (
    <div>
      <BlockHeader number="Blocco 04" title="La Ruota della Vita" color="#C9A96E" />

      <AnimatedBlock>
        <div style={{
          background: '#0F0E12',
          border: '1px solid #1E1C22',
          borderRadius: '3px',
          padding: '2rem',
        }}>
          <div ref={ref}>
            <RadarChart
              scores={radarScores}
              expansionAreas={report.wheel_expansion ?? []}
              loopAreas={report.wheel_loops ?? []}
              isActive={visible}
            />
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            {[
              { color: '#6B9E6B', label: 'Aree di espansione' },
              { color: '#9E7A8B', label: 'Aree con loop' },
              { color: '#C9A96E', label: 'Neutro' },
            ].map(({ color, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                <span style={{
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                  fontSize: '0.7rem', color: '#4A4035',
                }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </AnimatedBlock>

      {/* Priority */}
      {report.wheel_priority && (
        <AnimatedBlock delay={150}>
          <div style={{
            marginTop: '1.25rem',
            padding: '1.25rem 1.5rem',
            border: '1px solid #C9A96E40',
            borderRadius: '3px',
            display: 'flex',
            gap: '1.25rem',
            alignItems: 'flex-start',
          }}>
            <div>
              <p style={{
                fontFamily: 'var(--font-dm-sans), sans-serif',
                fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase',
                color: '#C9A96E', marginBottom: '0.4rem',
              }}>
                Priorità di Partenza
              </p>
              <p style={{
                fontFamily: 'var(--font-playfair), Georgia, serif',
                fontSize: '1rem', color: '#C9A96E', marginBottom: '0.4rem',
              }}>
                {report.wheel_priority.area}
              </p>
              <p style={{
                fontFamily: 'var(--font-dm-sans), sans-serif',
                fontSize: '0.85rem', color: '#A89880', lineHeight: 1.65,
              }}>
                {report.wheel_priority.reason}
              </p>
            </div>
          </div>
        </AnimatedBlock>
      )}
    </div>
  );
}

// ─── Block 5: Identity target ─────────────────────────────────────────────────

function PulsingBorder({ children }: { children: React.ReactNode }) {
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    const t = setInterval(() => setPulse(p => !p), 1800);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{
      padding: '1.25rem',
      border: `1px solid ${pulse ? '#9E7A8B80' : '#9E7A8B30'}`,
      borderRadius: '3px',
      background: pulse ? 'rgba(158,122,139,0.05)' : 'transparent',
      transition: 'border-color 1.5s ease, background 1.5s ease',
    }}>
      {children}
    </div>
  );
}

function Block5Identity({ report }: { report: ScanReport }) {
  const identityColor = '#9E7A8B';

  return (
    <div>
      <BlockHeader number="Blocco 05" title="L'Identità Target" color={identityColor} />

      {report.identity_target && (
        <AnimatedBlock>
          <div style={{
            background: '#0F0E12',
            border: `1px solid ${identityColor}30`,
            borderTop: `2px solid ${identityColor}`,
            borderRadius: '3px',
            padding: '2.5rem 2rem',
          }}>
            {/* Identity name */}
            {report.identity_target.name && (
              <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                <p style={{
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                  fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase',
                  color: '#4A4035', marginBottom: '0.75rem',
                }}>
                  La tua identità target
                </p>
                <h3 style={{
                  fontFamily: 'var(--font-playfair), Georgia, serif',
                  fontSize: '1.6rem', fontWeight: 400,
                  color: identityColor,
                  textShadow: `0 0 30px ${identityColor}60`,
                  letterSpacing: '-0.01em',
                }}>
                  {report.identity_target.name}
                </h3>
              </div>
            )}

            {/* Da → A */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto 1fr',
              gap: '1.5rem',
              alignItems: 'center',
              marginBottom: '2rem',
            }}>
              <div>
                <p style={{
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                  fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase',
                  color: '#4A4035', marginBottom: '0.5rem',
                }}>
                  Da — chi sei ora
                </p>
                <p style={{
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                  fontSize: '0.875rem', color: '#A89880', lineHeight: 1.7,
                }}>
                  {report.identity_target.shift_from}
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                <div style={{ width: '1px', height: '20px', background: '#1E1C22' }} />
                <span style={{ color: identityColor, fontSize: '1.1rem' }}>→</span>
                <div style={{ width: '1px', height: '20px', background: '#1E1C22' }} />
              </div>

              <div>
                <p style={{
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                  fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase',
                  color: identityColor, marginBottom: '0.5rem',
                }}>
                  A — chi diventi
                </p>
                <p style={{
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                  fontSize: '0.875rem', color: '#F5F0E8', lineHeight: 1.7,
                }}>
                  {report.identity_target.shift_to}
                </p>
              </div>
            </div>

            {/* First action — pulsing */}
            {report.identity_target.first_action && (
              <PulsingBorder>
                <p style={{
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                  fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase',
                  color: identityColor, marginBottom: '0.5rem',
                }}>
                  Prima Azione
                </p>
                <p style={{
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                  fontSize: '0.9rem', color: '#F5F0E8', lineHeight: 1.7,
                }}>
                  {report.identity_target.first_action}
                </p>
              </PulsingBorder>
            )}
          </div>
        </AnimatedBlock>
      )}
    </div>
  );
}

// ─── Block 6: Letter ──────────────────────────────────────────────────────────

function Block6Letter({ letter }: { letter: string }) {
  return (
    <div>
      <BlockHeader number="Blocco 06" title="La Lettera" color="#C9A96E" />
      <AnimatedBlock>
        <div style={{ padding: '1rem 0 3rem' }}>
          <p style={{
            fontFamily: 'var(--font-playfair), Georgia, serif',
            fontSize: '1.15rem',
            fontStyle: 'italic',
            lineHeight: 2,
            color: '#F5F0E8',
            maxWidth: '580px',
          }}>
            {letter}
          </p>
        </div>
      </AnimatedBlock>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function ResultsClient({
  report,
  radarScores,
}: {
  report: ScanReport;
  radarScores: number[];
}) {
  return (
    <div style={{
      width: '100%',
      maxWidth: '740px',
      padding: '5rem 2rem 6rem',
      margin: '0 auto',
      fontFamily: 'var(--font-dm-sans), sans-serif',
    }}>
      {/* Hero header */}
      <div style={{ textAlign: 'center', marginBottom: '5rem', opacity: 1 }}>
        <p style={{
          fontFamily: 'var(--font-dm-sans), sans-serif',
          fontSize: '0.6rem', letterSpacing: '0.3em', textTransform: 'uppercase',
          color: '#C9A96E', marginBottom: '1.25rem',
        }}>
          SELF OS — Profilo Identitario
        </p>
        <h1 style={{
          fontFamily: 'var(--font-playfair), Georgia, serif',
          fontSize: 'clamp(2rem, 5vw, 2.8rem)',
          fontWeight: 400,
          color: '#F5F0E8',
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
          marginBottom: '1.5rem',
        }}>
          Quello che emerge
        </h1>
        <div style={{
          width: '40px', height: '1px',
          background: 'linear-gradient(to right, transparent, #C9A96E, transparent)',
          margin: '0 auto',
        }} />
      </div>

      <Block1Archetypes report={report} />
      <SectionDivider />
      <Block2Loops report={report} />
      <SectionDivider />
      <Block3Beliefs report={report} />
      <SectionDivider />
      <Block4Wheel report={report} radarScores={radarScores} />
      <SectionDivider />
      <Block5Identity report={report} />
      <SectionDivider />
      <Block6Letter letter={report.letter} />

      {/* CTA */}
      <div style={{ textAlign: 'center', marginTop: '3rem' }}>
        <Link
          href="/dashboard"
          style={{
            display: 'inline-block',
            padding: '1rem 3rem',
            background: 'transparent',
            border: '1px solid #C9A96E',
            borderRadius: '2px',
            color: '#C9A96E',
            fontFamily: 'var(--font-dm-sans), sans-serif',
            fontSize: '0.8rem',
            textDecoration: 'none',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            transition: 'all 0.4s ease',
          }}
        >
          Entra nel tuo sistema →
        </Link>
      </div>
    </div>
  );
}
