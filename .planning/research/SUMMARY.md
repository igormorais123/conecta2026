# Research Summary: Integracao Elexion → CONECTA 2026

**Domain:** Dashboard de campanha politica consumindo API de gamificacao de campo
**Researched:** 2026-03-28
**Overall confidence:** MEDIUM-HIGH

## Executive Summary

O projeto integra dois sistemas complementares ja existentes: CONECTA (HTML+JS+Supabase, dashboard de coordenadores) e Elexion (NestJS+PostgreSQL+PostGIS, plataforma de gamificacao para cabos eleitorais). O CONECTA precisa consumir a API REST e WebSocket do Elexion sem ser reescrito. O stack recomendado e conservador: Chart.js e Leaflet.js via CDN para visualizacoes, Socket.IO client via CDN para tempo real, e nenhuma quebra na arquitetura vanilla JS existente.

O principal bloqueador tecnico nao e a integracao em si, mas a ordem de execucao: o Docker do Elexion precisa estar rodando na VPS Hostinger e o NestJS precisa ter CORS habilitado para `inteia.com.br` antes de qualquer desenvolvimento no CONECTA. Qualquer trabalho frontend antes disso e cego — nao e possivel testar.

A seguranca do token JWT do Elexion e o tradeoff central da integracao. Fases 1-4 usam `sessionStorage` + bearer direto (risco baixo dado que sao 3 usuarios coordenadores em ambiente controlado). A Fase 5 implementa proxy via Supabase Edge Function eliminando o token do browser completamente. A latencia adicional do proxy (~100-200ms) e aceitavel para dados de polling; para o war room em tempo real o Socket.IO mantem conexao direta com a VPS.

A adaptacao do Elexion para o Distrito Federal (de Roraima) requer uma migration especifica: 33 Regioes Administrativas com poligonos GeoJSON, seeds de equipes da campanha Celina Leao, e atualizacao de strings de candidato. Isso precisa acontecer na Fase 1 junto com o deploy Docker, nao depois.

## Key Findings

**Stack:** Chart.js + Leaflet.js + Socket.IO via CDN; NestJS CORS para `inteia.com.br`; Supabase Edge Function como proxy na Fase 5.

**Architecture:** CONECTA como consumer puro da Elexion API. Modulos JS separados por funcionalidade. Polling simples antes do WebSocket. Proxy substitui bearer na fase final.

**Critical pitfall:** CORS preflight OPTIONS bloqueado e o problema mais comum e mais silencioso. O segundo e token em localStorage — usar sessionStorage nas fases iniciais e proxy depois.

## Implications for Roadmap

Based on research, suggested phase structure:

1. **Fundacao** — Prerequisitos inegociaveis antes de qualquer frontend
   - Deploy Docker Elexion na VPS Hostinger (NestJS + PostgreSQL + nginx)
   - NestJS CORS habilitado para `https://inteia.com.br`
   - Migration DF: geofences 33 RAs, seeds Celina Leao
   - `elexion-client.js` basico com auth bearer e refresh de token
   - Addresses: R1 (base), R11, R12
   - Avoids: Pitfall 1 (CORS preflight), Pitfall 7 (dados RR no DF), Pitfall 4 (OOM Docker)

2. **Dashboard Core** — Valor imediato para coordenadores com baixa complexidade
   - KPIs agregados (tarefas, XP, cabos ativos) em cards
   - Leaderboard de cabos com XP, badges, nivel
   - Rankings por equipe regional
   - Graficos Chart.js de performance temporal
   - Addresses: R2, R3, R4
   - Avoids: Pitfall 6 (refresh token), Pitfall 10 (canvas oculto), Pitfall 12 (memory leak)

3. **Visualizacoes Avancadas** — Diferenciadores visuais de alto impacto
   - Heatmap geografico Leaflet + Leaflet.heat (RAs do DF)
   - War Room com Socket.IO (feed, alertas, pulse)
   - Addresses: R6, R9
   - Avoids: Pitfall 5 (CORS gateway separado), Pitfall 8 (latencia), Pitfall 11 (pontos heatmap)

4. **Operacoes de Campo** — Features de escrita (requer token com permissao COORDINATOR)
   - Criacao e atribuicao de tarefas gamificadas
   - Desafios semanais configurados via CONECTA
   - Metricas sociais dos cabos (Instagram, X, TikTok)
   - Addresses: R5, R7, R8

5. **Hardening** — Seguranca e estabilidade para o dia das eleicoes
   - Proxy Supabase Edge Function (token Elexion sai do browser)
   - Sanitizacao sistematica de innerHTML no CONECTA
   - Addresses: R10
   - Avoids: Pitfall 3 (XSS localStorage), Pitfall 9 (timeout Edge Function)

**Phase ordering rationale:**
- Fase 1 e bloqueadora: nada funciona sem Docker + CORS + migration DF
- Fase 2 antes de Fase 3: KPIs simples provam a integracao antes de adicionar Socket.IO
- Fase 3 antes de Fase 4: visibilidade de campo antes de operar campo
- Fase 5 depois de tudo: hardening nao adiciona features, pode ser feito a qualquer momento apos Fase 1

**Research flags for phases:**
- Fase 1: Verificar se Elexion tem script de migration DF ou se precisa ser criado do zero. Verificar roles de usuario (COORDINATOR vs FIELD_WORKER) para saber quais endpoints requerem qual permissao.
- Fase 3: Testar formato exato dos dados de heatmap retornados pelo Elexion — se ja vem como `[lat, lng, intensity]` ou precisa de transformacao.
- Fase 4: Verificar se o endpoint de criacao de tarefas/desafios aceita o papel de coordenador ou exige role ADMIN.
- Fase 5: Verificar plano Supabase atual — limite de 100 Edge Functions no plano Free e suficiente, mas verificar quota de invocacoes.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack (CDN libs) | HIGH | Chart.js, Leaflet, Socket.IO — documentacao oficial verificada, CDN URLs confirmados |
| CORS NestJS | HIGH | Documentacao oficial verificada, patterns confirmados por multiplas fontes |
| Supabase Edge Functions (proxy) | MEDIUM | Limites verificados (256MB, 150s timeout, 2s CPU). Pattern de proxy com Deno fetch documentado. Latencia exata nao testada. |
| Socket.IO JWT auth | MEDIUM | Pattern verificado na documentacao oficial. Config CORS do WebSocketGateway confirmada. |
| Docker VPS resource allocation | MEDIUM | Boas praticas verificadas. Valores especificos para este stack sao estimativas — precisam de ajuste pos-deploy. |
| Adaptacao RR → DF | LOW | Nao ha acesso ao repo Elexion para verificar schema atual e existencia de migration scripts. Inferencia baseada na descricao do PROJECT.md. |
| Heatmap dados formato | LOW | Assume que `/analytics/heatmap` retorna lat/lng/intensity. Formato real nao verificado sem acesso a API. |

## Gaps to Address

- Acesso ao repo Elexion para verificar: (a) schema de banco atual, (b) roles de usuario disponiveis, (c) formato exato de retorno do heatmap, (d) se ja existe migration DF ou precisa ser criada
- Plano Supabase atual — verificar quota de Edge Functions e invocacoes antes da Fase 5
- SSL/TLS na VPS — verificar se o nginx ja tem certificado para `api.elexion.com.br` ou se precisa configurar Let's Encrypt
- Porta 3000 exposta publicamente na VPS — verificar se ha firewall/regra de entrada no Hostinger
- Tempo estimado de resposta da API Elexion — sem benchmark real, latencia do CONECTA para cabos desconhecida
