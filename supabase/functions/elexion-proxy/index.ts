/**
 * elexion-proxy — Supabase Edge Function (Deno runtime)
 * Proxy seguro entre o browser e a API Elexion.
 *
 * Phase 5 — Hardening: SEC-01 (token fora do browser), SEC-02 (service account)
 *
 * CONFIGURACAO OBRIGATORIA:
 * No Supabase Dashboard -> Edge Functions -> elexion-proxy -> Environment Variables,
 * configurar:
 *   ELEXION_SERVICE_TOKEN = JWT de longa duracao do service account Elexion
 *
 * As variaveis SUPABASE_URL e SUPABASE_ANON_KEY ja estao disponíveis automaticamente
 * no runtime das Edge Functions do Supabase.
 *
 * IMPORTANTE: Este proxy NAO suporta WebSocket.
 * O Socket.IO (War Room) continua conectando diretamente ao Elexion
 * com token Supabase no handshake (comportamento da Phase 3).
 *
 * URL da funcao em producao:
 *   https://dvgbqbwipwegkndutvte.supabase.co/functions/v1/elexion-proxy
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ---- Constantes ----

const ELEXION_BASE = 'https://api.elexion.com.br/api/v1'
const ELEXION_SERVICE_TOKEN = Deno.env.get('ELEXION_SERVICE_TOKEN') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

// CORS restrito ao dominio de producao
const ALLOWED_ORIGIN = 'https://inteia.com.br'

// Headers CORS padrao
const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
}

// ---- Helper: resposta JSON com CORS ----

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  })
}

// ---- Handler principal ----

Deno.serve(async (req: Request) => {
  // 1. CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // 2. Validar sessao Supabase via Authorization header
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Unauthorized: missing bearer token' }, 401)
  }

  // Criar cliente Supabase com o token do usuario para validar a sessao
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return jsonResponse({ error: 'Invalid session' }, 401)
  }

  // 3. Verificar que ELEXION_SERVICE_TOKEN esta configurado
  if (!ELEXION_SERVICE_TOKEN) {
    console.error('[elexion-proxy] ELEXION_SERVICE_TOKEN nao configurado no Supabase Dashboard')
    return jsonResponse({ error: 'Proxy misconfigured' }, 500)
  }

  // 4. Extrair path do Elexion da URL do proxy
  // Ex: /elexion-proxy/analytics/kpis -> /analytics/kpis
  const url = new URL(req.url)
  const elexionPath = url.pathname.replace(/^\/elexion-proxy/, '') + url.search

  // 5. Forward para api.elexion.com.br com service account JWT
  // Timeout de 10s (Pitfall 9: Elexion pode ser lento, Edge Function tem wall-clock de 150s)
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
      body: req.method !== 'GET' && req.method !== 'HEAD' ? await req.text() : undefined,
      signal: controller.signal,
    })
  } catch (err) {
    clearTimeout(timeout)
    const isTimeout = err instanceof Error && err.name === 'AbortError'
    const msg = isTimeout ? 'Elexion timeout (10s)' : 'Elexion unreachable'
    console.error(`[elexion-proxy] ${msg}:`, err)
    return jsonResponse({ error: msg }, 502)
  }
  clearTimeout(timeout)

  // 6. Retornar resposta do Elexion para o browser (sem expor o service token)
  const body = await elexionRes.text()
  return new Response(body, {
    status: elexionRes.status,
    headers: {
      'Content-Type': elexionRes.headers.get('Content-Type') || 'application/json',
      ...corsHeaders,
    },
  })
})
