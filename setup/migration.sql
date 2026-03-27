-- ============================================================
-- CONECTA 2026 — Schema completo para Supabase (PostgreSQL)
-- Migração inicial: criação de todas as tabelas, RLS e seeds
-- ============================================================

-- ============================================================
-- 1. PERFIS (vinculado ao auth.users do Supabase)
-- ============================================================
CREATE TABLE IF NOT EXISTS perfis (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome       TEXT,
  email      TEXT,
  papel      TEXT NOT NULL DEFAULT 'operador'
             CHECK (papel IN ('admin','coordenador','operador','visualizador')),
  regiao     TEXT,
  ativo      BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE perfis IS 'Perfis de usuários do sistema CONECTA, vinculados ao auth do Supabase';

-- ============================================================
-- 2. EVENTOS (agenda de campanha)
-- ============================================================
CREATE TABLE IF NOT EXISTS eventos (
  id         BIGSERIAL PRIMARY KEY,
  data       DATE,
  hora       TIME,
  titulo     TEXT NOT NULL,
  local      TEXT,
  tipo       TEXT CHECK (tipo IN ('visita','reuniao','evento','debate','caminhada','carreata')),
  obs        TEXT,
  criado_por UUID REFERENCES perfis(id),
  criado_em  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE eventos IS 'Eventos e compromissos da campanha';

-- ============================================================
-- 3. VEÍCULOS (frota)
-- ============================================================
CREATE TABLE IF NOT EXISTS veiculos (
  id            BIGSERIAL PRIMARY KEY,
  placa         TEXT,
  modelo        TEXT,
  cor           TEXT,
  responsavel   TEXT,
  telefone      TEXT,
  uso           TEXT,
  data_saida    DATE,
  hora_saida    TIME,
  km_saida      NUMERIC,
  km_chegada    NUMERIC,
  status        TEXT NOT NULL DEFAULT 'disponivel'
                CHECK (status IN ('disponivel','em-uso','manutencao')),
  criado_por    UUID REFERENCES perfis(id),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE veiculos IS 'Controle de frota e quilometragem';

-- ============================================================
-- 4. PESSOAS (equipe de campanha)
-- ============================================================
CREATE TABLE IF NOT EXISTS pessoas (
  id          BIGSERIAL PRIMARY KEY,
  nome        TEXT NOT NULL,
  telefone    TEXT,
  regiao      TEXT,
  atribuicoes TEXT,
  foto_url    TEXT,
  obs         TEXT,
  criado_por  UUID REFERENCES perfis(id),
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE pessoas IS 'Pessoas vinculadas à campanha e suas atribuições';

-- ============================================================
-- 5. LÍDERES (lideranças comunitárias e políticas)
-- ============================================================
CREATE TABLE IF NOT EXISTS lideres (
  id              BIGSERIAL PRIMARY KEY,
  nome            TEXT NOT NULL,
  telefone        TEXT,
  aniversario_dia INT,
  aniversario_mes TEXT,
  regiao          TEXT,
  endereco        TEXT,
  tipo            TEXT,
  areas           TEXT[],
  define          TEXT,
  chegou          TEXT,
  alcance         INT NOT NULL DEFAULT 0,
  obs             TEXT,
  lgpd            BOOLEAN NOT NULL DEFAULT FALSE,
  status          TEXT NOT NULL DEFAULT 'Ativo',
  criado_por      UUID REFERENCES perfis(id),
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE lideres IS 'Lideranças comunitárias com dados de alcance e áreas de atuação';

-- ============================================================
-- 6. APOIADORES (cadastro público — qualquer pessoa pode se registrar)
-- ============================================================
CREATE TABLE IF NOT EXISTS apoiadores (
  id                BIGSERIAL PRIMARY KEY,
  nome              TEXT NOT NULL,
  telefone          TEXT,
  telefone_numeros  TEXT,
  email             TEXT,
  cidade            TEXT,
  instagram         TEXT,
  lgpd_aceite       BOOLEAN NOT NULL DEFAULT FALSE,
  dispositivo       TEXT,
  criado_em         TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE apoiadores IS 'Cadastro público de apoiadores — aceita inserção anônima';

-- ============================================================
-- 7. DEMANDAS (solicitações e requerimentos)
-- ============================================================
CREATE TABLE IF NOT EXISTS demandas (
  id          BIGSERIAL PRIMARY KEY,
  titulo      TEXT NOT NULL,
  regiao      TEXT,
  categoria   TEXT,
  prioridade  TEXT CHECK (prioridade IN ('alta','media','baixa')),
  descricao   TEXT,
  solicitante TEXT,
  status      TEXT NOT NULL DEFAULT 'Aberta'
              CHECK (status IN ('Aberta','Em andamento','Resolvida')),
  criado_por  UUID REFERENCES perfis(id),
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE demandas IS 'Demandas e solicitações recebidas durante a campanha';

-- ============================================================
-- 8. PESQUISAS (dados de pesquisas eleitorais)
-- ============================================================
CREATE TABLE IF NOT EXISTS pesquisas (
  id          BIGSERIAL PRIMARY KEY,
  data        DATE,
  instituto   TEXT,
  celina      NUMERIC,
  segundo     TEXT,
  segundo_pct NUMERIC,
  amostra     INT,
  margem      NUMERIC,
  criado_por  UUID REFERENCES perfis(id),
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE pesquisas IS 'Resultados de pesquisas eleitorais para acompanhamento';

-- ============================================================
-- 9. JURÍDICO (prazos e obrigações legais)
-- ============================================================
CREATE TABLE IF NOT EXISTS juridico (
  id         BIGSERIAL PRIMARY KEY,
  data       DATE,
  titulo     TEXT NOT NULL,
  descricao  TEXT,
  tipo       TEXT,
  criado_por UUID REFERENCES perfis(id),
  criado_em  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE juridico IS 'Prazos e obrigações do calendário jurídico-eleitoral';

-- ============================================================
-- 10. MATERIAIS (estoque de campanha)
-- ============================================================
CREATE TABLE IF NOT EXISTS materiais (
  id            BIGSERIAL PRIMARY KEY,
  nome          TEXT NOT NULL,
  fase          TEXT CHECK (fase IN ('pre','campanha','ambas')),
  fornecedor    TEXT,
  quantidade    INT NOT NULL DEFAULT 0,
  estoque       INT NOT NULL DEFAULT 0,
  distribuido   INT NOT NULL DEFAULT 0,
  minimo        INT NOT NULL DEFAULT 0,
  obs           TEXT,
  criado_por    UUID REFERENCES perfis(id),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE materiais IS 'Controle de estoque de materiais de campanha';

-- ============================================================
-- 11. COMUNICAÇÃO (contadores — linha única)
-- ============================================================
CREATE TABLE IF NOT EXISTS comunicacao (
  id             BIGSERIAL PRIMARY KEY,
  whatsapp       INT NOT NULL DEFAULT 0,
  instagram      INT NOT NULL DEFAULT 0,
  videos         INT NOT NULL DEFAULT 0,
  midia          INT NOT NULL DEFAULT 0,
  jingles        INT NOT NULL DEFAULT 0,
  santinhos      INT NOT NULL DEFAULT 0,
  atualizado_por UUID REFERENCES perfis(id),
  atualizado_em  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE comunicacao IS 'Contadores de produção de comunicação (linha única)';

-- ============================================================
-- 12. VISITAS (mapa do DF — cidades/regiões administrativas)
-- ============================================================
CREATE TABLE IF NOT EXISTS visitas (
  id             BIGSERIAL PRIMARY KEY,
  cidade         TEXT UNIQUE NOT NULL,
  status         TEXT NOT NULL DEFAULT 'nao-visitada'
                 CHECK (status IN ('visitada','parcial','nao-visitada')),
  contagem       INT NOT NULL DEFAULT 0,
  data           DATE,
  obs            TEXT,
  atualizado_por UUID REFERENCES perfis(id),
  atualizado_em  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE visitas IS 'Status de visitação das regiões administrativas do DF';

-- ============================================================
-- 13. TAREFAS (vinculadas a pessoas)
-- ============================================================
CREATE TABLE IF NOT EXISTS tarefas (
  id         BIGSERIAL PRIMARY KEY,
  pessoa_id  BIGINT NOT NULL REFERENCES pessoas(id) ON DELETE CASCADE,
  titulo     TEXT NOT NULL,
  descricao  TEXT,
  prazo      DATE,
  concluida  BOOLEAN NOT NULL DEFAULT FALSE,
  criado_por UUID REFERENCES perfis(id),
  criado_em  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE tarefas IS 'Tarefas atribuídas a pessoas da equipe de campanha';

-- ============================================================
-- 14. ATIVIDADES (log de ações no sistema)
-- ============================================================
CREATE TABLE IF NOT EXISTS atividades (
  id         BIGSERIAL PRIMARY KEY,
  texto      TEXT NOT NULL,
  usuario_id UUID REFERENCES perfis(id),
  criado_em  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE atividades IS 'Log de atividades do sistema para auditoria';

-- ============================================================
-- 15. LOGÍSTICA — TAREFAS
-- ============================================================
CREATE TABLE IF NOT EXISTS logistica_tarefas (
  id          BIGSERIAL PRIMARY KEY,
  titulo      TEXT NOT NULL,
  fase        TEXT,
  prazo       DATE,
  prioridade  TEXT,
  responsavel TEXT,
  status      TEXT NOT NULL DEFAULT 'pendente',
  criado_por  UUID REFERENCES perfis(id),
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE logistica_tarefas IS 'Tarefas operacionais de logística da campanha';

-- ============================================================
-- 16. LOGÍSTICA — FORNECEDORES
-- ============================================================
CREATE TABLE IF NOT EXISTS logistica_fornecedores (
  id         BIGSERIAL PRIMARY KEY,
  empresa    TEXT NOT NULL,
  contato    TEXT,
  telefone   TEXT,
  servico    TEXT,
  prazo      DATE,
  status     TEXT NOT NULL DEFAULT 'Orçamento',
  criado_por UUID REFERENCES perfis(id),
  criado_em  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE logistica_fornecedores IS 'Fornecedores contratados ou em negociação';

-- ============================================================
-- 17. LOGÍSTICA — EQUIPES
-- ============================================================
CREATE TABLE IF NOT EXISTS logistica_equipes (
  id              BIGSERIAL PRIMARY KEY,
  nome            TEXT NOT NULL,
  chefe           TEXT,
  funcao          TEXT,
  telefone        TEXT,
  regiao          TEXT,
  materiais_desc  TEXT,
  criado_por      UUID REFERENCES perfis(id),
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE logistica_equipes IS 'Equipes de campo organizadas por região';

-- ============================================================
-- 18. LOGÍSTICA — MEMBROS DE EQUIPE
-- ============================================================
CREATE TABLE IF NOT EXISTS logistica_membros (
  id        BIGSERIAL PRIMARY KEY,
  equipe_id BIGINT NOT NULL REFERENCES logistica_equipes(id) ON DELETE CASCADE,
  nome      TEXT NOT NULL,
  telefone  TEXT,
  funcao    TEXT
);

COMMENT ON TABLE logistica_membros IS 'Membros individuais das equipes de logística';


-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE perfis                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE veiculos                ENABLE ROW LEVEL SECURITY;
ALTER TABLE pessoas                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE lideres                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE apoiadores              ENABLE ROW LEVEL SECURITY;
ALTER TABLE demandas                ENABLE ROW LEVEL SECURITY;
ALTER TABLE pesquisas               ENABLE ROW LEVEL SECURITY;
ALTER TABLE juridico                ENABLE ROW LEVEL SECURITY;
ALTER TABLE materiais               ENABLE ROW LEVEL SECURITY;
ALTER TABLE comunicacao             ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitas                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarefas                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE atividades              ENABLE ROW LEVEL SECURITY;
ALTER TABLE logistica_tarefas       ENABLE ROW LEVEL SECURITY;
ALTER TABLE logistica_fornecedores  ENABLE ROW LEVEL SECURITY;
ALTER TABLE logistica_equipes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE logistica_membros       ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- POLÍTICAS RLS — APOIADORES (caso especial: INSERT público)
-- ============================================================

-- Qualquer pessoa pode se cadastrar como apoiador (sem autenticação)
CREATE POLICY "apoiadores_insert_publico"
  ON apoiadores FOR INSERT
  TO anon, authenticated
  WITH CHECK (TRUE);

-- Apenas autenticados podem visualizar apoiadores
CREATE POLICY "apoiadores_select_autenticado"
  ON apoiadores FOR SELECT
  TO authenticated
  USING (TRUE);

-- Apenas admin/coordenador podem atualizar ou deletar apoiadores
CREATE POLICY "apoiadores_update_admin"
  ON apoiadores FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfis
      WHERE perfis.id = auth.uid()
        AND perfis.papel IN ('admin','coordenador')
    )
  );

CREATE POLICY "apoiadores_delete_admin"
  ON apoiadores FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfis
      WHERE perfis.id = auth.uid()
        AND perfis.papel IN ('admin','coordenador')
    )
  );


-- ============================================================
-- POLÍTICAS RLS — ATIVIDADES (INSERT para qualquer autenticado)
-- ============================================================

CREATE POLICY "atividades_select_autenticado"
  ON atividades FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "atividades_insert_autenticado"
  ON atividades FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

CREATE POLICY "atividades_update_admin"
  ON atividades FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfis
      WHERE perfis.id = auth.uid()
        AND perfis.papel IN ('admin','coordenador')
    )
  );

CREATE POLICY "atividades_delete_admin"
  ON atividades FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfis
      WHERE perfis.id = auth.uid()
        AND perfis.papel IN ('admin','coordenador')
    )
  );


-- ============================================================
-- POLÍTICAS RLS — TABELAS PADRÃO
-- Regra: SELECT para autenticados; INSERT/UPDATE/DELETE para admin/coordenador
-- ============================================================

-- Função auxiliar para verificar se o usuário é admin ou coordenador
CREATE OR REPLACE FUNCTION public.usuario_eh_gestor()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM perfis
    WHERE perfis.id = auth.uid()
      AND perfis.papel IN ('admin','coordenador')
  );
$$;

COMMENT ON FUNCTION public.usuario_eh_gestor IS 'Retorna true se o usuário logado é admin ou coordenador';

-- Macro para criar as 4 políticas padrão em cada tabela
-- (PostgreSQL não tem macros, então repetimos para cada tabela)

-- PERFIS
CREATE POLICY "perfis_select" ON perfis FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "perfis_insert" ON perfis FOR INSERT TO authenticated WITH CHECK (usuario_eh_gestor() OR id = auth.uid());
CREATE POLICY "perfis_update" ON perfis FOR UPDATE TO authenticated USING (usuario_eh_gestor() OR id = auth.uid());
CREATE POLICY "perfis_delete" ON perfis FOR DELETE TO authenticated USING (usuario_eh_gestor());

-- EVENTOS
CREATE POLICY "eventos_select" ON eventos FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "eventos_insert" ON eventos FOR INSERT TO authenticated WITH CHECK (usuario_eh_gestor());
CREATE POLICY "eventos_update" ON eventos FOR UPDATE TO authenticated USING (usuario_eh_gestor());
CREATE POLICY "eventos_delete" ON eventos FOR DELETE TO authenticated USING (usuario_eh_gestor());

-- VEÍCULOS
CREATE POLICY "veiculos_select" ON veiculos FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "veiculos_insert" ON veiculos FOR INSERT TO authenticated WITH CHECK (usuario_eh_gestor());
CREATE POLICY "veiculos_update" ON veiculos FOR UPDATE TO authenticated USING (usuario_eh_gestor());
CREATE POLICY "veiculos_delete" ON veiculos FOR DELETE TO authenticated USING (usuario_eh_gestor());

-- PESSOAS
CREATE POLICY "pessoas_select" ON pessoas FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "pessoas_insert" ON pessoas FOR INSERT TO authenticated WITH CHECK (usuario_eh_gestor());
CREATE POLICY "pessoas_update" ON pessoas FOR UPDATE TO authenticated USING (usuario_eh_gestor());
CREATE POLICY "pessoas_delete" ON pessoas FOR DELETE TO authenticated USING (usuario_eh_gestor());

-- LÍDERES
CREATE POLICY "lideres_select" ON lideres FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "lideres_insert" ON lideres FOR INSERT TO authenticated WITH CHECK (usuario_eh_gestor());
CREATE POLICY "lideres_update" ON lideres FOR UPDATE TO authenticated USING (usuario_eh_gestor());
CREATE POLICY "lideres_delete" ON lideres FOR DELETE TO authenticated USING (usuario_eh_gestor());

-- DEMANDAS
CREATE POLICY "demandas_select" ON demandas FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "demandas_insert" ON demandas FOR INSERT TO authenticated WITH CHECK (usuario_eh_gestor());
CREATE POLICY "demandas_update" ON demandas FOR UPDATE TO authenticated USING (usuario_eh_gestor());
CREATE POLICY "demandas_delete" ON demandas FOR DELETE TO authenticated USING (usuario_eh_gestor());

-- PESQUISAS
CREATE POLICY "pesquisas_select" ON pesquisas FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "pesquisas_insert" ON pesquisas FOR INSERT TO authenticated WITH CHECK (usuario_eh_gestor());
CREATE POLICY "pesquisas_update" ON pesquisas FOR UPDATE TO authenticated USING (usuario_eh_gestor());
CREATE POLICY "pesquisas_delete" ON pesquisas FOR DELETE TO authenticated USING (usuario_eh_gestor());

-- JURÍDICO
CREATE POLICY "juridico_select" ON juridico FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "juridico_insert" ON juridico FOR INSERT TO authenticated WITH CHECK (usuario_eh_gestor());
CREATE POLICY "juridico_update" ON juridico FOR UPDATE TO authenticated USING (usuario_eh_gestor());
CREATE POLICY "juridico_delete" ON juridico FOR DELETE TO authenticated USING (usuario_eh_gestor());

-- MATERIAIS
CREATE POLICY "materiais_select" ON materiais FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "materiais_insert" ON materiais FOR INSERT TO authenticated WITH CHECK (usuario_eh_gestor());
CREATE POLICY "materiais_update" ON materiais FOR UPDATE TO authenticated USING (usuario_eh_gestor());
CREATE POLICY "materiais_delete" ON materiais FOR DELETE TO authenticated USING (usuario_eh_gestor());

-- COMUNICAÇÃO
CREATE POLICY "comunicacao_select" ON comunicacao FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "comunicacao_insert" ON comunicacao FOR INSERT TO authenticated WITH CHECK (usuario_eh_gestor());
CREATE POLICY "comunicacao_update" ON comunicacao FOR UPDATE TO authenticated USING (usuario_eh_gestor());
CREATE POLICY "comunicacao_delete" ON comunicacao FOR DELETE TO authenticated USING (usuario_eh_gestor());

-- VISITAS
CREATE POLICY "visitas_select" ON visitas FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "visitas_insert" ON visitas FOR INSERT TO authenticated WITH CHECK (usuario_eh_gestor());
CREATE POLICY "visitas_update" ON visitas FOR UPDATE TO authenticated USING (usuario_eh_gestor());
CREATE POLICY "visitas_delete" ON visitas FOR DELETE TO authenticated USING (usuario_eh_gestor());

-- TAREFAS
CREATE POLICY "tarefas_select" ON tarefas FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "tarefas_insert" ON tarefas FOR INSERT TO authenticated WITH CHECK (usuario_eh_gestor());
CREATE POLICY "tarefas_update" ON tarefas FOR UPDATE TO authenticated USING (usuario_eh_gestor());
CREATE POLICY "tarefas_delete" ON tarefas FOR DELETE TO authenticated USING (usuario_eh_gestor());

-- LOGÍSTICA — TAREFAS
CREATE POLICY "log_tarefas_select" ON logistica_tarefas FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "log_tarefas_insert" ON logistica_tarefas FOR INSERT TO authenticated WITH CHECK (usuario_eh_gestor());
CREATE POLICY "log_tarefas_update" ON logistica_tarefas FOR UPDATE TO authenticated USING (usuario_eh_gestor());
CREATE POLICY "log_tarefas_delete" ON logistica_tarefas FOR DELETE TO authenticated USING (usuario_eh_gestor());

-- LOGÍSTICA — FORNECEDORES
CREATE POLICY "log_fornecedores_select" ON logistica_fornecedores FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "log_fornecedores_insert" ON logistica_fornecedores FOR INSERT TO authenticated WITH CHECK (usuario_eh_gestor());
CREATE POLICY "log_fornecedores_update" ON logistica_fornecedores FOR UPDATE TO authenticated USING (usuario_eh_gestor());
CREATE POLICY "log_fornecedores_delete" ON logistica_fornecedores FOR DELETE TO authenticated USING (usuario_eh_gestor());

-- LOGÍSTICA — EQUIPES
CREATE POLICY "log_equipes_select" ON logistica_equipes FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "log_equipes_insert" ON logistica_equipes FOR INSERT TO authenticated WITH CHECK (usuario_eh_gestor());
CREATE POLICY "log_equipes_update" ON logistica_equipes FOR UPDATE TO authenticated USING (usuario_eh_gestor());
CREATE POLICY "log_equipes_delete" ON logistica_equipes FOR DELETE TO authenticated USING (usuario_eh_gestor());

-- LOGÍSTICA — MEMBROS
CREATE POLICY "log_membros_select" ON logistica_membros FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "log_membros_insert" ON logistica_membros FOR INSERT TO authenticated WITH CHECK (usuario_eh_gestor());
CREATE POLICY "log_membros_update" ON logistica_membros FOR UPDATE TO authenticated USING (usuario_eh_gestor());
CREATE POLICY "log_membros_delete" ON logistica_membros FOR DELETE TO authenticated USING (usuario_eh_gestor());


-- ============================================================
-- TRIGGER: Auto-criar perfil quando um novo usuário se registra
-- ============================================================

CREATE OR REPLACE FUNCTION public.criar_perfil_ao_registrar()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.perfis (id, nome, email, papel)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'papel', 'operador')
  );
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.criar_perfil_ao_registrar IS 'Cria automaticamente um perfil quando um novo usuário se cadastra via auth';

-- Vincula o trigger ao auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.criar_perfil_ao_registrar();


-- ============================================================
-- SEED: Linha inicial da tabela comunicação
-- ============================================================

INSERT INTO comunicacao (whatsapp, instagram, videos, midia, jingles, santinhos)
VALUES (0, 0, 0, 0, 0, 0);


-- ============================================================
-- SEED: 37 Regiões Administrativas do DF na tabela visitas
-- ============================================================

INSERT INTO visitas (cidade) VALUES
  ('Plano Piloto'),
  ('Gama'),
  ('Taguatinga'),
  ('Brazlândia'),
  ('Sobradinho'),
  ('Planaltina'),
  ('Paranoá'),
  ('Núcleo Bandeirante'),
  ('Ceilândia'),
  ('Guará'),
  ('Cruzeiro'),
  ('Samambaia'),
  ('Santa Maria'),
  ('São Sebastião'),
  ('Recanto das Emas'),
  ('Lago Sul'),
  ('Riacho Fundo'),
  ('Lago Norte'),
  ('Candangolândia'),
  ('Águas Claras'),
  ('Riacho Fundo II'),
  ('Sudoeste/Octogonal'),
  ('Varjão'),
  ('Park Way'),
  ('SCIA/Estrutural'),
  ('Sobradinho II'),
  ('Jardim Botânico'),
  ('Itapoã'),
  ('SIA'),
  ('Vicente Pires'),
  ('Fercal'),
  ('Sol Nascente/Pôr do Sol'),
  ('Arniqueira'),
  ('Arapoanga'),
  ('Água Quente'),
  ('Lúcio Costa'),
  ('Mangueiral')
ON CONFLICT (cidade) DO NOTHING;


-- ============================================================
-- 19. COLUNA USERNAME EM PERFIS
-- ============================================================

ALTER TABLE perfis ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

COMMENT ON COLUMN perfis.username IS 'Username operacional para login (ex: silvio2026)';

-- Trigger atualizado para incluir username
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
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;


-- ============================================================
-- 20. CONFIGURACOES_APP (JSON singleton para Logistica e outros)
-- ============================================================

CREATE TABLE IF NOT EXISTS configuracoes_app (
  chave         TEXT PRIMARY KEY,
  payload       JSONB NOT NULL DEFAULT '{}'::jsonb,
  atualizado_por UUID REFERENCES perfis(id),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE configuracoes_app IS 'Armazena configuracoes e estados JSON singleton (logistica, organograma, etc)';

ALTER TABLE configuracoes_app ENABLE ROW LEVEL SECURITY;

-- SELECT para autenticados
CREATE POLICY "config_app_select" ON configuracoes_app
  FOR SELECT TO authenticated USING (TRUE);

-- INSERT para admin/coordenador
CREATE POLICY "config_app_insert" ON configuracoes_app
  FOR INSERT TO authenticated
  WITH CHECK (usuario_eh_gestor());

-- UPDATE para admin/coordenador
CREATE POLICY "config_app_update" ON configuracoes_app
  FOR UPDATE TO authenticated
  USING (usuario_eh_gestor());

-- DELETE para admin/coordenador
CREATE POLICY "config_app_delete" ON configuracoes_app
  FOR DELETE TO authenticated
  USING (usuario_eh_gestor());

-- Permitir leitura anonima da coluna username para resolver login
-- (necessario porque o login consulta perfis antes de autenticar)
CREATE POLICY "perfis_select_anon_username" ON perfis
  FOR SELECT TO anon
  USING (TRUE);


-- ============================================================
-- SEED: Usernames dos 3 usuarios iniciais
-- (executar APOS criar os usuarios no auth)
-- ============================================================

-- UPDATE perfis SET username = 'silvio2026' WHERE email = 'silvio2026@conecta.interno';
-- UPDATE perfis SET username = 'karla2026' WHERE email = 'karla2026@conecta.interno';
-- UPDATE perfis SET username = 'igor2026' WHERE email = 'igor2026@conecta.interno';
-- UPDATE perfis SET papel = 'admin' WHERE email = 'silvio2026@conecta.interno';
-- UPDATE perfis SET papel = 'coordenador' WHERE email = 'karla2026@conecta.interno';
-- UPDATE perfis SET papel = 'admin' WHERE email = 'igor2026@conecta.interno';


-- ============================================================
-- FIM DA MIGRAÇÃO
-- ============================================================
