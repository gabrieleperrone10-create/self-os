import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resend, FROM_EMAIL } from '@/lib/resend/client';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const firstName = profile?.full_name?.split(' ')[0] ?? 'amico';

    await resend.emails.send({
      from: FROM_EMAIL,
      to: user.email,
      subject: 'Il tuo percorso identitario è iniziato',
      html: welcomeEmailHtml(firstName),
    });

    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error('[email/welcome]', err);
    // Non-blocking — email failure doesn't break the flow
    return NextResponse.json({ sent: false });
  }
}

function welcomeEmailHtml(firstName: string): string {
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
      Benvenuto, ${firstName}
    </h1>
    <p style="color:#A89880;font-size:0.95rem;line-height:1.8;margin-bottom:1.5rem;">
      Hai appena fatto il primo passo verso la comprensione profonda di chi sei.
    </p>
    <p style="color:#A89880;font-size:0.95rem;line-height:1.8;margin-bottom:1.5rem;">
      SELF OS non ti dirà cosa fare. Ti mostrerà chi stai essendo mentre lo fai.
      La differenza sembra sottile — non lo è.
    </p>
    <p style="color:#A89880;font-size:0.95rem;line-height:1.8;margin-bottom:2.5rem;">
      Completa il tuo <strong style="color:#F5F0E8;">Scan iniziale</strong> per ricevere il tuo
      profilo identitario. 8 domande. Nessun giudizio.
    </p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/scan"
       style="display:inline-block;padding:0.875rem 2rem;border:1px solid #C9A96E;border-radius:3px;color:#C9A96E;text-decoration:none;font-size:0.9rem;letter-spacing:0.05em;">
      Inizia lo Scan →
    </a>
    <hr style="border:none;border-top:1px solid #1E1812;margin:3rem 0;">
    <p style="color:#4A4035;font-size:0.75rem;line-height:1.6;">
      SELF OS — Sistema Operativo Identitario.<br>
      Puoi cancellarti in qualsiasi momento dalle impostazioni.
    </p>
  </div>
</body>
</html>
  `.trim();
}
