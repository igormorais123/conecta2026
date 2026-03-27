# CONECTA 2026 — Status de Implementacao

> Atualizado: 2026-03-27
> Plano de referencia: PLANO_CONECTA_v4.md
> Projeto: Sistema de campanha Celina Leao — migracao para producao online

---

## CONTEXTO

Sistema web de gestao de campanha politica (CONECTA Celina Leao 2026).
Stack: HTML5 + CSS3 + JavaScript puro — sem frameworks, sem bundlers.
Cada .html e standalone (CSS e JS inline).
Backend: Supabase (banco + auth + storage + realtime).
Deploy alvo: inteia.com.br/conecta2026/ via Vercel.

### Repositorios

| Repo | Local | GitHub | Funcao |
|------|-------|--------|--------|
| Conecta-2026 (original Silvio) | `C:\Users\IgorPC\.claude\projects\Conecta 2026` | silviomvieira-hub/Conecta-2026 | Repo principal |
| Conecta-2026 (fork Igor) | mesmo diretorio, remote `fork` | igormorais123/Conecta-2026 | Fork com integracoes |
| pesquisa-eleitoral-df | `C:\Agentes` | igormorais123/pesquisa-eleitoral-df | Vercel deploy (inteia.com.br) |

---

## ESTADO ATUAL (27/03/2026)

### Fases implementadas (Plano v4)

| Fase | Descricao | Status |
|------|-----------|--------|
| 0 | Fundacao tecnica (config, rotas, contratos) | CONCLUIDA |
| 1 | Login por username + conta.html + index.html | CONCLUIDA |
| 2 | Sincronizacao do CONECTA.html | CONCLUIDA |
| 3 | Sincronizacao da Logistica | CONCLUIDA |
| 4 | Paginas secundarias e formulario publico | CONCLUIDA |
| 5 | Banco, seguranca e setup operacional | CONCLUIDA |
| 6 | Migracao de dados locais e homologacao | PARCIAL — export/import de backup local implementado; falta carga final no Supabase e homologacao multiusuario |
| 7 | PWA, refinamento visual e branding | PARCIAL — PWA minima entregue (manifest, service worker, icones, favicon, metatags); refinamento visual segue pendente |
| 8 | Deploy, checklist e go-live | PARCIAL — checklist e `vercel.json` prontos; go-live final depende de smoke no ambiente publicado |

### Arquivos do projeto

| Arquivo | Funcao | Auth guard | Sync |
|---------|--------|-----------|------|
| `index.html` | Redirect para login.html | Nao (publico) | Nao |
| `login.html` | Login por username (sem magic link) | Nao (publico) | Nao |
| `conta.html` | Troca de senha e logout | Sim | Nao |
| `CONECTA.html` | Aplicacao principal (dashboard, agenda, equipe, etc) | Sim | Sim (ConectaDB) |
| `Logistica Campanha.html` | Logistica (tarefas, materiais, equipe, checklist, salas) | Sim | Sim (ConectaDB) |
| `cadastro-apoiador.html` | Formulario publico de apoiadores | Nao (publico) | Insert anonimo + fila offline |
| `qrcode-cartao.html` | Gerador de QR code para cartao de visita | Sim | Nao |
| `Coordenadores Regionais.html` | Grid de coordenadores regionais | Sim | Nao |
| `Cadastro - lideres 2026.htm` | Cadastro de lideres (Valdelino Barcelos — fora do escopo) | Nao | Nao |

### Scripts compartilhados

| Arquivo | Funcao |
|---------|--------|
| `js/supabase-config.js` | Fonte unica de config: URL, chave, base path, CONECTA_AUTH_GUARD, CONECTA_READY |
| `js/conecta-db.js` | Sync layer: cache + localStorage + Supabase (bulk upsert, fila offline, singletons, realtime seletivo) |

### Setup e banco

| Arquivo | Funcao |
|---------|--------|
| `setup/migration.sql` | Schema completo: 20 tabelas + RLS + triggers + seeds + configuracoes_app + coluna username |
| `setup/migration_username_login.sql` | Patch: RPC resolver_email_por_username para login seguro |
| `setup/SETUP.md` | Guia completo de provisionamento (3 usuarios, usernames, smoke test) |
| `vercel.json` | Rewrites para /conecta2026/ |

---

## DADOS REAIS NO SISTEMA

Dados hardcoded no codigo (nao dependem de localStorage nem Supabase):

| Dado | Quantidade | Localizacao |
|------|-----------|-------------|
| Contatos por cidade | 341 pessoas em 33 cidades | `CONTATOS_CAMPANHA` no CONECTA.html |
| Coordenadores gerais (organograma) | 12 pessoas | Organograma no CONECTA.html |
| Coordenadores regionais | 6 pessoas | Coordenadores Regionais.html |
| Eventos do sabado 14/03/2026 | 15 eventos | Auto-popular no CONECTA.html |
| Calendario eleitoral | 15 datas | `CALENDARIO_ELEITORAL` no CONECTA.html |
| Cidades do DF | 34 cidades | `cidadesDF` no CONECTA.html |
| Regioes administrativas | 37 regioes | Seed no migration.sql |
| Eleitorado por regiao | 33 regioes com dados TRE-DF | Tabela no Logistica Campanha.html |
| Checklist do coordenador | 39 itens (pre-campanha + campanha) | `CHECKLIST_ITEMS` no Logistica Campanha.html |
| Salas do comite | 5 salas (Auditorio, S5, S6, S14, S16) | Logistica Campanha.html |

Dados que iniciam VAZIOS (preenchidos pelo usuario via interface):

| Dado | Chave localStorage | Tabela Supabase |
|------|-------------------|-----------------|
| Pesquisas eleitorais | conectacelina_pesquisas | pesquisas |
| Demandas publicas | conectacelina_demandas | demandas |
| Materiais de campanha | conectacelina_materiais | materiais |
| Lideres comunitarios | conectacelina_lideres | lideres |
| Veiculos | conectacelina_veiculos | veiculos |
| Juridico / Prazos | conectacelina_juridico | juridico |
| Tarefas de pessoas | conectacelina_tarefas_pessoas | tarefas |
| Comunicacao (contadores) | conectacelina_comunicacao | comunicacao |
| Visitas ao mapa | conectacelina_visitas | visitas |
| Atividades (log) | conectacelina_atividades | atividades |
| Logistica completa | logistica_celina_2026 | configuracoes_app (JSON) |
| Coord. Segmentos Sociais | coordSegmentosSociais | configuracoes_app (JSON) |
| Organograma customizado | organograma_lista_completa | configuracoes_app (JSON) |

---

## O QUE FALTA FAZER

### BLOQUEANTE — Supabase (acao manual do Igor ou Silvio)

1. [ ] Criar projeto Supabase (Free, Sao Paulo)
2. [ ] Rodar `setup/migration.sql` no SQL Editor
3. [ ] Rodar `setup/migration_username_login.sql` no SQL Editor
4. [ ] Criar 3 usuarios (silvio2026, karla2026, igor2026) com Auto Confirm
5. [ ] Setar usernames e papeis via SQL (ver SETUP.md passo 6)
6. [ ] Substituir placeholders em `js/supabase-config.js` (URL + anon key)
7. [x] Commit e push

### Apos Supabase ativo

8. [ ] Testar login com os 3 usuarios
9. [ ] Testar criacao de dados e sync entre contas
10. [ ] Importar no Supabase o backup/localStorage exportado pelo `CONECTA.html` (Fase 6)
11. [ ] Deploy em inteia.com.br/conecta2026/
12. [ ] Smoke test completo (ver TESTES.md e SETUP.md)

### Melhorias futuras (nao bloqueante)

- [x] PWA minima (manifest.json, service-worker.js, icones, favicon)
- [ ] Refinamento extra de PWA offline e invalidacao de cache
- [ ] Relatorios analiticos
- [ ] Normalizacao da Logistica (tabelas separadas em vez de JSON)

---

## DECISOES PENDENTES

| # | Decisao | Recomendacao |
|---|---------|--------------|
| D1 | Cadastro lideres Valdelino Barcelos entra no escopo? | Nao (manter fora) |
| D2 | Coordenadores Regionais.html e pagina protegida? | Sim (ja tem auth guard) |
| D3 | Dominio proprio ou subpath? | Subpath /conecta2026/ por ora |
| D4 | Tabelas normalizadas de Logistica na v1? | Nao (JSON em configuracoes_app) |

---

## CUSTOS

| Item | Mensal | Nota |
|------|--------|------|
| Supabase Free | R$0 | 500MB banco, 1GB storage, 50K auth |
| Vercel Free | R$0 | Ja em uso |
| Total v1 | R$0 | Ate precisar escalar |

---

> Ultima atualizacao: 27/03/2026 por ONIR
