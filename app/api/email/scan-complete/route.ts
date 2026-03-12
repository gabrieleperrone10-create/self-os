import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resend, FROM_EMAIL } from '@/lib/resend/client';
import type { ScanReport } from '@/types/scan';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    const [profileRes, scanRes] = await Promise.all([
      supabase.from('profiles').select('full_name').eq('id', user.id).single(),
      supabase.from('scans').select('analysis').eq('user_id', user.id)
        .order('completed_at', { ascending: false }).limit(1).single(),
    ]);

    const firstName = profileRes.data?.full_name?.split(' ')[0] ?? 'amico';
    const report = scanRes.data?.analysis as unknown as ScanReport | null;
    const archetype = report?.archetype_primary?.title ?? null;

    await resend.emails.send({
      from: FROM_EMAIL,
      to: user.email,
      subject: 'Il tuo profilo identitario è pronto',
      html: scanCompleteEmailHtml(firstName, archetype),
    });

    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error('[email/scan-complete]', err);
    return NextResponse.json({ sent: false });
  }
}

function scanCompleteEmailHtml(firstName: string, archetype: string | null): string {
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
      ${firstName}, il tuo profilo è pronto.
    </h1>
    ${archetype ? `
    <div style="background:#120F0A;border:1px solid #1E1812;border-top:2px solid #C9A96E;border-radius:3px;padding:1.25rem 1.5rem;margin-bottom:1.5rem;">
      <p style="font-size:0.65rem;letter-spacing:0.15em;text-transform:uppercase;color:#C9A96E;margin-bottom:0.4rem;">Archetipo Primario</p>
      <p style="font-size:1.1rem;color:#F5F0E8;margin:0;">${archetype}</p>
    </div>
    ` : ''}
    <p style="color:#A89880;font-size:0.95rem;line-height:1.8;margin-bottom:1.5rem;">
      Il tuo scan iniziale è completo. Dentro trovi il tuo profilo identitario in 6 blocchi:
      archetipi, loop comportamentali, credenze fondanti, ruota della vita, identità target e una lettera personale.
    </p>
    <p style="color:#A89880;font-size:0.95rem;line-height:1.8;margin-bottom:2.5rem;">
      Questo non è un'analisi da leggere una volta sola.
      È uno specchio — torna quando senti di aver cambiato qualcosa.
    </p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/scan/results"
       style="display:inline-block;padding:0.875rem 2rem;border:1px solid #C9A96E;border-radius:3px;color:#C9A96E;text-decoration:none;font-size:0.9rem;letter-spacing:0.05em;">
      Vedi il tuo profilo →
    </a>
    <hr style="border:none;border-top:1px solid #1E1812;margin:3rem 0;">
    <p style="color:#4A4035;font-size:0.75rem;line-height:1.6;">
      SELF OS — Sistema Operativo Identitario.
    </p>
  </div>
</body>
</html>
  `.trim();
}
