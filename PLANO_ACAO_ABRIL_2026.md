# PLANO DE AÇÃO — CONECTA 2026
# Avaliação do Sistema em Produção + Próximos Passos

> Data: 01/04/2026
> Avaliação realizada no deploy ao vivo: https://inteia.com.br/conecta2026
> Repositório: https://github.com/silviomvieira-hub/Conecta-2026
> Autor: Análise automatizada via Claude Code

---

## 1. ESTADO ATUAL DO SISTEMA EM PRODUÇÃO

### 1.1 Páginas Ativas no Deploy

| Página | URL | Status | Observação |
|--------|-----|--------|------------|
| Login | `/conecta2026/login.html` | ✅ Funcionando | Login por username, integração Supabase |
| Index (redirect) | `/conecta2026/index.html` | ✅ Funcionando | Redireciona para login.html |
| CONECTA (principal) | `/conecta2026/CONECTA.html` | ✅ Funcionando | SPA completa com 16+ seções |
| Logística | `/conecta2026/Logistica Campanha.html` | ✅ Funcionando | 16 módulos operacionais |
| Conta | `/conecta2026/conta.html` | ✅ Funcionando | Troca de senha + integração Elexion |
| Cadastro Apoiador | `/conecta2026/cadastro-apoiador.html` | ✅ Funcionando | Público, com LGPD |
| Coordenadores | `/conecta2026/Coordenadores Regionais.html` | ✅ Funcionando | 6 coordenadores regionais |
| QR Code | `/conecta2026/qrcode-cartao.html` | ✅ Funcionando | Gerador de cartão de visita |

### 1.2 Funcionalidades Verificadas no CONECTA.html

**Principal:**
- Dashboard com cards estatísticos (cidades, eventos, pessoal, demandas, veículos, pesquisas, líderes)
- Alertas do calendário eleitoral TSE com cores e animações
- Log de atividades recentes

**Operacional:**
- Agenda da Celina (criação de eventos, visualização calendário/lista)
- Controle de Veículos (frota, quilometragem, responsáveis)
- Quem é Quem (diretório de contatos com fotos, busca, filtros)
- Cadastro de Líderes (formulário completo com LGPD, export WhatsApp/email)
- Mapa do DF (34 regiões administrativas com status de cobertura)

**Estratégico:**
- Pesquisas Eleitorais (registro de pesquisas, gráficos comparativos)
- Comunicação (métricas de WhatsApp, Instagram, vídeos, mídia)
- Demandas Populares (registro com prioridade, categoria, status)

**Administrativo:**
- Jurídico/Prazos (timeline, categorias, monitoramento)
- Materiais (inventário, fornecedores, estoque, alertas)

**Campo (seção recente):**
- Gamificação (leaderboard, XP, rankings regionais)
- Mapa de Cobertura
- War Room (feed em tempo real, alertas)
- Tarefas de Campo
- Desafios
- Social (métricas de redes sociais)

### 1.3 Funcionalidades Verificadas na Logística

16 módulos completos:
1. Dashboard com countdown para eleição (04/10/2026)
2. Tarefas (atribuições diárias por coordenador)
3. Materiais (controle de estoque)
4. Fornecedores (contatos, prazos, contratos)
5. Equipe (organização por time/região)
6. Subcoordenações (6 departamentos)
7. Calendário Eleitoral
8. Checklist (39 itens pré-campanha + campanha)
9. Eleitorado DF (dados TRE-DF de 33 regiões, 2.853.835 eleitores)
10. Agenda de Salas (5 salas do comitê, conflito de horário)
11. Orçamento (categorias, controle financeiro)
12. Distribuição (log de materiais por região)
13. Vales Combustível (gestão de frota)
14. Ativos na Rua / Logística Reversa
15. Bandeiraços/Eventos (conflito de local/data)
16. Patrimônio (inventário de ativos, condição, valor)

### 1.4 Usuários Configurados

| Username | Papel | Status |
|----------|-------|--------|
| silvio2026 | admin | ✅ Login funcional |
| karla2026 | coordenador | Configurado |
| igor2026 | admin | Configurado |

---

## 2. DIAGNÓSTICO — O QUE PRECISA SER FEITO

### 2.1 PRIORIDADE ALTA (Bloqueantes para operação real)

#### P0-01: Validar sincronização multiusuário (Supabase)
- **Problema**: Fases 2 e 3 do plano original marcam sync como "concluída", mas a homologação multiusuário ainda não foi executada com dados reais
- **Impacto**: Se os 3 usuários não veem os mesmos dados, o sistema não serve para operação de campanha
- **Ação**: Testar login com os 3 usuários e verificar se dados criados por um aparecem para os outros após refresh
- **Arquivos**: `js/conecta-db.js`, `CONECTA.html`, `Logistica Campanha.html`

#### P0-02: Importar dados existentes do localStorage para Supabase
- **Problema**: Fase 6 (migração) está marcada como PARCIAL — export/import de backup local implementado mas carga no Supabase não foi feita
- **Impacto**: Dados existentes podem se perder se alguém limpar o cache do navegador
- **Ação**: Exportar localStorage atual → importar no Supabase via rotina de migração
- **Arquivos**: `CONECTA.html` (botão de export), `js/conecta-db.js`

#### P0-03: Smoke test completo no ambiente de produção
- **Problema**: O checklist de TESTES.md tem 30+ itens ainda não marcados
- **Impacto**: Não se sabe quais funcionalidades realmente operam corretamente no deploy
- **Ação**: Executar todos os itens do TESTES.md sistematicamente no ambiente inteia.com.br

### 2.2 PRIORIDADE MÉDIA (Melhorias importantes)

#### P1-01: Revisão de segurança — credenciais e exposição
- **Problema**: Login com silvio2026/silvio2026 (senha = username) é vulnerável
- **Impacto**: Qualquer pessoa que adivinhe o padrão acessa o sistema
- **Ação**: Trocar senhas de todos os usuários para senhas fortes e diferentes do username
- **Local**: `conta.html` (troca de senha)

#### P1-02: Testar e estabilizar modo offline + fila de sync
- **Problema**: Fila offline está implementada no código mas não foi homologada
- **Impacto**: Dados inseridos sem internet podem se perder
- **Ação**: Testar cenário offline completo (desligar rede → inserir dados → religar → verificar sync)

#### P1-03: Integração Elexion (conta.html)
- **Problema**: A página de conta oferece vincular conta Elexion para gamificação e mapas térmicos
- **Status**: Interface existe, falta validar se a API Elexion está respondendo
- **Ação**: Testar conexão com credenciais reais ou decidir se essa integração é prioridade

#### P1-04: Atualizar dados dos Coordenadores Regionais
- **Problema**: Última atualização registrada em 22/03/2026
- **Ação**: Verificar se os 6 coordenadores e telefones estão atualizados

#### P1-05: Validar QR Code em produção
- **Problema**: QR code deve apontar para URL correta de cadastro público
- **Ação**: Gerar QR code e escanear com celular para confirmar que abre cadastro-apoiador.html correto

### 2.3 PRIORIDADE BAIXA (Melhorias futuras — não bloqueiam operação)

#### P2-01: PWA — Refinamento do service worker e cache
- **Status**: PWA mínima entregue (manifest, service worker, ícones)
- **Pendente**: Invalidação de cache entre releases, teste de instalação mobile
- **Ação**: Testar "Adicionar à tela inicial" em Android/iOS

#### P2-02: Normalização da Logística (v2)
- **Status**: Logística sincroniza como JSON único em `configuracoes_app` (decisão do plano v4)
- **Futuro**: Separar em tabelas normalizadas para relatórios avançados
- **Ação**: Manter como está na v1, planejar para v2

#### P2-03: Relatórios analíticos e dashboards avançados
- **Status**: Dados existem mas sem cruzamento entre módulos
- **Futuro**: Criar views/reports que cruzem Logística + CONECTA + Pesquisas

#### P2-04: Refinamento visual e branding
- **Status**: Cada página tem sua paleta definida e consistente
- **Futuro**: Padronizar rodapés, melhorar responsividade em telas menores

---

## 3. PLANO DE EXECUÇÃO

### Semana 1 (01-04/04/2026) — Estabilização

| Dia | Tarefa | Responsável | Critério de Aceite |
|-----|--------|-------------|-------------------|
| 1 | P1-01: Trocar senhas dos 3 usuários | Silvio/Igor | Senhas fortes ≠ username |
| 1 | P0-03: Smoke test - Seções 1 e 2 (login, conta, rotas) | Silvio | Items marcados ✅ no TESTES.md |
| 2 | P0-01: Teste de sync multiusuário CONECTA.html | Silvio + Karla | Dado criado por um, visto pelo outro |
| 2 | P0-01: Teste de sync multiusuário Logística | Silvio + Karla | Estado Logística compartilhado |
| 3 | P0-02: Exportar localStorage e importar no Supabase | Silvio/Igor | Dados históricos preservados no banco |
| 3 | P0-03: Smoke test - Seções 3 a 6 (sync, offline, formulário) | Silvio | Items marcados ✅ no TESTES.md |
| 4 | P1-02: Teste completo offline/fila | Silvio | Badge offline funciona, fila replay OK |
| 4 | P1-05: Validar QR Code produção | Silvio | QR escaneia e abre cadastro correto |

### Semana 2 (07-11/04/2026) — Operação + Melhorias

| Dia | Tarefa | Responsável | Critério de Aceite |
|-----|--------|-------------|-------------------|
| 1 | P1-03: Testar integração Elexion | Igor | API responde ou decisão de prioridade |
| 1 | P1-04: Atualizar coordenadores regionais | Silvio | Telefones e nomes validados |
| 2 | P0-03: Smoke test - Seções 7 a 9 (páginas secundárias, realtime, PWA) | Silvio | Checklist 100% executado |
| 3 | P2-01: Testar PWA mobile | Silvio | App instala no celular |
| 4 | Correções de bugs encontrados nos testes | Dev | Bugs resolvidos |
| 5 | Go-live operacional — sistema pronto para a equipe usar | Todos | Todos P0 resolvidos |

---

## 4. INVENTÁRIO COMPLETO DE ARQUIVOS DO PROJETO

### Arquivos Web (deploy)

| Arquivo | Tipo | Tamanho aprox. | Função |
|---------|------|----------------|--------|
| `index.html` | Redirect | Pequeno | Redireciona para login.html |
| `login.html` | Página | Médio | Login por username |
| `conta.html` | Página | Médio | Gestão de conta + Elexion |
| `CONECTA.html` | SPA | ~220KB+ | Aplicação principal (16+ seções) |
| `Logistica Campanha.html` | SPA | Grande | Logística (16 módulos) |
| `cadastro-apoiador.html` | Formulário | Médio | Cadastro público de apoiadores |
| `Coordenadores Regionais.html` | Página | Médio | Grid de coordenadores |
| `qrcode-cartao.html` | Ferramenta | Médio | Gerador de QR code |
| `Cadastro - lideres 2026.htm` | Formulário | Médio | Líderes Valdelino (fora do escopo) |

### Scripts compartilhados

| Arquivo | Função |
|---------|--------|
| `js/supabase-config.js` | Config única: URL, chave, base path, auth guard |
| `js/conecta-db.js` | Camada de sync: cache + localStorage + Supabase |

### Infraestrutura

| Arquivo | Função |
|---------|--------|
| `vercel.json` | Rewrites para /conecta2026/ |
| `manifest.json` | PWA manifest |
| `service-worker.js` | PWA service worker |
| `favicon.ico` | Ícone do site |
| `icons/` | Ícones PWA |
| `package.json` | Dependências npm (se houver) |

### Documentação e Setup

| Arquivo | Função |
|---------|--------|
| `CLAUDE.md` | Instruções para Claude Code |
| `AGENTS.md` | Instruções para Codex |
| `PLANO_CONECTA_v4.md` | Plano técnico detalhado (8 fases) |
| `WORKING.md` | Status de implementação |
| `TESTES.md` | Checklist de homologação (30+ itens) |
| `PLANO_ACAO_ABRIL_2026.md` | **ESTE ARQUIVO** — plano de ação atualizado |
| `setup/migration.sql` | Schema SQL completo (20 tabelas + RLS) |
| `setup/migration_username_login.sql` | Patch: RPC login por username |
| `setup/SETUP.md` | Guia de provisionamento Supabase |

### Documentos estáticos

| Arquivo | Função |
|---------|--------|
| `Organograma da Campanha.docx` | Organograma oficial |
| `Organograma da Campanha.pdf` | Organograma PDF |
| `Coordenadores Regionais - WhatsApp.txt` | Contatos WhatsApp |
| `screenshot-conecta.png` | Screenshot do sistema |

---

## 5. MÉTRICAS DO SISTEMA

### Dados hardcoded (já disponíveis)

| Dado | Volume |
|------|--------|
| Contatos por cidade | 341 pessoas / 33 cidades |
| Coordenadores do organograma | 12 pessoas |
| Coordenadores regionais | 6 pessoas |
| Datas do calendário eleitoral | 15 datas |
| Cidades do DF | 34 |
| Regiões administrativas | 37 |
| Eleitorado TRE-DF | 2.853.835 eleitores / 33 regiões |
| Checklist do coordenador | 39 itens |
| Salas do comitê | 5 salas |

### Datas críticas do calendário

| Data | Evento |
|------|--------|
| 05/03 - 03/04/2026 | Janela partidária |
| 06/05/2026 | Prazo de filiação e domicílio eleitoral |
| 15/05/2026 | Início da vaquinha eleitoral |
| 04/07/2026 | Restrições de mídia |
| 20/07 - 05/08/2026 | Convenções partidárias |
| 15/08/2026 | Registro de candidatura |
| 16/08/2026 | **INÍCIO DA CAMPANHA** |
| 04/10/2026 | **DIA DA ELEIÇÃO** |
| 18/12/2026 | Diplomação |

---

## 6. RESUMO EXECUTIVO

O sistema CONECTA 2026 está **deployado e funcionando** em inteia.com.br/conecta2026 com todas as páginas acessíveis. A base técnica é sólida — login por username, auth guard, 16+ seções no CONECTA.html, 16 módulos na Logística, formulário público com LGPD, PWA básica.

**O que está PRONTO:**
- Todas as 8+ páginas online e funcionais
- Login por username com Supabase
- Estrutura de sync (ConectaDB) implementada
- Camada offline com fila local
- PWA mínima (manifest, service worker, ícones)
- Schema SQL completo com 20 tabelas + RLS
- Documentação técnica abrangente

**O que FALTA para operação real:**
1. **Homologação multiusuário** — testar sync real entre silvio2026, karla2026 e igor2026
2. **Migração de dados** — exportar localStorage para Supabase
3. **Trocar senhas** — senhas atuais são fracas (= username)
4. **Smoke test completo** — executar os 30+ itens do TESTES.md
5. **Validação offline** — confirmar que fila de sync funciona em cenário real

**Estimativa**: 1-2 semanas para estabilização completa e go-live operacional.

---

> Plano gerado em 01/04/2026
> Base: análise do deploy ao vivo em inteia.com.br/conecta2026
> Referência: PLANO_CONECTA_v4.md + WORKING.md + TESTES.md
