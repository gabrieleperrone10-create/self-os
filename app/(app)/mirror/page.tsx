import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { canAccess } from '@/lib/utils/features';
import { Paywall } from '@/components/shared/paywall';
import MirrorClient from './mirror-client';
import type { Profile } from '@/types';

export default async function MirrorPage({
  searchParams,
}: {
  searchParams: Promise<{ seed?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

  const [{ data: profile }, { count: openCount }, params] = await Promise.all([
    supabase.from('profiles').select('plan').eq('id', user.id).single<Profile>(),
    supabase
      .from('decisions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('outcome', null)
      .lt('created_at', thirtyDaysAgo),
    searchParams,
  ]);

  if (!canAccess('mirror', profile?.plan ?? 'free')) {
    return <Paywall feature="mirror" />;
  }

  return <MirrorClient seed={params.seed} openDecisionsCount={openCount ?? 0} />;
}
