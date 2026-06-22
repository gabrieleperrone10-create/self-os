export function BiometricsComingSoon() {
  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>

      {/* Header reale ma sbiadito */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
          Corpo
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Biometrici e calendario — come il corpo risponde a ciò che fai
        </p>
      </div>

      {/* Anteprima pixelata + overlay */}
      <div style={{ position: 'relative', borderRadius: '3px', overflow: 'hidden' }}>

        {/* Mockup sfondo — simula la UI reale */}
        <div style={{ filter: 'blur(8px) brightness(0.4)', userSelect: 'none', pointerEvents: 'none' }}>

          {/* Cards summary fake */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {[['HRV oggi', '61', 'ms'], ['FC a riposo', '58', 'bpm'], ['Passi oggi', '7.240', ''], ['Baseline HRV', '58.2', 'ms']].map(([label, val, unit]) => (
              <div key={label} style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: '3px', padding: '1.5rem', flex: 1, minWidth: '140px',
              }}>
                <p style={{ fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>{label}</p>
                <p style={{ fontFamily: 'Georgia, serif', fontSize: '1.9rem', color: 'var(--text-primary)', lineHeight: 1 }}>
                  {val}<span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginLeft: '0.3rem' }}>{unit}</span>
                </p>
              </div>
            ))}
          </div>

          {/* Chart fake — barre */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '3px', padding: '1.5rem', marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>HRV — 30 giorni</p>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '120px' }}>
              {[45,62,58,71,55,60,48,66,70,63,55,68,72,60,58,65,70,55,62,58,68,74,60,55,66,70,63,58,71,65].map((h, i) => (
                <div key={i} style={{ flex: 1, background: 'var(--credenze)', opacity: 0.7, height: `${(h / 74) * 100}%`, borderRadius: '1px 1px 0 0' }} />
              ))}
            </div>
          </div>

          {/* Tabella correlazioni fake */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '3px', overflow: 'hidden', marginBottom: '1.5rem' }}>
            {[
              { date: 'Mer 19', hrv: '+6', steps: '8.320', event: 'Palestra', cat: 'Sport' },
              { date: 'Mar 18', hrv: '−3', steps: '11.450', event: 'Review Q2', cat: 'Meeting' },
              { date: 'Lun 17', hrv: '+11', steps: '6.100', event: 'Pranzo', cat: 'Sociale' },
              { date: 'Dom 16', hrv: '+14', steps: '12.800', event: '', cat: '' },
            ].map(row => (
              <div key={row.date} style={{ display: 'flex', gap: '2rem', padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', width: '60px' }}>{row.date}</span>
                <span style={{ fontSize: '0.78rem', color: row.hrv.startsWith('+') ? 'var(--pattern)' : '#B87171', width: '50px' }}>{row.hrv} ms</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', width: '60px' }}>{row.steps}</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-primary)' }}>{row.event}</span>
                {row.cat && <span style={{ fontSize: '0.62rem', color: 'var(--gold)', border: '1px solid var(--gold)', borderRadius: '2px', padding: '0.1rem 0.35rem' }}>{row.cat}</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Overlay centrale */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: 'radial-gradient(ellipse at center, rgba(10,8,6,0.7) 0%, rgba(10,8,6,0.5) 100%)',
          padding: '2rem',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '1.25rem' }}>
            In arrivo
          </p>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '1.75rem', color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: '1.25rem', maxWidth: '520px' }}>
            Il corpo non mente.<br />La mente spesso sì.
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.8, maxWidth: '460px', marginBottom: '2rem' }}>
            SELF OS leggerà il tuo sistema nervoso autonomo in tempo reale —
            HRV, frequenza cardiaca, sonno, temperatura — e lo metterà in relazione
            con quello che hai fatto, chi hai visto, e cosa hai deciso.
            Non per giudicarti. Per mostrarti chi stai diventando, un giorno alla volta.
          </p>
          <div style={{
            display: 'inline-flex', gap: '0.4rem', alignItems: 'center',
            padding: '0.6rem 1.25rem',
            border: '1px solid var(--border)',
            borderRadius: '3px',
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
            fontFamily: 'Georgia, serif',
          }}>
            <span style={{ color: 'var(--gold)' }}>●</span>
            Disponibile presto
          </div>
        </div>
      </div>

    </div>
  );
}
