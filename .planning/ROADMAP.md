# Roadmap: Integracao Elexion → CONECTA 2026

**Created:** 2026-03-29
**Milestone:** v1.0 — Integracao completa
**Phases:** 5
**Estimated total:** 14-22 dias

## Phase 1: Fundacao — Docker + CORS + Migration DF + Client JS

**Goal:** Elexion API acessivel pelo CONECTA via fetch cross-origin.
**Requirements:** INFRA-01, INFRA-02, INFRA-03, INFRA-04, CLIENT-01, CLIENT-02, CLIENT-03, CLIENT-04
**Estimated effort:** 3-4 dias
**Depends on:** Nada (bloqueadora de tudo)

### Tasks
1. Deploy Docker Elexion na VPS Hostinger (docker-compose.staging.yml)
2. Configurar nginx reverse proxy + SSL Let's Encrypt para api.elexion.com.br
3. Habilitar CORS no NestJS main.ts para `https://inteia.com.br`
4. Habilitar CORS no WebSocket gateway para `https://inteia.com.br`
5. Criar e executar migration DF: 33 RAs como geofences GeoJSON + seeds equipes Celina
6. Criar usuario coordenador no Elexion (role coordenador_regional)
7. Criar `js/elexion-client.js`: login, refresh token, fetch com bearer, fallback
8. Criar UI de vinculacao de conta Elexion em conta.html
9. Prova de conceito: fetch /api/v1/analytics/kpis e exibir no console do CONECTA

### Success criteria
- `curl https://api.elexion.com.br/api/v1/health` retorna 200
- CONECTA.html consegue fazer fetch cross-origin para a API sem erro CORS
- Token JWT armazenado em sessionStorage, refresh funcional
- Migration DF visivel: geofences de RAs retornadas pelo endpoint de heatmap

### Risks
- VPS pode ter firewall bloqueando porta 3000 — verificar regras de entrada
- SSL Let's Encrypt pode falhar se DNS de elexion.com.br nao aponta para a VPS
- Migration DF pode nao existir no Elexion — criar do zero se necessario

---

## Phase 2: Dashboard Core — KPIs + Leaderboard + Graficos

**Goal:** Coordenadores veem metricas de gamificacao e rankings no CONECTA.
**Requirements:** DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, DASH-06, DASH-07
**Estimated effort:** 3-4 dias
**Depends on:** Phase 1

### Tasks
1. Adicionar secao "Gamificacao" na sidebar do CONECTA.html com icone e badge
2. Criar pagina/secao de KPIs: cards com tarefas, XP, cabos, cobertura
3. Carregar Chart.js via CDN e renderizar grafico de performance temporal
4. Criar tabela de leaderboard (posicao, nome, XP, nivel, streak, ultimo badge)
5. Adicionar filtro dropdown por equipe regional
6. Criar secao de ranking por equipe com cards agregados
7. Implementar polling setInterval 60s para atualizar dados automaticamente
8. Indicador visual de "ultima atualizacao" e botao de refresh manual

### Success criteria
- Cards de KPIs exibem dados reais do Elexion
- Leaderboard mostra cabos ordenados por XP com nivel e streak
- Grafico Chart.js renderiza timeline de performance
- Dados atualizam automaticamente a cada 60s

### Risks
- Volume de dados: leaderboard com muitos cabos pode ser lento — usar paginacao
- Chart.js canvas pode nao renderizar se a secao estiver oculta (display:none) — inicializar ao mostrar

---

## Phase 3: Visualizacoes Avancadas — Heatmap + War Room

**Goal:** Mapa de cobertura geografica e feed em tempo real para coordenadores.
**Requirements:** VIS-01, VIS-02, VIS-03, VIS-04, VIS-05
**Estimated effort:** 3-4 dias
**Depends on:** Phase 1 (CORS + client), Phase 2 (sidebar ja existe)

### Tasks
1. Carregar Leaflet.js + Leaflet.heat via CDN
2. Criar secao "Mapa de Cobertura" com mapa centrado no DF (-15.78, -47.93)
3. Fetch /api/v1/analytics/heatmap e renderizar pontos de calor
4. Fetch /api/v1/analytics/heatmap/gaps e destacar areas sem cobertura
5. Overlay dos limites das 33 RAs no mapa (GeoJSON)
6. Carregar Socket.IO client via CDN
7. Criar secao "War Room" com feed de atividade (scroll infinito)
8. Conectar ao WebSocket do Elexion com auth JWT no handshake
9. Escutar eventos: task.completed, xp.awarded, alert.triggered
10. Indicador de pulso: animacao que pulsa com atividade recente
11. Lista de alertas ativos com severidade e botao "Resolver"

### Success criteria
- Mapa Leaflet renderiza heatmap de atividade nas RAs do DF
- Areas sem cobertura visualmente destacadas
- War Room exibe feed live via WebSocket (latencia < 2s)
- Alertas aparecem em tempo real com indicador visual

### Risks
- CORS do WebSocket gateway NestJS e configurado separadamente do REST — testar
- Formato dos dados do heatmap pode nao ser [lat, lng, intensity] — verificar schema
- Leaflet pode conflitar com mapa existente do CONECTA (secao "Mapa do DF")

---

## Phase 4: Operacoes de Campo — Tarefas + Desafios + Social

**Goal:** Coordenadores criam tarefas e desafios, veem metricas sociais dos cabos.
**Requirements:** OPS-01..08
**Estimated effort:** 3-5 dias
**Depends on:** Phase 2

### Tasks
1. Criar secao "Tarefas de Campo" separada das "Tarefas" existentes do CONECTA
2. Lista de tarefas com filtros (status, tipo, equipe, prazo)
3. Modal de criacao de tarefa: titulo, descricao, tipo, localizacao, deadline, atribuicao
4. POST /api/v1/tasks e POST /api/v1/tasks/:id/assign via elexion-client.js
5. Visualizacao de reports de tarefas concluidas
6. Criar secao "Desafios" com lista de desafios ativos
7. Modal de criacao de desafio: tipo, metrica, alvo, recompensa XP, duracao
8. Acompanhar progresso e leaderboard de cada desafio
9. Criar secao "Social" com metricas por equipe
10. Scorecard individual por cabo (posts, engagement, plataformas)

### Success criteria
- Coordenador cria tarefa no CONECTA e cabo recebe no app mobile
- Desafio criado no CONECTA aparece ativo para cabos
- Metricas sociais mostram dados reais de Instagram/X/TikTok
- Separacao clara entre tarefas CONECTA (Supabase) e tarefas Elexion

### Risks
- Endpoints de escrita (POST) podem exigir role ADMIN no Elexion — verificar e ajustar
- Confusao entre "tarefas" do CONECTA e do Elexion — nomear claramente na UI

---

## Phase 5: Hardening — Proxy Seguro + Sanitizacao

**Goal:** Token JWT do Elexion sai do browser. Seguranca pronta para eleicao.
**Requirements:** SEC-01, SEC-02, SEC-03, SEC-04
**Estimated effort:** 2-3 dias
**Depends on:** Phases 1-4 funcionando

### Tasks
1. Criar Supabase Edge Function `elexion-proxy` (Deno)
2. Implementar: validar sessao Supabase → forward para api.elexion.com.br com service account JWT
3. Criar/configurar service account no Elexion com token de longa duracao
4. Migrar elexion-client.js para usar proxy em vez de chamada direta
5. Auditar e sanitizar todos os innerHTML do CONECTA que usam dados da API
6. Remover `inteia.com.br` do CORS do Elexion (proxy elimina necessidade)
7. Testar que Socket.IO continua funcionando (direto, nao via proxy — Edge Function nao suporta WS)

### Success criteria
- Token JWT do Elexion nao existe mais no browser (nenhum sessionStorage)
- Todas as chamadas REST passam pelo proxy Supabase
- Socket.IO mantem conexao direta (exceção aceita — autenticado com token de curta duracao)
- innerHTML auditado: nenhum dado da API inserido sem sanitizacao

### Risks
- Latencia adicional do proxy (~100-200ms) — aceitavel para polling, testar UX
- Edge Function limite 150s wall-clock — suficiente para REST, nao para WebSocket
- Plano Supabase Free: verificar quota de invocacoes de Edge Functions

---

## Timeline Summary

```
Semana 1:  [=== Phase 1: Fundacao ===]
Semana 2:  [=== Phase 2: Dashboard ==][== Phase 3: Heatmap+WR (inicio) ==]
Semana 3:  [= Phase 3 (fim) =][=== Phase 4: Operacoes ===]
Semana 4:  [= Phase 4 (fim) =][== Phase 5: Hardening ==]
```

Fases 2 e 3 podem ser parcialmente paralelas (dashboard e heatmap sao independentes).
Fase 5 pode comecar mais cedo se necessario (seguranca prioritaria).

## Next Step

Run `/gsd:plan-phase 1` to create detailed execution plan for Phase 1: Fundacao.

---
*Last updated: 2026-03-29 after initialization*
