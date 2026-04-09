---
phase: 05-hardening-proxy-seguro-sanitizacao
plan: 01
subsystem: seguranca
tags: [proxy, sanitizacao, edge-function, xss, cors]
dependency_graph:
  requires: [phases 1-4 completas]
  provides: [SEC-01, SEC-02, SEC-03, SEC-04]
  affects: [js/elexion-client.js, CONECTA.html, supabase/functions]
tech_stack:
  added: [Supabase Edge Functions (Deno)]
  patterns: [proxy reverso com validacao de sessao, sanitizacao sistematica innerHTML]
key_files:
  created:
    - supabase/functions/elexion-proxy/index.ts
  modified:
    - js/elexion-client.js
    - CONECTA.html
decisions:
  - "Supabase client global: window.CONECTA_SUPABASE (nao _supabaseClient)"
  - "isAuthenticated() agora async — 4 call sites atualizados com await"
  - "renderVeiculos sanitizado com escapeHtml() em todos os 10 campos"
  - "ev.sub sanitizado com _safeText(); ev.texto mantido sem dupla sanitizacao"
metrics:
  completed: 2026-03-28
  tasks: 3/3
---

# Phase 5 Plan 01: Hardening — Proxy Seguro + Sanitizacao Summary

Edge Function Deno como proxy reverso entre browser e Elexion API, eliminando JWT do browser; ElexionClient v2.0 via proxy Supabase; auditoria completa de innerHTML no CONECTA.html com escapeHtml/safeText em todos os pontos de dados externos.

## Tasks Completed

### Task 1: Edge Function elexion-proxy (Deno)

Criado `supabase/functions/elexion-proxy/index.ts` (123 linhas):
- Valida sessao Supabase via `auth.getUser()` antes de qualquer forward
- Usa `ELEXION_SERVICE_TOKEN` (env var no Supabase Dashboard) como bearer para o Elexion
- CORS restrito a `https://inteia.com.br`
- Timeout de 10s no fetch (Pitfall 9)
- WebSocket NAO proxeado — Socket.IO continua direto
- Helper `jsonResponse()` para respostas padronizadas com CORS
- Tratamento de timeout vs unreachable com mensagens distintas

### Task 2: ElexionClient v2.0 (proxy)

Reescrito `js/elexion-client.js`:
- **Removidos**: `login()`, `saveTokens()`, `getAccessToken()`, `getRefreshToken()`, `refreshTokens()`, `clearTokens()`, `TOKEN_KEY`, `REFRESH_KEY`, `BASE` (api.elexion.com.br)
- **Adicionados**: `PROXY_URL` (Edge Function URL), `getSupabaseClient()` helper
- `request()` agora obtem sessao Supabase via `window.CONECTA_SUPABASE.auth.getSession()` e envia bearer token Supabase ao proxy
- `isAuthenticated()` agora async — verifica sessao Supabase
- `logout()` simplificado (apenas limpa USER_KEY)
- API publica mantida: 18 metodos fetchXxx sem alteracao de assinatura
- Versao atualizada para 2.0.0

### Task 3: Auditoria innerHTML (SEC-03)

Auditado e sanitizado CONECTA.html:
- **ev.sub**: agora usa `_safeText(ev.sub)` no renderWarRoomFeed (linha ~6473)
- **renderVeiculos**: 10 campos sanitizados com `escapeHtml()` — placa, modelo, cor, responsavel, telefone, uso, dataSaida, horaSaida, kmSaida, kmChegada
- **4 call sites de isAuthenticated()**: atualizados para `await ElexionClient.isAuthenticated()` (funcao agora async)
- **Comentario SEC-04** adicionado proximo a renderGamificacao: instrucoes para remover CORS do NestJS na VPS
- Total de ocorrencias `_safeText`/`escapeHtml`: 45 (antes: ~35)

Secoes ja sanitizadas (confirmadas, sem alteracao necessaria):
- renderPessoas: todos os campos com `escapeHtml()`
- renderLideres: todos os campos com `escapeHtml()`
- renderTarefasCampo: usa `replace(/</g, '&lt;')` inline
- renderSocial: usa `replace(/</g, '&lt;')` inline
- challenge leaderboard: usa `replace(/</g, '&lt;')` inline
- reports: usa `replace(/</g, '&lt;')` inline
- Socket.IO handlers: todos os dados passam por `_safeText()` antes de montar ev.texto/ev.sub

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] isAuthenticated() async breaking change**
- **Found during:** Task 2/3
- **Issue:** O plano tornou isAuthenticated() async mas nao mencionou atualizar os 4 call sites no CONECTA.html que chamavam de forma sincrona
- **Fix:** Adicionado `await` nos 4 locais: renderGamificacao (5759), filtrarLeaderboard (5854), renderMapaCobertura (6048), iniciarWarRoom (6252)
- **Files modified:** CONECTA.html
- **Impact:** Sem essa correcao, isAuthenticated() retornaria uma Promise (truthy) em vez de verificar a sessao real

## Post-Deploy Actions (Manual)

### SEC-02: Configurar ELEXION_SERVICE_TOKEN
1. Supabase Dashboard -> Edge Functions -> elexion-proxy -> Environment Variables
2. Adicionar: `ELEXION_SERVICE_TOKEN` = JWT de longa duracao do service account Elexion
3. Deploy da Edge Function: `supabase functions deploy elexion-proxy`

### SEC-04: Remover CORS do NestJS
Apos validar o proxy em producao:
1. SSH na VPS 187.77.53.163
2. Editar `src/main.ts` do NestJS: remover `https://inteia.com.br` do `enableCors()`
3. Reiniciar container: `docker restart api`

## Known Stubs

Nenhum. Todos os endpoints estao wired ao proxy; sanitizacao completa.

## Verification Results

- SEC-01: `grep "elexion_access_token" js/elexion-client.js` = 0 ocorrencias
- SEC-02: `ELEXION_SERVICE_TOKEN` presente na Edge Function
- SEC-03: 45 ocorrencias de `_safeText`/`escapeHtml` no CONECTA.html (>= 20)
- SEC-04: Comentario instrucional presente no CONECTA.html
- WebSocket: Socket.IO nao passa pelo proxy (comportamento Phase 3 mantido)
- API publica: 18 metodos fetchXxx com assinaturas identicas

## Self-Check: PASSED

Arquivos verificados:
- FOUND: supabase/functions/elexion-proxy/index.ts (123 linhas, ELEXION_SERVICE_TOKEN x6)
- FOUND: js/elexion-client.js (PROXY_URL presente, elexion_access_token ausente)
- FOUND: CONECTA.html (_safeText(ev.sub) na linha 6473, await isAuthenticated x4)
- FOUND: .planning/REQUIREMENTS.md (SEC-01..04 marcados [x])
- FOUND: .planning/STATE.md (Phase 5 Complete)
- FOUND: .planning/ROADMAP.md (05-01-PLAN.md marcado [x])

NOTA: Git commit/push devem ser executados manualmente (Bash indisponivel nesta sessao):
```bash
cd "C:\Users\IgorPC\.claude\projects\Conecta 2026"
git add supabase/functions/elexion-proxy/index.ts js/elexion-client.js CONECTA.html
git add .planning/phases/05-hardening-proxy-seguro-sanitizacao/05-01-SUMMARY.md
git add .planning/STATE.md .planning/ROADMAP.md .planning/REQUIREMENTS.md
git commit -m "feat(05-01): hardening proxy seguro + sanitizacao innerHTML (SEC-01..04)

- Edge Function elexion-proxy: valida sessao Supabase, forward com service account token
- ElexionClient v2.0: PROXY_URL, sem token Elexion no browser
- Auditoria innerHTML: 45 pontos sanitizados com escapeHtml/_safeText
- isAuthenticated() async + 4 call sites atualizados com await
- CORS restrito, timeout 10s, WebSocket nao proxeado"
git push origin main
```
