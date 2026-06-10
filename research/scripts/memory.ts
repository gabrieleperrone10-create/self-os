import * as fs from 'fs'
import * as path from 'path'

const STATE_PATH = path.join(process.cwd(), 'research/vault/memory/state.json')
const VAULT_PATH = path.join(process.cwd(), 'research/vault')

export interface RunMetrics {
  total_users: number
  total_checkins: number
  avg_state_morning: number | null
  avg_state_evening: number | null
  active_patterns: number
  total_decisions: number
}

export interface AgentState {
  last_run: string | null
  last_metrics: RunMetrics | null
  approved_proposals: string[]  // date strings of approved proposal files
}

const EMPTY_STATE: AgentState = {
  last_run: null,
  last_metrics: null,
  approved_proposals: [],
}

export function loadState(): AgentState {
  if (!fs.existsSync(STATE_PATH)) return { ...EMPTY_STATE }
  try {
    return JSON.parse(fs.readFileSync(STATE_PATH, 'utf-8'))
  } catch {
    return { ...EMPTY_STATE }
  }
}

export function saveState(state: AgentState) {
  fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true })
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2))
}

export function computeMetrics(aggData: Record<string, unknown>): RunMetrics {
  const meta = aggData.meta as Record<string, unknown>
  const checkins = (aggData.checkins as Array<Record<string, unknown>>) ?? []

  const avg = (arr: number[]) =>
    arr.length > 0
      ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10
      : null

  const morningScores = checkins
    .filter(c => c.type === 'morning' && c.state_score != null)
    .map(c => c.state_score as number)

  const eveningScores = checkins
    .filter(c => c.type === 'evening' && c.state_score != null)
    .map(c => c.state_score as number)

  return {
    total_users: (meta.total_users as number) ?? 0,
    total_checkins: (meta.total_checkins as number) ?? 0,
    avg_state_morning: avg(morningScores),
    avg_state_evening: avg(eveningScores),
    active_patterns: (meta.total_patterns as number) ?? 0,
    total_decisions: (meta.total_decisions as number) ?? 0,
  }
}

// Scan proposal files and return dates of those marked approved or implemented
export function getApprovedProposals(): string[] {
  const dir = path.join(VAULT_PATH, 'proposals')
  if (!fs.existsSync(dir)) return []

  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .filter(f => {
      const content = fs.readFileSync(path.join(dir, f), 'utf-8')
      const fm = content.match(/^---\n([\s\S]*?)\n---/)
      if (!fm) return false
      return fm[1].includes('status: approved') || fm[1].includes('status: implemented')
    })
    .map(f => f.replace('.md', ''))
}

// Build a human-readable delta summary to inject into analysis prompts
export function buildDeltaContext(prev: AgentState, current: RunMetrics): string {
  if (!prev.last_run || !prev.last_metrics) {
    return 'Prima analisi — nessun confronto disponibile.'
  }

  const p = prev.last_metrics
  const lines: string[] = [`Ultima analisi: ${prev.last_run}`]

  const sign = (n: number) => n >= 0 ? `+${n}` : `${n}`

  const checkinDelta = current.total_checkins - p.total_checkins
  if (checkinDelta > 0) lines.push(`Nuovi check-in da ultima analisi: +${checkinDelta}`)

  if (p.avg_state_morning != null && current.avg_state_morning != null) {
    const d = Math.round((current.avg_state_morning - p.avg_state_morning) * 10) / 10
    lines.push(`Stato medio mattina: ${p.avg_state_morning} → ${current.avg_state_morning} (${sign(d)})`)
  }
  if (p.avg_state_evening != null && current.avg_state_evening != null) {
    const d = Math.round((current.avg_state_evening - p.avg_state_evening) * 10) / 10
    lines.push(`Stato medio sera: ${p.avg_state_evening} → ${current.avg_state_evening} (${sign(d)})`)
  }

  const patDelta = current.active_patterns - p.active_patterns
  if (patDelta !== 0) lines.push(`Pattern attivi: ${p.active_patterns} → ${current.active_patterns} (${sign(patDelta)})`)

  if (prev.approved_proposals.length > 0) {
    lines.push(`Proposte approvate/implementate da ultima analisi: ${prev.approved_proposals.join(', ')}`)
  }

  return lines.join('\n')
}
