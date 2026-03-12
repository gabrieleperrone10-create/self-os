export default function Loading() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '40vh',
    }}>
      <p style={{
        color: 'var(--text-muted)',
        fontSize: '0.75rem',
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
      }}>
        —
      </p>
    </div>
  );
}
