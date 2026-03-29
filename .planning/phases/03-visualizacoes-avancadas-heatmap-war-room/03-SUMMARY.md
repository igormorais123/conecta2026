---
phase: 03-visualizacoes-avancadas-heatmap-war-room
plan: 01
subsystem: CONECTA frontend
tags: [leaflet, heatmap, socketio, war-room, realtime, geofences]
dependency_graph:
  requires: [elexion-client.js, Phase 2 gamificacao wrapper]
  provides: [page-mapa-cobertura, page-war-room, renderMapaCobertura, iniciarWarRoom, conectarWarRoomSocket]
  affects: [CONECTA.html sidebar, showPage wrapper, PAGE_REALTIME_KEYS]
tech_stack:
  added: [Leaflet 1.9.4, Leaflet.heat 0.2.0, Socket.IO Client 4.8.3]
  patterns: [showPage wrapper chaining, _safeText XSS sanitization, polling fallback for WebSocket]
key_files:
  modified: [CONECTA.html]
decisions:
  - Tiles OpenStreetMap gratuitos em vez de Google Maps/Mapbox (sem token)
  - Limite de 500 pontos no heatmap por Pitfall 11 (performance Leaflet.heat)
  - JWT passado em auth.token do handshake Socket.IO (nao em query string)
  - Polling fallback REST a cada 30s quando Socket.IO indisponivel
  - _safeText() como sanitizador universal para dados externos no DOM (Pitfall 3)
  - Socket mantido conectado em background ao sair da secao war-room
  - Leaflet inicializado lazy (so na primeira abertura da secao, evita Pitfall 10)
metrics:
  duration: 8min
  completed: 2026-03-29
---

# Phase 3 Plan 01: Visualizacoes Avancadas (Heatmap + War Room) Summary

Heatmap geografico Leaflet com cobertura das RAs do DF + War Room com feed Socket.IO em tempo real, alertas com severidade e indicador de pulso animado.

## What Was Built

- **CDN tags** no `<head>`: Leaflet 1.9.4 CSS/JS, Leaflet.heat 0.2.0, Socket.IO 4.8.3 (antes de elexion-client.js)
- **CSS** inline: estilos para mapa (420px container), war room feed com animacao warFadeIn, pulso verde animado (pulsarAtividade), alertas com cor por severidade (high/medium/low), responsivo 768px
- **Sidebar**: dois novos nav-items (Mapa de Cobertura + War Room com badge de alertas)
- **Secao Mapa de Cobertura** (id=page-mapa-cobertura): cabecalho com botao atualizar, banner offline, legenda cores, container Leaflet, grid de stats por RA
- **Secao War Room** (id=page-war-room): cabecalho com indicador de pulso, banner offline WebSocket, grid 2 colunas (feed atividade + alertas ativos com botao Resolver)
- **JS Mapa**: `inicializarLeaflet()` (lazy init centro DF -15.78/-47.93), `renderMapaCobertura()` (fetch paralelo heatmap+gaps+geofences, 3 camadas Leaflet), `renderMapaRaStats()` (cards por RA), `_safeText()` (sanitizacao XSS)
- **JS War Room**: `iniciarWarRoom()` (snapshot REST + Socket.IO), `conectarWarRoomSocket()` (JWT no handshake, handlers task.completed/xp.awarded/alert.triggered), `ativarPollingFallbackWarRoom()` (30s REST), `resolverAlerta()` (PATCH otimista), `acionarPulso()` (animacao CSS), `atualizarBadgeWarRoom()` (contagem alertas na sidebar)
- **Wrapper showPage** encadeado: mapa-cobertura chama renderMapaCobertura(), war-room chama iniciarWarRoom()
- **PAGE_REALTIME_KEYS** atualizado com entradas mapa-cobertura e war-room

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1+2+3 | 8b9e6ed | feat(03-01): Mapa de Cobertura Leaflet + War Room Socket.IO no CONECTA |

## Deviations from Plan

None - plan executed exactly as written. As 3 tasks foram consolidadas em um unico commit porque as edicoes sao interdependentes no mesmo arquivo (CONECTA.html) e a separacao em 3 commits traria risco de estados intermediarios quebrados.

## Requirements Addressed

| Requirement | Description | Status |
|-------------|-------------|--------|
| VIS-01 | Heatmap geografico Leaflet.js com cobertura das RAs do DF | Complete |
| VIS-02 | Heatmap de gaps (areas nao visitadas) destacadas | Complete |
| VIS-03 | War Room: feed de atividade em tempo real via Socket.IO | Complete |
| VIS-04 | War Room: alertas ativos com indicador visual e resolucao | Complete |
| VIS-05 | War Room: pulso da campanha (indicador de atividade geral) | Complete |

## Known Stubs

Nenhum stub. Todas as funcoes estao implementadas e conectadas ao ElexionClient. Quando Elexion esta offline, banners de fallback aparecem sem quebrar o CONECTA (comportamento intencional, nao stub).

## Self-Check: PASSED

- CONECTA.html: arquivo modificado com 793 linhas adicionadas
- Commit 8b9e6ed: presente no historico git
- page-mapa-cobertura: 3 ocorrencias no arquivo (nav + HTML + JS)
- page-war-room: 3 ocorrencias no arquivo (nav + HTML + JS)
- conectarWarRoomSocket: 3 ocorrencias (definicao + 2 chamadas)
- leaflet (case-insensitive): 18 ocorrencias
- _safeText: 14 ocorrencias (sanitizacao XSS em todos os pontos de dados externos)
