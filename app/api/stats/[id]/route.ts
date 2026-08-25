import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { StatAggregation, StatDefinition, StatMode, StatPeriod, StatRole } from '@/types';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    const body = await request.json() as {
      label?: string;
      unit?: string | null;
      definition?: string | null;
      mode?: StatMode;
      period?: StatPeriod;
      target?: number | null;
      active?: boolean;
      parentId?: string | null;
      role?: StatRole | null;
      aggregation?: StatAggregation;
    };

    const updates: Record<string, unknown> = {};
    if (body.label !== undefined) {
      const label = body.label.trim();
      if (!label || label.length > 80) return NextResponse.json({ error: 'Nome non valido' }, { status: 400 });
      updates.label = label;
    }
    if (body.unit !== undefined) updates.unit = body.unit?.trim() || null;
    if (body.definition !== undefined) updates.definition = body.definition?.trim() || null;
    if (body.mode !== undefined) updates.mode = body.mode;
    if (body.period !== undefined) updates.period = body.period;
    if (body.target !== undefined) updates.target = body.target;
    if (body.active !== undefined) updates.active = body.active;
    if (body.aggregation !== undefined) updates.aggregation = body.aggregation;

    // Agganciare/staccare una stat esistente da un risultato. Serve per costruire una
    // famiglia con stat già in uso, senza doverle ricreare da zero.
    if (body.parentId !== undefined) {
      const parentId = body.parentId;
      if (parentId === null) {
        updates.parent_id = null;
        updates.role = null;
      } else {
        if (parentId === id) {
          return NextResponse.json({ error: 'Una stat non può essere figlia di se stessa' }, { status: 422 });
        }
        const role = body.role ?? null;
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
        if (parent.parent_id) {
          return NextResponse.json(
            { error: 'Una stat che è già figlia di un risultato non può farne da genitore' },
            { status: 422 },
          );
        }
        // Questa stat ha a sua volta dei figli? Diventerebbe un nipote: gerarchia a un livello.
        const { count } = await supabase
          .from('stat_definitions')
          .select('*', { count: 'exact', head: true })
          .eq('parent_id', id)
          .eq('user_id', user.id);
        if ((count ?? 0) > 0) {
          return NextResponse.json(
            { error: 'Questa stat ha già dei livelli di produzione sotto di sé: non può diventare figlia di un altro risultato' },
            { status: 422 },
          );
        }
        updates.parent_id = parentId;
        updates.role = role;
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nessuna modifica' }, { status: 400 });
    }

    const { data: definition, error } = await supabase
      .from('stat_definitions')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single<StatDefinition>();

    if (error) throw error;
    if (!definition) return NextResponse.json({ error: 'Non trovato' }, { status: 404 });
    return NextResponse.json({ definition });
  } catch (err) {
    console.error('[stats PATCH]', err);
    return NextResponse.json({ error: 'Aggiornamento fallito' }, { status: 500 });
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    const { error } = await supabase
      .from('stat_definitions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[stats DELETE]', err);
    return NextResponse.json({ error: 'Eliminazione fallita' }, { status: 500 });
  }
}
