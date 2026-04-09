---
phase: 04-operacoes-de-campo-tarefas-desafios-social
plan: 01
subsystem: conecta-campo-operations
tags: [elexion, tarefas-campo, desafios, social, polling]
dependency_graph:
  requires: [elexion-client, conecta-html-sidebar, showPage-wrapper]
  provides: [campo-tasks-ui, campo-challenges-ui, campo-social-ui, campo-polling]
  affects: [CONECTA.html, js/elexion-client.js]
tech_stack:
  added: []
  patterns: [wireCampoPages-wrapper, campo-prefix-isolation, innerHTML-sanitization]
key_files:
  created: []
  modified:
    - js/elexion-client.js
    - CONECTA.html
decisions:
  - Prefixo campo- em todos IDs e funcoes para evitar conflito com tarefas Supabase existentes
  - wireCampoPages() usa mesmo padrao de wrapper que gamificacao (encadeia showPage)
  - Sanitizacao inline com replace(/</g,'&lt;') em todo innerHTML de dados da API
  - Polling 60s independente do polling de gamificacao (nao interfere)
  - Max 5 equipes no render social para nao sobrecarregar chamadas paralelas
metrics:
  duration: 8min
  completed: 2026-03-28
---

# Phase 4 Plan 01: Operacoes de Campo (Tarefas + Desafios + Social) Summary

Tres secoes de operacoes de campo adicionadas ao CONECTA com 10 metodos no ElexionClient, modais de criacao, filtros, fallback offline e polling 60s.

## Tasks Completed

### Task 1: Extender ElexionClient com 10 metodos
- **Commit:** 9b9a196
- **Files:** js/elexion-client.js
- 10 metodos adicionados: fetchTasks, fetchTaskReports, createTask, assignTask, fetchChallenges, createChallenge, fetchChallengeProgress, fetchChallengeLeaderboard, fetchSocialTeamMetrics, fetchSocialScorecard
- Todos usam request() com fallback null (CLIENT-03)
- Metodos existentes inalterados

### Task 2: Nav-items, secoes HTML e modais
- **Commit:** 9b9a196
- **Files:** CONECTA.html
- 3 nav-items na sidebar (secao Campo): Tarefas de Campo, Desafios, Social
- 3 secoes page: page-tarefas-campo, page-desafios, page-social
- 2 modais: modalTarefaCampo (7 campos), modalDesafio (5 campos)
- 3 titulos registrados em showPage() titles{}
- Filtros de status e tipo na secao tarefas
- Fallback offline em todas as 3 secoes

### Task 3: JavaScript render, submit e wiring
- **Commit:** 9b9a196
- **Files:** CONECTA.html
- renderTarefasCampo() com filtros e cards por status
- verReportsTarefa() com painel expandivel
- salvarTarefaCampo() com createTask + assignTask opcional
- renderDesafios() com barra de progresso
- verLeaderboardDesafio() com tabela
- salvarDesafio() com createChallenge
- renderSocial() com cards por equipe (posts, engagement, alcance)
- wireCampoPages() intercepta showPage para render automatico
- Polling 60s para as 3 secoes via setInterval

## Deviations from Plan

### Minor Deviation

**1. [Consolidacao de commits] Unico commit para as 3 tasks**
- **Motivo:** As 3 tasks foram executadas em sequencia rapida e commitadas juntas em vez de individualmente
- **Impacto:** Nenhum impacto funcional, apenas granularidade de commit diferente do padrao

## Decisions Made

1. **Prefixo campo-**: Todos os IDs HTML e nomes de funcoes usam prefixo `campo-` para isolamento total das tarefas Supabase existentes
2. **wireCampoPages pattern**: Encadeia no showPage wrapper existente (mesmo padrao da gamificacao Phase 2)
3. **Sanitizacao inline**: replace(/</g,'&lt;') aplicado em todos os dados da API antes de innerHTML
4. **Max 5 equipes no Social**: Limita chamadas paralelas de fetchSocialTeamMetrics para performance
5. **Polling independente**: setInterval proprio de 60s, separado do polling de gamificacao

## Known Stubs

Nenhum stub identificado. Todas as funcoes estao conectadas a metodos reais do ElexionClient.

## Requirements Coverage

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| OPS-01 | Complete | Lista tarefas Elexion com filtros status/tipo, separada de Supabase |
| OPS-02 | Complete | Modal + salvarTarefaCampo() chama POST /tasks |
| OPS-03 | Complete | Campo worker-id no modal + assignTask() |
| OPS-04 | Complete | verReportsTarefa() com painel expandivel |
| OPS-05 | Complete | Modal + salvarDesafio() chama POST /challenges |
| OPS-06 | Complete | Barra progresso + verLeaderboardDesafio() |
| OPS-07 | Complete | renderSocial() com cards posts/engagement/alcance por equipe |
| OPS-08 | Complete | Scorecard panel individual por cabo |
