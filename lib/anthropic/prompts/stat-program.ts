// Programma del periodo per una stat (modulo STAT, piano §4 / F3).
//
// Vincolo di architettura, non stilistico: QUALE formula si applica lo decide
// il motore (lib/stats/engine.ts) prima di arrivare qui. Il modello riceve la
// formula già scelta con i suoi passi generici e li istanzia sui dati reali.
// Non sceglie la condizione, non aggiunge passi, non li riordina — la sequenza
// È la formula. Se il modello potesse scegliere, il modulo tornerebbe a essere
// un oroscopo con dei numeri accanto.

import type { Condition, Divergence } from '@/lib/stats/engine';
import type { Diagnosis, StatRole } from '@/lib/stats/family';

export type StatProgramChild = {
  label: string;
  role: StatRole;
  condition: Condition | null;
  inOrder: boolean | null;
  currentValue: number | null;
  /** Unità PROPRIA del figlio: un carico è in kg anche se il VFP è in %. */
  unit: string | null;
};

export type StatProgramInput = {
  label: string;
  unit: string | null;
  definition: string | null;
  /** 'down' = scendere è migliorare (peso, spese, massa grassa). */
  direction: 'up' | 'down';
  mode: 'grow' | 'maintain';
  target: number | null;
  periodLabel: string;
  /** Serie recente: etichetta di periodo + valore, dal più vecchio. */
  series: Array<{ period: string; value: number }>;

  condition: Condition;
  conditionLabel: string;
  previous: number;
  current: number;
  deltaText: string;

  trendLabel: string | null;
  trendText: string | null;
  divergence: Divergence;

  /** La formula scelta dal motore: nome + passi generici da istanziare. */
  formulaName: string;
  formulaSteps: readonly string[];

  /** Presenti solo se la stat è un VFP con figli. */
  diagnosis: Diagnosis | null;
  diagnosisTitle: string | null;
  children: StatProgramChild[];
  /**
   * Valorizzato quando il programma NON si scrive sul risultato ma sul livello
   * che il motore ha individuato come quello che cede: qui c'è il nome del
   * risultato a cui quel livello appartiene.
   */
  parentLabel: string | null;
};

// Indicazione d'uso — accompagna la KB nel blocco system (cachato, condiviso).
export const STAT_PROGRAM_INSTRUCTION = `Stai scrivendo il programma di un periodo per UNA statistica di una persona, con le condizioni e le formule qui sopra. La condizione e la formula da applicare sono GIÀ STATE DECISE da un motore statistico deterministico e ti vengono date: non discuterle, non sceglierne altre, non rimettere in discussione la lettura. Il tuo unico compito è istanziare i passi di QUELLA formula sui numeri reali di QUESTA persona, nella stessa sequenza e nello stesso numero: un passo istanziato per ogni passo generico, nell'ordine dato. La sequenza è la formula — riordinarla o aggiungerne uno la rompe. Cita i valori veri (il numero, l'unità, i periodi) invece di parafrasarli, e usa la definizione operativa che la persona si è data per quella stat. Registro: diagnosi strutturale, mai colpa; nessun tono motivazionale, nessuna congratulazione, nessun consiglio mascherato da domanda, nessuna promessa di risultato. Se i dati non bastano per essere specifico su un passo, dillo in quel passo invece di riempirlo di genericità. Due tipi di passo si degradano facilmente in riempitivo, e vanno resi operativi: quando un passo è CONDIZIONALE ("se peggiora, scopri perché"), ricava dai dati la soglia concreta che fa scattare la condizione — sotto quale valore, rispetto a quale fascia recente — invece di limitarti a dire che per ora non c'è niente da fare; quando un passo chiede di SCOPRIRE cosa ha funzionato, nomina i candidati concreti visibili nella serie o nella definizione operativa che la persona si è data, invece di ripetere l'istruzione di cercarli.`;

const ROLE_TEXT: Record<StatRole, string> = {
  quantity: 'quantità (l\'ha fatto?)',
  quality: 'metodo (come l\'ha fatto?)',
  support: 'condizione abilitante',
};

export const STAT_PROGRAM_PROMPT = (d: StatProgramInput): string => {
  const unit = d.unit ? ` ${d.unit}` : '';

  const serie = d.series
    .map(p => `  ${p.period}: ${p.value}${unit}`)
    .join('\n');

  const obiettivo = d.mode === 'maintain'
    ? `mantenere${d.target !== null ? ` il livello di ${d.target}${unit}` : ' il livello'}`
    : 'crescere nel tempo';

  const verso = d.direction === 'down'
    ? 'Su questa stat SCENDERE È MIGLIORARE (es. peso, spese, massa grassa): un valore più basso è un risultato migliore.'
    : 'Su questa stat salire è migliorare.';

  const divergenzaNota = d.divergence === 'confirm'
    ? 'Condizione del periodo e tendenza concordano: la lettura è solida.'
    : d.divergence === 'no_trend'
      ? 'ATTENZIONE: non c\'è ancora una tendenza (troppo pochi periodi). Il programma è provvisorio e va detto: si basa su due soli punti.'
      : 'Condizione e tendenza divergono.';

  const famiglia = d.diagnosis && d.children.length > 0
    ? `
=== LIVELLI DI PRODUZIONE (questa stat è un risultato, non un'attività) ===
Diagnosi del motore: ${d.diagnosisTitle ?? d.diagnosis}
${d.children.map(c => `  - ${c.label} [${ROLE_TEXT[c.role]}]: ${c.condition ?? 'non registrato'}${c.currentValue !== null ? ` — valore corrente ${c.currentValue}${c.unit ? ` ${c.unit}` : ''}` : ''}${c.inOrder === false ? ' ← è questo che cede' : ''}`).join('\n')}

Questa diagnosi è già stata calcolata: usala come contesto per rendere i passi
specifici (quale livello toccare e quale no), NON riscriverla e non contraddirla.
`
    : '';

  const gerarchia = d.parentLabel
    ? `
=== PERCHÉ SI LAVORA QUI ===
Il risultato che conta è "${d.parentLabel}", ma il motore ha individuato che è QUESTA
stat il livello che sta cedendo. Il programma si scrive quindi qui, non sul risultato:
agire sul risultato direttamente non è possibile, si agisce sul livello che lo produce.
`
    : '';

  return `Scrivi il programma del periodo per questa statistica.
${gerarchia}
=== LA STAT ===
Nome: ${d.label}
Cosa conta, secondo la definizione che si è dato: ${d.definition ?? '(non specificata)'}
Obiettivo: ${obiettivo}. ${verso}

=== I DATI VERI ===
Periodo corrente: ${d.periodLabel}
Serie recente:
${serie}

Condizione del periodo: ${d.conditionLabel} (${d.previous}${unit} → ${d.current}${unit}, ${d.deltaText})
Tendenza: ${d.trendLabel ?? 'non ancora leggibile'}${d.trendText ? ` — ${d.trendText}` : ''}
${divergenzaNota}
${famiglia}
=== LA FORMULA DA ISTANZIARE (decisa dal motore, non discuterla) ===
Formula: ${d.formulaName}
Passi generici, in sequenza vincolante:
${d.formulaSteps.map((s, i) => `  ${i + 1}. ${s}`).join('\n')}

Riscrivi ESATTAMENTE ${d.formulaSteps.length} passi, nello stesso ordine, ciascuno
istanziato sui numeri e sulla definizione di questa persona. Il passo 1 istanziato
corrisponde al passo 1 generico, e così via.

Due modi di rompere la formula, entrambi da evitare:
- cambiare il TEMA di un passo (se il generico parla di disciplina, il tuo parla di
  disciplina applicata al suo caso — non di un argomento adiacente);
- ammorbidire un passo che prescrive di NON agire trasformandolo in un suggerimento
  di ottimizzazione. "Non cambiare niente" istanziato resta "non cambiare niente",
  detto sui suoi dati. Non proporre miglioramenti dove la formula dice di fermarsi.

Rispondi SOLO con JSON valido:
{
  "lettura": "una frase che legge i numeri veri di questo periodo, senza interpretarli",
  "passi": [${d.formulaSteps.map((_, i) => `"passo ${i + 1} istanziato"`).join(', ')}],
  "nota": "un limite della lettura (pochi dati, stima retroattiva, tendenza assente) oppure null"
}`;
};
