import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'
import Anthropic from '@anthropic-ai/sdk'
import {
  compressAggregatePrompt,
  compressPersonalPrompt,
  aggregateAnalysisPrompt,
  personalAnalysisPrompt,
  rdProposalsStaticContext,
  rdProposalsDynamicInput,
} from './prompts'
import {
  loadState,
  saveState,
  computeMetrics,
  getApprovedProposals,
  buildDeltaContext,
} from './memory'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

// ── Model allocation ──────────────────────────────────────────────────────────
// Haiku:  compression — mechanical summarization, no reasoning needed
// Opus:   analysis    — deep psychological pattern recognition
// Sonnet: proposals   — structured output from pre-reasoned analysis (with caching)
const HAIKU  = 'claude-haiku-4-5-20251001'
const OPUS   = 'claude-opus-4-8'
const SONNET = 'claude-sonnet-4-6'

// Minimum users before running aggregate analysis (below this = statistical noise)
const AGGREGATE_THRESHOLD = 10

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const VAULT    = path.join(process.cwd(), 'research/vault')
const DATA_AGG = path.join(process.cwd(), 'research/data/aggregate')
const DATA_PER = path.join(process.cwd(), 'research/data/personal')

// ── Helpers ───────────────────────────────────────────────────────────────────

function latestFile(dir: string): string | null {
  if (!fs.existsSync(dir)) return null
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort().reverse()
  return files[0] ? path.join(dir, files[0]) : null
}

function readJson(filePath: string | null): Record<string, unknown> | null {
  if (!filePath || !fs.existsSync(filePath)) return null
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
}

function writeVault(relativePath: string, content: string) {
  const fullPath = path.join(VAULT, relativePath)
  fs.mkdirSync(path.dirname(fullPath), { recursive: true })
  fs.writeFileSync(fullPath, content, 'utf-8')
  console.log(`     → vault/${relativePath}`)
}

function frontmatter(fields: Record<string, string>): string {
  return `---\n${Object.entries(fields).map(([k, v]) => `${k}: ${v}`).join('\n')}\n---\n\n`
}

function elapsed(start: number): string {
  return `${((Date.now() - start) / 1000).toFixed(1)}s`
}

// ── API calls ─────────────────────────────────────────────────────────────────

async function compress(prompt: string, label: string): Promise<string> {
  const t = Date.now()
  process.stdout.write(`  [Haiku]  ${label}...`)
  const res = await client.messages.create({
    model: HAIKU,
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })
  console.log(` ${elapsed(t)}`)
  const block = res.content[0]
  return block.type === 'text' ? block.text : ''
}

async function analyze(prompt: string, label: string): Promise<string> {
  const t = Date.now()
  process.stdout.write(`  [Opus]   ${label}...`)
  const res = await client.messages.create({
    model: OPUS,
    max_tokens: 8192,
    messages: [{
      role: 'user',
      content: [{
        type: 'text' as const,
        text: prompt,
        cache_control: { type: 'ephemeral' as const },
      }],
    }],
  })
  const cached = (res.usage as unknown as Record<string, number>)?.cache_read_input_tokens ?? 0
  const note = cached > 0 ? ` [cached: ${cached}tok]` : ''
  console.log(` ${elapsed(t)}${note}`)
  const block = res.content[0]
  return block.type === 'text' ? block.text : ''
}

async function propose(staticCtx: string, dynamicInput: string, label: string): Promise<string> {
  const t = Date.now()
  process.stdout.write(`  [Sonnet] ${label}...`)
  const res = await client.messages.create({
    model: SONNET,
    max_tokens: 16000,
    messages: [{
      role: 'user',
      content: [
        // Static: role + current prompt sources — cached between runs
        { type: 'text' as const, text: staticCtx, cache_control: { type: 'ephemeral' as const } },
        // Dynamic: analysis outputs — always fresh
        { type: 'text' as const, text: dynamicInput },
      ],
    }],
  })
  const cached = (res.usage as unknown as Record<string, number>)?.cache_read_input_tokens ?? 0
  const note = cached > 0 ? ` [cached: ${cached}tok]` : ''
  console.log(` ${elapsed(t)}${note}`)
  const block = res.content[0]
  return block.type === 'text' ? block.text : ''
}

// ── Pipeline ──────────────────────────────────────────────────────────────────

async function main() {
  const today = new Date().toISOString().split('T')[0]
  console.log(`\n🔬 SELF OS Research Agent — ${today}`)
  console.log(`   Pipeline: Haiku 4.5 → Opus 4.8 → Sonnet 4.6\n`)

  // Load data
  const aggData = readJson(latestFile(DATA_AGG))
  const perData = readJson(latestFile(DATA_PER))

  if (!aggData) {
    console.error('❌ Nessun dato trovato. Esegui prima: npm run research:export')
    process.exit(1)
  }

  // Load previous state + compute current metrics
  const prevState = loadState()
  const currentMetrics = computeMetrics(aggData)
  const deltaContext = buildDeltaContext(prevState, currentMetrics)
  const approvedProposals = getApprovedProposals()

  const meta = aggData.meta as Record<string, unknown>
  const totalUsers = (meta.total_users as number) ?? 0
  const runAggregate = totalUsers >= AGGREGATE_THRESHOLD

  if (!runAggregate) {
    console.log(`  ℹ️  Analisi aggregata saltata (${totalUsers} utenti < soglia ${AGGREGATE_THRESHOLD})`)
    console.log(`     Verrà attivata automaticamente quando ci saranno ${AGGREGATE_THRESHOLD}+ utenti.\n`)
  }

  if (approvedProposals.length > 0) {
    console.log(`  ✓ Proposte approvate da integrare: ${approvedProposals.join(', ')}\n`)
  }

  const total = Date.now()

  // ── Step 1: Compress (Haiku, parallel) ──────────────────────────────────────
  console.log('  Step 1 — Compress (Haiku)')
  const [aggCompressed, perCompressed] = await Promise.all([
    runAggregate ? compress(compressAggregatePrompt(aggData), 'aggregate data') : Promise.resolve(''),
    perData ? compress(compressPersonalPrompt(perData), 'personal data') : Promise.resolve(''),
  ])

  // ── Step 2: Analyze (Opus, parallel) ────────────────────────────────────────
  console.log('\n  Step 2 — Analyze (Opus 4.8)')
  const [aggAnalysis, perAnalysis] = await Promise.all([
    runAggregate
      ? analyze(aggregateAnalysisPrompt(aggCompressed, deltaContext), 'aggregate patterns')
      : Promise.resolve(''),
    perCompressed
      ? analyze(personalAnalysisPrompt(perCompressed, deltaContext), 'personal journey')
      : Promise.resolve(''),
  ])

  // Write findings
  if (runAggregate && aggAnalysis) {
    writeVault(`findings/aggregate/${today}.md`,
      frontmatter({
        date: today, type: 'aggregate-finding',
        users: String(totalUsers),
        checkins: String(currentMetrics.total_checkins),
        model: OPUS,
      }) + aggAnalysis
    )
  }
  if (perData && perAnalysis) {
    writeVault(`findings/personal/${today}.md`,
      frontmatter({
        date: today, type: 'personal-finding',
        subject: 'Gabriele Perrone',
        checkins: String((perData.checkins as unknown[])?.length ?? 0),
        patterns: String((perData.patterns as unknown[])?.length ?? 0),
        model: OPUS,
      }) + perAnalysis
    )
  }

  // ── Step 3: Proposals (Sonnet, with caching) ─────────────────────────────────
  console.log('\n  Step 3 — Propose (Sonnet 4.6)')
  const currentPrompts: Record<string, string> = {}
  const promptsDir = path.join(process.cwd(), 'lib/anthropic/prompts')
  if (fs.existsSync(promptsDir)) {
    for (const file of fs.readdirSync(promptsDir)) {
      if (file.endsWith('.ts'))
        currentPrompts[file.replace('.ts', '')] =
          fs.readFileSync(path.join(promptsDir, file), 'utf-8')
    }
  }

  const proposals = await propose(
    rdProposalsStaticContext(currentPrompts),
    rdProposalsDynamicInput(aggAnalysis, perAnalysis, approvedProposals),
    'R&D proposals'
  )

  writeVault(`proposals/${today}.md`,
    frontmatter({
      date: today, type: 'rd-proposal',
      // Cambia in 'approved' in Obsidian sulle sezioni che vuoi implementare
      status: 'proposed',
      model: SONNET,
    }) + proposals
  )

  // ── Save state ───────────────────────────────────────────────────────────────
  saveState({
    last_run: today,
    last_metrics: currentMetrics,
    approved_proposals: approvedProposals,
  })

  // ── Dashboard ────────────────────────────────────────────────────────────────
  const ls = (sub: string) =>
    fs.existsSync(path.join(VAULT, sub))
      ? fs.readdirSync(path.join(VAULT, sub)).filter(f => f.endsWith('.md')).sort().reverse()
      : []

  const link = (sub: string, f: string) => `- [[${sub}/${f.replace('.md', '')}]]`

  const aggFindings = ls('findings/aggregate').slice(0, 5).map(f => link('findings/aggregate', f)).join('\n')
  const perFindings = ls('findings/personal').slice(0, 5).map(f => link('findings/personal', f)).join('\n')
  const propList    = ls('proposals').slice(0, 5).map(f => link('proposals', f)).join('\n')

  writeVault('📊 Dashboard.md', `# SELF OS — Research Vault

> Ultimo aggiornamento: ${today}

---

## Metriche Sistema

| Metrica | Valore |
|---------|--------|
| Utenti totali | ${currentMetrics.total_users} |
| Check-in totali | ${currentMetrics.total_checkins} |
| Stato medio mattina | ${currentMetrics.avg_state_morning ?? '—'} |
| Stato medio sera | ${currentMetrics.avg_state_evening ?? '—'} |
| Pattern attivi | ${currentMetrics.active_patterns} |
| Decisioni registrate | ${currentMetrics.total_decisions} |
| Analisi aggregata attiva | ${runAggregate ? 'Sì' : `No (soglia: ${AGGREGATE_THRESHOLD} utenti)`} |

---

## Findings Aggregati
${aggFindings || `_Aggregata non ancora attiva (serve ${AGGREGATE_THRESHOLD}+ utenti)._`}

## Findings Personali
${perFindings || '_Nessuna analisi ancora._'}

## Proposte R&D
${propList || '_Nessuna proposta ancora._'}

---

## Workflow (cosa fai tu, cosa fa il sistema)

**Automatico — \`npm run research\`:**
1. Export tutti i dati da Supabase → JSON locale
2. Haiku comprime i JSON in narrativa densa
3. Opus analizza i pattern (personale sempre, aggregato solo con 10+ utenti)
4. Sonnet produce proposte con diff ai prompt
5. Stato salvato per confronto al prossimo run

**Manuale — tu in Obsidian:**
1. Leggi findings: aggregate → personal
2. Leggi proposals: valuta ogni sezione
3. Sulle sezioni che approvi → cambia frontmatter \`status: proposed\` → \`status: approved\`
4. Di' a Claude Code: *"implementa le proposte approvate di oggi"*
5. Claude legge il file, applica i diff ai prompt in \`lib/anthropic/prompts/\`
6. Al run successivo, l'agente misura l'impatto

\`\`\`bash
npm run research          # tutto: export + analisi
npm run research:export   # solo export dati
npm run research:agent    # solo analisi (dati già presenti)
\`\`\`
`)

  console.log(`\n✅ Research completato in ${elapsed(total)}`)
  console.log(`   Apri research/vault/ in Obsidian.\n`)
}

main().catch(err => {
  console.error('❌ Agent fallito:', err)
  process.exit(1)
})
