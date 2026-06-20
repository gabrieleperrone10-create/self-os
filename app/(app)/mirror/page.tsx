import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getViewContext } from '@/lib/supabase/view-context';
import { canAccess } from '@/lib/utils/features';
import { Paywall } from '@/components/shared/paywall';
import MirrorClient from './mirror-client';

export default async function MirrorPage({
  searchParams,
}: {
  searchParams: Promise<{ seed?: string }>;
}) {
  const supabase = await createClient();
  const viewContext = await getViewContext(supabase);
  if (!viewContext) redirect('/login');
  const { viewUserId, viewProfile } = viewContext;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

  const [{ count: openCount }, params] = await Promise.all([
    supabase
      .from('decisions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', viewUserId)
      .is('outcome', null)
      .lt('created_at', thirtyDaysAgo),
    searchParams,
  ]);

  if (!canAccess('mirror', viewProfile?.plan ?? 'free')) {
    return <Paywall feature="mirror" />;
  }

  return <MirrorClient seed={params.seed} openDecisionsCount={openCount ?? 0} />;
}
