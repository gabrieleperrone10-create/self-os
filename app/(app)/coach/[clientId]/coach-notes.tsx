'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function CoachNotes({
  relationId,
  initialNotes,
}: {
  relationId: string;
  initialNotes: string;
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  async function save() {
    setSaving(true);
    await supabase
      .from('coach_clients')
      .update({ notes })
      .eq('id', relationId);
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '3px', padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <p style={{ fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          Note private
        </p>
        {saved && (
          <span style={{ fontSize: '0.7rem', color: 'var(--pattern)' }}>Salvato ✓</span>
        )}
      </div>
      <textarea
        value={notes}
        onChange={e => { setNotes(e.target.value); setSaved(false); }}
        rows={5}
        placeholder="Note visibili solo a te. Il cliente non le vede."
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          borderBottom: '1px solid var(--border)',
          color: 'var(--text-primary)',
          fontFamily: 'Georgia, serif',
          fontSize: '0.875rem',
          lineHeight: 1.7,
          padding: '0.5rem 0',
          resize: 'none',
          outline: 'none',
          caretColor: 'var(--gold)',
        }}
        onFocus={e => (e.currentTarget.style.borderBottomColor = 'var(--gold)')}
        onBlur={e => (e.currentTarget.style.borderBottomColor = 'var(--border)')}
      />
      {notes !== initialNotes && (
        <div style={{ textAlign: 'right', marginTop: '0.75rem' }}>
          <button
            onClick={save}
            disabled={saving}
            style={{
              padding: '0.4rem 0.875rem',
              background: 'transparent',
              border: '1px solid var(--gold)',
              borderRadius: '3px',
              color: 'var(--gold)',
              fontFamily: 'Georgia, serif',
              fontSize: '0.75rem',
              cursor: 'pointer',
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? 'Salvataggio...' : 'Salva note'}
          </button>
        </div>
      )}
    </div>
  );
}
