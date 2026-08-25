-- SELF OS — Modulo STAT: famiglie (VFP + figli)
--
-- Nella tech di Hubbard ogni posto ha un VFP (Valuable Final Product) definito con
-- precisione, e la distinzione portante è "motion vs production": puoi essere pieno
-- di attività senza che il prodotto finale arrivi. Qui una stat può dichiarare un
-- genitore: il VFP è il risultato, i figli sono i livelli di produzione che lo
-- generano (l'hai fatto / come l'hai fatto / condizioni abilitanti).
--
-- Vedi lib/stats/family.ts e .agents/plan-stat-module.md §7.

-- 'month': un VFP di risultato si legge sul mese, non sulla settimana.
ALTER TABLE stat_definitions DROP CONSTRAINT IF EXISTS stat_definitions_period_check;
ALTER TABLE stat_definitions ADD CONSTRAINT stat_definitions_period_check
  CHECK (period IN ('day', 'week', 'month'));

ALTER TABLE stat_definitions
  -- Il VFP di questa stat. NULL = la stat è a sé (o è essa stessa un VFP).
  -- ON DELETE SET NULL: cancellare il VFP libera i figli, non li distrugge.
  ADD COLUMN parent_id UUID REFERENCES stat_definitions(id) ON DELETE SET NULL,

  -- Quale livello di produzione presidia questo figlio. Determina l'ordine della
  -- diagnosi: su lavoro non fatto (quantity) non ha senso valutare il metodo.
  ADD COLUMN role TEXT CHECK (role IN ('quantity', 'quality', 'support')),

  -- Come si sommano i valori del figlio quando si sale al periodo del VFP:
  -- gli allenamenti di un mese si sommano, il peso no (si prende l'ultimo),
  -- una percentuale di aderenza si media.
  ADD COLUMN aggregation TEXT NOT NULL DEFAULT 'sum'
    CHECK (aggregation IN ('sum', 'mean', 'last'));

-- Un figlio deve dichiarare il proprio ruolo; una stat senza genitore non lo ha.
ALTER TABLE stat_definitions ADD CONSTRAINT stat_definitions_role_requires_parent
  CHECK ((parent_id IS NULL AND role IS NULL) OR (parent_id IS NOT NULL AND role IS NOT NULL));

CREATE INDEX idx_stat_definitions_parent ON stat_definitions(parent_id) WHERE parent_id IS NOT NULL;
