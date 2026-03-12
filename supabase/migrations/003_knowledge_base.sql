-- SELF OS: Knowledge Base
-- Fondamenta psicologiche usate come contesto per i prompt AI

DROP TABLE IF EXISTS public.knowledge_base;

CREATE TABLE public.knowledge_base (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  category     TEXT        NOT NULL CHECK (category IN ('archetype', 'framework', 'process', 'wheel_of_life', 'glossary')),
  archetype_id TEXT,
  title        TEXT        NOT NULL,
  content      TEXT        NOT NULL,
  tags         TEXT[]      DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kb_read_all"
  ON public.knowledge_base FOR SELECT
  USING (true);
