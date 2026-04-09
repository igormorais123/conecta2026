---
phase: 02-dashboard-core-kpis-leaderboard-graficos
plan: 01
subsystem: gamificacao-dashboard
tags: [chart.js, leaderboard, kpis, polling, elexion-integration]
dependency_graph:
  requires: [elexion-client.js (Phase 1)]
  provides: [secao gamificacao, fetchLeaderboard, fetchTeamsRanking]
  affects: [CONECTA.html sidebar, CONECTA.html pages, elexion-client.js]
tech_stack:
  added: [Chart.js 4.4.7 via CDN]
  patterns: [polling 60s, showPage interception, parallel fetch, escapeHtml sanitization]
key_files:
  created: []
  modified:
    - js/elexion-client.js
    - CONECTA.html
decisions:
  - "Grafico usa fallback com distribuicao uniforme dos KPIs quando API nao retorna serie temporal"
  - "showPage interceptado via wrapper (preserva funcao original) para disparar renderGamificacao"
  - "Leaderboard limitado a 20 cabos no frontend (slice) para nao sobrecarregar o DOM"
  - "Badge NOVO na sidebar so aparece quando ha dados reais de leaderboard"
  - "CSS responsivo: grid 2 colunas colapsa para 1 em mobile (768px)"
metrics:
  duration: 5min
  completed: 2026-03-29T12:53:00Z
  tasks_completed: 3
  tasks_total: 3
  files_modified: 2
---

# Phase 2 Plan 1: Dashboard Core KPIs Leaderboard Graficos Summary

Secao "Gamificacao" integrada ao CONECTA.html com KPIs, leaderboard filtrado por equipe, ranking de equipes e grafico Chart.js dual-axis com polling automatico de 60 segundos.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | fetchLeaderboard e fetchTeamsRanking no ElexionClient | 8f29f63 | js/elexion-client.js |
| 2 | Nav item Gamificacao + HTML secao completa | dda6607 | CONECTA.html |
| 3 | Chart.js CDN + CSS + JS + polling 60s | 8a99a7f | CONECTA.html |

## What Was Built

### js/elexion-client.js
- `fetchLeaderboard(equipeId?)` — GET /api/v1/analytics/leaderboard com filtro opcional por equipe
- `fetchTeamsRanking()` — GET /api/v1/analytics/teams/ranking
- Ambos seguem o padrao existente: retornam dados ou null (fallback gracioso)

### CONECTA.html — Sidebar
- Nav-section "Campo" com item "Gamificacao" (icone trofeu, badge NOVO dinamico)
- Badge fica oculto por default, exibido quando ha dados de leaderboard

### CONECTA.html — Secao page-gamificacao
- 4 KPI cards reutilizando .stat-card existente: Tarefas Concluidas, XP Total, Cabos Ativos, Cobertura DF
- Grafico Chart.js de linha com eixos Y duais (XP esquerda, Tarefas direita) e seletor 7d/30d/3m
- Leaderboard com top 20 cabos, medalhas ouro/prata/bronze, filtro por equipe regional via dropdown
- Grid de equipes regionais com metricas agregadas (XP, cabos, tarefas, cobertura)
- Banner de fallback quando Elexion offline ou conta nao vinculada
- Indicador de "Ultima atualizacao" com cor verde (sucesso) ou amarelo (offline)

### CONECTA.html — CSS
- Classes .gami-leaderboard-row, .gami-pos (com top1/top2/top3), .gami-nome, .gami-xp, etc
- Classes .gami-equipe-card, .gami-equipe-nome, .gami-equipe-stat
- Media query para responsividade mobile (grid 1 coluna em 768px)

### CONECTA.html — JS
- renderGamificacao(): ponto de entrada, fetch paralelo de KPIs + leaderboard + equipes
- renderGamiKpis(), renderGamiLeaderboard(), renderGamiEquipes(), renderGamiChart()
- popularFiltroEquipes(): popula dropdown com equipes unicas do leaderboard
- iniciarPollingGamificacao(): setInterval 60s (polling silencioso, so executa se pagina ativa)
- Wrapper de showPage para disparar renderGamificacao() automaticamente
- Sanitizacao via escapeHtml() em todos os dados inseridos no DOM

## Endpoints Elexion Consumidos

| Endpoint | Metodo | Usado por |
|----------|--------|-----------|
| /api/v1/analytics/kpis | GET | renderGamificacao() |
| /api/v1/analytics/leaderboard | GET | renderGamificacao(), renderGamiLeaderboard() |
| /api/v1/analytics/leaderboard?equipe={id} | GET | renderGamiLeaderboard() (com filtro) |
| /api/v1/analytics/teams/ranking | GET | renderGamificacao() |

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

Nenhum stub encontrado. Os dados vem do Elexion via ElexionClient. Quando a API retorna null (offline/nao autenticado), a interface mostra "--" nos KPIs e mensagens de "Nenhum dado" nos grids, com banner de fallback visivel. O grafico usa fallback de distribuicao uniforme dos KPIs caso a API nao retorne serie temporal (campo kpis.serie) — este e comportamento intencional documentado no plano.

## Self-Check: PASSED

- [x] js/elexion-client.js exists and contains fetchLeaderboard + fetchTeamsRanking
- [x] CONECTA.html exists and contains all 13 required elements
- [x] Commit 8f29f63 found (Task 1)
- [x] Commit dda6607 found (Task 2)
- [x] Commit 8a99a7f found (Task 3)
