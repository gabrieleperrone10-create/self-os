import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Scan } from '@/types';
import type { ScanReport } from '@/types/scan';
import ResultsClient from './results-client';

// Extract one numeric score per life area from scan answers
// Questions D1, D4, D7, D10, D13, D16, D19, D22 map to the 8 life areas
// They are SCALA questions (1–5) — normalize to 0–10 for radar chart
function extractRadarScores(answers: Record<string, unknown>): number[] {
  const keys = ['D1', 'D4', 'D7', 'D10', 'D13', 'D16', 'D19', 'D22'];
  return keys.map(k => {
    const raw = answers[k];
    const n = typeof raw === 'number' ? raw : typeof raw === 'string' ? parseFloat(raw) : NaN;
    if (isNaN(n)) return 5; // default mid
    // SCALA answers are 1–5; normalize to 1–10
    return Math.round(((n - 1) / 4) * 9 + 1);
  });
}

export default async function ScanResultsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: scan } = await supabase
    .from('scans')
    .select('*')
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false })
    .limit(1)
    .single<Scan>();

  if (!scan?.analysis) redirect('/scan');

  // Detect old scan format (pre-redesign: had shadow_pattern instead of archetype_primary)
  const analysisRaw = scan.analysis as unknown as Record<string, unknown>;
  if (!analysisRaw.archetype_primary) {
    // Delete the incompatible scan so the user can retake it
    await supabase.from('scans').delete().eq('id', scan.id);
    redirect('/scan');
  }

  const report = scan.analysis as unknown as ScanReport;
  const answers = (scan.answers ?? {}) as Record<string, unknown>;
  const radarScores = extractRadarScores(answers);

  return <ResultsClient report={report} radarScores={radarScores} />;
}
