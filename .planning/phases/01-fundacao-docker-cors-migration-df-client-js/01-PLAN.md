---
phase: 01-fundacao-docker-cors-migration-df-client-js
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - C:\Users\IgorPC\.claude\projects\elexion\apps\api\prisma\seed.df.ts
  - C:\Users\IgorPC\.claude\projects\Conecta 2026\js\elexion-client.js
  - C:\Users\IgorPC\.claude\projects\Conecta 2026\conta.html
autonomous: false
requirements: [INFRA-01, INFRA-02, INFRA-03, INFRA-04, CLIENT-01, CLIENT-02, CLIENT-03, CLIENT-04]

must_haves:
  truths:
    - "curl para https://api.elexion.com.br/api/v1/health retorna 200 com {\"status\":\"ok\"}"
    - "Preflight OPTIONS com Origin: https://inteia.com.br retorna access-control-allow-origin: https://inteia.com.br"
    - "SELECT COUNT(*) FROM geofences retorna 33"
    - "Login com coordenador@inteia.com.br retorna accessToken JWT valido"
    - "ElexionClient.login() no console do CONECTA armazena token em sessionStorage (nao localStorage)"
    - "ElexionClient.fetchKpis() no console retorna dados (ou null sem quebrar a pagina)"
    - "Abrir conta.html mostra secao Elexion com campos de email e senha funcionais"
  artifacts:
    - path: "C:\\Users\\IgorPC\\.claude\\projects\\elexion\\apps\\api\\prisma\\seed.df.ts"
      provides: "Seed TypeScript das 33 RAs do DF + equipes Celina Leao + usuario coordenador"
      contains: "prisma.geofence.upsert"
    - path: "C:\\Users\\IgorPC\\.claude\\projects\\Conecta 2026\\js\\elexion-client.js"
      provides: "IIFE ElexionClient com login, refresh, fetchAutenticado, fallback"
      exports: ["window.ElexionClient"]
    - path: "C:\\Users\\IgorPC\\.claude\\projects\\Conecta 2026\\conta.html"
      provides: "Secao de vinculacao de conta Elexion com UI funcional"
      contains: "elexion-client.js"
  key_links:
    - from: "VPS /opt/elexion/.env"
      to: "apps/api/src/main.ts enableCors()"
      via: "CORS_ORIGINS env var lida em runtime"
      pattern: "CORS_ORIGINS=.*inteia\\.com\\.br"
    - from: "VPS /opt/elexion/.env"
      to: "apps/api/src/events/events.gateway.ts @WebSocketGateway"
      via: "process.env.CORS_ORIGINS lido no decorator (mesma var — um restart resolve ambos)"
      pattern: "process\\.env\\.CORS_ORIGINS"
    - from: "js/elexion-client.js"
      to: "sessionStorage"
      via: "setItem('elexion_access_token', ...) e setItem('elexion_refresh_token', ...)"
      pattern: "sessionStorage\\.setItem"
    - from: "conta.html"
      to: "js/elexion-client.js"
      via: "<script src=\"js/elexion-client.js\"> antes do script inline da pagina"
      pattern: "elexion-client\\.js"
---

<objective>
Tornar a API Elexion acessivel pelo CONECTA via fetch cross-origin.

Purpose: Fase bloqueadora — nenhuma integracao das fases 2-5 funciona sem isso. CORS bloqueado = tela em branco no DevTools. Seed vazio = heatmap sem dados. Client.js ausente = nenhum endpoint chamavel.

Output:
- VPS com CORS_ORIGINS incluindo inteia.com.br (REST + WebSocket em um restart)
- 33 geofences das Regioes Administrativas do DF na tabela do Elexion
- Usuario coordenador@inteia.com.br com role coordenador_regional
- js/elexion-client.js com auth bearer, refresh rotativo e fallback gracioso
- conta.html com secao de vinculacao de conta Elexion
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@.planning/STATE.md
@.planning/phases/01-fundacao-docker-cors-migration-df-client-js/01-RESEARCH.md

<interfaces>
<!-- Lidos diretamente do codigo-fonte do Elexion. Executor nao precisa explorar o repo. -->

De apps/api/src/main.ts (linha 49):
```typescript
app.enableCors({
  origin: configService.get<string>('CORS_ORIGINS', 'http://localhost:3001').split(','),
  credentials: true,
});
```
Le CORS_ORIGINS do .env e divide por virgula. Adicionar https://inteia.com.br e reiniciar container.

De apps/api/src/events/events.gateway.ts (linha 22-27):
```typescript
@WebSocketGateway({
  cors: {
    origin: (process.env.CORS_ORIGINS || 'http://localhost:3001').split(','),
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
```
MESMO process.env.CORS_ORIGINS — uma alteracao no .env e um restart do container api resolve REST + WebSocket.

De apps/api/src/auth/auth.controller.ts (modo bearer):
```
POST /api/v1/auth/login
Body: { email, password }            (sem x-session-transport: cookie)
Response: { accessToken, refreshToken, user }

POST /api/v1/auth/refresh
Body: { refreshToken }               (token opaco hex, NAO JWT)
Response: { accessToken, refreshToken }   (refresh e ROTATIVO — sempre salvar o novo)
```

De packages/shared/src/types/roles.ts:
```typescript
enum UserRole {
  superadmin = 'superadmin',   // nivel 0
  admin = 'admin',             // nivel 1
  coordenador_regional = 'coordenador_regional',  // nivel 2
  coordenador = 'coordenador', // nivel 3
  cabo_eleitoral = 'cabo_eleitoral',  // nivel 4
}
```

De apps/api/prisma/seed.ts (padrao upsert):
```typescript
await prisma.geofence.upsert({
  where: { id: 'rr-ra-01-boa-vista' },
  update: {},
  create: {
    id: 'rr-ra-01-boa-vista',
    name: 'Boa Vista',
    description: 'Capital de Roraima',
    polygon: [
      { latitude: 2.8194, longitude: -60.6714 },
      // ... minimo 3 pontos GeoCoordinate
    ],
    createdById: superadmin.id,
  },
});
```
Formato polygon: { latitude: number, longitude: number }[] (minimo 3 pontos)
ATENCAO: GeoJSON usa [longitude, latitude] — inverter ao converter: map(([lng, lat]) => ({ latitude: lat, longitude: lng }))

POST /api/v1/users (requer ADMIN ou SUPERADMIN):
```json
{ "email": "...", "name": "...", "password": "...", "role": "coordenador_regional" }
```
Superadmin existente: renan@elexion.com.br / Elexion2026!

js/conecta-db.js e js/supabase-config.js existem — elexion-client.js sera o terceiro arquivo em js/.
conta.html existe e tem estrutura de card com CSS inline compativel (paleta #1a237e / #ff6f00).
</interfaces>
</context>

<tasks>

<task type="checkpoint:human-action">
  <name>Task 1: Adicionar inteia.com.br ao CORS_ORIGINS na VPS e reiniciar container api</name>
  <what-built>
    Nada foi automatizado ainda — esta acao requer SSH na VPS porque o executor nao tem acesso direto ao servidor.
    O CORS e o bloqueador #1: sem isso, nenhum fetch do CONECTA para o Elexion funciona.
  </what-built>
  <how-to-verify>
    Execute os comandos abaixo via SSH. A chave elexionSSH deve estar disponivel localmente.

    **Passo 1 — SSH e editar .env:**
    ```bash
    ssh -i elexionSSH root@187.77.53.163
    cd /opt/elexion

    # Verificar valor atual (deve mostrar sem inteia.com.br):
    grep CORS_ORIGINS .env

    # Substituir a linha CORS_ORIGINS:
    sed -i 's|CORS_ORIGINS=.*|CORS_ORIGINS=https://app.elexion.com.br,http://localhost:3001,https://inteia.com.br,http://localhost:5500,http://127.0.0.1:5500|' .env

    # Confirmar a mudanca:
    grep CORS_ORIGINS .env
    # Esperado: CORS_ORIGINS=https://app.elexion.com.br,http://localhost:3001,https://inteia.com.br,http://localhost:5500,http://127.0.0.1:5500
    ```

    **Passo 2 — Reiniciar apenas o container api:**
    ```bash
    docker compose -f docker-compose.yml restart api
    # Aguardar ~15s e verificar status:
    docker ps --filter name=elexion-api
    # Esperado: Status "Up X seconds (healthy)" ou similar
    ```

    **Passo 3 — Verificar CORS REST (na VPS ou na sua maquina local):**
    ```bash
    curl -s -I -X OPTIONS https://api.elexion.com.br/api/v1/analytics/kpis \
      -H 'Origin: https://inteia.com.br' \
      -H 'Access-Control-Request-Method: GET' \
      -H 'Access-Control-Request-Headers: Authorization'
    ```
    Esperado nos headers da resposta:
    - `access-control-allow-origin: https://inteia.com.br`
    - HTTP status 204

    **Passo 4 — Verificar CORS localhost (para desenvolvimento local):**
    ```bash
    curl -s -I -X OPTIONS https://api.elexion.com.br/api/v1/analytics/kpis \
      -H 'Origin: http://localhost:5500' \
      -H 'Access-Control-Request-Method: GET' \
      -H 'Access-Control-Request-Headers: Authorization'
    ```
    Esperado: `access-control-allow-origin: http://localhost:5500`

    **Resultado para continuar:** Ambos os curls devem retornar access-control-allow-origin correto.
    O WebSocket (events.gateway.ts) usa a mesma env var — ja esta corrigido tambem.
  </how-to-verify>
  <action>Acao manual requerida: SSH na VPS e editar /opt/elexion/.env conforme instrucoes em how-to-verify acima.</action>
  <verify><automated>curl -sI -X OPTIONS https://api.elexion.com.br/api/v1/analytics/kpis -H 'Origin: https://inteia.com.br' -H 'Access-Control-Request-Method: GET' -H 'Access-Control-Request-Headers: Authorization' | grep -i 'access-control-allow-origin'</automated></verify>
  <done>Header access-control-allow-origin: https://inteia.com.br presente na resposta do preflight OPTIONS</done>
  <resume-signal>
    Digite "cors ok" apos confirmar que o curl retorna access-control-allow-origin: https://inteia.com.br
    Se houver problema, cole a saida do curl e o erro.
  </resume-signal>
</task>

<task type="auto">
  <name>Task 2: Criar seed.df.ts — 33 RAs do DF como geofences + equipes Celina Leao + coordenador</name>
  <files>C:\Users\IgorPC\.claude\projects\elexion\apps\api\prisma\seed.df.ts</files>
  <action>
    Criar o arquivo `apps/api/prisma/seed.df.ts` no repo Elexion.
    Este seed e idempotente (upsert em tudo) — pode ser executado multiplas vezes sem duplicatas.

    **Estrutura do arquivo:**

    1. Importar PrismaClient e bcrypt (mesmo padrao do seed.ts existente)
    2. Definir os 33 registros de geofence com IDs fixos no formato `df-ra-{NN}-{slug}`:
       - RA I: df-ra-01-brasilia — Brasilia (Plano Piloto)
       - RA II: df-ra-02-gama — Gama
       - RA III: df-ra-03-taguatinga — Taguatinga
       - RA IV: df-ra-04-brazlandia — Brazlandia
       - RA V: df-ra-05-sobradinho — Sobradinho
       - RA VI: df-ra-06-planaltina — Planaltina
       - RA VII: df-ra-07-paranoa — Paranoa
       - RA VIII: df-ra-08-nucleo-bandeirante — Nucleo Bandeirante
       - RA IX: df-ra-09-ceilandia — Ceilandia
       - RA X: df-ra-10-guara — Guara
       - RA XI: df-ra-11-cruzeiro — Cruzeiro
       - RA XII: df-ra-12-samambaia — Samambaia
       - RA XIII: df-ra-13-santa-maria — Santa Maria
       - RA XIV: df-ra-14-sao-sebastiao — Sao Sebastiao
       - RA XV: df-ra-15-recanto-emas — Recanto das Emas
       - RA XVI: df-ra-16-lago-sul — Lago Sul
       - RA XVII: df-ra-17-riacho-fundo — Riacho Fundo
       - RA XVIII: df-ra-18-lago-norte — Lago Norte
       - RA XIX: df-ra-19-candangolandia — Candangolandia
       - RA XX: df-ra-20-aguas-claras — Aguas Claras
       - RA XXI: df-ra-21-riacho-fundo-ii — Riacho Fundo II
       - RA XXII: df-ra-22-sudoeste-octogonal — Sudoeste/Octogonal
       - RA XXIII: df-ra-23-varjao — Varjao
       - RA XXIV: df-ra-24-park-way — Park Way
       - RA XXV: df-ra-25-scia — SCIA (Estrutural)
       - RA XXVI: df-ra-26-sobradinho-ii — Sobradinho II
       - RA XXVII: df-ra-27-jardim-botanico — Jardim Botanico
       - RA XXVIII: df-ra-28-itapoa — Itapoa
       - RA XXIX: df-ra-29-sao-sebastiao-expansao — SIA
       - RA XXX: df-ra-30-vicente-pires — Vicente Pires
       - RA XXXI: df-ra-31-fercal — Fercal
       - RA XXXII: df-ra-32-sol-nascente — Sol Nascente/Por do Sol
       - RA XXXIII: df-ra-33-arniqueira — Arniqueira

    Para o polygon de cada RA, usar coordenadas aproximadas do centroide + bounding box simplificado
    (4 pontos formando um retangulo ao redor da RA). Coordenadas reais do DF:
    O DF fica entre lat -15.5 a -16.1 e lng -47.3 a -48.3.

    Exemplo para Brasilia (Plano Piloto) — poligono simplificado da Asa Norte + Asa Sul:
    ```typescript
    polygon: [
      { latitude: -15.7200, longitude: -47.9500 },
      { latitude: -15.7200, longitude: -47.8500 },
      { latitude: -15.8400, longitude: -47.8500 },
      { latitude: -15.8400, longitude: -47.9500 },
    ]
    ```

    Cada RA deve ter poligono com pelo menos 4 pontos (retangulo ou forma simplificada).
    Nao e necessario ser perfeito — geofences serao refinadas depois se necessario.
    O importante e ter 33 registros validos para o COUNT(*) = 33.

    3. Apos as geofences, criar 1 usuario coordenador_regional para o CONECTA:
    ```typescript
    await prisma.user.upsert({
      where: { email: 'coordenador@inteia.com.br' },
      update: {},
      create: {
        email: 'coordenador@inteia.com.br',
        name: 'Coordenador CONECTA Celina Leao',
        passwordHash: await bcrypt.hash('Celina2026!', 12),
        role: UserRoleEnum.coordenador_regional,
        isActive: true,
      },
    });
    ```

    4. Criar 1 equipe piloto para testes (a equipe completa por RA vira depois):
    ```typescript
    await prisma.team.upsert({
      where: { id: 'df-team-coordenacao-central' },
      update: {},
      create: {
        id: 'df-team-coordenacao-central',
        name: 'Coordenacao Central DF — Celina Leao 2026',
        region: 'Distrito Federal',
        coordinatorId: coordenador.id,
      },
    });
    ```

    5. Funcao main() com try/catch e prisma.$disconnect() no finally.

    **Importante:** Usar `UserRoleEnum.coordenador_regional` (enum do Prisma, nao string).
    Verificar o enum no schema.prisma se necessario: `grep -r "UserRoleEnum" apps/api/prisma/schema.prisma`.
    Se o enum se chama diferente, adaptar.

    **Executar apos criar o arquivo (na VPS via docker exec):**
    ```bash
    ssh -i elexionSSH root@187.77.53.163
    # Copiar o arquivo para a VPS:
    # (na maquina local) scp -i elexionSSH seed.df.ts root@187.77.53.163:/opt/elexion/apps/api/prisma/
    # OU editar direto no servidor

    # Executar o seed dentro do container:
    docker exec elexion-api sh -c 'cd /app/apps/api && npx ts-node --project tsconfig.json prisma/seed.df.ts'
    ```

    Se ts-node nao estiver disponivel no container, usar:
    ```bash
    docker exec elexion-api sh -c 'cd /app/apps/api && npx prisma db seed'
    ```
    (requer que `package.json` do api tenha `"seed": "ts-node prisma/seed.df.ts"` — verificar e ajustar se necessario)

    Alternativamente, executar via npx tsx se disponivel:
    ```bash
    docker exec elexion-api sh -c 'cd /app/apps/api && npx tsx prisma/seed.df.ts'
    ```
  </action>
  <verify>
    <automated>
      # Verificar contagem de geofences apos executar o seed na VPS:
      ssh -i elexionSSH root@187.77.53.163 "docker exec elexion-postgres psql -U elexion -d elexion -t -c 'SELECT COUNT(*) FROM geofences'"
      # Esperado: 33

      # Verificar usuario coordenador:
      ssh -i elexionSSH root@187.77.53.163 "docker exec elexion-postgres psql -U elexion -d elexion -t -c \"SELECT email, role FROM users WHERE email = 'coordenador@inteia.com.br'\""
      # Esperado: coordenador@inteia.com.br | coordenador_regional

      # Verificar que o login funciona:
      curl -s -X POST https://api.elexion.com.br/api/v1/auth/login \
        -H 'Content-Type: application/json' \
        -d '{"email":"coordenador@inteia.com.br","password":"Celina2026!"}' | grep -o '"accessToken":"[^"]*"' | head -c 50
      # Esperado: "accessToken":"eyJ... (inicio do JWT)
    </automated>
  </verify>
  <done>
    - 33 registros em geofences (SELECT COUNT(*) = 33)
    - Usuario coordenador@inteia.com.br com role coordenador_regional existe no banco
    - POST /auth/login com as credenciais retorna accessToken JWT valido
    - 1 equipe "Coordenacao Central DF" criada com coordenadorId correto
  </done>
</task>

<task type="auto">
  <name>Task 3: Criar js/elexion-client.js — auth bearer, refresh rotativo, fetch com fallback</name>
  <files>C:\Users\IgorPC\.claude\projects\Conecta 2026\js\elexion-client.js</files>
  <action>
    Criar `js/elexion-client.js` no projeto CONECTA.
    Pattern: IIFE que expoe `window.ElexionClient` — mesmo padrao de js/supabase-config.js e js/conecta-db.js.

    **Conteudo completo do arquivo:**

    ```javascript
    /**
     * elexion-client.js — Cliente HTTP para a API Elexion (modo bearer)
     * Versao: 1.0.0 (Fase 1 — Fundacao)
     *
     * Uso:
     *   <script src="js/elexion-client.js"></script>
     *   const user = await ElexionClient.login('email', 'senha');
     *   const kpis = await ElexionClient.fetchKpis();  // null se offline
     */

    window.ElexionClient = (() => {
      const BASE = 'https://api.elexion.com.br/api/v1';
      const TOKEN_KEY = 'elexion_access_token';
      const REFRESH_KEY = 'elexion_refresh_token';
      const USER_KEY = 'elexion_user';

      // ---- Armazenamento (sessionStorage, nunca localStorage) ----
      // CLIENT-02: token jamais vai para localStorage

      function getAccessToken() {
        return sessionStorage.getItem(TOKEN_KEY);
      }

      function getRefreshToken() {
        return sessionStorage.getItem(REFRESH_KEY);
      }

      function saveTokens(accessToken, refreshToken) {
        sessionStorage.setItem(TOKEN_KEY, accessToken);
        sessionStorage.setItem(REFRESH_KEY, refreshToken);
      }

      function clearTokens() {
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(REFRESH_KEY);
        sessionStorage.removeItem(USER_KEY);
      }

      // ---- Auth ----

      /**
       * Login no Elexion com email e senha.
       * Modo bearer: sem x-session-transport: cookie.
       * @returns {Promise<object|null>} dados do usuario ou null em caso de erro
       */
      async function login(email, password) {
        try {
          const res = await fetch(BASE + '/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // SEM x-session-transport: cookie — modo bearer
            body: JSON.stringify({ email, password }),
            mode: 'cors',
          });

          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Credenciais invalidas (' + res.status + ')');
          }

          const data = await res.json();
          // data = { accessToken, refreshToken, user }
          saveTokens(data.accessToken, data.refreshToken);
          sessionStorage.setItem(USER_KEY, JSON.stringify(data.user));
          return data.user;

        } catch (err) {
          // CLIENT-03: nao propagar erro que quebre o CONECTA
          console.warn('[ElexionClient] login falhou:', err.message);
          return null;
        }
      }

      /**
       * Refresh do accessToken usando o refreshToken atual.
       * CRITICO: refresh token e rotativo — sempre salvar o novo par retornado.
       * @returns {Promise<string|null>} novo accessToken ou null
       */
      async function refreshTokens() {
        const refreshToken = getRefreshToken();
        if (!refreshToken) return null;

        try {
          const res = await fetch(BASE + '/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),  // body, NAO cookie
            mode: 'cors',
          });

          if (!res.ok) {
            // Refresh falhou — limpar tokens, usuario deve relogar no Elexion
            clearTokens();
            return null;
          }

          const data = await res.json();
          // SEMPRE salvar AMBOS os tokens novos (refresh e rotativo)
          saveTokens(data.accessToken, data.refreshToken);
          return data.accessToken;

        } catch {
          clearTokens();
          return null;
        }
      }

      /**
       * Logout do Elexion (apenas local — limpa sessionStorage).
       * Nao desautentica do CONECTA/Supabase.
       */
      function logout() {
        clearTokens();
      }

      /**
       * Retorna true se ha um token de acesso em sessao.
       * Nao valida expiracao (isso acontece na proxima request).
       */
      function isAuthenticated() {
        return !!getAccessToken();
      }

      /**
       * Retorna o objeto user salvo na sessao, ou null.
       */
      function getCurrentUser() {
        try {
          const raw = sessionStorage.getItem(USER_KEY);
          return raw ? JSON.parse(raw) : null;
        } catch {
          return null;
        }
      }

      // ---- Fetch autenticado com retry em 401 ----

      /**
       * Fetch para endpoint autenticado do Elexion.
       * Retry automatico em 401 via refresh token.
       * CLIENT-03: retorna null (nao throw) quando Elexion indisponivel.
       *
       * @param {string} path - Ex: '/analytics/kpis'
       * @param {RequestInit} options - Opcoes adicionais de fetch (method, body, etc)
       * @returns {Promise<any|null>} dados JSON ou null
       */
      async function request(path, options = {}) {
        const token = getAccessToken();
        if (!token) return null;

        const doFetch = async (bearerToken) => {
          return fetch(BASE + path, {
            ...options,
            headers: {
              'Content-Type': 'application/json',
              ...options.headers,
              'Authorization': 'Bearer ' + bearerToken,
            },
            mode: 'cors',
          });
        };

        try {
          let res = await doFetch(token);

          // 401 — tentar refresh uma vez
          if (res.status === 401) {
            const newToken = await refreshTokens();
            if (!newToken) {
              // Refresh falhou — usuario deve relogar no Elexion (nao afeta CONECTA)
              return null;
            }
            res = await doFetch(newToken);
          }

          if (!res.ok) {
            console.warn('[ElexionClient] request falhou:', res.status, path);
            return null;
          }

          return await res.json();

        } catch (err) {
          // CLIENT-03: Elexion offline nao quebra o CONECTA
          console.warn('[ElexionClient] Elexion indisponivel:', err.message);
          return null;
        }
      }

      // ---- Endpoints da API ----

      /** GET /api/v1/analytics/kpis — requer coordenador+ */
      async function fetchKpis() {
        return request('/analytics/kpis');
      }

      /** GET /api/v1/analytics/heatmap — requer coordenador+ */
      async function fetchHeatmap() {
        return request('/analytics/heatmap');
      }

      /** GET /api/v1/analytics/heatmap/gaps — requer coordenador+ */
      async function fetchHeatmapGaps() {
        return request('/analytics/heatmap/gaps');
      }

      /** GET /api/v1/geofences — requer coordenador+ */
      async function fetchGeofences() {
        return request('/geofences');
      }

      /** GET /api/v1/war-room/feed — requer coordenador+ */
      async function fetchWarRoomFeed() {
        return request('/war-room/feed');
      }

      /** GET /api/v1/war-room/alerts — requer coordenador+ */
      async function fetchAlerts() {
        return request('/war-room/alerts');
      }

      // ---- API publica ----

      return {
        login,
        logout,
        refreshTokens,
        isAuthenticated,
        getCurrentUser,
        request,
        // Endpoints
        fetchKpis,
        fetchHeatmap,
        fetchHeatmapGaps,
        fetchGeofences,
        fetchWarRoomFeed,
        fetchAlerts,
      };
    })();
    ```

    Apos criar o arquivo, fazer commit e push (regra do CLAUDE.md):
    ```bash
    git add js/elexion-client.js
    git commit -m "feat: adicionar elexion-client.js com auth bearer e fallback gracioso"
    git push origin main
    ```
  </action>
  <verify>
    <automated>
      # Verificar que o arquivo existe e tem o padrao IIFE correto:
      grep -c "window.ElexionClient" "C:\Users\IgorPC\.claude\projects\Conecta 2026\js\elexion-client.js"
      # Esperado: 1

      grep -c "sessionStorage" "C:\Users\IgorPC\.claude\projects\Conecta 2026\js\elexion-client.js"
      # Esperado: >= 5 (varios usos de sessionStorage)

      grep "localStorage" "C:\Users\IgorPC\.claude\projects\Conecta 2026\js\elexion-client.js"
      # Esperado: NENHUMA linha (CLIENT-02: nunca usar localStorage)

      grep -c "return null" "C:\Users\IgorPC\.claude\projects\Conecta 2026\js\elexion-client.js"
      # Esperado: >= 4 (fallback CLIENT-03 em multiplos lugares)
    </automated>
  </verify>
  <done>
    - js/elexion-client.js existe com window.ElexionClient exposto
    - login() armazena tokens em sessionStorage (verificar grep localStorage = 0 resultados)
    - request() retorna null (nao throw) em qualquer falha de rede
    - refresh token e salvo apos cada refresh (ambos accessToken e refreshToken atualizados)
    - Arquivo commitado e pusado para main
  </done>
</task>

<task type="auto">
  <name>Task 4: Adicionar secao Elexion em conta.html — vinculacao de conta com UI funcional</name>
  <files>C:\Users\IgorPC\.claude\projects\Conecta 2026\conta.html</files>
  <action>
    Modificar `conta.html` para adicionar uma secao de vinculacao com a conta Elexion.
    conta.html ja existe com estrutura de card (fundo gradient, paleta #1a237e/#ff6f00).

    **Passo 1 — Adicionar script do elexion-client.js no head:**
    Apos a linha `<script src="js/conecta-db.js"></script>`, adicionar:
    ```html
    <script src="js/elexion-client.js"></script>
    ```

    **Passo 2 — Adicionar CSS para a secao Elexion:**
    Dentro do `<style>` existente, adicionar ao final (antes do `</style>`):
    ```css
    .elexion-section {
        margin-top: 28px;
        border-top: 1px solid #e2e8f0;
        padding-top: 24px;
    }
    .elexion-status {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 14px;
        border-radius: 8px;
        font-size: 0.85rem;
        margin-bottom: 16px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
    }
    .elexion-status.connected {
        background: #f0fdf4;
        border-color: #bbf7d0;
        color: #15803d;
    }
    .elexion-status.disconnected {
        background: #fef2f2;
        border-color: #fecaca;
        color: #dc2626;
    }
    .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: currentColor;
        flex-shrink: 0;
    }
    ```

    **Passo 3 — Adicionar HTML da secao Elexion dentro do .card, apos o ultimo elemento existente e antes do .footer:**
    ```html
    <!-- Integracao Elexion -->
    <div class="elexion-section">
        <h2 style="font-size:1.1rem;color:#1a237e;margin-bottom:4px;">Integracao Elexion</h2>
        <p style="color:#64748b;font-size:0.85rem;margin-bottom:14px;">
            Vincule sua conta do sistema de campo (Elexion) para acessar dados de gamificacao e heatmap.
        </p>

        <div id="elexionStatus" class="elexion-status disconnected">
            <span class="dot"></span>
            <span id="elexionStatusText">Nao conectado ao Elexion</span>
        </div>

        <div id="elexionLoginForm">
            <div class="field">
                <label class="label" for="elexionEmail">E-mail Elexion</label>
                <input type="email" id="elexionEmail" placeholder="coordenador@inteia.com.br" autocomplete="username">
            </div>
            <div class="field">
                <label class="label" for="elexionPassword">Senha Elexion</label>
                <input type="password" id="elexionPassword" placeholder="••••••••" autocomplete="current-password">
            </div>
            <div class="actions">
                <button class="primary" id="elexionLoginBtn" onclick="conectarElexion()">Conectar ao Elexion</button>
            </div>
        </div>

        <div id="elexionConnectedInfo" style="display:none;">
            <div class="panel">
                <strong>Conectado como:</strong> <span id="elexionUserName">—</span><br>
                <strong>E-mail:</strong> <span id="elexionUserEmail">—</span><br>
                <strong>Perfil:</strong> <span id="elexionUserRole">—</span>
            </div>
            <div class="actions">
                <button class="secondary" onclick="desconectarElexion()">Desconectar do Elexion</button>
                <button class="secondary" onclick="testarElexion()">Testar Conexao</button>
            </div>
        </div>

        <div id="elexionMsg" class="message"></div>
    </div>
    ```

    **Passo 4 — Adicionar script inline no final do body (antes do </body>):**
    ```html
    <script>
    // Integracao Elexion — conta.html
    (function initElexionUI() {
        if (typeof ElexionClient === 'undefined') return;

        // Verificar se ja ha sessao ativa
        if (ElexionClient.isAuthenticated()) {
            const user = ElexionClient.getCurrentUser();
            if (user) mostrarConectado(user);
        }
    })();

    function mostrarConectado(user) {
        document.getElementById('elexionLoginForm').style.display = 'none';
        document.getElementById('elexionConnectedInfo').style.display = 'block';
        const statusEl = document.getElementById('elexionStatus');
        statusEl.className = 'elexion-status connected';
        document.getElementById('elexionStatusText').textContent = 'Conectado ao Elexion';
        document.getElementById('elexionUserName').textContent = user.name || '—';
        document.getElementById('elexionUserEmail').textContent = user.email || '—';
        document.getElementById('elexionUserRole').textContent = user.role || '—';
    }

    function mostrarDesconectado() {
        document.getElementById('elexionLoginForm').style.display = 'block';
        document.getElementById('elexionConnectedInfo').style.display = 'none';
        const statusEl = document.getElementById('elexionStatus');
        statusEl.className = 'elexion-status disconnected';
        document.getElementById('elexionStatusText').textContent = 'Nao conectado ao Elexion';
    }

    function mostrarMensagem(texto, tipo) {
        const msg = document.getElementById('elexionMsg');
        msg.textContent = texto;
        msg.className = 'message ' + tipo;
        setTimeout(() => { msg.className = 'message'; }, 5000);
    }

    async function conectarElexion() {
        if (typeof ElexionClient === 'undefined') {
            mostrarMensagem('ElexionClient nao carregado. Recarregue a pagina.', 'error');
            return;
        }
        const email = document.getElementById('elexionEmail').value.trim();
        const password = document.getElementById('elexionPassword').value;
        if (!email || !password) {
            mostrarMensagem('Informe e-mail e senha do Elexion.', 'error');
            return;
        }
        const btn = document.getElementById('elexionLoginBtn');
        btn.disabled = true;
        btn.textContent = 'Conectando...';

        const user = await ElexionClient.login(email, password);

        btn.disabled = false;
        btn.textContent = 'Conectar ao Elexion';

        if (!user) {
            mostrarMensagem('Falha na conexao. Verifique e-mail e senha do Elexion.', 'error');
            return;
        }
        mostrarConectado(user);
        mostrarMensagem('Conta Elexion vinculada com sucesso!', 'success');
    }

    function desconectarElexion() {
        if (typeof ElexionClient !== 'undefined') ElexionClient.logout();
        mostrarDesconectado();
        mostrarMensagem('Desconectado do Elexion.', 'success');
    }

    async function testarElexion() {
        if (typeof ElexionClient === 'undefined') return;
        const kpis = await ElexionClient.fetchKpis();
        if (kpis) {
            mostrarMensagem('Conexao OK — API Elexion respondendo.', 'success');
        } else {
            mostrarMensagem('Sem resposta da API Elexion. Token pode ter expirado.', 'error');
        }
    }
    </script>
    ```

    Apos modificar, fazer commit e push:
    ```bash
    git add conta.html
    git commit -m "feat: adicionar secao de integracao Elexion em conta.html (CLIENT-04)"
    git push origin main
    ```
  </action>
  <verify>
    <automated>
      grep -c "elexion-client.js" "C:\Users\IgorPC\.claude\projects\Conecta 2026\conta.html"
      # Esperado: 1

      grep -c "ElexionClient.login" "C:\Users\IgorPC\.claude\projects\Conecta 2026\conta.html"
      # Esperado: 1

      grep -c "sessionStorage\|localStorage" "C:\Users\IgorPC\.claude\projects\Conecta 2026\conta.html"
      # Esperado: 0 (elexion-client.js cuida do storage, conta.html nao acessa direto)
    </automated>
  </verify>
  <done>
    - conta.html carrega elexion-client.js via script tag
    - Secao "Integracao Elexion" visivel com campos de email e senha
    - Botao "Conectar ao Elexion" chama ElexionClient.login() e exibe feedback
    - Se ja autenticado ao abrir a pagina, mostra status "Conectado" com dados do usuario
    - Botao "Desconectar" limpa sessionStorage via ElexionClient.logout()
    - Arquivo commitado e pusado para main
  </done>
</task>

<task type="checkpoint:human-verify">
  <name>Task 5: Verificar integracao ponta a ponta — login real no Elexion a partir do CONECTA</name>
  <what-built>
    Task 1: CORS_ORIGINS atualizado na VPS, container api reiniciado
    Task 2: seed.df.ts executado — 33 geofences + coordenador@inteia.com.br no banco
    Task 3: js/elexion-client.js criado com auth bearer, refresh e fallback
    Task 4: conta.html com UI de vinculacao Elexion
  </what-built>
  <how-to-verify>
    **Ambiente de teste:** Abrir conta.html localmente via Live Server (http://localhost:5500) ou diretamente no browser.

    **Passo 1 — Verificar que elexion-client.js carrega:**
    - Abrir conta.html no browser
    - Abrir DevTools (F12) → Console
    - Digitar: `typeof ElexionClient`
    - Esperado: `"object"` (nao "undefined")

    **Passo 2 — Testar login real:**
    - Na secao "Integracao Elexion" da conta.html
    - E-mail: `coordenador@inteia.com.br`
    - Senha: `Celina2026!`
    - Clicar "Conectar ao Elexion"
    - Esperado: Status muda para "Conectado ao Elexion" (fundo verde), nome e email do usuario aparecem

    **Passo 3 — Verificar que token esta em sessionStorage (nao localStorage):**
    - DevTools → Application → Session Storage → localhost
    - Deve haver: `elexion_access_token` (JWT longo, comeca com eyJ)
    - Deve haver: `elexion_refresh_token` (hex opaco, 64+ chars)
    - Em Local Storage: nao deve haver chaves elexion_*

    **Passo 4 — Testar fetch autenticado no console:**
    ```javascript
    const kpis = await ElexionClient.fetchKpis();
    console.log(kpis);
    ```
    Esperado: objeto JSON com dados de KPIs (pode estar vazio se banco sem atividade de campo) OU null (se o endpoint retornar erro — mas nao deve lancar excecao)

    **Passo 5 — Verificar fallback gracioso (CLIENT-03):**
    - No console, simular Elexion offline:
    ```javascript
    // Testar com token invalido
    sessionStorage.setItem('elexion_access_token', 'token-invalido');
    sessionStorage.setItem('elexion_refresh_token', 'refresh-invalido');
    const resultado = await ElexionClient.fetchKpis();
    console.log('resultado com token invalido:', resultado);
    ```
    Esperado: `resultado com token invalido: null` (sem erro, sem excecao nao tratada)
    - Abrir CONECTA.html normalmente para confirmar que carrega sem erro

    **Passo 6 — Testar desconexao:**
    - Na conta.html, clicar "Desconectar do Elexion"
    - DevTools → Application → Session Storage: chaves elexion_* devem sumir
    - Status volta para "Nao conectado"

    **Criterios de aprovacao:**
    - [ ] ElexionClient existe no window global
    - [ ] Login com coordenador@inteia.com.br funciona (sem erro CORS, sem 401)
    - [ ] Token armazenado em sessionStorage (nao localStorage)
    - [ ] fetchKpis() retorna null (sem throw) com token invalido
    - [ ] CONECTA.html abre normalmente mesmo com Elexion "deslogado"
  </how-to-verify>
  <action>Verificacao manual: abrir conta.html no browser e testar login com coordenador@inteia.com.br conforme instrucoes em how-to-verify acima.</action>
  <verify><automated>MISSING — verificacao visual requerida (browser DevTools)</automated></verify>
  <done>Login funciona, token em sessionStorage, CONECTA.html carrega sem erros mesmo sem sessao Elexion</done>
  <resume-signal>
    Digite "fase 1 ok" se todos os criterios passaram.
    Se houver erro CORS: cole o erro do console e a saida do curl do Passo 1 do Task 1.
    Se houver 401 no login: verifique se o seed foi executado com email/senha corretos.
  </resume-signal>
</task>

</tasks>

<verification>
## Gate de conclusao da Fase 1

Executar estes comandos antes de declarar a fase completa:

```bash
# 1. Health check
curl -s https://api.elexion.com.br/api/v1/health | grep '"status":"ok"'
# Esperado: {"status":"ok"}

# 2. CORS REST
curl -s -I -X OPTIONS https://api.elexion.com.br/api/v1/analytics/kpis \
  -H 'Origin: https://inteia.com.br' \
  -H 'Access-Control-Request-Method: GET' \
  -H 'Access-Control-Request-Headers: Authorization' 2>&1 | grep -i "access-control-allow-origin"
# Esperado: access-control-allow-origin: https://inteia.com.br

# 3. Login + KPIs (prova CLIENT-01 + INFRA-04)
TOKEN=$(curl -s -X POST https://api.elexion.com.br/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"coordenador@inteia.com.br","password":"Celina2026!"}' | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
echo "Token obtido: ${TOKEN:0:20}..."
curl -s -H "Authorization: Bearer $TOKEN" https://api.elexion.com.br/api/v1/analytics/kpis
# Esperado: JSON (objeto, mesmo que vazio) — nao 401, nao erro CORS

# 4. Contagem geofences DF
ssh -i elexionSSH root@187.77.53.163 "docker exec elexion-postgres psql -U elexion -d elexion -t -c 'SELECT COUNT(*) FROM geofences'"
# Esperado: 33
```
</verification>

<success_criteria>
- `curl https://api.elexion.com.br/api/v1/health` retorna `{"status":"ok"}`
- Preflight OPTIONS com `Origin: https://inteia.com.br` retorna `access-control-allow-origin: https://inteia.com.br`
- `SELECT COUNT(*) FROM geofences` = 33
- Login com `coordenador@inteia.com.br` / `Celina2026!` retorna accessToken JWT valido
- `ElexionClient` disponivel como global em conta.html
- Login via UI de conta.html funciona sem erro CORS
- Token armazenado em sessionStorage, nao localStorage
- CONECTA.html carrega normalmente independente do estado do Elexion
</success_criteria>

<output>
Apos conclusao, criar `.planning/phases/01-fundacao-docker-cors-migration-df-client-js/01-SUMMARY.md` com:
- O que foi feito (tasks executadas, decisoes tomadas)
- Credenciais criadas (emails, senhas — sem expor em logs publicos)
- Artefatos criados (arquivos, registros no banco)
- Problemas encontrados e como foram resolvidos
- Estado do banco apos o seed (contagens)
- Proximos passos (Fase 2)
</output>
