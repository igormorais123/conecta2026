# Domain Pitfalls

**Domain:** Integracao cross-origin HTML+JS com NestJS gamificado em VPS
**Researched:** 2026-03-28

## Pitfalls Criticos

Erros que causam reescrita ou bloqueio total do projeto.

### Pitfall 1: CORS Preflight bloqueado por falta de OPTIONS no NestJS

**O que da errado:** O browser envia uma requisicao OPTIONS (preflight) antes de qualquer fetch com header Authorization. Se o NestJS nao responder corretamente ao OPTIONS, TODOS os fetches falham com "blocked by CORS policy" — mesmo com o servidor respondendo ao GET real.

**Por que acontece:** NestJS por padrao nao habilita CORS. A config `app.enableCors()` deve ser chamada ANTES de `app.listen()`. Muitos tutoriais mostram isso na ordem errada.

**Consequencias:** Nenhum dado do Elexion aparece no CONECTA. Parece bug de rede, nao de config.

**Prevencao:**
```typescript
// main.ts — ORDEM IMPORTA
const app = await NestFactory.create(AppModule);
app.enableCors({                          // ANTES do listen
  origin: ['https://inteia.com.br'],
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
await app.listen(3000);
```

**Deteccao:** No DevTools → Network → filtrar "blocked" ou preflight OPTIONS com status != 204.

---

### Pitfall 2: CORS wildcard (`*`) com Authorization header

**O que da errado:** `origin: '*'` parece "deixar tudo passar", mas o browser REJEITA automaticamente qualquer request com header `Authorization: Bearer ...` quando a resposta tem `Access-Control-Allow-Origin: *`. Resulta em CORS error mesmo com o servidor "aceitando".

**Por que acontece:** Especificacao CORS proibe wildcard com credenciais/headers customizados. Muitos devs testam sem Authorization header e pensam que CORS esta funcionando.

**Consequencias:** Todos os endpoints autenticados do Elexion falham silenciosamente.

**Prevencao:** Listar origins explicitamente. Nunca usar `*` quando ha Authorization header.

**Deteccao:** Error "The value of the 'Access-Control-Allow-Origin' header in the response must not be the wildcard '*' when the request's credentials mode is 'include' or when it is a cross-origin request with headers".

---

### Pitfall 3: Token JWT Elexion em localStorage — vetor XSS

**O que da errado:** O CONECTA.html tem 217KB de JS inline. Um XSS (via dado de campanha injetado, ex: nome de candidato com `<script>`) pode roubar o token do localStorage e autenticar no Elexion como coordenador.

**Por que acontece:** localStorage e acessivel por qualquer JS na pagina, sem restricao de origem interna.

**Consequencias:** Acesso total a API Elexion por atacante. Vazamento de dados de cabos eleitorais (LGPD).

**Prevencao:**
- Fases 1-4: usar `sessionStorage` (menor janela, nao persiste entre abas)
- Fase 5 (definitivo): proxy Supabase Edge Function — token Elexion nunca chega ao browser
- Sanitizar TODOS os dados antes de renderizar no DOM (`textContent` em vez de `innerHTML`)

**Deteccao:** Revisar todos os `innerHTML` no CONECTA.html que usam dados vindos de API.

---

### Pitfall 4: Docker na VPS sem memoria reservada — OOM Killer

**O que da errado:** Sem limites de memoria no docker-compose.yml, o PostgreSQL+PostGIS pode consumir toda a RAM disponivel (8GB) durante uma query espacial complexa (heatmap). O kernel Linux mata processos (OOM Killer) — geralmente o NestJS, derrubando a API.

**Por que acontece:** Docker por padrao nao limita containers. PostGIS com queries de distancia/densidade sao pesadas.

**Consequencias:** API Elexion cai aleatoriamente durante uso intenso (dia de eleicao). Dificil de diagnosticar sem monitoramento.

**Prevencao:**
```yaml
# docker-compose.yml
services:
  nestjs-api:
    deploy:
      resources:
        limits:
          memory: 1500M
          cpus: '1.0'
  postgres:
    deploy:
      resources:
        limits:
          memory: 2500M
          cpus: '0.8'
    environment:
      - POSTGRES_SHARED_BUFFERS=512MB
      - POSTGRES_WORK_MEM=64MB
```

**Deteccao:** `docker stats` — monitorar uso de memoria em tempo real. Se algum container chega a 90%+ do limite, tunar.

---

### Pitfall 5: WebSocket CORS diferente do HTTP CORS

**O que da errado:** Habilitar CORS no `app.enableCors()` do NestJS nao afeta o Socket.IO WebSocket gateway. O gateway tem configuracao CORS propria no decorator `@WebSocketGateway`. Resultado: fetch funciona, Socket.IO falha.

**Por que acontece:** NestJS trata HTTP e WebSocket como pilhas separadas. O `enableCors()` afeta apenas o adaptador HTTP (Express/Fastify).

**Consequencias:** War room nao conecta. Error "WebSocket connection to 'wss://...' failed".

**Prevencao:**
```typescript
@WebSocketGateway({
  cors: {
    origin: ['https://inteia.com.br'],
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'], // fallback polling
})
export class WarRoomGateway {}
```

**Deteccao:** DevTools → Network → WS — ver handshake. Se retorna 403, e CORS do gateway.

---

## Pitfalls Moderados

### Pitfall 6: Refresh de token Elexion nao implementado — sessao expira em 15min

**O que da errado:** Token Elexion expira em 15min. Se o coordenador deixar o CONECTA aberto e voltar depois, todas as requests falham com 401.

**Prevencao:** Interceptor no `elexion-client.js` que detecta 401, chama `/auth/refresh` com o refresh_token, atualiza o sessionStorage e repete a request original.

---

### Pitfall 7: Elexion adaptado para RR — geofences e equipes erradas para DF

**O que da errado:** Seeds, geofences e configuracao de equipes no Elexion foram feitos para Roraima (Jorge Everton). Ao subir a instancia DF, os dados de referencia geografica e nomes de equipes estarao errados.

**Prevencao:** Criar migration/seed especifica para DF antes de qualquer teste com o CONECTA:
- Geofences: 33 Regioes Administrativas do DF (poligonos GeoJSON)
- Equipes: estrutura da campanha Celina Leao (coordenadores regionais)
- Candidata: alterar strings de "Jorge Everton" para "Celina Leao"

---

### Pitfall 8: Supabase Edge Function com latencia adicionada no proxy

**O que da errado:** Edge Functions executam nos servidores da Supabase (mais proximo do usuario). Mas o Elexion esta em SP (VPS Hostinger). Cada request passa por: browser → Supabase Edge → VPS SP → Supabase Edge → browser. Latencia adicional de ~100-200ms por request.

**Prevencao:** Aceitar a latencia para dados nao-criticos (KPIs, leaderboard). Para war room em tempo real (Socket.IO), manter conexao direta ao WebSocket da VPS — NAO proxear WebSocket pela Edge Function (nao suportado).

---

### Pitfall 9: Supabase Edge Function timeout de 150s para idle

**O que da errado:** Se o Elexion API demorar mais de 150s para responder (ex: query PostGIS pesada sem indice), a Edge Function retorna 504 Gateway Timeout antes da resposta chegar.

**Prevencao:** Garantir indices corretos no PostgreSQL/PostGIS para queries de heatmap. Adicionar timeout explicito no fetch da Edge Function (ex: 10s) para falhar rapido em vez de esperar 150s.

---

### Pitfall 10: Chart.js canvas nao renderiza em secao escondida (display:none)

**O que da errado:** Se o Chart.js inicializar um canvas dentro de uma secao com `display:none` (ex: aba nao ativa no CONECTA), o canvas tem dimensoes zero e o grafico nao renderiza. Quando a secao aparece, o grafico esta corrompido.

**Prevencao:** Inicializar o Chart apenas quando a secao estiver visivel. Usar `chart.resize()` quando a secao abrir. Ou usar `display:block; visibility:hidden` em vez de `display:none` durante a inicializacao.

---

## Pitfalls Menores

### Pitfall 11: Leaflet.heat perde performance com mais de 10.000 pontos

**O que da errado:** O endpoint `/analytics/heatmap` pode retornar pontos de cada visita de cabo. Com 500 cabos fazendo 20 visitas cada = 10.000 pontos. Leaflet.heat fica lento no render.

**Prevencao:** Pedir ao Elexion que agregue por celula geografica (grid H3 ou por RA) antes de retornar. Maximo 500 pontos para o heatmap renderizar fluidamente.

---

### Pitfall 12: `setInterval` nao limpo causa memory leak em SPA-like

**O que da errado:** O CONECTA usa secoes alternadas (estilo SPA). Se o setInterval de polling nao for limpo quando a secao Elexion sai da tela, continuara fazendo requests em background indefinidamente.

**Prevencao:** Armazenar o ID do interval e limpar com `clearInterval` ao esconder a secao.

---

## Warnings por Fase

| Topico da Fase | Pitfall Provavel | Mitigacao |
|----------------|-----------------|-----------|
| Fase 1: CORS + bearer | OPTIONS preflight bloqueado | Testar com curl + Origin header antes do browser |
| Fase 1: Deploy Docker | OOM Killer derruba API | Configurar limits no compose antes de subir |
| Fase 2: Leaderboard + KPIs | Token expira em 15min | Implementar refresh interceptor desde o inicio |
| Fase 3: Graficos Chart.js | Canvas em secao oculta | Inicializar apenas quando visivel |
| Fase 3: Heatmap | Dados RR no lugar de DF | Rodar migration DF antes de qualquer teste |
| Fase 4: War Room Socket.IO | CORS do gateway separado do HTTP | Configurar `@WebSocketGateway` CORS explicitamente |
| Fase 5: Proxy Edge Function | Latencia +150ms, timeout 150s | Nao proxear WebSocket; timeout explicito de 10s |
| Fase 5: Proxy Edge Function | JWT em sessionStorage ate Fase 5 | Mitigar com sanitizacao de innerHTML no CONECTA |

## Sources

- [NestJS CORS Production Guide](https://felixastner.com/articles/enabling-nestjs-cors-in-production)
- [Socket.IO CORS Handling](https://socket.io/docs/v3/handling-cors/)
- [JWT Storage Security](https://pragmaticwebsecurity.com/articles/oauthoidc/localstorage-xss.html)
- [Docker Memory Limits](https://docs.docker.com/engine/containers/resource_constraints/)
- [Supabase Edge Functions Limits](https://supabase.com/docs/guides/functions/limits)
- [PostGIS Performance Tips](https://postgis.net/docs/manual-3.0/performance_tips.html)
- [Stealing JWTs via XSS](https://medium.com/redteam/stealing-jwts-in-localstorage-via-xss-6048d91378a0)
