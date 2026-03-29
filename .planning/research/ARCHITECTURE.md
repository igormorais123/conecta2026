# Architecture Patterns

**Domain:** Integracao CONECTA (HTML+JS+Supabase) com Elexion (NestJS+PostgreSQL)
**Researched:** 2026-03-28

## Arquitetura Recomendada

```
FASE 1-4 (bearer direto — rapido para prova de conceito):

┌─────────────────────────────────────────────────┐
│  NAVEGADOR DO COORDENADOR                       │
│                                                 │
│  CONECTA.html                                   │
│  ├── Auth: supabase-config.js (login)           │
│  ├── elexion-client.js (novo — fetch wrapper)   │
│  │    └── Authorization: Bearer <token-elexion>  │
│  ├── leaderboard.js → Chart.js render           │
│  ├── heatmap.js → Leaflet + Leaflet.heat        │
│  └── warroom.js → Socket.IO client              │
└──────────┬──────────────────────┬───────────────┘
           │ HTTPS fetch          │ WSS
           ▼                      ▼
┌──────────────────┐   ┌──────────────────────────┐
│  Supabase        │   │  VPS Hostinger           │
│  (existente)     │   │  nginx (443 → :3000)     │
│  Supabase Auth   │   │                          │
│  PostgreSQL      │   │  Docker: nestjs-api       │
│  Edge Functions  │   │  Docker: postgres+postgis │
│  (fase 5: proxy) │   │  Docker: nginx           │
└──────────────────┘   └──────────────────────────┘

FASE 5 (proxy — token nao exposto no browser):

CONECTA.html → Supabase Edge Function → Elexion API
               (valida JWT Supabase,    (usa JWT Elexion
                usa JWT Elexion         do Supabase Secret)
                do Secret)
```

## Componentes e Fronteiras

| Componente | Responsabilidade | Comunica Com |
|-----------|-----------------|-------------|
| `elexion-client.js` | Wrapper de fetch para Elexion API. Gerencia token, retry, erro | Elexion API REST |
| `elexion-store.js` | Cache em memoria de respostas Elexion. Evita refetch desnecessario | elexion-client.js |
| `leaderboard.js` | Renderiza ranking de cabos com XP, badges, streaks | elexion-store.js, Chart.js |
| `heatmap.js` | Renderiza cobertura geografica das RAs do DF | elexion-store.js, Leaflet |
| `warroom.js` | Gerencia conexao Socket.IO e atualiza feed em tempo real | Socket.IO client |
| `dashboard-kpis.js` | Cards de KPIs (tarefas, XP total, cabos ativos) | elexion-store.js |
| Supabase Edge Function `elexion-proxy` | Proxy seguro que esconde JWT Elexion (Fase 5) | Elexion API, Supabase Auth |
| NestJS Elexion API | Backend gamificacao — nao modificar estrutura | PostgreSQL+PostGIS |

## Fluxo de Dados

### Fase 1-4: Bearer direto

```
1. Coordenador loga no CONECTA (Supabase Auth)
2. CONECTA autentica no Elexion:
   POST api.elexion.com.br/api/v1/auth/login
   → retorna access_token (15min) + refresh_token (7d)
3. Token armazenado em sessionStorage (nao localStorage — menor janela XSS)
4. elexion-client.js injeta Bearer em cada fetch
5. Polling setInterval(60000) para KPIs + leaderboard
6. Socket.IO conecta para war room:
   io('wss://api.elexion.com.br', { auth: { token } })
7. Token Elexion renovado via refresh_token antes de expirar (14min)
```

### Fase 5: Proxy Edge Function

```
1. Coordenador loga CONECTA → recebe JWT Supabase (como hoje)
2. Qualquer fetch para Elexion vai para:
   https://dvgbqbwipwegkndutvte.supabase.co/functions/v1/elexion-proxy
3. Edge Function valida JWT Supabase (usuario eh coordenador autorizado)
4. Edge Function usa ELEXION_TOKEN (Supabase Secret) para chamar Elexion API
5. Resposta retorna ao CONECTA — token Elexion nunca toca o browser
```

## Patterns a Seguir

### Pattern 1: Modulo JS isolado por funcionalidade

Cada nova secao do CONECTA ganha um arquivo .js separado injetado na pagina.
Evita poluir o CONECTA.html de 217KB com mais logica inline.

```javascript
// elexion-client.js — exemplo de wrapper
const ElexionClient = (() => {
  const BASE = 'https://api.elexion.com.br/api/v1';
  let token = sessionStorage.getItem('elexion_token');

  async function get(path) {
    const res = await fetch(`${BASE}${path}`, {
      headers: { 'Authorization': `Bearer ${token}` },
      mode: 'cors'
    });
    if (res.status === 401) await refreshToken();
    return res.json();
  }

  return { get };
})();
```

### Pattern 2: Polling com fallback antes do WebSocket

Implementar polling simples (setInterval) antes do Socket.IO.
Garante funcionalidade basica enquanto configura WebSocket.

```javascript
// Fase 1: polling
const poll = setInterval(() => loadKPIs(), 60_000);

// Fase 3: substituir por Socket.IO
const socket = io('wss://api.elexion.com.br', {
  auth: { token: sessionStorage.getItem('elexion_token') }
});
socket.on('kpis:updated', (data) => renderKPIs(data));
clearInterval(poll); // para o polling quando Socket.IO conecta
```

### Pattern 3: Supabase Edge Function como proxy

```typescript
// supabase/functions/elexion-proxy/index.ts
import { serve } from 'https://deno.land/std/http/server.ts';

serve(async (req) => {
  // 1. Verificar JWT Supabase
  const authHeader = req.headers.get('Authorization');
  // validar com supabase admin sdk...

  // 2. Extrair path da query
  const url = new URL(req.url);
  const path = url.searchParams.get('path');

  // 3. Chamar Elexion com token do Secret
  const elexionToken = Deno.env.get('ELEXION_TOKEN');
  const upstream = await fetch(`https://api.elexion.com.br/api/v1${path}`, {
    headers: { 'Authorization': `Bearer ${elexionToken}` }
  });

  return new Response(await upstream.text(), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

## Anti-Patterns a Evitar

### Anti-Pattern 1: Token Elexion em localStorage

**O que e:** Salvar o JWT do Elexion em localStorage para persistir entre sessoes.
**Por que e ruim:** Qualquer script XSS injected no CONECTA.html rouba o token. localStorage e acessivel por qualquer JS da pagina.
**Em vez disso:** Usar sessionStorage (desaparece ao fechar aba) nas fases 1-4. Usar proxy (Fase 5) para nao expor token algum.

### Anti-Pattern 2: CORS wildcard com credentials

**O que e:** Configurar `origin: '*'` no NestJS junto com `credentials: true`.
**Por que e ruim:** Rejeitado pelo browser por especificacao CORS. Nao funciona.
**Em vez disso:** Listar origins especificas: `['https://inteia.com.br']`.

### Anti-Pattern 3: Buscar dados em cada render de UI

**O que e:** Fazer fetch para Elexion toda vez que o usuario clica em aba ou abre modal.
**Por que e ruim:** 3 coordenadores = 3 sessoes, mas pode gerar dezenas de requests/min. VPS tem recursos limitados.
**Em vez disso:** Cache em memoria com TTL (ex: 60s). Revalidar apenas quando expirado.

### Anti-Pattern 4: Um arquivo JS monolitico

**O que e:** Adicionar toda logica Elexion diretamente no CONECTA.html (ja tem 217KB).
**Por que e ruim:** Impossivel de manter, debug, e testar. Carregamento inicial piora.
**Em vez disso:** Arquivos separados carregados via `<script src>` com defer.

## Consideracoes de Escalabilidade

| Preocupacao | 3 coordenadores (atual) | 30 coordenadores | 300 coordenadores |
|-------------|------------------------|-----------------|------------------|
| Elexion REST | setInterval 60s OK | Adicionar cache | Redis cache obrigatorio |
| Socket.IO | 1 namespace ok | Rooms por equipe | Redis adapter para scaling |
| VPS 8GB | Suficiente (4.25GB alocado) | Suficiente | Upgrade VPS necessario |
| Supabase Edge | 150s timeout ok para proxy simples | Ok ate ~1000 req/min | Plano Pro necessario |
| PostgreSQL | Sem problema | Sem problema | Indices PostGIS criticos |

## Sequencia de Construcao (ordem de dependencias)

```
1. Deploy Docker Elexion na VPS (bloqueador de tudo)
2. NestJS CORS habilitado para inteia.com.br
3. elexion-client.js + autenticacao bearer no CONECTA
4. KPIs + leaderboard (fetch simples, sem graficos)
5. Chart.js graficos de performance
6. Leaflet heatmap geografico
7. Socket.IO war room
8. Proxy Supabase Edge Function (substitui bearer)
9. Formulario criacao de desafios
```

## Sources

- [NestJS CORS Security Docs](https://docs.nestjs.com/security/cors)
- [Socket.IO CORS Handling](https://socket.io/docs/v3/handling-cors/)
- [Supabase Edge Functions Architecture](https://supabase.com/docs/guides/functions/architecture)
- [JWT Security: localStorage vs sessionStorage](https://workos.com/blog/secure-jwt-storage)
- [Real-Time Dashboard Patterns](https://blog.openreplay.com/real-time-dashboards-nodejs/)
