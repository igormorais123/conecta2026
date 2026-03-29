# Feature Landscape

**Domain:** Integracao dashboard politico com plataforma de gamificacao de campo
**Researched:** 2026-03-28

## Table Stakes

Funcionalidades que os coordenadores esperam. Falta alguma e o produto parece incompleto.

| Feature | Por que Esperado | Complexidade | Notas |
|---------|-----------------|-------------|-------|
| KPIs agregados (tarefas, XP total, cabos ativos) | Todo dashboard de campanha exibe numeros-chave em destaque | Baixa | GET /api/v1/analytics/kpis — um fetch, renderizar em cards |
| Leaderboard de cabos eleitorais | Gamificacao sem ranking e invisivel — motivacao cai | Media | GET /api/v1/gamification/leaderboard — lista ordenada com avatar, nome, XP, badge |
| Status de tarefas de campo | Coordenadores precisam saber o que esta sendo feito agora | Baixa | GET /api/v1/tasks — filtrar por status (pending/done/overdue) |
| Indicador de cabo ativo/inativo | Quem esta em campo hoje? Quem sumiu? | Baixa | Derivado do leaderboard — last_seen timestamp |
| Atualizacao periodica dos dados | Dashboard estatico e inutil em dia de campanha | Baixa | setInterval polling a cada 60s, simples antes do WebSocket |

## Differentiators

Features que diferenciam — nao esperadas, mas valorizadas.

| Feature | Proposta de Valor | Complexidade | Notas |
|---------|------------------|-------------|-------|
| War Room em tempo real | Feed de atividade live (Socket.IO) — "controle de operacao" para coordenadores | Alta | wss://api.elexion.com.br/socket.io/ — requer config CORS no gateway NestJS |
| Heatmap geografico das RAs | Visualiza lacunas de cobertura no DF por regiao administrativa | Media | GET /api/v1/analytics/heatmap — Leaflet + Leaflet.heat, dados de lat/lng |
| Graficos temporais de performance | Evolucao da equipe ao longo da semana/mes — identifica tendencias | Media | Chart.js line chart — dados de /analytics/teams/ranking historico |
| Criacao de desafios gamificados | Coordenador lanca desafio diretamente do CONECTA — aumenta engajamento | Alta | POST /api/v1/challenges — formulario no CONECTA escrevendo na API Elexion |
| Metricas de redes sociais | Quantos posts, alcance, engajamento dos cabos online | Media | GET /api/v1/social/team/:teamId/metrics — exige permissao de dados sociais no Elexion |
| Rankings por equipe regional | Competicao saudavel entre equipes de diferentes RAs | Baixa | GET /api/v1/analytics/teams/ranking — variante do leaderboard |

## Anti-Features

Features para explicitamente NAO construir.

| Anti-Feature | Por que Evitar | O que Fazer em vez |
|--------------|---------------|-------------------|
| Reescrever CONECTA em React/Next.js | 3 usuarios, HTML+JS funciona. Migracao = semanas de retrabalho sem ganho real | Manter vanilla JS, adicionar Chart.js/Leaflet via CDN |
| Login unificado Supabase + Elexion | SSO requer OAuth ou SAML — complexidade desnecessaria para 3 usuarios | Proxy na Fase 5 esconde o JWT do Elexion; usuario ve apenas o login CONECTA |
| Sincronizar bancos (Supabase ↔ PostgreSQL Elexion) | Risco de inconsistencia, duplicacao, conflitos — dois sistemas com schemas diferentes | CONECTA consome API Elexion por fetch; nenhum dado e replicado |
| Multi-tenancy no Elexion | Schema Elexion nao tem campaign_id — adaptar seria reescrever o core | Instancia dedicada para DF; RR e DF sao instancias separadas |
| App mobile proprio para coordenadores | Ja existe CONECTA como web app + Elexion app para cabos | CONECTA funciona em mobile browser; nao criar terceiro app |
| Notificacoes push para coordenadores | 3 usuarios — war room em aba aberta resolve; push add complexidade | War Room via Socket.IO no browser com sons/alertas visuais |

## Dependencias entre Features

```
CORS NestJS habilitado → qualquer fetch do CONECTA para Elexion
Docker Elexion online → todas as features abaixo
  ├── KPIs dashboard → leaderboard → graficos temporais
  ├── Heatmap (Leaflet) → independente de Socket.IO
  ├── War Room → depende Socket.IO CORS configurado
  │    └── Feed em tempo real → alertas → pulse
  ├── Criacao de desafios → depende auth write-access (token com role COORDINATOR)
  └── Proxy Supabase → substitui bearer direto no browser → seguranca melhorada
```

## MVP Recomendado (Fase 1-2)

Priorizar:
1. CORS NestJS + deploy Docker funcionando (pre-requisito de tudo)
2. KPIs + leaderboard (impacto imediato, baixa complexidade)
3. Heatmap DF (diferenciador visual de alto impacto, independe de WebSocket)
4. Polling simples (setInterval 60s) antes do Socket.IO

Deferir:
- War Room (Socket.IO): depende de CORS de WebSocket, mais complexo — Fase 3
- Criacao de desafios: requer token com permissao de escrita — Fase 4
- Proxy Supabase Edge Function: hardening de seguranca — Fase 5
- Metricas sociais: depende de dados ricos no Elexion, menor prioridade — Fase 4

## Sources

- Analise dos endpoints em PROJECT.md
- [Gamification UI Patterns 2025](https://themeselection.com/blog/gamification-component-example/)
- [Chart.js Dashboard Guide](https://embeddable.com/blog/how-to-build-dashboards-with-chart-js)
- [Socket.IO Real-Time Dashboard](https://oneuptime.com/blog/post/2026-01-26-socketio-realtime-dashboards/view)
- [Leaflet.heat Plugin](https://github.com/Leaflet/Leaflet.heat)
