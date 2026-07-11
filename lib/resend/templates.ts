// Template email SELF OS — stesso linguaggio visivo dell'app:
// dark, Georgia, oro, niente entusiasmo da marketing.

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://self-os.space';

function shell(inner: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="background:#0A0806;color:#F5F0E8;font-family:Georgia,serif;margin:0;padding:0;">
  <div style="max-width:560px;margin:0 auto;padding:3rem 2rem;">
    <p style="font-size:0.7rem;letter-spacing:0.2em;text-transform:uppercase;color:#C9A96E;margin-bottom:2.5rem;">SELF OS</p>
    ${inner}
    <p style="color:#4A4035;font-size:0.75rem;line-height:1.7;margin-top:3rem;border-top:1px solid #1E1812;padding-top:1.5rem;">
      Ricevi questa email perché usi SELF OS. Puoi disattivare i promemoria nelle
      <a href="${APP_URL}/settings" style="color:#A89880;">impostazioni</a>.
    </p>
  </div>
</body>
</html>`;
}

const button = (href: string, label: string) => `
<a href="${href}" style="display:inline-block;border:1px solid #C9A96E;color:#C9A96E;text-decoration:none;padding:0.75rem 2rem;font-size:0.85rem;letter-spacing:0.05em;">${label}</a>`;

export function morningReminderHtml(firstName: string): string {
  return shell(`
    <h1 style="font-size:1.4rem;font-weight:normal;color:#F5F0E8;margin-bottom:1.5rem;">${firstName}, da quale versione di te vuoi operare oggi?</h1>
    <p style="color:#A89880;font-size:0.95rem;line-height:1.85;margin-bottom:2rem;">
      Due minuti, tre domande. Non per produttività — per vedere la tua identità in azione prima che la giornata decida al posto tuo.
    </p>
    ${button(`${APP_URL}/checkin`, 'Check-in del mattino →')}`);
}

export function eveningReminderHtml(firstName: string, openDecisions: number): string {
  const nudge = openDecisions > 0
    ? `<p style="color:#A89880;font-size:0.9rem;line-height:1.8;margin-top:1.5rem;border-left:2px solid #4A4035;padding-left:1rem;">
        Hai ${openDecisions === 1 ? 'una decisione aperta' : `${openDecisions} decisioni aperte`} nel Mirror senza esito registrato.
        L'esito è il dato che trasforma le intenzioni in evidenza. <a href="${APP_URL}/mirror" style="color:#C9A96E;">Registralo →</a>
      </p>`
    : '';
  return shell(`
    <h1 style="font-size:1.4rem;font-weight:normal;color:#F5F0E8;margin-bottom:1.5rem;">${firstName}, quale pattern hai riconosciuto oggi?</h1>
    <p style="color:#A89880;font-size:0.95rem;line-height:1.85;margin-bottom:2rem;">
      La giornata è un dato. Due minuti per registrarlo prima che la memoria lo riscriva.
    </p>
    ${button(`${APP_URL}/checkin`, 'Check-in della sera →')}
    ${nudge}`);
}

export function weeklyReportEmailHtml(firstName: string, reportText: string, weekStart: string, weekEnd: string): string {
  return shell(`
    <p style="font-size:0.7rem;letter-spacing:0.15em;text-transform:uppercase;color:#A89880;margin-bottom:0.75rem;">Report settimanale — ${weekStart} → ${weekEnd}</p>
    <h1 style="font-size:1.4rem;font-weight:normal;color:#F5F0E8;margin-bottom:1.5rem;">${firstName}, questa settimana il sistema ha visto questo:</h1>
    <div style="color:#D8CFC0;font-size:0.95rem;line-height:1.9;margin-bottom:2rem;white-space:pre-line;border-left:2px solid #C9A96E;padding-left:1.25rem;">${reportText}</div>
    ${button(`${APP_URL}/identity-map`, 'Vedi la mappa completa →')}`);
}

export function monthlyLetterEmailHtml(firstName: string, letterText: string, monthName: string): string {
  return shell(`
    <p style="font-size:0.7rem;letter-spacing:0.15em;text-transform:uppercase;color:#A89880;margin-bottom:0.75rem;">La lettera di ${monthName}</p>
    <div style="color:#D8CFC0;font-size:1rem;line-height:2;margin-bottom:2rem;white-space:pre-line;">${letterText}</div>
    ${button(`${APP_URL}/letters`, 'Tutte le tue lettere →')}`);
}
