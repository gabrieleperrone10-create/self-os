import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resend, FROM_EMAIL } from '@/lib/resend/client';
import type { UserPlan } from '@/types';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // This route can be called with a userId from the webhook (no user session)
    const body = await request.json() as { userId?: string; plan?: UserPlan; email?: string };
    const { userId, plan, email } = body;

    let targetEmail = email;
    let firstName = 'amico';

    if (userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', userId)
        .single();
      firstName = profile?.full_name?.split(' ')[0] ?? 'amico';
      targetEmail = profile?.email ?? email;
    }

    if (!targetEmail) return NextResponse.json({ error: 'Email mancante' }, { status: 400 });

    await resend.emails.send({
      from: FROM_EMAIL,
      to: targetEmail,
      subject: `Il tuo piano ${plan === 'coach' ? 'Coach' : 'Pro'} è attivo`,
      html: upgradeEmailHtml(firstName, plan ?? 'pro'),
    });

    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error('[email/upgrade-confirmed]', err);
    return NextResponse.json({ sent: false });
  }
}

function upgradeEmailHtml(firstName: string, plan: UserPlan): string {
  const isCoach = plan === 'coach';
  const features = isCoach
    ? ['Dashboard clienti completa', 'Note private per cliente', 'Clienti illimitati', 'Report settimanali', 'Tutto il piano Pro']
    : ['Mirror decisionale illimitato', 'Identity Map completa', 'Pattern recognition AI', 'Check-in illimitati', 'Esportazione dati'];

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="background:#0A0806;color:#F5F0E8;font-family:Georgia,serif;margin:0;padding:0;">
  <div style="max-width:560px;margin:0 auto;padding:3rem 2rem;">
    <p style="font-size:0.7rem;letter-spacing:0.2em;text-transform:uppercase;color:#C9A96E;margin-bottom:2rem;">
      SELF OS
    </p>
    <h1 style="font-size:1.75rem;font-weight:normal;color:#F5F0E8;margin-bottom:1.5rem;">
      ${firstName}, benvenuto nel piano ${isCoach ? 'Coach' : 'Pro'}.
    </h1>
    <p style="color:#A89880;font-size:0.95rem;line-height:1.8;margin-bottom:1.5rem;">
      Il tuo piano è attivo. Hai ora accesso a tutto:
    </p>
    <div style="background:#120F0A;border:1px solid #1E1812;border-radius:3px;padding:1.5rem;margin-bottom:2rem;">
      ${features.map(f => `
      <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.6rem;">
        <span style="color:#C9A96E;font-size:0.7rem;">✦</span>
        <span style="color:#A89880;font-size:0.9rem;">${f}</span>
      </div>`).join('')}
    </div>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
       style="display:inline-block;padding:0.875rem 2rem;border:1px solid #C9A96E;border-radius:3px;color:#C9A96E;text-decoration:none;font-size:0.9rem;letter-spacing:0.05em;">
      Vai alla dashboard →
    </a>
    <hr style="border:none;border-top:1px solid #1E1812;margin:3rem 0;">
    <p style="color:#4A4035;font-size:0.75rem;line-height:1.6;">
      SELF OS — gestisci il tuo piano nelle impostazioni in qualsiasi momento.
    </p>
  </div>
</body>
</html>
  `.trim();
}
