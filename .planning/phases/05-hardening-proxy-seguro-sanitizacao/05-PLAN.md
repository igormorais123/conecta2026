---
phase: 05-hardening-proxy-seguro-sanitizacao
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - supabase/functions/elexion-proxy/index.ts
  - js/elexion-client.js
  - CONECTA.html
autonomous: true
requirements:
  - SEC-01
  - SEC-02
  - SEC-03
  - SEC-04

must_haves:
  truths:
    - "Nenhum token JWT do Elexion existe no browser (sessionStorage limpo apos migracao)"
    - "Todas as chamadas REST ao Elexion passam pelo proxy Supabase (nao ha fetch direto para api.elexion.com.br nos endpoints de dados)"
    - "Socket.IO continua funcionando via conexao direta (war room funcional)"
    - "Nenhum dado externo da API Elexion e inserido no DOM via innerHTML sem escapeHtml/_safeText"
  artifacts:
    - path: "supabase/functions/elexion-proxy/index.ts"
      provides: "Edge Function Deno que valida sessao Supabase e faz forward para api.elexion.com.br"
      min_lines: 80
      exports: ["default handler"]
    - path: "js/elexion-client.js"
      provides: "Cliente migrado para usar proxy em vez de chamada direta, sem login/tokens no browser"
      contains: "SUPABASE_PROXY_URL"
    - path: "CONECTA.html"
      provides: "Audit de innerHTML com _safeText aplicado em todos os pontos de insercao de dados da API"
      contains: "_safeText"
  key_links:
    - from: "js/elexion-client.js"
      to: "supabase/functions/elexion-proxy/index.ts"
      via: "fetch para URL da Edge Function com Authorization: Bearer {supabase_access_token}"
      pattern: "SUPABASE_PROXY_URL"
    - from: "supabase/functions/elexion-proxy/index.ts"
      to: "api.elexion.com.br"
      via: "Deno fetch com Authorization: Bearer {service_account_token}"
      pattern: "ELEXION_SERVICE_TOKEN"
    - from: "CONECTA.html"
      to: "ElexionClient.request"
      via: "sem chamada direta a api.elexion.com.br — proxy e transparente"
      pattern: "ElexionClient\\."
---

<objective>
Eliminar o token JWT do Elexion do browser via proxy Supabase Edge Function, e fechar todas as vulnerabilidades de XSS via innerHTML.

Purpose: Seguranca para o dia da eleicao. Dados de cabos eleitorais nao podem vazar por XSS. Token Elexion nao pode ser roubado do sessionStorage.
Output: Edge Function `elexion-proxy`, ElexionClient migrado, CONECTA.html auditado/sanitizado.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/research/PITFALLS.md

<interfaces>
<!-- Estado atual do ElexionClient (js/elexion-client.js) — executor deve migrar ESTE arquivo -->
<!-- BASE atual: 'https://api.elexion.com.br/api/v1' — deve ser substituido por proxy -->

const BASE = 'https://api.elexion.com.br/api/v1'; // REMOVER
const TOKEN_KEY = 'elexion_access_token';           // REMOVER
const REFRESH_KEY = 'elexion_refresh_token';        // REMOVER
const USER_KEY = 'elexion_user';                    // MANTER (dados de usuario, nao token)

// Funcoes que SOMEM apos migracao (token nao existe mais no browser):
// - saveTokens(), getAccessToken(), getRefreshToken(), refreshTokens(), login(), clearTokens()

// Funcoes que PERMANECEM (adaptadas para proxy):
// - request(path, options) — agora chama proxy em vez de BASE direta
// - isAuthenticated() — verifica sessao Supabase em vez de sessionStorage
// - getCurrentUser()
// - logout()
// - Todos os fetchXxx() — sem alteracao de assinatura

// API publica que CONECTA.html usa (nao pode quebrar):
ElexionClient.request(path, options)
ElexionClient.fetchKpis()
ElexionClient.fetchHeatmap()
ElexionClient.fetchHeatmapGaps()
ElexionClient.fetchGeofences()
ElexionClient.fetchWarRoomFeed()
ElexionClient.fetchAlerts()
ElexionClient.fetchLeaderboard(equipeId)
ElexionClient.fetchTeamsRanking()
ElexionClient.isAuthenticated()
ElexionClient.logout()

<!-- Sanitizacao existente no CONECTA.html — nao duplicar, apenas auditar gaps -->
function escapeHtml(str) // linha 4841 — escapa &, <, >, "
function _safeText(str)  // linha 6042 — usa div.textContent para sanitizacao completa

// Gaps conhecidos a corrigir na auditoria:
// Linha 6285: ev.texto inserido sem _safeText (contém HTML controlado com <strong>)
//   — manter estrutura mas garantir que ev.texto so contem HTML gerado internamente
//   — ev.sub (linha 6287) inserido sem _safeText — CORRIGIR

// Secoes do CONECTA com innerHTML que recebem dados externos (nao Elexion, mas auditoria completa):
// - renderPessoas (linha 3745): dados do localStorage — usar escapeHtml nos campos de usuario
// - renderVeiculos (linha 3593): dados do localStorage
// - renderTarefas (linha 4940): dados do localStorage
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Edge Function elexion-proxy (Deno) + variavel de ambiente</name>
  <files>supabase/functions/elexion-proxy/index.ts</files>
  <action>
Criar a Edge Function Deno que atua como proxy seguro entre o browser e api.elexion.com.br.

**Estrutura da funcao:**

```typescript
// supabase/functions/elexion-proxy/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ELEXION_BASE = 'https://api.elexion.com.br/api/v1'
const ELEXION_SERVICE_TOKEN = Deno.env.get('ELEXION_SERVICE_TOKEN') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': 'https://inteia.com.br',
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      },
    })
  }

  // 1. Validar sessao Supabase (Authorization: Bearer <supabase_access_token>)
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } }
  })
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return new Response(JSON.stringify({ error: 'Invalid session' }), { status: 401 })
  }

  // 2. Extrair path do Elexion da URL do proxy
  // Ex: /elexion-proxy/analytics/kpis → /analytics/kpis
  const url = new URL(req.url)
  const elexionPath = url.pathname.replace(/^\/elexion-proxy/, '') + url.search

  // 3. Forward para api.elexion.com.br com service account JWT
  // Timeout explicito de 10s (Pitfall 9: Edge Function wall-clock 150s, Elexion pode ser lento)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000)

  let elexionRes: Response
  try {
    elexionRes = await fetch(ELEXION_BASE + elexionPath, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ELEXION_SERVICE_TOKEN}`,
      },
      body: req.method !== 'GET' ? await req.text() : undefined,
      signal: controller.signal,
    })
  } catch (err) {
    clearTimeout(timeout)
    const msg = err instanceof Error && err.name === 'AbortError' ? 'Elexion timeout' : 'Elexion unreachable'
    return new Response(JSON.stringify({ error: msg }), {
      status: 502,
      headers: { 'Access-Control-Allow-Origin': 'https://inteia.com.br' }
    })
  }
  clearTimeout(timeout)

  // 4. Retornar resposta do Elexion para o browser (sem expor o service token)
  const body = await elexionRes.text()
  return new Response(body, {
    status: elexionRes.status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': 'https://inteia.com.br',
    },
  })
})
```

**Variavel de ambiente — SEC-02 (service account):**

O `ELEXION_SERVICE_TOKEN` e o JWT de longa duracao do service account do Elexion. Deve ser configurado no Supabase Dashboard → Edge Functions → elexion-proxy → Environment Variables. O executor deve:

1. Criar o arquivo da Edge Function com o codigo acima.
2. Adicionar comentario no topo do arquivo explicando que ELEXION_SERVICE_TOKEN deve ser configurado no Supabase Dashboard (o executor nao tem acesso a Dashboard — isso e checkpoint humano apos o plano, nao bloqueia).
3. Usar a URL padrao da Edge Function: `https://dvgbqbwipwegkndutvte.supabase.co/functions/v1/elexion-proxy`

**Nao proxear WebSocket** (Pitfall 8/9): Socket.IO usa WebSocket — Edge Function nao suporta WebSocket. O proxy e somente para chamadas REST. O CONECTA.html ja conecta o Socket.IO diretamente com token de curta duracao (comportamento mantido).
  </action>
  <verify>
    <automated>
      Verificar existencia e estrutura minima do arquivo:
      grep -c "ELEXION_SERVICE_TOKEN\|supabase.auth.getUser\|ELEXION_BASE" supabase/functions/elexion-proxy/index.ts
      Deve retornar 3 (tres ocorrencias).
    </automated>
  </verify>
  <done>
    - Arquivo `supabase/functions/elexion-proxy/index.ts` existe com >= 80 linhas
    - Valida sessao Supabase antes de fazer qualquer request ao Elexion
    - Usa ELEXION_SERVICE_TOKEN como bearer para o Elexion (service account — SEC-02)
    - Timeout de 10s explicitamente configurado (previne Pitfall 9)
    - CORS habilitado para `inteia.com.br`
    - WebSocket NAO e proxeado (Socket.IO continua direto)
  </done>
</task>

<task type="auto">
  <name>Task 2: Migrar ElexionClient para proxy (remove token do browser — SEC-01)</name>
  <files>js/elexion-client.js</files>
  <action>
Reescrever `js/elexion-client.js` para eliminar completamente o JWT do Elexion do browser.

**Mudancas principais:**

1. **Remover** constantes TOKEN_KEY, REFRESH_KEY e todas as funcoes de token Elexion: `saveTokens()`, `getAccessToken()`, `getRefreshToken()`, `refreshTokens()`, `login()`, `clearTokens()`.

2. **Adicionar** constante `PROXY_URL` apontando para a Edge Function:
   ```javascript
   const PROXY_URL = 'https://dvgbqbwipwegkndutvte.supabase.co/functions/v1/elexion-proxy';
   ```

3. **Reescrever** `request(path, options)` para:
   - Obter o `access_token` da sessao Supabase atual (Supabase SDK ja esta carregado no CONECTA.html via CDN)
   - Usar esse token para autenticar com o PROXY (nao com o Elexion diretamente)
   - Fazer fetch para `PROXY_URL + path` com `Authorization: Bearer {supabase_token}`
   - Manter o comportamento de retornar `null` quando indisponivel (CLIENT-03)

   ```javascript
   async function request(path, options = {}) {
     // Obter sessao Supabase (SDK global: window._supabase ou supabaseClient)
     // O CONECTA.html inicializa Supabase como variavel global — usar a existente
     let supabaseToken = null;
     try {
       // Tentar com a instancia global do Supabase usada no CONECTA
       const client = window._supabaseClient || window.supabaseClient || window._supabase;
       if (client) {
         const { data } = await client.auth.getSession();
         supabaseToken = data?.session?.access_token || null;
       }
     } catch (e) {
       console.warn('[ElexionClient] Nao foi possivel obter sessao Supabase:', e.message);
     }

     if (!supabaseToken) {
       console.warn('[ElexionClient] Sem sessao Supabase ativa — proxy nao autenticado');
       return null;
     }

     try {
       const res = await fetch(PROXY_URL + path, {
         ...options,
         headers: {
           'Content-Type': 'application/json',
           ...options.headers,
           'Authorization': 'Bearer ' + supabaseToken,
         },
       });

       if (!res.ok) {
         console.warn('[ElexionClient] proxy retornou', res.status, 'para', path);
         return null;
       }

       return await res.json();
     } catch (err) {
       console.warn('[ElexionClient] Proxy indisponivel:', err.message);
       return null;
     }
   }
   ```

4. **Adaptar** `isAuthenticated()` para verificar sessao Supabase (nao sessionStorage de token Elexion):
   ```javascript
   async function isAuthenticated() {
     // Autenticacao agora depende da sessao Supabase, nao do token Elexion
     // Retorna true se ha sessao Supabase ativa
     try {
       const client = window._supabaseClient || window.supabaseClient || window._supabase;
       if (!client) return false;
       const { data } = await client.auth.getSession();
       return !!(data?.session?.access_token);
     } catch { return false; }
   }
   ```

5. **Manter** `USER_KEY` e `getCurrentUser()` sem alteracao (armazena dados de usuario, nao token).

6. **Manter** `logout()` — agora apenas limpa o USER_KEY do sessionStorage.

7. **Manter** todos os metodos `fetchXxx()` sem alteracao de assinatura (interface publica do CONECTA.html nao muda).

8. **Inspecionar** o CONECTA.html para identificar a variavel global do cliente Supabase (grep por `supabase`, `_supabase`, `supabaseClient`) e usar o nome correto na implementacao acima. Ajustar a logica de `request()` para usar o nome exato encontrado.

9. **Atualizar** a versao no comentario do topo: `Versao: 2.0.0 (Fase 5 — Proxy Seguro)`.

10. **SEC-04 — Remocao de CORS inteia.com.br do Elexion:** Adicionar comentario no topo do arquivo: `// AVISO: Apos validar o proxy em producao, remover inteia.com.br do CORS do NestJS (main.ts na VPS). O proxy elimina a necessidade de CORS direto.`

**Compatibilidade Socket.IO:** O Socket.IO conecta diretamente com token Supabase no handshake (ja implementado na Fase 3). Nao alterar esse comportamento.
  </action>
  <verify>
    <automated>
      # Token Elexion nao existe mais no codigo:
      grep -c "elexion_access_token\|elexion_refresh_token\|saveTokens\|refreshTokens" js/elexion-client.js
      # Deve retornar 0 (nenhuma ocorrencia)

      # Proxy URL presente:
      grep -c "PROXY_URL\|elexion-proxy" js/elexion-client.js
      # Deve retornar >= 1
    </automated>
  </verify>
  <done>
    - `js/elexion-client.js` nao contém `elexion_access_token` nem `elexion_refresh_token`
    - `request()` faz fetch para PROXY_URL (Supabase Edge Function), nao para api.elexion.com.br
    - Token enviado ao proxy e o token Supabase da sessao ativa (nao token Elexion)
    - API publica (fetchKpis, fetchLeaderboard etc.) mantém mesmas assinaturas — CONECTA.html nao quebra
    - Versao atualizada para 2.0.0
  </done>
</task>

<task type="auto">
  <name>Task 3: Auditoria e sanitizacao de innerHTML no CONECTA.html (SEC-03)</name>
  <files>CONECTA.html</files>
  <action>
Auditar todos os pontos de `innerHTML` no CONECTA.html que inserem dados externos (da API Elexion ou de input de usuario) sem sanitizacao, e aplicar `_safeText()` ou `escapeHtml()` onde faltam.

**Gaps ja identificados para corrigir:**

1. **Linha ~6285 — ev.sub no renderWarRoomFeed:**
   ```javascript
   // ANTES:
   html += '<div style="...">' + ev.sub + '</div>';
   // DEPOIS:
   html += '<div style="...">' + _safeText(ev.sub) + '</div>';
   ```
   Nota: `ev.texto` contem HTML intencional construido internamente (`<strong>`) — nao sanitizar com _safeText pois destroi a formatacao. Verificar que ev.texto NUNCA recebe dados brutos da API sem passar por _safeText() no handler de evento Socket.IO (linhas ~6170-6197 — ja estao corretos, confirmar).

2. **Verificar secao de Pessoas (linha ~3745) — renderPessoas:**
   - Inspecionar os campos interpolados no template literal do `innerHTML`
   - Campos como `p.nome`, `p.cargo`, `p.telefone` vem do localStorage (input do usuario)
   - Aplicar `escapeHtml()` em todos os campos de string interpolados que nao estejam sanitizados

3. **Verificar secao de Veiculos (linha ~3593) — renderVeiculos:**
   - Mesma auditoria: campos `v.modelo`, `v.placa`, `v.responsavel` etc.
   - Aplicar `escapeHtml()` nos que estiverem sem sanitizacao

4. **Verificar secao de Lideres (linha ~5237) — renderLideres:**
   - Auditar campos interpolados nos templates HTML
   - Aplicar `escapeHtml()` nos campos sem sanitizacao

5. **Varredura adicional — buscar padroes de risco:**
   Percorrer o arquivo procurando por: `innerHTML.*\$\{` ou `innerHTML.*\+.*\.nome` ou `innerHTML.*\+.*\.titulo` — qualquer interpolacao direta de campo de dado externo sem escapeHtml/textContent. Corrigir cada ocorrencia encontrada.

**O que NAO alterar:**
- innerHTML com strings literais hardcoded (HTML estatico, sem dados externos) — safe por design
- innerHTML para mensagens de estado vazias ("Nenhum dado de leaderboard") — strings literais, nao dados externos
- ev.texto nos eventos Socket.IO — esse campo e construido internamente com _safeText() aplicado nos dados da API antes de montar a string (ver linhas 6170-6197)
- Estilos CSS inline gerados no JS (sem dados externos)

**Atualizar o comentario de versao** na secao Elexion/Gamificacao para indicar que passou pela auditoria de seguranca Fase 5.

**SEC-04 — CORS Elexion:** Adicionar comentario proximo a inicializacao do ElexionClient no CONECTA.html:
```javascript
// SEC-04: Apos validar proxy em producao, SSH na VPS 187.77.53.163 e remover
// 'https://inteia.com.br' do enableCors() no main.ts do NestJS. Reiniciar container.
```
  </action>
  <verify>
    <automated>
      # Verificar que ev.sub agora usa _safeText:
      grep -n "ev\.sub" CONECTA.html
      # Deve mostrar _safeText(ev.sub) na linha de innerHTML

      # Contar ocorrencias totais de _safeText apos auditoria (deve aumentar vs baseline de ~12):
      grep -c "_safeText\|escapeHtml" CONECTA.html
      # Deve ser >= 20 (auditoria adicionou novas ocorrencias)
    </automated>
  </verify>
  <done>
    - `ev.sub` sanitizado com `_safeText()` no renderWarRoomFeed
    - Secoes Pessoas, Veiculos e Lideres auditadas — todos os campos de string externos passam por escapeHtml()
    - Nenhum campo de dado externo (API ou localStorage) inserido diretamente via innerHTML sem sanitizacao
    - Comentario SEC-04 adicionado orientando remocao do CORS no NestJS apos validacao do proxy
  </done>
</task>

</tasks>

<verification>
Verificacao final da fase:

1. **SEC-01 — Token fora do browser:** `grep -r "elexion_access_token" js/` deve retornar vazio. O sessionStorage do browser nao deve conter tokens Elexion.

2. **SEC-02 — Service account:** O arquivo `supabase/functions/elexion-proxy/index.ts` usa `ELEXION_SERVICE_TOKEN` (variavel de ambiente, configurada no Supabase Dashboard — acao manual pos-deploy).

3. **SEC-03 — Sanitizacao:** `grep -c "_safeText\|escapeHtml" CONECTA.html` deve ser >= 20. Nenhum dado externo inserido sem sanitizacao.

4. **SEC-04 — CORS:** Comentario instrucional adicionado. A remocao do CORS no NestJS e acao manual na VPS — documentada para o operador.

5. **Regressao Socket.IO:** A war room e o feed de atividade ainda funcionam (Socket.IO nao passou pelo proxy — conexao direta mantida).
</verification>

<success_criteria>
- Token JWT do Elexion nao existe mais no sessionStorage do browser (SEC-01)
- Edge Function `elexion-proxy` implementada com validacao de sessao Supabase (SEC-01, SEC-02)
- `js/elexion-client.js` chama proxy em vez de `api.elexion.com.br` diretamente
- Auditoria completa de innerHTML: todos os dados externos passam por `_safeText()` ou `escapeHtml()` (SEC-03)
- CONECTA.html continua funcionando: leaderboard, heatmap, war room, KPIs — sem regressao
- Instrucoes para remocao do CORS no Elexion documentadas no codigo (SEC-04)
</success_criteria>

<output>
Apos conclusao, criar `.planning/phases/05-hardening-proxy-seguro-sanitizacao/05-01-SUMMARY.md` com:
- Arquivos modificados e o que foi feito em cada um
- Instrucoes para configurar ELEXION_SERVICE_TOKEN no Supabase Dashboard
- Instrucoes para remover CORS `inteia.com.br` do NestJS na VPS (apos validar proxy)
- Qualquer divergencia encontrada (ex: nome da variavel global Supabase no CONECTA)
</output>
