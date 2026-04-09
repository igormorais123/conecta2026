-- ============================================================
-- CONECTA 2026 — Patch incremental para login por username
-- Executar apos a migration.sql principal
-- ============================================================

BEGIN;

-- 1. Garante coluna de username em perfis
ALTER TABLE public.perfis
ADD COLUMN IF NOT EXISTS username TEXT;

COMMENT ON COLUMN public.perfis.username IS 'Username operacional para login (ex: silvio2026)';

-- 2. Backfill dos usuarios internos ja existentes
UPDATE public.perfis
SET username = lower(split_part(email, '@', 1))
WHERE (username IS NULL OR btrim(username) = '')
  AND email IS NOT NULL
  AND lower(email) LIKE '%@conecta.interno';

-- 3. Unicidade case-insensitive
CREATE UNIQUE INDEX IF NOT EXISTS perfis_username_unique_idx
ON public.perfis (lower(username))
WHERE username IS NOT NULL;

-- 4. Trigger de criacao de perfil passa a preencher username automaticamente
CREATE OR REPLACE FUNCTION public.criar_perfil_ao_registrar()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.perfis (id, nome, email, papel, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'papel', 'operador'),
    COALESCE(
      NULLIF(lower(NEW.raw_user_meta_data->>'username'), ''),
      CASE
        WHEN NEW.email IS NOT NULL AND lower(NEW.email) LIKE '%@conecta.interno'
          THEN lower(split_part(NEW.email, '@', 1))
        ELSE NULL
      END
    )
  )
  ON CONFLICT (id) DO UPDATE
  SET nome = EXCLUDED.nome,
      email = EXCLUDED.email,
      papel = EXCLUDED.papel,
      username = COALESCE(public.perfis.username, EXCLUDED.username);

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.criar_perfil_ao_registrar IS
'Cria ou atualiza automaticamente o perfil vinculado ao auth.users, preenchendo username quando disponivel.';

-- 5. Remove politica aberta de leitura anonima, se ela existir
DROP POLICY IF EXISTS perfis_select_anon_username ON public.perfis;

-- 6. RPC segura para resolver username -> email antes do login
CREATE OR REPLACE FUNCTION public.resolver_email_por_username(p_username TEXT)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.email
  FROM public.perfis p
  WHERE p.ativo = TRUE
    AND p.username IS NOT NULL
    AND lower(p.username) = lower(btrim(p_username))
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.resolver_email_por_username IS
'Resolve o email interno correspondente ao username operacional, sem expor SELECT anonimo amplo em perfis.';

REVOKE ALL ON FUNCTION public.resolver_email_por_username(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolver_email_por_username(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.resolver_email_por_username(TEXT) TO authenticated;

COMMIT;
