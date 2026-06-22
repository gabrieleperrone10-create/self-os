export type ConvergencePoint = {
  date: string;            // giorno del check-in serale (N)
  declaredState: number;   // stato dichiarato la sera (1-10)
  note: string | null;     // frammento da answers, se utile
  nightHrv: number | null;     // HRV della notte successiva (N→N+1)
  nightHrvDelta: number | null;// scostamento vs baseline
  nextHr: number | null;       // FC a riposo del giorno dopo
  nightSleep: number | null;   // ore dormite la notte successiva (N→N+1)
};

export type BiometricsInputData = {
  hrvBaseline: number | null;
  correlations: Array<{
    date: string;
    hrv: number | null;
    hrvDelta: number | null;
    hr: number | null;
    steps: number | null;
    sleep: number | null;  // ore dormite la notte D-1→D (entrando nel giorno D)
    events: string[];
  }>;
  convergence: ConvergencePoint[];
  allMetrics: string[];
  hasCalendar: boolean;
  hasSleep: boolean;
  dataDays: number;
};

// Indicazione d'uso del framework biometrico — accompagna la KB nel blocco system (cachato).
export const BIOMETRICS_INSIGHT_INSTRUCTION = `Stai leggendo i dati biometrici di un utente con il framework di lettura corpo/mente qui sopra. Applica i tre strati nell'ordine vincolante: prima la base fisiologica (cosa il segnale può dire), poi la correlazione (con il principio del ritardo e la disciplina dei confondenti), e SOLO se reggono lo strato identitario, sempre ancorato e con contro-evidenza. Rispetta il Contratto Epistemico Biometrico: trend e non singolo dato, baseline personale e non normativa, ipotesi e non verdetti, nessun claim clinico. La CONVERGENZA tra ciò che la persona ha dichiarato di vivere e come il corpo ha risposto la notte successiva è il segnale più forte che hai: quando dato corporeo e dato dichiarato puntano nella stessa direzione, il pattern diventa difficile da negare e va specchiato; quando divergono, è la divergenza stessa la notizia. Se i segnali del corpo convergono con distress, vale il Protocollo Safety.`;

export const BIOMETRICS_INSIGHT_PROMPT = (data: BiometricsInputData): string => {
  const { hrvBaseline, correlations, convergence, allMetrics, hasCalendar, hasSleep, dataDays } = data;

  const hasHrv = correlations.some(d => d.hrv !== null);

  const giorni = correlations
    .map(d => {
      const parts: string[] = [`${d.date}:`];
      if (d.hrv !== null) parts.push(`HRV ${d.hrv}ms (${d.hrvDelta !== null ? (d.hrvDelta >= 0 ? '+' : '') + d.hrvDelta + ' vs baseline' : 'no baseline'})`);
      if (d.hr !== null) parts.push(`FC riposo ${d.hr}bpm`);
      if (d.sleep !== null) parts.push(`sonno ${d.sleep}h`);
      if (d.steps !== null) parts.push(`${d.steps.toLocaleString('it-IT')} passi`);
      if (d.events.length > 0) parts.push(`eventi: ${d.events.slice(0, 4).join(', ')}`);
      return parts.join(' | ');
    })
    .join('\n');

  const convergenza = convergence.length > 0
    ? convergence
        .map(c => {
          const parts: string[] = [`Sera ${c.date}: stato dichiarato ${c.declaredState}/10`];
          if (c.note) parts.push(`("${c.note}")`);
          const corpo: string[] = [];
          if (c.nightHrv !== null) corpo.push(`HRV notte successiva ${c.nightHrv}ms${c.nightHrvDelta !== null ? ` (${c.nightHrvDelta >= 0 ? '+' : ''}${c.nightHrvDelta})` : ''}`);
          if (c.nextHr !== null) corpo.push(`FC riposo giorno dopo ${c.nextHr}bpm`);
          if (c.nightSleep !== null) corpo.push(`sonno ${c.nightSleep}h`);
          parts.push(`→ corpo: ${corpo.length > 0 ? corpo.join(', ') : 'nessun dato notturno'}`);
          return parts.join(' ');
        })
        .join('\n')
    : null;

  return `${!hasHrv ? `NOTA: I dati HRV non sono ancora disponibili (il bracciale non ha sincronizzato). Analizza solo i dati presenti (FC, passi) e segnala esplicitamente il limite — affidabilità "bassa".\n\n` : ''}DATI (${dataDays} giorni di storico):
Baseline HRV: ${hrvBaseline !== null ? `${hrvBaseline}ms (riferimento personale, non normativo)` : 'non disponibile'}
Metriche disponibili: ${allMetrics.join(', ')}
${hasCalendar ? '' : 'Calendario: non connesso — non inventare correlazioni con eventi\n'}${hasSleep ? 'Sonno: disponibile (ore dormite per notte). È il CONFONDENTE MAESTRO — guardalo SEMPRE prima di proporre una lettura identitaria di un calo HRV o di una FC elevata. Una notte corta deprime l\'HRV e alza la FC a riposo per ragioni puramente fisiologiche: es. "HRV sotto baseline ma solo 5h di sonno → la spiegazione fisiologica viene prima di quella identitaria". Solo se il corpo cede CON un sonno adeguato la lettura identitaria regge.\n' : 'Sonno: NON disponibile — è la variabile maestra e il confondente n.1. Non puoi escludere "ha dormito meno" come spiegazione di un calo di HRV. Dillo esplicitamente quando proponi una lettura.\n'}
SERIE GIORNALIERA (i passi sono carico comportamentale, non un esito del corpo; il sonno è la notte che precede il giorno):
${giorni}
${convergenza ? `\nCONVERGENZA STATO DICHIARATO ↔ CORPO (la sera dichiarata, accanto alla risposta del corpo nella notte successiva — il ritardo è già applicato):\n${convergenza}\n` : ''}
Ricorda il principio del ritardo: lo stato di oggi si riflette nel corpo delle 12-48h SUCCESSIVE. Prima di una lettura identitaria, escludi i confondenti ovvi, A PARTIRE DAL SONNO (sonno scarso, alcol, allenamento, malattia, attività insolita).

Genera un'analisi in JSON con ESATTAMENTE questi campi:
{
  "stato_nervoso": uno tra "recupero" | "attivo_stabile" | "stress_moderato" | "stress_elevato" | "segnale_assente",
  "etichetta": frase breve (4-6 parole) che descrive il bilancio osservato, es. "Sistema in recupero" o "Carico che si accumula",
  "lettura": 3-4 frasi in seconda persona sul TREND. Se c'è convergenza tra stato dichiarato e risposta del corpo, è la cosa più importante: nominala con i dati specifici (quale stato, quale risposta notturna) e offri la contro-evidenza fisiologica. Se manca il sonno, dillo. NON essere generico, NON inventare, NON affermare cause,
  "correlazioni": array di oggetti {evento, impatto} con le correlazioni più plausibili tra ciò che la persona ha vissuto/fatto e il corpo nelle 24-48h successive. Vuoto se i dati non bastano,
  "indicazione": 1-2 frasi concrete e di buon senso su cosa fare ADESSO, mai presentate come prescrizione medica,
  "affidabilita": "alta" se HRV + 14+ giorni + sonno, "media" se dati parziali, "bassa" se solo passi/FC, <7 giorni, o sonno assente
}

Restituisci SOLO il JSON, senza altro testo.`.trim();
};
