# Integracao Elexion → CONECTA 2026

## What This Is

Integracao do sistema de gamificacao Elexion (NestJS + PostgreSQL + React Native) ao dashboard de campanha CONECTA (HTML+JS+Supabase) para a candidata Celina Leao 2026 no Distrito Federal. Coordenadores usam o CONECTA em inteia.com.br/conecta2026/ para ver rankings, tarefas, metricas sociais, war room e heatmaps. Cabos eleitorais usam o app mobile Elexion para executar tarefas gamificadas em campo.

## Core Value

Coordenadores no CONECTA veem em tempo real a performance dos cabos eleitorais (XP, tarefas, cobertura geografica) sem sair do sistema que ja usam.

## Requirements

### Validated

- ✓ CONECTA funcional em inteia.com.br/conecta2026/ — existente
- ✓ Login por username com Supabase Auth — existente
- ✓ Dashboard com sidebar, stats, organograma, agenda — existente
- ✓ Logistica com tarefas, materiais, equipe, checklist — existente
- ✓ Elexion API REST com gamificacao, tarefas, analytics — existente no repo
- ✓ Elexion app mobile React Native com offline-first — existente no repo

### Active

- [ ] R1: CONECTA consome API REST do Elexion (CORS + client JS)
- [ ] R2: Painel de ranking/leaderboard de cabos no CONECTA
- [ ] R3: KPIs de campanha (tarefas concluidas, XP total, cabos ativos) no CONECTA
- [ ] R4: Performance por equipe com graficos temporais
- [ ] R5: Criacao e atribuicao de tarefas gamificadas para cabos via CONECTA
- [ ] R6: War Room (feed de atividade, alertas, pulso) no CONECTA
- [ ] R7: Desafios semanais criaveis e acompanhaveis pelo CONECTA
- [ ] R8: Metricas de redes sociais dos cabos (Instagram, X, TikTok) no CONECTA
- [ ] R9: Heatmap de cobertura geografica das RAs do DF no CONECTA
- [ ] R10: Proxy seguro via Supabase Edge Function (token JWT nao exposto no browser)
- [ ] R11: Adaptacao do Elexion para campanha Celina Leao / DF (geofences, equipes, seeds)
- [ ] R12: Deploy do Elexion na VPS Hostinger funcional e acessivel

### Out of Scope

- Reescrever CONECTA com framework (React/Next.js) — manter HTML+JS puro
- Unificar bancos Supabase + PostgreSQL Elexion — complementares, nao replicados
- Multi-tenancy no Elexion — usar instancia dedicada para DF
- Modificar o app mobile do Elexion — usar como esta
- SSO/login unificado na v1 — proxy transparente resolve na v1

## Context

### Dois Sistemas Complementares

**CONECTA** e o dashboard dos coordenadores de campanha. Gerencia agenda, veiculos, demandas, pesquisas, juridico, materiais, logistica. Stack leve (HTML+JS+Supabase). 3 usuarios: silvio2026, karla2026, igor2026.

**Elexion** e a plataforma de gamificacao para cabos eleitorais. NestJS API + React Native mobile + Next.js dashboard. Originalmente criado para Jorge Everton (RR). Tem: XP, badges, streaks, challenges, leaderboard, tarefas geolocadas, social media tracking, war room, compliance LGPD. Hospedado em VPS Hostinger (187.77.53.163, 2 vCPU, 8GB RAM, SP).

### Infraestrutura Atual

| Sistema | Hospedagem | Banco | Auth |
|---------|-----------|-------|------|
| CONECTA | Vercel (inteia.com.br/conecta2026/) | Supabase (dvgbqbwipwegkndutvte.supabase.co) | Supabase Auth (username) |
| Elexion API | VPS Hostinger (api.elexion.com.br:3000) | PostgreSQL 16 + PostGIS (Docker) | JWT (access 15min + refresh 7d) |
| Elexion Web | VPS Hostinger (app.elexion.com.br:3001) | — | JWT (cookies httpOnly) |
| Elexion Mobile | APK distribuido | WatermelonDB (offline) + sync API | JWT (bearer) |

### Endpoints Elexion Relevantes

- `GET /api/v1/analytics/kpis` — KPIs da campanha
- `GET /api/v1/analytics/teams/ranking` — Ranking de equipes
- `GET /api/v1/analytics/heatmap` — Heatmap geoespacial
- `GET /api/v1/gamification/leaderboard` — Leaderboard de cabos
- `GET /api/v1/tasks` — Lista tarefas
- `GET /api/v1/social/team/:teamId/metrics` — Metricas sociais
- `GET /api/v1/war-room/summary` — Feed + alertas + pulse
- `GET /api/v1/challenges` — Desafios ativos
- WebSocket: `wss://api.elexion.com.br/socket.io/`

### Gamificacao do Elexion (resumo)

- XP: 10 fontes (task 100, login 10, social 30, challenge 200, etc)
- Multiplicador streak: 1 + (dias x 0.1), cap 2.0x
- 13 badges (FIRST_TASK, STREAK_7, DOOR_MASTER, SOCIAL_STAR, etc)
- Recompensas variaveis (Hook Model): 15% probabilidade base
- Niveis: threshold = 100 x level^1.5, max level 100
- Desafios: individuais ou equipe, metricas configuráveis

## Constraints

- **Stack CONECTA**: HTML+JS puro, sem frameworks — manter
- **Auth dual**: CONECTA usa Supabase, Elexion usa JWT proprio — nao unificar na v1
- **CORS**: inteia.com.br precisa acessar api.elexion.com.br — cross-origin
- **VPS recursos**: 2 vCPU, 8GB RAM — limita a uma instancia Elexion
- **Seguranca**: Token JWT do Elexion no browser JS e risco XSS — mitigar com proxy na Fase 5
- **Usuarios CONECTA**: apenas 3 coordenadores — escopo pequeno, nao precisa escalar
- **Candidata diferente**: Elexion foi feito para RR, CONECTA e para DF — adaptar geofences, equipes

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| CONECTA como consumer da API Elexion (nao modificar Elexion) | Manter Elexion independente, nao criar acoplamento | — Pending |
| Proxy via Supabase Edge Function na Fase 5 (nao na v1) | Complexidade vs seguranca. 3 usuarios = risco baixo. Proxy depois. | — Pending |
| Instancia Elexion dedicada para DF (nao multi-tenant) | Schema nao tem campaign_id. Instancia separada = isolamento de dados | — Pending |
| Comecar com CORS + bearer (Fase 1), migrar para proxy (Fase 5) | Prova de conceito rapida, hardening depois | — Pending |
| Graficos via Chart.js CDN (sem build step) | Manter stack HTML+JS puro do CONECTA | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition:**
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone:**
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-29 after initialization*
