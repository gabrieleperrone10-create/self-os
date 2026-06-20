// Scan has its own full-screen layout — no sidebar, no chrome
export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getViewContext } from '@/lib/supabase/view-context';
import { ViewAsBar } from '@/components/shared/view-as-bar';
import { Playfair_Display, DM_Sans } from 'next/font/google';
import type { Profile } from '@/types';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

export default async function ScanLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const viewContext = await getViewContext(supabase);

  if (!viewContext) redirect('/login');

  const { realRole, isImpersonating, viewProfile } = viewContext;

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
    <>
      <ViewAsBar realRole={realRole} isImpersonating={isImpersonating} viewProfile={viewProfile} users={users} />
      <div
        className={`${playfair.variable} ${dmSans.variable}`}
        style={{
          minHeight: '100vh',
          backgroundColor: '#08070A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {children}
      </div>
    </>
  );
}
