import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const PERSONAL_EMAIL = 'gabrieleperrone10@gmail.com'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function main() {
  const today = new Date().toISOString().split('T')[0]
  console.log(`\n📦 SELF OS Research Export — ${today}\n`)

  const [
    { data: profiles, error: e1 },
    { data: scans, error: e2 },
    { data: checkins, error: e3 },
    { data: patterns, error: e4 },
    { data: decisions, error: e5 },
  ] = await Promise.all([
    supabase.from('profiles').select('*'),
    supabase.from('scans').select('*'),
    supabase.from('checkins').select('*').order('date', { ascending: true }),
    supabase.from('patterns').select('*'),
    supabase.from('decisions').select('*').order('created_at', { ascending: true }),
  ])

  const errors = [e1, e2, e3, e4, e5].filter(Boolean)
  if (errors.length > 0) {
    console.error('❌ Supabase errors:', errors)
    process.exit(1)
  }

  const personal = profiles?.find(p => p.email === PERSONAL_EMAIL)
  if (!personal) console.warn('⚠️  Personal user not found — personal export skipped')

  // Build anon map: personal = user_000, others = user_001, user_002...
  let counter = 1
  const anonMap: Record<string, string> = {}
  for (const p of profiles || []) {
    anonMap[p.id] = p.id === personal?.id
      ? 'user_000'
      : `user_${String(counter++).padStart(3, '0')}`
  }

  // ── AGGREGATE ─────────────────────────────────────────────────────────────
  const aggregate = {
    exported_at: today,
    meta: {
      total_users: profiles?.length ?? 0,
      total_scans: scans?.length ?? 0,
      total_checkins: checkins?.length ?? 0,
      total_patterns: patterns?.length ?? 0,
      total_decisions: decisions?.length ?? 0,
      note: 'user_000 = personal (Gabriele), all others fully anonymous',
    },
    users: profiles?.map(p => ({
      anon_id: anonMap[p.id],
      plan: p.plan,
      role: p.role,
      onboarding_completed: p.onboarding_completed,
      created_at: p.created_at,
    })),
    scans: scans?.map(s => ({
      anon_user: anonMap[s.user_id] ?? 'unknown',
      answers: s.answers,
      analysis: s.analysis,
      completed_at: s.completed_at,
    })),
    checkins: checkins?.map(c => ({
      anon_user: anonMap[c.user_id] ?? 'unknown',
      type: c.type,
      state_score: c.state_score,
      answers: c.answers,
      ai_insight: c.ai_insight,
      date: c.date,
    })),
    patterns: patterns?.map(p => ({
      anon_user: anonMap[p.user_id] ?? 'unknown',
      type: p.type,
      title: p.title,
      description: p.description,
      frequency: p.frequency,
      first_seen: p.first_seen,
      last_seen: p.last_seen,
      is_active: p.is_active,
    })),
    decisions: decisions?.map(d => ({
      anon_user: anonMap[d.user_id] ?? 'unknown',
      state_score: d.state_score,
      origin: d.origin,
      // keep ai_mirror text for quality analysis, drop description (too personal)
      ai_mirror_excerpt: d.ai_mirror?.slice(0, 200),
      has_outcome: !!d.outcome,
      created_at: d.created_at,
    })),
  }

  // ── PERSONAL ──────────────────────────────────────────────────────────────
  const personalData = personal ? {
    exported_at: today,
    profile: {
      plan: personal.plan,
      role: personal.role,
      onboarding_completed: personal.onboarding_completed,
      created_at: personal.created_at,
    },
    scans: scans
      ?.filter(s => s.user_id === personal.id)
      .map(s => ({ answers: s.answers, analysis: s.analysis, completed_at: s.completed_at })),
    checkins: checkins
      ?.filter(c => c.user_id === personal.id)
      .map(c => ({
        type: c.type,
        state_score: c.state_score,
        answers: c.answers,
        ai_insight: c.ai_insight,
        date: c.date,
      })),
    patterns: patterns
      ?.filter(p => p.user_id === personal.id)
      .map(p => ({
        type: p.type,
        title: p.title,
        description: p.description,
        frequency: p.frequency,
        first_seen: p.first_seen,
        last_seen: p.last_seen,
        is_active: p.is_active,
        metadata: p.metadata,
      })),
    decisions: decisions
      ?.filter(d => d.user_id === personal.id)
      .map(d => ({
        description: d.description,
        state_score: d.state_score,
        origin: d.origin,
        ai_mirror: d.ai_mirror,
        outcome: d.outcome,
        outcome_date: d.outcome_date,
        created_at: d.created_at,
      })),
  } : null

  // ── WRITE ─────────────────────────────────────────────────────────────────
  const aggDir = path.join(process.cwd(), 'research/data/aggregate')
  const perDir = path.join(process.cwd(), 'research/data/personal')
  fs.mkdirSync(aggDir, { recursive: true })
  fs.mkdirSync(perDir, { recursive: true })

  const aggPath = path.join(aggDir, `${today}.json`)
  fs.writeFileSync(aggPath, JSON.stringify(aggregate, null, 2))
  console.log(`✓ Aggregate → research/data/aggregate/${today}.json`)
  console.log(`  ${aggregate.meta.total_users} users | ${aggregate.meta.total_scans} scans | ${aggregate.meta.total_checkins} checkins | ${aggregate.meta.total_patterns} patterns | ${aggregate.meta.total_decisions} decisions`)

  if (personalData) {
    const perPath = path.join(perDir, `${today}.json`)
    fs.writeFileSync(perPath, JSON.stringify(personalData, null, 2))
    console.log(`✓ Personal  → research/data/personal/${today}.json`)
    console.log(`  ${personalData.checkins?.length ?? 0} checkins | ${personalData.patterns?.length ?? 0} patterns | ${personalData.decisions?.length ?? 0} decisions`)
  }

  console.log('\n✅ Export complete. Run `npm run research:agent` to analyze.\n')
}

main().catch(err => {
  console.error('❌ Export failed:', err)
  process.exit(1)
})
