// App pages are never statically prerendered — they require auth
export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getViewContext } from '@/lib/supabase/view-context';
import { Sidebar } from '@/components/shared/sidebar';
import { ViewAsBar } from '@/components/shared/view-as-bar';
import { ViewAsProvider } from '@/components/shared/view-as-context';
import type { Profile } from '@/types';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const viewContext = await getViewContext(supabase);

  if (!viewContext) redirect('/login');

  const { realRole, isImpersonating, viewUserId, viewProfile } = viewContext;

  let users: Pick<Profile, 'id' | 'full_name' | 'email'>[] = [];
  if (realRole === 'admin' && !isImpersonating) {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .order('created_at', { ascending: false })
      .limit(200);
    users = data ?? [];
  }

  return (
    <ViewAsProvider value={{ isImpersonating, viewUserId, viewProfile, realRole }}>
      <ViewAsBar realRole={realRole} isImpersonating={isImpersonating} viewProfile={viewProfile} users={users} />
      <div className="app-layout">
        <Sidebar />
        <main className="app-main">
          {children}
        </main>
      </div>
    </ViewAsProvider>
  );
}
