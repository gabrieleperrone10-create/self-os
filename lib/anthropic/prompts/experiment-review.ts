import type { Experiment, ExperimentEntry } from '@/types';

const RESPONSE_LABELS: Record<string, string> = {
  acted_differently: 'ha agito diversamente',
  noticed_during:    'ci è caduto ma l\'ha visto in tempo reale',
  noticed_after:     'ci è caduto, l\'ha visto dopo',
  automatic:         'automatico — non l\'ha visto',
};

export const EXPERIMENT_REVIEW_PROMPT = (
  experiment: Experiment,
  entries: ExperimentEntry[],
): string => {
  const emerged = entries.filter(e => e.emerged);
  const actedDifferently = entries.filter(e => e.response === 'acted_differently');
  const noticedDuring = entries.filter(e => e.response === 'noticed_during');
  const automatic = entries.filter(e => e.response === 'automatic');
  const notEmerged = entries.filter(e => !e.emerged);

  const entriesText = entries
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(e => {
      const responseLabel = e.response ? RESPONSE_LABELS[e.response] : '—';
      const noteText = e.note ? ` | Nota: "${e.note}"` : '';
      return `[${e.date}] ${e.emerged ? `Emerso → ${responseLabel}` : 'Non emerso'}${noteText}`;
    })
    .join('\n');

  return `Sei il Lab di SELF OS — review dell'esperimento dopo ${experiment.duration_days} giorni.

Il tuo compito: leggere i dati con precisione clinica e dare una valutazione onesta.
Non motivazionale. Non generico. Solo specchio dei dati.

ESPERIMENTO:
Pattern: ${experiment.pattern_title}
Trigger: ${experiment.triggers.join(', ')}
Azione automatica: ${experiment.automatic_action}
Identità confermata: ${experiment.identity_confirmation}

Esperimento (azione diversa):
- Scarico: ${experiment.body_discharge_name} (${experiment.body_discharge_duration})
- Azione: ${experiment.different_action_when} → ${experiment.different_action}

DATI ${experiment.duration_days} GIORNI:
Giorni tracciati: ${entries.length}/${experiment.duration_days}
Pattern emerso: ${emerged.length} volte
- Agito diversamente: ${actedDifferently.length}
- Visto in tempo reale: ${noticedDuring.length}
- Visto dopo: ${entries.filter(e => e.response === 'noticed_after').length}
- Automatico (non visto): ${automatic.length}
- Non emerso: ${notEmerged.length}

DETTAGLIO GIORNALIERO:
${entriesText}

---

Scrivi una review in markdown, in italiano, seconda persona. Max 200 parole totali.

## Cosa mostrano i dati
Leggi i numeri senza interpretare troppo. Cosa è successo esattamente?

## Cosa significa
Una sola frase chirurgica su cosa rivelano questi dati sul pattern e sulla sua trasformazione.
Non dire cosa dovrebbe fare — solo cosa mostrano i dati.

## Raccomandazione
Scegli UNA opzione e motiva brevemente con i dati:
- **Estendi** (altri 7 giorni) — se c'è discontinuità iniziale (1-3 volte diverso) e il contesto è emerso abbastanza
- **Chiudi: discontinuità comportamentale** — se 4+ volte su ${emerged.length || experiment.duration_days} ha agito diversamente
- **Rivedi l'esperimento** — se il pattern è emerso ma l'azione diversa non era praticabile, o lo scarico non ha funzionato
- **Cambia contesto** — se il pattern non è emerso abbastanza per avere dati significativi (< 3 volte)
- **Bloccato** — se è emerso molte volte e sempre automatico: serve un approccio diverso`;
};
