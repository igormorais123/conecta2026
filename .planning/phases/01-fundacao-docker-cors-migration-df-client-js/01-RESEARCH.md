# Phase 1: Fundacao — Docker + CORS + Migration DF + Client JS - Research

**Researched:** 2026-03-29
**Domain:** NestJS CORS, Docker VPS deploy, PostgreSQL seed, JWT auth, vanilla JS client
**Confidence:** HIGH — Elexion source code lido diretamente + SSH ao VPS confirmou estado atual

---

## Summary

A infraestrutura do Elexion **ja esta rodando na VPS Hostinger**. Todos os containers (nestjs-api, postgres, redis, nginx, certbot, web) estao `Up` e saudaveis. O endpoint `https://api.elexion.com.br/api/v1/health` retorna HTTP 200. O banco tem schema completo e seed do Roraima aplicado (9 usuarios, 2 equipes). Isso muda o escopo da Fase 1 em relacao ao previsto: nao e deploy do zero, e **adaptacao de instalacao existente**.

Os dois bloqueadores reais da Fase 1 sao: (1) `CORS_ORIGINS` no `.env` da VPS nao inclui `https://inteia.com.br` — o preflight retorna 204 mas sem o header `Access-Control-Allow-Origin`, portanto o browser bloqueia; (2) geofences table esta vazia (0 linhas) e as equipes sao de Roraima, nao do DF.

O fluxo de auth do Elexion tem dois modos: **cookie** (`x-session-transport: cookie`, httpOnly, para web) e **bearer** (para mobile). O CONECTA deve usar o modo bearer: POST /api/v1/auth/login com email+password, recebe `accessToken` (JWT 15min) + `refreshToken` (opaco, 7 dias), armazena em sessionStorage, injeta como `Authorization: Bearer` em cada fetch. O refresh e feito via POST /api/v1/auth/refresh com body `{"refreshToken": "..."}` — sem cookie.

A migration de DF nao existe no repo — precisa ser criada como seed TypeScript seguindo o mesmo padrao do `seed.ts` existente. O formato do polygon e `{latitude: number, longitude: number}[]` (array de GeoCoordinate, minimo 3 pontos), armazenado como JSONB no PostgreSQL. As 33 Regioes Administrativas do DF tem poligonos GeoJSON publicos disponibilizados pelo IBGE e pelo GDF. O seed DF deve: (a) criar 33 geofences com poligonos RA, (b) criar equipes Celina Leao por regiao, (c) criar usuario coordenador com role `coordenador_regional`.

**Recomendacao primaria:** Nao redeployar. Atualizar CORS_ORIGINS no .env da VPS, reiniciar o container api, criar e executar seed DF, criar usuario coordenador via seed ou POST /api/v1/users (requer role ADMIN).

---

<phase_requirements>
## Phase Requirements

| ID | Descricao | Suporte da Pesquisa |
|----|-----------|---------------------|
| INFRA-01 | Elexion API rodando na VPS Hostinger (Docker: NestJS + PostgreSQL + Redis + nginx) | CONCLUIDO — VPS ja rodando, confirmado por SSH |
| INFRA-02 | CORS habilitado no NestJS para `https://inteia.com.br` (REST + WebSocket gateway) | Requer adicao de `https://inteia.com.br` ao CORS_ORIGINS no .env + restart api container |
| INFRA-03 | Migration DF executada: 33 RAs como geofences, seeds de equipes Celina Leao | Seed DF nao existe — criar seed.df.ts seguindo padrao do seed.ts; formato polygon confirmado |
| INFRA-04 | Usuario coordenador criado no Elexion com role `coordenador_regional` | Via POST /api/v1/users (requer ADMIN); ou via seed DF; role enum confirmado como `coordenador_regional` |
| CLIENT-01 | `js/elexion-client.js` com auth JWT (login, refresh, bearer header) | Endpoints confirmados: POST /auth/login, POST /auth/refresh com body refreshToken (modo bearer) |
| CLIENT-02 | Token JWT em sessionStorage (nunca localStorage) | Confirmado: auth controller aceita tokens no body para clientes bearer (nao-cookie) |
| CLIENT-03 | Fallback gracioso quando Elexion indisponivel (nao quebrar CONECTA) | Padrao try/catch com flag de estado; CONECTA nao pode depender do Elexion para funcionar |
| CLIENT-04 | Tela de vinculacao de conta Elexion em conta.html ou configuracoes | UI simples: email + senha → POST /auth/login → feedback de sucesso/erro |
</phase_requirements>

---

## Estado Atual da VPS (CRITICO — muda o plano)

**Descoberto por SSH direto ao servidor 187.77.53.163.**

| Container | Status | Ports |
|-----------|--------|-------|
| elexion-api | Up 24h (healthy) | :3000 (interno) |
| elexion-web | Up 24h (healthy) | :3001 (interno) |
| elexion-nginx | Up 4d | 0.0.0.0:80, 0.0.0.0:443 |
| elexion-postgres | Up 4d (healthy) | :5432 (interno) |
| elexion-certbot | Up 4d | interno |
| elexion-redis | Up 4d (healthy) | :6379 (interno) |

**API health:** `https://api.elexion.com.br/api/v1/health` → HTTP 200, `{"status":"ok"}`

**CORS_ORIGINS atual:** `https://app.elexion.com.br,http://localhost:3001`

**inteia.com.br no CORS:** NAO — preflight retorna 204 mas sem `Access-Control-Allow-Origin: https://inteia.com.br`. Browser vai bloquear.

**Banco de dados:** Schema completo, seed RR aplicado (9 usuarios, 2 equipes — "Equipe Centro" e "Equipe Zona Oeste")

**Geofences:** 0 linhas — tabela vazia.

**Firewall VPS:** Apenas portas 22, 80, 443 abertas. Porta 3000 NAO exposta diretamente (correto).

**Deploy path:** `/opt/elexion/` no servidor. `.env` em `/opt/elexion/.env`.

---

## Standard Stack

### Infraestrutura existente (nao mudar)

| Componente | Versao | Config |
|------------|--------|--------|
| NestJS API | 10+ | Container `elexion-api`, porta 3000 interna |
| PostgreSQL + PostGIS | 16-3.4 | Container `elexion-postgres`, volume `elexion-pgdata` |
| Redis | 7-alpine | Container `elexion-redis`, maxmemory 256mb |
| Nginx | 1.27-alpine | Reverse proxy + SSL termination, portas 80/443 |
| Certbot | latest | Auto-renewal cada 12h, certs em volume `elexion-nginx-certs` |
| Prisma ORM | 6.x | Monorepo turborepo, schema em `apps/api/prisma/schema.prisma` |

### Ferramentas para Fase 1 (sem instalacao nova)

| Ferramenta | Uso | Como |
|------------|-----|------|
| SSH com chave elexionSSH | Acesso VPS | `ssh -i elexionSSH root@187.77.53.163` |
| docker exec | Comandos dentro dos containers | `docker exec elexion-api sh -c '...'` |
| npx prisma db seed | Executar seed DF | `cd /app/apps/api && npx prisma db seed` |
| psql | Verificar dados | `docker exec elexion-postgres psql -U elexion -d elexion -c '...'` |

### Configuracao CORS atual (arquivo de referencia)

`/opt/elexion/.env` no servidor:
```env
CORS_ORIGINS=https://app.elexion.com.br,http://localhost:3001
```

Mudar para:
```env
CORS_ORIGINS=https://app.elexion.com.br,http://localhost:3001,https://inteia.com.br
```

### Como o NestJS le CORS_ORIGINS

```typescript
// apps/api/src/main.ts (linha 49)
app.enableCors({
  origin: configService.get<string>('CORS_ORIGINS', 'http://localhost:3001').split(','),
  credentials: true,
});
```

Portanto: adicionar `https://inteia.com.br` ao `.env`, reiniciar apenas o container api. Nginx nao precisa mudar — ele delega CORS ao NestJS (comentario no default.conf: "CORS is handled by NestJS — do NOT add CORS headers here").

---

## Architecture Patterns

### Fluxo de Auth — modo bearer (o que o CONECTA deve usar)

O Elexion tem dois modos de transporte de tokens:
- **Cookie** (web nativo): header `x-session-transport: cookie` → tokens em httpOnly cookies, refresh via cookie
- **Bearer** (mobile/externo): sem esse header → tokens no body da resposta, refresh via body

O CONECTA deve usar o modo **bearer** (sem enviar `x-session-transport: cookie`).

```
1. POST /api/v1/auth/login
   Body: {"email": "coord@elexion.com.br", "password": "..."}
   Response: {"accessToken": "eyJ...", "refreshToken": "abc123hex...", "user": {...}}

2. Guardar em sessionStorage:
   sessionStorage.setItem('elexion_access_token', data.accessToken)
   sessionStorage.setItem('elexion_refresh_token', data.refreshToken)

3. Cada fetch autenticado:
   Authorization: Bearer <accessToken>

4. Quando 401: POST /api/v1/auth/refresh
   Body: {"refreshToken": "abc123hex..."}
   Response: novos tokens (refresh token rotativo — usar o novo)
   OBS: NAO enviar cookie, NAO enviar x-session-transport

5. Token expira: accessToken 15min, refreshToken 7 dias
```

**CRITICO:** O refreshToken e **opaco** (hex aleatorio de 256 bits), nao um JWT. O accessToken e um JWT com claims: `{sub, role, email, teamId}`. O refresh token e armazenado como hash SHA-256 no banco e e **rotativo** (cada uso invalida e gera novo par).

### Roles e permissoes (confirmado do codigo)

```
UserRole.SUPERADMIN = 'superadmin'   (nivel 0 — acesso total)
UserRole.ADMIN = 'admin'             (nivel 1 — gerencia usuarios)
UserRole.COORDENADOR_REGIONAL = 'coordenador_regional'  (nivel 2)
UserRole.COORDENADOR = 'coordenador' (nivel 3 — minimo para analytics, geofences, war room)
UserRole.CABO_ELEITORAL = 'cabo_eleitoral' (nivel 4 — apenas campo)
```

**Regra do RolesGuard:** `userLevel <= requiredRole.level`. Portanto `coordenador_regional` (nivel 2) tem acesso a tudo que requer `coordenador` (nivel 3) ou superior.

**Endpoints que o CONECTA vai usar (Fase 1-4) — todos requerem minimo COORDENADOR:**
- `GET /api/v1/analytics/kpis` — COORDENADOR+
- `GET /api/v1/analytics/heatmap` — COORDENADOR+
- `GET /api/v1/analytics/heatmap/gaps` — COORDENADOR+
- `GET /api/v1/war-room/feed` — COORDENADOR+
- `GET /api/v1/war-room/alerts` — COORDENADOR+
- `GET /api/v1/geofences` — COORDENADOR+
- `POST /api/v1/geofences` — COORDENADOR+

**Para criar usuario COORDENADOR_REGIONAL:** Requer ADMIN. O superadmin existente (`renan@elexion.com.br`, senha `Elexion2026!`) pode fazer isso via `POST /api/v1/users`.

### Formato do Polygon (geofences)

```typescript
// CreateGeofenceDto — polygon e array de GeoCoordinate
polygon: [{latitude: number, longitude: number}, ...]  // minimo 3 pontos

// Armazenado como JSONB no PostgreSQL
// coluna: polygon jsonb NOT NULL
```

O GeoJSON das RAs do DF tem coordenadas em `[longitude, latitude]` (formato GeoJSON padrao). Precisa inverter ao criar geofences no Elexion, pois o DTO usa `{latitude, longitude}`.

### Formato de retorno do heatmap (confirmado)

```typescript
// GET /api/v1/analytics/heatmap → HeatMapPoint[]
interface HeatMapPoint {
  latitude: number;
  longitude: number;
  intensity: number;
}

// GET /api/v1/analytics/heatmap/h3 → H3HeatMapResult
interface H3HeatMapResult {
  cells: H3AggregatedData[];
  resolution: H3Resolution;
  totalDataPoints: number;
}
```

Dados retornados com base em `task_assignments.check_in_latitude/longitude` — precisam de cabos fazendo check-in para ter dados. Para testes iniciais o banco estara vazio (sem atividade de campo ainda).

### Estrutura do elexion-client.js

```javascript
// js/elexion-client.js — IIFE module pattern (vanilla JS)
const ElexionClient = (() => {
  const BASE = 'https://api.elexion.com.br/api/v1';
  const TOKEN_KEY = 'elexion_access_token';
  const REFRESH_KEY = 'elexion_refresh_token';

  // Auth: login retorna {accessToken, refreshToken, user}
  // Modo bearer: sem x-session-transport header
  // refreshToken e opaco (hex), NAO e JWT

  // Refresh token e ROTATIVO: cada uso invalida o atual e retorna novo par
  // Guardar SEMPRE o novo refresh token apos cada refresh

  // Retorna null (nao throw) quando Elexion indisponivel — CLIENT-03
})();
```

### Nginx — WebSocket CORS ja configurado corretamente

O nginx `default.conf` ja tem bloco `/socket.io/` com headers de upgrade corretos. O CORS do WebSocket gateway do NestJS e **independente** do `app.enableCors()` e precisa ser configurado no decorator `@WebSocketGateway`.

Verificar se o war-room gateway tem `cors` configurado — nao lido nesta pesquisa (arquivo `war-room.gateway.ts` pode existir, ou o gateway pode estar no war-room.service).

---

## Don't Hand-Roll

| Problema | Nao Construir | Usar Isto | Por que |
|----------|---------------|-----------|---------|
| Polygon DF das 33 RAs | Coordenadas manuais | GeoJSON oficial IBGE/GDF | IBGE fornece shapefile e GeoJSON das RAs do DF (atualizados 2022) |
| Verificacao de ponto em poligono | Algoritmo proprio | `geofences.service.ts` ja tem ray-casting; PostGIS `ST_Contains` para producao | Ja implementado no Elexion |
| Rotacao de refresh token | Logica custom | Ja implementada em `auth.service.ts` | Invalida o anterior automaticamente no banco |
| Retry em 401 | Loop custom | Interceptor padrao em elexion-client.js | Uma so implementacao, reutilizavel em todos os fetches |

---

## Common Pitfalls

### Pitfall 1: CORS sem inteia.com.br — bloqueio silencioso

**O que da errado:** CORS_ORIGINS atual nao tem `https://inteia.com.br`. Preflight retorna 204 mas sem `Access-Control-Allow-Origin`, entao o browser bloqueia o request real. Parece erro de rede no DevTools.

**Como evitar:** Adicionar `https://inteia.com.br` ao `.env` na VPS e reiniciar so o container `elexion-api` (nao o nginx):
```bash
# Na VPS
echo "CORS_ORIGINS=https://app.elexion.com.br,http://localhost:3001,https://inteia.com.br" >> /opt/elexion/.env
# ou editar o .env e alterar a linha CORS_ORIGINS
docker compose -f docker-compose.yml restart api
```

**Verificacao:** `curl -I -X OPTIONS https://api.elexion.com.br/api/v1/analytics/kpis -H 'Origin: https://inteia.com.br' -H 'Access-Control-Request-Method: GET' -H 'Access-Control-Request-Headers: Authorization'` deve retornar `access-control-allow-origin: https://inteia.com.br`.

---

### Pitfall 2: credentials: true + CORS_ORIGINS exige origins explicitas

**O que da errado:** O `main.ts` usa `credentials: true`. Com `credentials: true`, o browser rejeita qualquer wildcard `*`. Por isso CORS_ORIGINS ja lista origins explicitamente — manter assim.

**Como evitar:** Nunca usar `*` em CORS_ORIGINS quando `credentials: true`. Listar cada origem explicitamente.

---

### Pitfall 3: Refresh token rotativo — cliente deve salvar novo token

**O que da errado:** Apos um refresh bem-sucedido, o `refreshToken` anterior e invalidado no banco. Se o cliente reutilizar o token antigo (porque nao salvou o novo), recebera 401 e sera forcado a relogar.

**Como evitar:** Sempre sobrescrever `sessionStorage.setItem('elexion_refresh_token', newTokens.refreshToken)` apos cada refresh. O `accessToken` tambem muda.

---

### Pitfall 4: Seed DF deve usar upsert, nao insert

**O que da errado:** Se o seed for executado duas vezes (por acidente), inserts simples geram duplicatas ou erros de unique constraint.

**Como evitar:** Usar o padrao do `seed.ts` existente:
```typescript
await prisma.geofence.upsert({
  where: { id: 'df-ra-01-brasilia' },
  update: {},
  create: { id: 'df-ra-01-brasilia', name: 'Brasilia (Plano Piloto)', ... }
});
```

---

### Pitfall 5: GeoJSON longitude/latitude invertidos

**O que da errado:** GeoJSON padrao usa `[longitude, latitude]`. O Elexion `CreateGeofenceDto` usa `{latitude, longitude}`. Converter sem inverter gera geofences com coordenadas erradas no DF.

**Como evitar:** Ao converter GeoJSON para o formato Elexion:
```typescript
// GeoJSON: [lng, lat]
// Elexion: {latitude, longitude}
polygon: geoJsonCoords.map(([lng, lat]) => ({ latitude: lat, longitude: lng }))
```

---

### Pitfall 6: Modo de transporte auth — nao enviar x-session-transport: cookie

**O que da errado:** Se o CONECTA enviar o header `x-session-transport: cookie`, o Elexion entra no modo cookie: nao retorna tokens no body, so define cookies httpOnly. O CONECTA nao consegue ler cookies httpOnly.

**Como evitar:** No `elexion-client.js`, nao enviar `x-session-transport` em nenhuma request. O Elexion usa modo bearer por padrao (sem esse header).

---

### Pitfall 7: Criar usuario coordenador requer role ADMIN, nao COORDENADOR

**O que da errado:** `POST /api/v1/users` requer `@Roles(UserRole.ADMIN)`. Um coordenador nao pode criar outro coordenador.

**Como evitar:** Usar o superadmin existente (`renan@elexion.com.br`) ou o admin (`admin@elexion.com.br`) para criar o usuario coordenador do CONECTA. Senha default do seed: `Elexion2026!`.

---

### Pitfall 8: WebSocket CORS e configurado separado do REST

**O que da errado:** `app.enableCors()` nao afeta o Socket.IO gateway. O gateway tem seu proprio `cors` config no `@WebSocketGateway` decorator.

**Pesquisa:** O arquivo `war-room.gateway.ts` nao foi identificado nesta pesquisa. Pode estar embutido em `war-room.service.ts` ou `war-room.listener.ts`. Deve ser localizado e verificado antes da Fase 3 (War Room).

---

## Code Examples

### Login no Elexion (modo bearer)

```javascript
// Source: apps/api/src/auth/auth.controller.ts (lido diretamente)
async function loginElexion(email, password) {
  const res = await fetch('https://api.elexion.com.br/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // SEM x-session-transport: cookie
    body: JSON.stringify({ email, password }),
    mode: 'cors',
  });
  if (!res.ok) throw new Error(`Login falhou: ${res.status}`);
  const data = await res.json();
  // data = { accessToken: "eyJ...", refreshToken: "abc123hex...", user: {...} }
  sessionStorage.setItem('elexion_access_token', data.accessToken);
  sessionStorage.setItem('elexion_refresh_token', data.refreshToken);
  return data.user;
}
```

### Refresh de token (modo bearer)

```javascript
// Source: apps/api/src/auth/auth.controller.ts
async function refreshElexionToken() {
  const refreshToken = sessionStorage.getItem('elexion_refresh_token');
  if (!refreshToken) throw new Error('Sem refresh token');

  const res = await fetch('https://api.elexion.com.br/api/v1/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),  // body, NAO cookie
    mode: 'cors',
  });
  if (!res.ok) throw new Error('Refresh falhou — relogar necessario');
  const data = await res.json();
  // SEMPRE salvar AMBOS os tokens novos (refresh e rotativo)
  sessionStorage.setItem('elexion_access_token', data.accessToken);
  sessionStorage.setItem('elexion_refresh_token', data.refreshToken);
  return data.accessToken;
}
```

### Fetch autenticado com retry em 401

```javascript
// Padrao para todos os endpoints autenticados
async function elexionFetch(path) {
  const token = sessionStorage.getItem('elexion_access_token');
  let res = await fetch(`https://api.elexion.com.br/api/v1${path}`, {
    headers: { 'Authorization': `Bearer ${token}` },
    mode: 'cors',
  });

  if (res.status === 401) {
    try {
      const newToken = await refreshElexionToken();
      res = await fetch(`https://api.elexion.com.br/api/v1${path}`, {
        headers: { 'Authorization': `Bearer ${newToken}` },
        mode: 'cors',
      });
    } catch {
      // Refresh falhou — deslogar do Elexion (mas NAO do CONECTA)
      sessionStorage.removeItem('elexion_access_token');
      sessionStorage.removeItem('elexion_refresh_token');
      return null;  // CLIENT-03: nao quebrar o CONECTA
    }
  }
  if (!res.ok) return null;  // Fallback gracioso
  return res.json();
}
```

### Adicionar inteia.com.br ao CORS na VPS

```bash
# SSH na VPS
ssh -i elexionSSH root@187.77.53.163

# Editar .env (alterar linha CORS_ORIGINS)
cd /opt/elexion
sed -i 's|CORS_ORIGINS=.*|CORS_ORIGINS=https://app.elexion.com.br,http://localhost:3001,https://inteia.com.br|' .env

# Reiniciar apenas o container api (nginx nao precisa reiniciar)
docker compose -f docker-compose.yml restart api

# Verificar CORS (deve retornar access-control-allow-origin: https://inteia.com.br)
curl -I -X OPTIONS https://api.elexion.com.br/api/v1/analytics/kpis \
  -H 'Origin: https://inteia.com.br' \
  -H 'Access-Control-Request-Method: GET' \
  -H 'Access-Control-Request-Headers: Authorization'
```

### Seed DF — estrutura base

```typescript
// apps/api/prisma/seed.df.ts (criar este arquivo)
// Executar: cd /app/apps/api && npx ts-node prisma/seed.df.ts

// Formato de polygon confirmado:
await prisma.geofence.upsert({
  where: { id: 'df-ra-01-brasilia' },
  update: {},
  create: {
    id: 'df-ra-01-brasilia',
    name: 'Brasilia (Plano Piloto)',
    description: 'RA I — Regiao Administrativa de Brasilia',
    polygon: [
      // GeoJSON [lng, lat] → Elexion {latitude, longitude}
      { latitude: -15.7797, longitude: -47.9297 },
      { latitude: -15.7901, longitude: -47.9001 },
      { latitude: -15.8050, longitude: -47.9200 },
      // ... poligono completo da RA
    ],
    createdById: superadminId,
  },
});
```

### Criar usuario coordenador_regional via API

```bash
# POST /api/v1/users — requer token de ADMIN ou SUPERADMIN
# Pegar token do superadmin primeiro:
TOKEN=$(curl -s -X POST https://api.elexion.com.br/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"renan@elexion.com.br","password":"Elexion2026!"}' \
  | jq -r '.accessToken')

# Criar coordenador do CONECTA
curl -X POST https://api.elexion.com.br/api/v1/users \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "coordenador@inteia.com.br",
    "name": "Coordenador CONECTA",
    "password": "<senha_forte>",
    "role": "coordenador_regional"
  }'
```

---

## Environment Availability

| Dependencia | Requerida por | Disponivel | Versao | Fallback |
|-------------|---------------|------------|--------|----------|
| VPS Hostinger 187.77.53.163 | INFRA-01 | Sim (confirmado por SSH) | Ubuntu 25.10 | — |
| Docker + todos containers | INFRA-01 | Sim (todos healthy) | nginx 1.27, postgres 16, redis 7 | — |
| SSL api.elexion.com.br | INFRA-01 | Sim (certbot ativo, certs Let's Encrypt) | — | — |
| `https://api.elexion.com.br/api/v1/health` | Todos | Sim, HTTP 200 | — | — |
| CORS para inteia.com.br | INFRA-02 | NAO (falta na CORS_ORIGINS) | — | Adicionar ao .env + restart |
| Geofences DF | INFRA-03 | NAO (tabela vazia) | — | Criar seed.df.ts |
| Equipes Celina Leao | INFRA-03 | NAO (teams sao de RR) | — | Criar via seed DF |
| Usuario coordenador DF | INFRA-04 | NAO | — | Criar via POST /users ou seed |
| js/elexion-client.js | CLIENT-01..04 | NAO (arquivo nao existe) | — | Criar |
| conta.html | CLIENT-04 | Verificar se existe no CONECTA | Desconhecido | Criar secao em CONECTA.html |

**Dependencias bloqueantes sem fallback:**
- Nenhuma — todos os bloqueios tem solucao clara documentada acima.

**Dependencias faltando com solucao:**
- CORS_ORIGINS: editar .env + restart container api
- Geofences DF: criar seed.df.ts com poligonos GeoJSON das 33 RAs
- Usuario coordenador: criar via API usando credenciais de admin existentes

---

## Open Questions

1. **WebSocket gateway CORS config**
   - O que sabemos: `war-room.controller.ts` existe, endpoints documentados, requer COORDENADOR+
   - O que nao sabemos: onde esta o `@WebSocketGateway` decorator e se ja tem `cors` configurado para `inteia.com.br`
   - Recomendacao: Procurar `war-room.gateway.ts` ou buscar `@WebSocketGateway` em `war-room.module.ts`. Configurar na Fase 1 junto com o CORS REST para evitar regresso na Fase 3.

2. **Poligonos GeoJSON das 33 RAs do DF — fonte de dados**
   - O que sabemos: formato esperado confirmado (`{latitude, longitude}[]`), precisam ser invertidos do GeoJSON padrao
   - O que nao sabemos: qual fonte usar (IBGE, GDF, OpenStreetMap)
   - Recomendacao: Usar dados do IBGE (malha municipal 2022) ou do portal dados.df.gov.br — precisão suficiente para geofences de campanha.

3. **conta.html no CONECTA**
   - O que sabemos: REQUIREMENTS.md menciona "conta.html ou configuracoes"
   - O que nao sabemos: se esse arquivo existe no CONECTA atual ou precisa ser criado
   - Recomendacao: Verificar a lista de arquivos do projeto CONECTA antes de planejar. Se nao existir, adicionar secao "Integracoes" em CONECTA.html.

4. **Vercel preview URLs**
   - O que sabemos: CONECTA esta hospedado na Vercel (inteia.com.br)
   - O que nao sabemos: se ha URLs de preview (ex: `*.vercel.app`) que tambem precisam estar no CORS
   - Recomendacao: Para desenvolvimento, adicionar tambem `http://localhost:5500` ou `http://127.0.0.1:5500` ao CORS_ORIGINS.

---

## Validation Architecture

Nao ha framework de testes no CONECTA (HTML+JS puro, sem build step). Validacao e por smoke tests manuais + curl.

| Req ID | Comportamento | Tipo | Comando | Arquivo |
|--------|--------------|------|---------|---------|
| INFRA-01 | API health endpoint retorna 200 | smoke | `curl -s https://api.elexion.com.br/api/v1/health` | — |
| INFRA-02 | Preflight CORS retorna Allow-Origin inteia.com.br | smoke | `curl -I -X OPTIONS ... -H 'Origin: https://inteia.com.br'` | — |
| INFRA-03 | 33 geofences na tabela | smoke | `docker exec elexion-postgres psql ... -c 'SELECT COUNT(*) FROM geofences'` | — |
| INFRA-04 | Usuario coordenador existe e consegue logar | smoke | `curl -X POST .../auth/login -d '{email, password}'` | — |
| CLIENT-01 | Login retorna accessToken + refreshToken | smoke | Abrir CONECTA no browser, abrir console, testar elexion-client.js | — |
| CLIENT-02 | Token em sessionStorage, nao localStorage | smoke | DevTools → Application → Storage → verificar | — |
| CLIENT-03 | CONECTA carrega normalmente quando Elexion indisponivel | manual | Testar com Elexion offline (docker stop elexion-api) | — |
| CLIENT-04 | UI de vinculacao de conta funciona | manual | Abrir CONECTA → conta/integracoes → inserir credenciais | — |

**Gate de conclusao da Fase 1:**
```bash
# 1. Health check
curl -s https://api.elexion.com.br/api/v1/health | grep '"status":"ok"'

# 2. CORS
curl -s -o /dev/null -w "%{http_code}" -X OPTIONS https://api.elexion.com.br/api/v1/analytics/kpis \
  -H 'Origin: https://inteia.com.br' \
  -H 'Access-Control-Request-Method: GET' \
  -H 'Access-Control-Request-Headers: Authorization'
# Esperado: 204, com header access-control-allow-origin: https://inteia.com.br

# 3. Login e KPIs (prova de conceito CLIENT-01 + INFRA-04)
TOKEN=$(curl -s -X POST https://api.elexion.com.br/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"coordenador@inteia.com.br","password":"<senha>"}' | jq -r '.accessToken')
curl -s -H "Authorization: Bearer $TOKEN" https://api.elexion.com.br/api/v1/analytics/kpis

# 4. Geofences DF
docker exec elexion-postgres psql -U elexion -d elexion -c 'SELECT COUNT(*) FROM geofences'
# Esperado: 33
```

---

## Sources

### Primary (HIGH confidence — codigo-fonte lido diretamente)

- `C:\Users\IgorPC\.claude\projects\elexion\apps\api\src\main.ts` — configuracao CORS, prefix, bootstrap
- `C:\Users\IgorPC\.claude\projects\elexion\apps\api\src\auth\auth.controller.ts` — endpoints de auth, modo cookie vs bearer
- `C:\Users\IgorPC\.claude\projects\elexion\apps\api\src\auth\auth.service.ts` — logica de tokens, expiracao, rotacao
- `C:\Users\IgorPC\.claude\projects\elexion\packages\shared\src\types\roles.ts` — enum UserRole com valores exatos
- `C:\Users\IgorPC\.claude\projects\elexion\packages\shared\src\types\analytics.ts` — tipos HeatMapPoint, CampaignKpis
- `C:\Users\IgorPC\.claude\projects\elexion\apps\api\src\analytics\analytics.controller.ts` — endpoints e roles requeridos
- `C:\Users\IgorPC\.claude\projects\elexion\apps\api\src\geofences\geofences.controller.ts` e `.service.ts` — formato polygon, autorizacao
- `C:\Users\IgorPC\.claude\projects\elexion\docker-compose.staging.yml` — servicos, limites de memoria, env vars
- `C:\Users\IgorPC\.claude\projects\elexion\infra\nginx\conf.d\default.conf` — CORS delegado ao NestJS, WebSocket config
- `C:\Users\IgorPC\.claude\projects\elexion\apps\api\prisma\seed.ts` — padrao de seed com upsert
- `C:\Users\IgorPC\.claude\projects\elexion\infra\scripts\deploy.sh` e `init-ssl.sh` — procedimentos de deploy

### Primary (HIGH confidence — SSH ao servidor)

- VPS 187.77.53.163: `docker ps` — status de todos os containers confirmado
- VPS 187.77.53.163: `curl https://api.elexion.com.br/api/v1/health` — API respondendo HTTP 200
- VPS 187.77.53.163: `printenv CORS_ORIGINS` — valor atual confirmado
- VPS 187.77.53.163: `psql ... SELECT email, role FROM users` — usuarios existentes confirmados
- VPS 187.77.53.163: `psql ... SELECT COUNT(*) FROM geofences` — 0 linhas confirmado
- VPS 187.77.53.163: CORS preflight — ausencia de `access-control-allow-origin: https://inteia.com.br` confirmada

---

## Metadata

**Confidence breakdown:**
- Estado da VPS e containers: HIGH — verificado por SSH direto
- Configuracao CORS atual e o que mudar: HIGH — codigo fonte + verificacao live
- Fluxo de auth bearer: HIGH — auth controller e service lidos, comportamento verificado
- Roles e permissoes: HIGH — enum e RolesGuard lidos, hierarquia documentada
- Formato dos dados da API (KPIs, heatmap): HIGH — tipos TypeScript lidos do shared package
- Seed DF (formato polygon): HIGH — DTO lido, schema PostgreSQL confirmado por psql
- WebSocket gateway CORS: MEDIUM — controller lido mas `@WebSocketGateway` nao localizado
- Poligonos GeoJSON das 33 RAs: MEDIUM — formato necessario claro, fonte de dados a confirmar

**Research date:** 2026-03-29
**Valid until:** 2026-04-28 (VPS e infra estaveis; dados do banco mudam apos execucao do seed DF)
