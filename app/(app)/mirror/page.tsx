import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { canAccess } from '@/lib/utils/features';
import { Paywall } from '@/components/shared/paywall';
import MirrorClient from './mirror-client';
import type { Profile } from '@/types';

export default async function MirrorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single<Profile>();

  if (!canAccess('mirror', profile?.plan ?? 'free')) {
    return <Paywall feature="mirror" />;
  }

  return <MirrorClient />;
}
