# Technology Stack

**Project:** Integracao Elexion → CONECTA 2026
**Researched:** 2026-03-28

## Stack Existente (nao mudar)

| Sistema | Tecnologia | Versao | Notas |
|---------|-----------|--------|-------|
| CONECTA frontend | HTML5 + CSS3 + JS puro | N/A | Sem frameworks, sem build step |
| CONECTA auth | Supabase Auth | JS SDK v2 | Username-based, chaves em supabase-config.js |
| CONECTA persistencia | Supabase (PostgreSQL) | dvgbqbwipwegkndutvte | Prefixo `conectacelina_` no localStorage |
| CONECTA hosting | Vercel | N/A | inteia.com.br/conecta2026/ |
| Elexion API | NestJS | v10+ | api.elexion.com.br:3000, porta custom |
| Elexion banco | PostgreSQL 16 + PostGIS | 16 | Docker, geodados para heatmap |
| Elexion WebSocket | Socket.IO (via NestJS) | v4 | wss://api.elexion.com.br/socket.io/ |
| Elexion hosting | VPS Hostinger | 2 vCPU, 8GB RAM | 187.77.53.163, Sao Paulo |

## Bibliotecas a Adicionar ao CONECTA

### Visualizacao de Dados
| Biblioteca | Versao CDN | CDN URL | Por que |
|-----------|-----------|---------|---------|
| Chart.js | 4.x (atual) | `https://cdn.jsdelivr.net/npm/chart.js` | Graficos de barra/linha/pizza sem build. Nativo vanilla JS. Canvas-based. Mais simples que D3. |
| Leaflet.js | 1.9.x | `https://unpkg.com/leaflet@1.9.4/dist/leaflet.js` | Mapas interativos para heatmap de cobertura das RAs do DF. 42KB, sem deps. |
| Leaflet.heat | 0.2.0 | `https://leaflet.github.io/Leaflet.heat/dist/leaflet-heat.js` | Plugin de heatmap para Leaflet. Simples, leve. |

### Comunicacao em Tempo Real
| Biblioteca | Versao CDN | CDN URL | Por que |
|-----------|-----------|---------|---------|
| Socket.IO Client | 4.8.3 | `https://cdn.socket.io/4.8.3/socket.io.min.js` | Conecta ao WebSocket do Elexion. Registra `io` como global. Fallback polling automatico. |

### Sem novas dependencias para
- Fetch API: nativa no browser, suficiente para REST
- Auth Supabase: ja existe via supabase-config.js
- Proxy: Supabase Edge Functions (Deno nativo, sem libs extras)

## Stack para Supabase Edge Functions (proxy fase 5)

| Item | Tecnologia | Por que |
|------|-----------|---------|
| Runtime | Deno (Supabase Edge) | Disponivel no plano existente, sem servidor adicional |
| HTTP client | `fetch` nativo Deno | Recomendado oficialmente, sem Axios |
| Auth verificacao | Supabase JWT middleware | Valida token CONECTA antes de repassar |
| Segredo Elexion | Supabase Secrets (env vars) | Token Elexion nao exposto no browser |
| Framework opcional | Hono (se complexidade crescer) | Leve, suportado nativamente em Edge Functions |

## Alternativas Consideradas

| Categoria | Recomendado | Alternativa | Por que nao |
|-----------|-------------|-------------|-------------|
| Graficos | Chart.js | D3.js | D3 tem curva acentuada, verboso demais para dashboards simples |
| Graficos | Chart.js | ApexCharts | ApexCharts e maior (750KB vs 200KB Chart.js) |
| Mapas | Leaflet + Leaflet.heat | Google Maps API | Google Maps requer billing/chave, Leaflet e gratuito |
| Mapas | Leaflet + Leaflet.heat | Mapbox GL JS | Mapbox requer token pago para volume |
| WebSocket | Socket.IO Client | WebSocket nativo | Socket.IO tem fallback polling e reconexao automatica, mais robusto |
| Proxy | Supabase Edge Functions | Cloudflare Workers | Supabase ja esta no stack, evita conta adicional |
| Proxy | Supabase Edge Functions | Servidor Node proprio | Mais infra para manter, VPS ja esta no limite |

## Instalacao (tudo via CDN, sem npm)

```html
<!-- Chart.js para graficos -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

<!-- Leaflet para heatmap geografico -->
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="https://leaflet.github.io/Leaflet.heat/dist/leaflet-heat.js"></script>

<!-- Socket.IO para war room em tempo real -->
<script src="https://cdn.socket.io/4.8.3/socket.io.min.js"
  integrity="sha384-kzavj5fiMwLKzzD1f8S7TeoVIEi7uKHvbTA3ueZkrzYq75pNQUiUi6Dy98Q3fxb0"
  crossorigin="anonymous"></script>
```

## Configuracao NestJS (lado Elexion)

```typescript
// main.ts — habilitar CORS para inteia.com.br
app.enableCors({
  origin: [
    'https://inteia.com.br',
    'https://www.inteia.com.br',
    // adicionar preview URLs do Vercel se necessario
  ],
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false, // Bearer token, nao cookie — credentials false esta correto
});

// gateway.ts — CORS para WebSocket
@WebSocketGateway({
  cors: {
    origin: ['https://inteia.com.br'],
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
})
```

## Configuracao Docker para VPS (8GB RAM, 2 vCPU)

Alocacao recomendada para nao estourar recursos:

| Container | mem_limit | cpus | Justificativa |
|-----------|-----------|------|---------------|
| nestjs-api | 1.5GB | 1.0 | NestJS leve em producao |
| postgres | 2.5GB | 0.8 | shared_buffers=512MB, work_mem=64MB |
| nginx | 256MB | 0.2 | Apenas proxy/SSL |
| **Total** | **4.25GB** | **2.0** | Deixa 3.75GB para OS + Docker daemon |

## Sources

- [Socket.IO Client Installation v4.8.3](https://socket.io/docs/v4/client-installation/)
- [Chart.js Getting Started](https://www.chartjs.org/docs/latest/getting-started/)
- [Leaflet.heat GitHub](https://github.com/Leaflet/Leaflet.heat)
- [NestJS CORS Docs](https://docs.nestjs.com/security/cors)
- [Supabase Edge Functions Limits](https://supabase.com/docs/guides/functions/limits)
- [Docker Resource Constraints](https://docs.docker.com/engine/containers/resource_constraints/)
