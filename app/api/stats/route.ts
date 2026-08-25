import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { MAX_ACTIVE_STATS } from '@/lib/stats/catalog';
import type {
  StatAggregation,
  StatArea,
  StatDefinition,
  StatDirection,
  StatMode,
  StatPeriod,
  StatRole,
} from '@/types';

function slugify(label: string): string {
  return label
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // via accenti
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    const { data, error } = await supabase
      .from('stat_definitions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ definitions: (data ?? []) as StatDefinition[] });
  } catch (err) {
    console.error('[stats GET]', err);
    return NextResponse.json({ error: 'Errore' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    const { count } = await supabase
      .from('stat_definitions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('active', true);

    if ((count ?? 0) >= MAX_ACTIVE_STATS) {
      return NextResponse.json(
        { error: `Hai già ${MAX_ACTIVE_STATS} stat attive. Metti in pausa o elimina una stat prima di aggiungerne un'altra — poche stat tenute bene battono molte stat abbandonate.` },
        { status: 422 }
      );
    }

    const body = await request.json() as {
      label: string;
      area: StatArea;
      unit?: string | null;
      definition?: string | null;
      direction?: StatDirection;
      mode?: StatMode;
      period?: StatPeriod;
      target?: number | null;
      parentId?: string | null;
      role?: StatRole | null;
      aggregation?: StatAggregation;
    };

    const label = body.label?.trim();
    if (!label || label.length > 80) {
      return NextResponse.json({ error: 'Nome non valido' }, { status: 400 });
    }
    const AREAS: StatArea[] = ['corpo', 'dieta', 'lavoro', 'relazioni', 'mente', 'soldi'];
    if (!AREAS.includes(body.area)) {
      return NextResponse.json({ error: 'Area non valida' }, { status: 400 });
    }

    // Un figlio deve dichiarare il ruolo (lo impone anche il CHECK in 018, ma un 400
    // è più utile di un 500). Il genitore va verificato: senza questo controllo si
    // potrebbe agganciare una stat al VFP di un altro utente passandone l'id.
    const parentId = body.parentId ?? null;
    const role = parentId ? (body.role ?? null) : null;
    if (parentId) {
      if (!role) {
        return NextResponse.json({ error: 'Un figlio deve dichiarare il proprio ruolo' }, { status: 400 });
      }
      const { data: parent } = await supabase
        .from('stat_definitions')
        .select('id, parent_id')
        .eq('id', parentId)
        .eq('user_id', user.id)
        .maybeSingle<{ id: string; parent_id: string | null }>();
      if (!parent) {
        return NextResponse.json({ error: 'Risultato non trovato' }, { status: 400 });
      }
      // Un solo livello: un figlio non può a sua volta fare da VFP.
      if (parent.parent_id) {
        return NextResponse.json(
          { error: 'Una stat che è già figlia di un risultato non può farne da genitore' },
          { status: 422 },
        );
      }
    }

    const baseKey = slugify(label) || 'stat';
    let key = baseKey;
    for (let i = 2; i <= 50; i++) {
      const { data: existing } = await supabase
        .from('stat_definitions')
        .select('id')
        .eq('user_id', user.id)
        .eq('key', key)
        .maybeSingle();
      if (!existing) break;
      key = `${baseKey}-${i}`;
    }

    const { data: definition, error } = await supabase
      .from('stat_definitions')
      .insert({
        user_id: user.id,
        key,
        label,
        area: body.area,
        unit: body.unit?.trim() || null,
        definition: body.definition?.trim() || null,
        direction: body.direction ?? 'up',
        mode: body.mode ?? 'grow',
        period: body.period ?? 'week',
        target: body.target ?? null,
        parent_id: parentId,
        role,
        aggregation: body.aggregation ?? 'sum',
      })
      .select()
      .single<StatDefinition>();

    if (error) throw error;
    return NextResponse.json({ definition });
  } catch (err) {
    console.error('[stats POST]', err);
    return NextResponse.json({ error: 'Creazione fallita' }, { status: 500 });
  }
}
