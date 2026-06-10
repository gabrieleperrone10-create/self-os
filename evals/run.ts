// Eval harness dei prompt SELF OS.
//
//   npm run evals             → tutti i prompt
//   npm run evals -- mirror   → solo un prompt (mirror | daily-insight | scan)
//
// Per ogni caso: costruisce il prompt con il VERO builder di produzione,
// chiama Claude, valida la struttura con i VERI schemi Zod di produzione,
// poi un LLM-judge valuta specificità/chirurgicità/aderenza/non-genericità.
// Report salvato in evals/results/<timestamp>.json (gitignorato).

import './env'; // PRIMA di tutto: il client Anthropic legge la chiave a import-time

import * as fs from 'fs';
import * as path from 'path';
import { anthropic, AI_MODEL } from '@/lib/anthropic/client';
import { MIRROR_PROMPT } from '@/lib/anthropic/prompts/mirror';
import { DAILY_INSIGHT_PROMPT } from '@/lib/anthropic/prompts/daily-insight';
import { SCAN_ANALYSIS_PROMPT } from '@/lib/anthropic/prompts/scan-analysis';
import { parseAIJson } from '@/lib/anthropic/parsers';
import { mirrorAnalysisSchema, scanReportSchema } from '@/lib/anthropic/schemas';
import { mirrorCases, dailyInsightCases, scanCases } from './cases';
import { judge, type JudgeResult } from './judge';

interface EvalResult {
  prompt: string;
  case: string;
  structuralValid: boolean | null; // null = output non-JSON (testo libero)
  judge: JudgeResult | null;
  output: string;
  error?: string;
}

async function generate(prompt: string, maxTokens: number): Promise<string> {
  const message = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  });
  const text = message.content[0];
  if (text.type !== 'text') throw new Error('Risposta non testuale');
  return text.text;
}

async function runMirror(): Promise<EvalResult[]> {
  const results: EvalResult[] = [];
  for (const c of mirrorCases) {
    process.stdout.write(`  mirror/${c.name} ... `);
    try {
      const output = await generate(MIRROR_PROMPT(c.answers, c.pastDecisions), 800);
      let structuralValid = true;
      try {
        parseAIJson(output, mirrorAnalysisSchema, 'eval-mirror');
      } catch {
        structuralValid = false;
      }
      // Il judge deve vedere TUTTO l'input (incluse le decisioni passate),
      // altrimenti scambia dettagli reali per allucinazioni
      const j = await judge('mirror', JSON.stringify({ risposte: c.answers, decisioni_passate: c.pastDecisions }, null, 2), output, c.criteria);
      results.push({ prompt: 'mirror', case: c.name, structuralValid, judge: j, output });
      console.log(`${j.pass && structuralValid ? 'PASS' : 'FAIL'} (avg ${j.avg.toFixed(1)}${structuralValid ? '' : ', SCHEMA INVALIDO'})`);
    } catch (err) {
      results.push({ prompt: 'mirror', case: c.name, structuralValid: null, judge: null, output: '', error: String(err) });
      console.log(`ERROR: ${err}`);
    }
  }
  return results;
}

async function runDailyInsight(): Promise<EvalResult[]> {
  const results: EvalResult[] = [];
  for (const c of dailyInsightCases) {
    process.stdout.write(`  daily-insight/${c.name} ... `);
    try {
      const output = await generate(DAILY_INSIGHT_PROMPT(c.checkin, c.recentCheckins), 512);
      const j = await judge(
        'daily-insight',
        JSON.stringify({ checkin: c.checkin.answers, stato: c.checkin.state_score, precedenti: c.recentCheckins.map(r => r.answers) }, null, 2),
        output,
        c.criteria,
      );
      results.push({ prompt: 'daily-insight', case: c.name, structuralValid: null, judge: j, output });
      console.log(`${j.pass ? 'PASS' : 'FAIL'} (avg ${j.avg.toFixed(1)})`);
    } catch (err) {
      results.push({ prompt: 'daily-insight', case: c.name, structuralValid: null, judge: null, output: '', error: String(err) });
      console.log(`ERROR: ${err}`);
    }
  }
  return results;
}

async function runScan(): Promise<EvalResult[]> {
  const results: EvalResult[] = [];
  for (const c of scanCases) {
    process.stdout.write(`  scan/${c.name} ... `);
    try {
      const output = await generate(SCAN_ANALYSIS_PROMPT(c.answers), 4096);
      let structuralValid = true;
      try {
        parseAIJson(output, scanReportSchema, 'eval-scan');
      } catch {
        structuralValid = false;
      }
      const j = await judge('scan-analysis', JSON.stringify(c.answers, null, 2), output, c.criteria);
      results.push({ prompt: 'scan-analysis', case: c.name, structuralValid, judge: j, output });
      console.log(`${j.pass && structuralValid ? 'PASS' : 'FAIL'} (avg ${j.avg.toFixed(1)}${structuralValid ? '' : ', SCHEMA INVALIDO'})`);
    } catch (err) {
      results.push({ prompt: 'scan-analysis', case: c.name, structuralValid: null, judge: null, output: '', error: String(err) });
      console.log(`ERROR: ${err}`);
    }
  }
  return results;
}

async function main() {
  const filter = process.argv[2]; // mirror | daily-insight | scan | undefined
  console.log(`\nSELF OS — Eval harness (modello: ${AI_MODEL})\n`);

  const all: EvalResult[] = [];
  if (!filter || filter === 'mirror') all.push(...await runMirror());
  if (!filter || filter === 'daily-insight') all.push(...await runDailyInsight());
  if (!filter || filter === 'scan') all.push(...await runScan());

  // Riepilogo
  const passed = all.filter(r => r.judge?.pass && r.structuralValid !== false).length;
  console.log(`\n${'='.repeat(60)}`);
  console.log(`RISULTATO: ${passed}/${all.length} casi superati`);
  for (const r of all.filter(r => !(r.judge?.pass && r.structuralValid !== false))) {
    console.log(`\nFAIL ${r.prompt}/${r.case}`);
    if (r.error) console.log(`  errore: ${r.error}`);
    if (r.structuralValid === false) console.log('  schema Zod: INVALIDO');
    if (r.judge) {
      console.log(`  punteggi: ${JSON.stringify(r.judge.scores)}`);
      for (const cf of r.judge.criteri_falliti) console.log(`  criterio fallito: ${cf}`);
      console.log(`  motivazione: ${r.judge.motivazione}`);
    }
  }

  // Report completo su file
  const resultsDir = path.join('evals', 'results');
  fs.mkdirSync(resultsDir, { recursive: true });
  const file = path.join(resultsDir, `${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(file, JSON.stringify({ model: AI_MODEL, date: new Date().toISOString(), results: all }, null, 2));
  console.log(`\nReport completo: ${file}\n`);

  process.exit(passed === all.length ? 0 : 1);
}

main();
