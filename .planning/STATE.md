# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-29)

**Core value:** Coordenadores no CONECTA veem em tempo real a performance dos cabos eleitorais
**Current focus:** Phase 5 — Hardening (Seguranca)

## Current Phase

**Phase:** 5 — Hardening
**Status:** Not started
**Current Plan:** 01
**Next action:** Phase 5 — Proxy Supabase Edge Function + sanitizacao

## Milestone Progress

| Phase | Name | Status |
|-------|------|--------|
| 1 | Fundacao | In progress (60%) |
| 2 | Dashboard Core | Complete |
| 3 | Visualizacoes Avancadas | Complete |
| 4 | Operacoes de Campo | Complete |
| 5 | Hardening | Not started |

## Decisions

- Usar findFirst + create (em vez de upsert com id fixo) para geofences e equipes no seed DF (UUID auto-gerado pelo Prisma)
- Event listeners via addEventListener em vez de onclick inline em conta.html
- Funcao mostrarMensagemElexion com nome distinto para evitar conflito com showMessage existente
- Grafico usa fallback com distribuicao uniforme dos KPIs quando API nao retorna serie temporal
- showPage interceptado via wrapper para disparar renderGamificacao automaticamente
- Leaderboard limitado a 20 cabos no frontend para nao sobrecarregar o DOM
- Tiles OpenStreetMap gratuitos em vez de Google Maps/Mapbox (sem token)
- Limite 500 pontos no heatmap (Pitfall 11 performance Leaflet.heat)
- JWT no auth.token do handshake Socket.IO (nao em query string)
- Polling fallback REST 30s quando Socket.IO indisponivel
- _safeText() sanitizador universal para dados externos no DOM (Pitfall 3)
- Leaflet inicializado lazy (so na primeira abertura, Pitfall 10)
- Prefixo campo- em IDs/funcoes para isolar tarefas Elexion das tarefas Supabase
- wireCampoPages() encadeia no showPage wrapper (mesmo padrao da gamificacao)
- Sanitizacao inline replace(/</g,'&lt;') em todo innerHTML de dados da API
- Max 5 equipes no render social para limitar chamadas paralelas

## Performance Metrics

| Phase-Plan | Duration | Tasks | Files | Date |
|-----------|----------|-------|-------|------|
| 01-01 | 5min | 3/5 | 3 | 2026-03-29 |
| 02-01 | 5min | 3/3 | 2 | 2026-03-29 |
| 03-01 | 8min | 3/3 | 1 | 2026-03-29 |
| 04-01 | 8min | 3/3 | 2 | 2026-03-28 |

## Blockers

- CORS na VPS: requer SSH na VPS 187.77.53.163 para editar .env e reiniciar container api
- Push para Elexion remote: SSH key nao configurada (commit local 0a86d8d pendente push)
- Seed DF: precisa ser executado na VPS apos push e git pull

## Last Session

**Date:** 2026-03-28T23:00:00Z
**Stopped at:** Completed 04-01-PLAN.md (3/3 tasks completas — Phase 4 done)

---
*Last updated: 2026-03-28 (Phase 4 complete)*
