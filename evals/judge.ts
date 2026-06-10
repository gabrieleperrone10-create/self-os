// LLM-judge: valuta l'output di un prompt SELF OS contro rubriche fisse
// + criteri specifici del caso. Restituisce punteggi 1-10 e verdetto.

import { anthropic, AI_MODEL } from '@/lib/anthropic/client';
import { parseAIJson } from '@/lib/anthropic/parsers';
import { z } from 'zod';

const judgeResultSchema = z.looseObject({
  scores: z.object({
    specificita: z.coerce.number(),     // usa le parole esatte dell'utente?
    chirurgicita: z.coerce.number(),    // nomina la dinamica precisa o gira intorno?
    aderenza_regole: z.coerce.number(), // niente consigli, formato giusto, registro giusto
    non_genericita: z.coerce.number(),  // varrebbe per chiunque o solo per QUESTA persona?
  }),
  criteri_falliti: z.array(z.string()),
  motivazione: z.string(),
});

export type JudgeResult = z.infer<typeof judgeResultSchema> & {
  avg: number;
  pass: boolean;
};

const PASS_THRESHOLD = 7;

export async function judge(
  promptName: string,
  caseInput: string,
  output: string,
  criteria: string[],
): Promise<JudgeResult> {
  const judgePrompt = `Sei il valutatore qualità dei prompt di SELF OS — un prodotto la cui intera
proposta di valore è la precisione psicologica delle risposte AI. Un output
generico, motivazionale o da oroscopo è un fallimento di prodotto.

Valuta questo output del prompt "${promptName}".

=== INPUT DEL CASO (dati utente sintetici) ===
${caseInput}

=== OUTPUT DA VALUTARE ===
${output}

=== CRITERI SPECIFICI DI QUESTO CASO ===
${criteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Assegna un punteggio 1-10 per ciascuna rubrica:
- specificita: usa le parole esatte dell'utente come specchio? (10 = cita testualmente i dettagli, 1 = parafrasi vaghe)
- chirurgicita: nomina la dinamica psicologica precisa? (10 = la nomina con esattezza, 1 = gira intorno)
- aderenza_regole: rispetta le regole del prompt (mai consigli, formato, lunghezza, registro)?
- non_genericita: questo output potrebbe valere per chiunque? (10 = solo per QUESTA persona, 1 = oroscopo)

Sii severo: 7 è un output buono, 9-10 è raro. Un consiglio mascherato da
domanda ("hai considerato di...?") è una violazione di aderenza_regole.

Rispondi SOLO con JSON valido:
{
  "scores": { "specificita": n, "chirurgicita": n, "aderenza_regole": n, "non_genericita": n },
  "criteri_falliti": ["criterio specifico non soddisfatto", ...],
  "motivazione": "2-3 frasi sul perché dei punteggi"
}`;

  const message = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: 800,
    messages: [{ role: 'user', content: judgePrompt }],
  });

  const text = message.content[0];
  if (text.type !== 'text') throw new Error('Risposta judge non valida');

  const result = parseAIJson(text.text, judgeResultSchema, `judge:${promptName}`);
  const s = result.scores;
  const avg = (s.specificita + s.chirurgicita + s.aderenza_regole + s.non_genericita) / 4;

  // I criteri_falliti restano visibili come warning nel report: il judge è
  // volutamente severissimo e ne trova quasi sempre — il verdetto binario
  // si basa sulla media, lo schema Zod resta invece un fail rigido.
  return { ...result, avg, pass: avg >= PASS_THRESHOLD };
}
