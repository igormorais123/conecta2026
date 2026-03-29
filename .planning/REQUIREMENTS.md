# Requirements: Integracao Elexion → CONECTA 2026

**Defined:** 2026-03-29
**Core Value:** Coordenadores no CONECTA veem em tempo real a performance dos cabos eleitorais sem sair do sistema que ja usam.

## v1 Requirements

### Fundacao (Infra + CORS + Client)

- [ ] **INFRA-01**: Elexion API rodando na VPS Hostinger (Docker: NestJS + PostgreSQL + Redis + nginx)
- [ ] **INFRA-02**: CORS habilitado no NestJS para `https://inteia.com.br` (REST + WebSocket gateway)
- [ ] **INFRA-03**: Migration DF executada: 33 RAs como geofences, seeds de equipes Celina Leao
- [ ] **INFRA-04**: Usuario coordenador criado no Elexion com role `coordenador_regional`
- [ ] **CLIENT-01**: `js/elexion-client.js` com auth JWT (login, refresh, bearer header)
- [ ] **CLIENT-02**: Token JWT em sessionStorage (nunca localStorage)
- [ ] **CLIENT-03**: Fallback gracioso quando Elexion indisponivel (nao quebrar CONECTA)
- [ ] **CLIENT-04**: Tela de vinculacao de conta Elexion em conta.html ou configuracoes

### Dashboard Core (KPIs + Leaderboard)

- [x] **DASH-01**: Secao "Gamificacao" na sidebar do CONECTA com badge de notificacao
- [x] **DASH-02**: Cards de KPIs: tarefas concluidas, XP total, cabos ativos, cobertura %
- [x] **DASH-03**: Leaderboard de cabos: posicao, nome, XP, nivel, streak, badges
- [x] **DASH-04**: Filtro de leaderboard por equipe regional
- [x] **DASH-05**: Ranking de equipes com metricas agregadas
- [x] **DASH-06**: Graficos Chart.js: performance temporal (dia/semana/mes)
- [x] **DASH-07**: Polling automatico a cada 60s (setInterval)

### Visualizacoes Avancadas (Heatmap + War Room)

- [ ] **VIS-01**: Heatmap geografico Leaflet.js com cobertura das RAs do DF
- [ ] **VIS-02**: Heatmap de gaps (areas nao visitadas) destacadas
- [ ] **VIS-03**: War Room: feed de atividade em tempo real via Socket.IO
- [ ] **VIS-04**: War Room: alertas ativos com indicador visual
- [ ] **VIS-05**: War Room: pulso da campanha (indicador de atividade geral)

### Operacoes de Campo (Tarefas + Desafios + Social)

- [ ] **OPS-01**: Lista de tarefas de campo do Elexion (separada das tarefas do CONECTA)
- [ ] **OPS-02**: Criar tarefa gamificada via CONECTA (POST /tasks) com tipo, local, deadline
- [ ] **OPS-03**: Atribuir tarefa a cabo eleitoral via CONECTA
- [ ] **OPS-04**: Ver reports de tarefas concluidas (resultado, fotos)
- [ ] **OPS-05**: Criar desafio semanal via CONECTA (metrica, alvo, recompensa XP)
- [ ] **OPS-06**: Acompanhar progresso e leaderboard do desafio
- [ ] **OPS-07**: Metricas de redes sociais por equipe (posts, engagement, alcance)
- [ ] **OPS-08**: Scorecard social individual por cabo

### Hardening (Seguranca)

- [ ] **SEC-01**: Proxy Supabase Edge Function: token JWT Elexion nunca exposto no browser
- [ ] **SEC-02**: Service account no Elexion com token de longa duracao para o proxy
- [ ] **SEC-03**: Sanitizacao sistematica de innerHTML no CONECTA (dados vindos da API)
- [ ] **SEC-04**: Remover CORS de `inteia.com.br` do Elexion apos migrar para proxy

## v2 Requirements

### Futuro (pos-eleicao ou se necessario)

- **V2-01**: SSO/login unificado Supabase + Elexion
- **V2-02**: Notificacoes push para coordenadores via FCM
- **V2-03**: Dashboard mobile nativo para coordenadores (PWA avancado)
- **V2-04**: Multi-tenancy no Elexion (campo campaign_id no schema)
- **V2-05**: Inteligencia: briefings e narrativas da IA no CONECTA

## Out of Scope

| Feature | Reason |
|---------|--------|
| Reescrever CONECTA em React/Next.js | 3 usuarios, HTML+JS funciona. Rewrite = semanas sem ganho |
| Sincronizar bancos Supabase ↔ PostgreSQL | Risco de inconsistencia, schemas diferentes |
| Modificar app mobile Elexion | Usar como esta, foco na integracao dashboard |
| App mobile proprio para coordenadores | CONECTA web funciona em mobile browser |
| Multi-tenancy no Elexion v1 | Schema sem campaign_id, instancia dedicada resolve |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01..04 | Phase 1: Fundacao | Pending |
| CLIENT-01..04 | Phase 1: Fundacao | Pending |
| DASH-01..07 | Phase 2: Dashboard Core | Complete |
| VIS-01..02 | Phase 3: Visualizacoes | Pending |
| VIS-03..05 | Phase 3: Visualizacoes | Pending |
| OPS-01..04 | Phase 4: Operacoes | Pending |
| OPS-05..06 | Phase 4: Operacoes | Pending |
| OPS-07..08 | Phase 4: Operacoes | Pending |
| SEC-01..04 | Phase 5: Hardening | Pending |

---
*Last updated: 2026-03-29 after initialization*
