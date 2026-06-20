export type ParsedEvent = {
  external_id: string;
  title: string;
  start_at: string;
  end_at: string;
  location: string | null;
  description: string | null;
  attendees: string[];
  all_day: boolean;
};

// ICS line folding: CRLF + whitespace è continuazione della riga precedente
function unfold(raw: string): string[] {
  return raw
    .replace(/\r\n([ \t])/g, '$1')
    .replace(/\n([ \t])/g, '$1')
    .split(/\r\n|\r|\n/)
    .filter(Boolean);
}

// Normalizza timestamp ICS in ISO string.
// I timestamp con TZID (es. Europe/Rome) vengono trattati come UTC — delta di 1-2h
// accettabile per la correlazione evento↔biometrico.
function parseDate(val: string, params: string): string {
  const isAllDay = params.includes('VALUE=DATE') || val.length === 8;
  if (isAllDay) {
    return `${val.slice(0, 4)}-${val.slice(4, 6)}-${val.slice(6, 8)}T00:00:00Z`;
  }
  const y  = val.slice(0, 4);
  const mo = val.slice(4, 6);
  const d  = val.slice(6, 8);
  const h  = val.slice(9, 11);
  const mi = val.slice(11, 13);
  const s  = val.slice(13, 15);
  const z  = val.endsWith('Z') ? 'Z' : 'Z'; // forza UTC per PostgreSQL TIMESTAMPTZ
  return `${y}-${mo}-${d}T${h}:${mi}:${s}${z}`;
}

function unescape(val: string): string {
  return val
    .replace(/\\n/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

export async function fetchAndParseIcs(url: string): Promise<ParsedEvent[]> {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`ICS fetch fallito: ${res.status}`);
  const text = await res.text();

  const lines = unfold(text);
  const events: ParsedEvent[] = [];

  let inEvent = false;
  let uid = '', summary = '', dtstart = '', dtend = '';
  let location = '', description = '';
  let attendees: string[] = [];
  let allDay = false;

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      uid = summary = dtstart = dtend = location = description = '';
      attendees = [];
      allDay = false;
      continue;
    }
    if (line === 'END:VEVENT') {
      if (uid && summary && dtstart && dtend) {
        events.push({
          external_id: uid,
          title: summary,
          start_at: dtstart,
          end_at: dtend,
          location: location || null,
          description: description || null,
          attendees,
          all_day: allDay,
        });
      }
      inEvent = false;
      continue;
    }
    if (!inEvent) continue;

    const sep = line.indexOf(':');
    if (sep === -1) continue;

    const fullKey = line.slice(0, sep);
    const val     = line.slice(sep + 1);
    const sc      = fullKey.indexOf(';');
    const baseKey = sc === -1 ? fullKey : fullKey.slice(0, sc);
    const params  = sc === -1 ? '' : fullKey.slice(sc + 1);

    switch (baseKey.toUpperCase()) {
      case 'UID':         uid = unescape(val); break;
      case 'SUMMARY':     summary = unescape(val); break;
      case 'LOCATION':    location = unescape(val); break;
      case 'DESCRIPTION': description = unescape(val); break;
      case 'DTSTART':
        allDay  = params.includes('VALUE=DATE') || val.length === 8;
        dtstart = parseDate(val, params);
        break;
      case 'DTEND':
        dtend = parseDate(val, params);
        break;
      case 'ATTENDEE': {
        const m = val.match(/mailto:([^\s;,]+)/i);
        if (m) attendees.push(m[1]);
        break;
      }
    }
  }

  return events;
}
