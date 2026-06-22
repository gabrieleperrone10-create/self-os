export type EventCategory =
  | 'meeting'
  | 'sport'
  | 'social'
  | 'salute'
  | 'viaggio'
  | 'studio'
  | 'personale';

export const CATEGORY_LABELS: Record<EventCategory, string> = {
  meeting: 'Meeting',
  sport:   'Sport',
  social:  'Sociale',
  salute:  'Salute',
  viaggio: 'Viaggio',
  studio:  'Studio',
  personale: 'Personale',
};

export const CATEGORY_COLORS: Record<EventCategory, string> = {
  meeting:   'var(--credenze)',
  sport:     'var(--pattern)',
  social:    'var(--gold)',
  salute:    '#9E8B7A',
  viaggio:   'var(--identita)',
  studio:    '#7A9E8B',
  personale: 'var(--text-muted)',
};

const PATTERNS: Array<{ cat: EventCategory; re: RegExp }> = [
  { cat: 'meeting',  re: /call|meeting|sync|riunione|incontro|team|standup|stand.up|1:1|one.on.one|interview|colloquio|review|retrospectiv|planning|briefing|allineamento|kickoff|kick.off/i },
  { cat: 'sport',    re: /gym|palestra|allenamento|workout|pilates|yoga|corsa|run|nuoto|swim|calcio|tennis|padel|basket|crossfit|bici|spinning|box|danza|dance/i },
  { cat: 'social',   re: /cena|pranzo|lunch|dinner|aperitivo|drinks|pizza|colazione|brunch|festa|party|compleanno|birthday|aperitif/i },
  { cat: 'salute',   re: /dentista|dottore|medico|doctor|visita|terapia|therapy|psicologo|fisioterapia|farmacia/i },
  { cat: 'viaggio',  re: /viaggio|volo|flight|treno|train|hotel|airbnb|transfer|partenza|arrivo/i },
  { cat: 'studio',   re: /corso|corso|lezione|lesson|lecture|studia|study|formazione|training|workshop|webinar/i },
];

export function categorizeEvent(title: string): EventCategory | null {
  for (const { cat, re } of PATTERNS) {
    if (re.test(title)) return cat;
  }
  return null;
}
