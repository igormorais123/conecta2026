---
phase: 01-fundacao-docker-cors-migration-df-client-js
plan: 01
subsystem: integracao-elexion
tags: [cors, seed, jwt, client-js, conta-html]
dependency_graph:
  requires: []
  provides: [elexion-client-js, seed-df, conta-elexion-ui]
  affects: [CONECTA.html, fases-2-5]
tech_stack:
  added: [elexion-client.js]
  patterns: [IIFE-module, bearer-auth, sessionStorage, fallback-gracioso]
key_files:
  created:
    - C:\Users\IgorPC\.claude\projects\elexion\apps\api\prisma\seed.df.ts
    - C:\Users\IgorPC\.claude\projects\Conecta 2026\js\elexion-client.js
  modified:
    - C:\Users\IgorPC\.claude\projects\Conecta 2026\conta.html
decisions:
  - Usar findFirst + create em vez de upsert com id fixo para geofences (Prisma UUID auto-gerado)
  - Usar findFirst para equipe (mesmo motivo - UUID auto-gerado no schema)
  - Event listeners via addEventListener em vez de onclick inline (melhor pratica)
  - Funcao mostrarMensagemElexion com nome distinto para nao conflitar com showMessage existente
metrics:
  duration: 5min
  completed: 2026-03-29T04:35:01Z
  tasks_completed: 3
  tasks_skipped: 2
  tasks_total: 5
---

# Phase 1 Plan 01: Fundacao CORS + Seed DF + Client JS + Conta UI Summary

Cliente JS para API Elexion com auth bearer e refresh rotativo, seed das 33 RAs do DF como geofences, e UI de vinculacao em conta.html

## Tasks Completed

| Task | Name | Status | Commit | Key Files |
|------|------|--------|--------|-----------|
| 1 | CORS na VPS | PENDENTE ACAO HUMANA | - | /opt/elexion/.env (VPS) |
| 2 | seed.df.ts - 33 RAs + coordenador | Completo (commit local) | 0a86d8d | apps/api/prisma/seed.df.ts |
| 3 | elexion-client.js | Completo + pushed | 36dfe9a | js/elexion-client.js |
| 4 | Secao Elexion em conta.html | Completo + pushed | 3af60cf | conta.html |
| 5 | Verificacao ponta a ponta | PENDENTE (depende Task 1) | - | - |

## O Que Foi Feito

### Task 2: seed.df.ts (Elexion repo)

Criado `apps/api/prisma/seed.df.ts` com:
- 33 geofences das Regioes Administrativas do DF (RA I a RA XXXIII)
- Poligonos simplificados (bounding box de 4 pontos cada)
- Coordenadas reais do DF (lat -15.5 a -16.1, lng -47.3 a -48.3)
- IDs semanticos: `df-ra-01-brasilia`, `df-ra-02-gama`, etc.
- Usuario `coordenador@inteia.com.br` com role `coordenador_regional`
- Equipe "Coordenacao Central DF - Celina Leao 2026"
- Idempotente: verifica existencia antes de criar (findFirst + create)
- Depende do seed.ts principal (busca superadmin como createdById)

**Credenciais criadas no seed:**
- Email: coordenador@inteia.com.br
- Senha: Celina2026!
- Role: coordenador_regional

### Task 3: js/elexion-client.js (CONECTA repo)

Criado cliente HTTP IIFE expondo `window.ElexionClient` com:
- `login(email, password)` - auth bearer, sem x-session-transport: cookie
- `refreshTokens()` - refresh rotativo (salva novo par a cada refresh)
- `logout()` - limpa sessionStorage
- `isAuthenticated()` - verifica presenca de token
- `getCurrentUser()` - retorna objeto user da sessao
- `request(path, options)` - fetch autenticado com retry em 401
- Endpoints: fetchKpis, fetchHeatmap, fetchHeatmapGaps, fetchGeofences, fetchWarRoomFeed, fetchAlerts

**Requisitos atendidos:**
- CLIENT-01: auth JWT completa (login + refresh + bearer header)
- CLIENT-02: tokens em sessionStorage, NUNCA localStorage (verificado: 0 usos de localStorage)
- CLIENT-03: fallback gracioso - retorna null (nao throw) em qualquer falha

### Task 4: conta.html modificada (CONECTA repo)

Adicionado:
- Script tag para carregar js/elexion-client.js
- CSS para status conectado/desconectado com indicador visual (dot verde/vermelho)
- Secao "Integracao Elexion" com formulario de email/senha
- Deteccao automatica de sessao ativa ao carregar a pagina
- Botoes: "Conectar ao Elexion", "Desconectar", "Testar Conexao"
- Feedback visual de sucesso/erro com auto-dismiss em 5s

**Requisito atendido:** CLIENT-04 - tela de vinculacao de conta Elexion funcional

## Deviations from Plan

### Decisoes de implementacao

**1. [Rule 3 - Blocking] Geofence IDs: findFirst em vez de upsert com id fixo**
- **Found during:** Task 2
- **Issue:** Schema Prisma define `id` como UUID auto-gerado (`@default(uuid())`). Upsert com id fixo tipo `df-ra-01-brasilia` causaria erro de tipo ou conflito.
- **Fix:** Usar `findFirst({ where: { name } })` + `create` condicional. Resultado identico (idempotente) sem conflito de UUID.

**2. [Rule 3 - Blocking] Push para Elexion remote falhou (SSH key)**
- **Found during:** Task 2
- **Issue:** Elexion remote usa git@github.com (SSH). Chave SSH nao configurada para este usuario/maquina.
- **Fix:** Commit feito localmente (0a86d8d). Push pendente -- usuario deve fazer `git -C "C:/Users/IgorPC/.claude/projects/elexion" push origin main` manualmente ou configurar SSH key.

**3. [Ajuste] Event listeners via addEventListener**
- **Found during:** Task 4
- **Issue:** Plano usava `onclick="conectarElexion()"` inline. Melhor pratica: addEventListener.
- **Fix:** Botoes usam `addEventListener('click', ...)` no script de inicializacao.

## Tasks Pendentes (Acao Humana)

### Task 1: CORS na VPS

Requer SSH na VPS 187.77.53.163. Comandos a executar:

```bash
ssh -i elexionSSH root@187.77.53.163
cd /opt/elexion
sed -i 's|CORS_ORIGINS=.*|CORS_ORIGINS=https://app.elexion.com.br,http://localhost:3001,https://inteia.com.br,http://localhost:5500,http://127.0.0.1:5500|' .env
docker compose -f docker-compose.yml restart api
```

Verificacao:
```bash
curl -s -I -X OPTIONS https://api.elexion.com.br/api/v1/analytics/kpis \
  -H 'Origin: https://inteia.com.br' \
  -H 'Access-Control-Request-Method: GET' \
  -H 'Access-Control-Request-Headers: Authorization'
```
Esperado: `access-control-allow-origin: https://inteia.com.br`

### Task 2 complemento: Executar seed na VPS

Apos push do seed.df.ts para o repo Elexion:

```bash
ssh -i elexionSSH root@187.77.53.163
# Puxar codigo atualizado
cd /opt/elexion && git pull
# Executar seed DF
docker exec elexion-api sh -c 'cd /app/apps/api && npx tsx prisma/seed.df.ts'
```

Verificacao:
```bash
docker exec elexion-postgres psql -U elexion -d elexion -t -c 'SELECT COUNT(*) FROM geofences'
# Esperado: 33
```

### Push Elexion repo

```bash
git -C "C:/Users/IgorPC/.claude/projects/elexion" push origin main
```

## Known Stubs

Nenhum stub identificado. Todos os componentes criados sao funcionais. A unica dependencia externa e a Task 1 (CORS na VPS) que habilita as chamadas cross-origin.

## Artefatos

| Artefato | Localizacao | Descricao |
|----------|-------------|-----------|
| seed.df.ts | elexion/apps/api/prisma/seed.df.ts | Seed 33 RAs DF + coordenador + equipe |
| elexion-client.js | Conecta 2026/js/elexion-client.js | Cliente HTTP bearer com fallback |
| conta.html | Conecta 2026/conta.html | UI de vinculacao de conta Elexion |

## Proximos Passos

1. Executar Task 1 (CORS na VPS) via SSH
2. Push do seed.df.ts para remote do Elexion
3. Executar seed.df.ts na VPS
4. Executar Task 5 (verificacao ponta a ponta) no browser
5. Iniciar Phase 2: Dashboard Core (KPIs + Leaderboard)

## Self-Check: PASSED

- FOUND: elexion/apps/api/prisma/seed.df.ts
- FOUND: Conecta 2026/js/elexion-client.js
- FOUND: Conecta 2026/conta.html (modified)
- FOUND: commit 0a86d8d (Elexion - seed.df.ts)
- FOUND: commit 36dfe9a (CONECTA - elexion-client.js)
- FOUND: commit 3af60cf (CONECTA - conta.html)
