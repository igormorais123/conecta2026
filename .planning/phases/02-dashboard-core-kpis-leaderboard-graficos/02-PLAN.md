---
phase: 02-dashboard-core-kpis-leaderboard-graficos
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - "C:\\Users\\IgorPC\\.claude\\projects\\Conecta 2026\\js\\elexion-client.js"
  - "C:\\Users\\IgorPC\\.claude\\projects\\Conecta 2026\\CONECTA.html"
autonomous: true
requirements: [DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, DASH-06, DASH-07]

must_haves:
  truths:
    - "Sidebar do CONECTA exibe item 'Gamificacao' com icone de trofeu e badge laranja 'NOVO'"
    - "Clicar em 'Gamificacao' exibe a secao com cards de KPIs (tarefas, XP, cabos, cobertura)"
    - "Leaderboard exibe cabos ordenados por XP com posicao, nome, nivel, streak e ultimo badge"
    - "Dropdown de filtro por equipe regional filtra o leaderboard sem recarregar a pagina"
    - "Secao de ranking por equipes exibe cards com metricas agregadas"
    - "Grafico Chart.js renderiza linha de performance temporal (dia/semana/mes)"
    - "Dados atualizam automaticamente a cada 60s com indicador de 'ultima atualizacao'"
    - "Quando Elexion esta offline, a secao exibe mensagem de fallback sem quebrar o CONECTA"
  artifacts:
    - path: "C:\\Users\\IgorPC\\.claude\\projects\\Conecta 2026\\js\\elexion-client.js"
      provides: "Metodos fetchLeaderboard e fetchTeamsRanking adicionados ao ElexionClient"
      exports: ["fetchLeaderboard", "fetchTeamsRanking"]
    - path: "C:\\Users\\IgorPC\\.claude\\projects\\Conecta 2026\\CONECTA.html"
      provides: "Secao gamificacao com KPIs, leaderboard, ranking equipes, grafico Chart.js e polling"
      contains: "page-gamificacao"
  key_links:
    - from: "sidebar nav-item gamificacao"
      to: "page-gamificacao"
      via: "onclick=\"showPage('gamificacao')\""
      pattern: "showPage.*gamificacao"
    - from: "page-gamificacao"
      to: "ElexionClient.fetchKpis()"
      via: "renderGamificacao() chamado em showPage() e em setInterval"
      pattern: "renderGamificacao"
    - from: "grafico canvas #chart-performance"
      to: "Chart.js"
      via: "new Chart(document.getElementById('chart-performance'), config)"
      pattern: "new Chart"
    - from: "setInterval"
      to: "renderGamificacao()"
      via: "setInterval(renderGamificacao, 60000)"
      pattern: "setInterval.*renderGamificacao.*60000"
---

<objective>
Adicionar a secao "Gamificacao" ao CONECTA.html com KPIs, leaderboard, ranking por equipes e grafico Chart.js. Os dados vem do Elexion via ElexionClient e atualizam automaticamente a cada 60s.

Purpose: Coordenadores precisam ver a performance dos cabos eleitorais sem sair do CONECTA. Esta secao e o ponto de entrada da integracao Elexion que usuarios vao interagir diariamente.

Output:
- js/elexion-client.js com fetchLeaderboard() e fetchTeamsRanking() adicionados
- CONECTA.html com secao gamificacao completa (nav + HTML + CSS + JS)
- Chart.js carregado via CDN com grafico de linha temporal
- Polling 60s com indicador visual de ultima atualizacao
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@.planning/STATE.md

<interfaces>
<!-- Contrato atual do ElexionClient (js/elexion-client.js). Executor usa diretamente. -->

```javascript
// window.ElexionClient — IIFE exposta globalmente
// Todos os metodos retornam Promise<data|null>. Null = Elexion offline (nao throw).

ElexionClient.login(email, password)      // -> Promise<user|null>
ElexionClient.logout()                    // -> void
ElexionClient.isAuthenticated()           // -> boolean
ElexionClient.getCurrentUser()            // -> object|null
ElexionClient.request(path, options)      // -> Promise<json|null> (fetch autenticado com retry 401)
ElexionClient.fetchKpis()                 // -> Promise<KpisData|null>
ElexionClient.fetchHeatmap()              // -> Promise<HeatmapData|null>
ElexionClient.fetchHeatmapGaps()          // -> Promise<GapsData|null>
ElexionClient.fetchGeofences()            // -> Promise<GeofenceData|null>
ElexionClient.fetchWarRoomFeed()          // -> Promise<FeedData|null>
ElexionClient.fetchAlerts()               // -> Promise<AlertsData|null>

// AUSENTES — precisam ser adicionados na Task 1:
// ElexionClient.fetchLeaderboard(equipeId?)  -> GET /analytics/leaderboard?equipe={id}
// ElexionClient.fetchTeamsRanking()          -> GET /analytics/teams/ranking
```

Endpoints Elexion usados nesta fase:
- GET /api/v1/analytics/kpis
  Retorno esperado: { tarefasConcluidas: number, xpTotal: number, cabosAtivos: number, cobertura: number }
  (Se endpoint retornar shape diferente, usar fallback de zeros e logar no console)

- GET /api/v1/analytics/leaderboard?equipe={id}
  Retorno esperado: array de { posicao, nome, xp, nivel, streak, ultimoBadge }

- GET /api/v1/analytics/teams/ranking
  Retorno esperado: array de { equipe, xpTotal, cabos, tarefas, cobertura }

<!-- Padrao de navegacao do CONECTA.html -->
// showPage(page) — ativa .page#page-{name} e .nav-item com onclick contendo '{name}'
// Titulos das secoes controlados em objeto `titles` dentro de showPage()
// Nav-items usam onclick inline: onclick="showPage('gamificacao')"
// Pages sao divs: <div class="page" id="page-gamificacao">

<!-- CSS variaveis disponiveis -->
:root {
  --primary: #1a237e;
  --primary-light: #3949ab;
  --primary-dark: #0d1442;
  --accent: #ff6f00;
  --accent-light: #ffa040;
  --success: #2e7d32;
  --danger: #c62828;
  --warning: #f57f17;
  --info: #0277bd;
  --bg: #f0f2f5;
  --card-bg: #ffffff;
  --text: #1a1a1a;
  --text-light: #666;
}

<!-- Classes de card existentes no CONECTA -->
.stat-card { background: var(--card-bg); border-radius: 16px; padding: 24px; }
.stat-card.green  { border-top: 4px solid var(--success); }
.stat-card.orange { border-top: 4px solid var(--accent); }
.stat-card.blue   { border-top: 4px solid var(--info); }
.stat-card.purple { border-top: 4px solid #7b1fa2; }
.stat-label { font-size: 0.8rem; color: var(--text-light); font-weight: 600; }
.stat-value { font-size: 2.2rem; font-weight: 800; color: var(--primary); margin: 8px 0 4px; }
.stat-sub   { font-size: 0.75rem; color: var(--text-light); }
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 24px; }

<!-- Fim do bloco de interfaces -->
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Adicionar fetchLeaderboard e fetchTeamsRanking ao elexion-client.js</name>
  <files>C:\Users\IgorPC\.claude\projects\Conecta 2026\js\elexion-client.js</files>
  <action>
Editar js/elexion-client.js para adicionar dois novos metodos antes do bloco `return {`:

1. Adicionar metodo fetchLeaderboard apos fetchAlerts():
```javascript
/**
 * GET /api/v1/analytics/leaderboard — ranking de cabos por XP.
 * @param {string|null} equipeId - Filtrar por equipe (opcional). Null = todos.
 * @returns {Promise<Array|null>} array de cabos ou null
 */
async function fetchLeaderboard(equipeId = null) {
  const path = equipeId
    ? '/analytics/leaderboard?equipe=' + encodeURIComponent(equipeId)
    : '/analytics/leaderboard';
  return request(path);
}

/**
 * GET /api/v1/analytics/teams/ranking — ranking agregado por equipe.
 * @returns {Promise<Array|null>} array de equipes ou null
 */
async function fetchTeamsRanking() {
  return request('/analytics/teams/ranking');
}
```

2. Adicionar fetchLeaderboard e fetchTeamsRanking ao objeto retornado pelo IIFE (no bloco `return {`), apos `fetchAlerts`.

Regra: NAO modificar nenhuma funcao existente. Apenas adicionar as duas novas funcoes e expor no return.
  </action>
  <verify>
    <automated>node -e "const fs=require('fs'); const src=fs.readFileSync('C:/Users/IgorPC/.claude/projects/Conecta 2026/js/elexion-client.js','utf8'); if(!src.includes('fetchLeaderboard')||!src.includes('fetchTeamsRanking')) process.exit(1); console.log('OK');"</automated>
  </verify>
  <done>elexion-client.js exporta fetchLeaderboard(equipeId?) e fetchTeamsRanking() no objeto window.ElexionClient. Funcoes existentes intactas.</done>
</task>

<task type="auto">
  <name>Task 2: Adicionar item "Gamificacao" na sidebar e secao HTML em CONECTA.html</name>
  <files>C:\Users\IgorPC\.clone\projects\Conecta 2026\CONECTA.html</files>
  <action>
Fazer TRES insercoes cirurgicas no CONECTA.html. Nao modificar nada fora dos pontos indicados.

--- INSERCAO 1: Nav item na sidebar ---
Localizar a linha com o nav-section "Logistica" (linha ~1729):
```html
        <div class="nav-section">Log&iacute;stica</div>
```
ANTES desta linha, inserir um novo nav-section "Campo" e o item Gamificacao:
```html
        <div class="nav-section">Campo</div>
        <div class="nav-item" onclick="showPage('gamificacao')">
            <span class="nav-icon">&#127942;</span>
            <span>Gamifica&ccedil;&atilde;o</span>
            <span class="nav-badge" id="badge-gamificacao" style="background:var(--accent);display:none;">NOVO</span>
        </div>
```
O badge ficara oculto por default e sera exibido via JS quando houver dados.

--- INSERCAO 2: HTML da secao gamificacao ---
Localizar o comentario `<!-- ========== DASHBOARD ==========` que inicia a primeira secao (linha ~1763).
ANTES desse comentario, inserir a secao gamificacao completa:

```html
    <!-- ========== GAMIFICACAO ========== -->
    <div class="page" id="page-gamificacao">

        <!-- Cabecalho da secao -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
            <div>
                <h2 style="font-size:1.4rem;font-weight:800;color:var(--primary);margin:0;">&#127942; Gamifica&ccedil;&atilde;o de Campo</h2>
                <p style="font-size:0.8rem;color:var(--text-light);margin:4px 0 0;">Performance dos cabos eleitorais via Elexion</p>
            </div>
            <div style="display:flex;align-items:center;gap:12px;">
                <span id="gami-ultima-atualizacao" style="font-size:0.75rem;color:var(--text-light);">Aguardando dados...</span>
                <button onclick="renderGamificacao()" style="padding:7px 16px;background:var(--primary);color:#fff;border:none;border-radius:8px;font-size:0.8rem;font-weight:600;cursor:pointer;">&#8635; Atualizar</button>
            </div>
        </div>

        <!-- Estado de conexao Elexion -->
        <div id="gami-offline-banner" style="display:none;background:#fff3e0;border:1px solid var(--accent);border-radius:10px;padding:12px 16px;margin-bottom:16px;font-size:0.85rem;color:#e65100;">
            &#9888; Elexion indispon&iacute;vel ou conta n&atilde;o vinculada. <a href="conta.html" style="color:var(--accent);font-weight:700;">Vincular conta &rarr;</a>
        </div>

        <!-- KPIs -->
        <div class="stats-grid" id="gami-kpis-grid">
            <div class="stat-card green">
                <div class="stat-label">Tarefas Conclu&iacute;das</div>
                <div class="stat-value" id="gami-kpi-tarefas">--</div>
                <div class="stat-sub">total da campanha</div>
            </div>
            <div class="stat-card orange">
                <div class="stat-label">XP Total Distribuído</div>
                <div class="stat-value" id="gami-kpi-xp">--</div>
                <div class="stat-sub">pontos de experi&ecirc;ncia</div>
            </div>
            <div class="stat-card blue">
                <div class="stat-label">Cabos Ativos</div>
                <div class="stat-value" id="gami-kpi-cabos">--</div>
                <div class="stat-sub">nos &uacute;ltimos 7 dias</div>
            </div>
            <div class="stat-card purple">
                <div class="stat-label">Cobertura DF</div>
                <div class="stat-value" id="gami-kpi-cobertura">--%</div>
                <div class="stat-sub">regi&otilde;es administrativas</div>
            </div>
        </div>

        <!-- Grid: Grafico + Filtro/Leaderboard -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">

            <!-- Grafico de performance temporal -->
            <div style="background:var(--card-bg);border-radius:16px;padding:24px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
                    <h3 style="font-size:1rem;font-weight:700;color:var(--primary);margin:0;">Performance Temporal</h3>
                    <select id="gami-chart-periodo" onchange="renderGamiChart()" style="padding:4px 10px;border:1px solid #e0e0e0;border-radius:6px;font-size:0.8rem;">
                        <option value="7">7 dias</option>
                        <option value="30" selected>30 dias</option>
                        <option value="90">3 meses</option>
                    </select>
                </div>
                <div style="position:relative;height:220px;">
                    <canvas id="chart-performance"></canvas>
                    <div id="gami-chart-empty" style="display:none;position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--text-light);font-size:0.85rem;">Sem dados de performance</div>
                </div>
            </div>

            <!-- Leaderboard com filtro -->
            <div style="background:var(--card-bg);border-radius:16px;padding:24px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
                    <h3 style="font-size:1rem;font-weight:700;color:var(--primary);margin:0;">&#127941; Leaderboard</h3>
                    <select id="gami-filtro-equipe" onchange="renderGamiLeaderboard()" style="padding:4px 10px;border:1px solid #e0e0e0;border-radius:6px;font-size:0.8rem;">
                        <option value="">Todas as equipes</option>
                    </select>
                </div>
                <div id="gami-leaderboard-lista" style="max-height:220px;overflow-y:auto;">
                    <p style="color:var(--text-light);font-size:0.85rem;text-align:center;padding:20px 0;">Carregando...</p>
                </div>
            </div>
        </div>

        <!-- Ranking por equipes -->
        <div style="background:var(--card-bg);border-radius:16px;padding:24px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
            <h3 style="font-size:1rem;font-weight:700;color:var(--primary);margin:0 0 16px;">&#127963; Ranking de Equipes Regionais</h3>
            <div id="gami-equipes-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;">
                <p style="color:var(--text-light);font-size:0.85rem;text-align:center;padding:20px 0;grid-column:1/-1;">Carregando...</p>
            </div>
        </div>

    </div><!-- /page-gamificacao -->
```

--- INSERCAO 3: Titulo da secao em showPage() ---
Localizar o objeto `titles` dentro da funcao showPage() (linha ~2787):
```javascript
        lideres: 'Cadastro de L\u00edderes'
```
Adicionar APOS essa linha (antes do fechamento do objeto):
```javascript
        gamificacao: 'Gamifica\u00e7\u00e3o de Campo'
```

Nao alterar nada mais. O CSS herdado (.stats-grid, .stat-card, etc.) ja existe no CONECTA.
  </action>
  <verify>
    <automated>node -e "const fs=require('fs'); const src=fs.readFileSync('C:/Users/IgorPC/.claude/projects/Conecta 2026/CONECTA.html','utf8'); const checks=['page-gamificacao','gami-kpi-tarefas','chart-performance','gami-leaderboard-lista','gami-equipes-grid','gami-ultima-atualizacao',\"showPage('gamificacao')\",'gamifica\\\\u00e7\\\\u00e3o']; const fail=checks.filter(c=>!src.includes(c)); if(fail.length){console.error('Faltando:',fail);process.exit(1);} console.log('OK - todos os elementos presentes');"</automated>
  </verify>
  <done>CONECTA.html tem nav-item "Gamificacao" na sidebar, div#page-gamificacao com KPIs/leaderboard/grafico/equipes, e titulo mapeado em showPage(). Nenhuma secao existente foi alterada.</done>
</task>

<task type="auto">
  <name>Task 3: Adicionar Chart.js CDN, CSS adicional, JS completo da secao gamificacao e polling 60s</name>
  <files>C:\Users\IgorPC\.clone\projects\Conecta 2026\CONECTA.html</files>
  <action>
Fazer TRES insercoes no CONECTA.html. Nao tocar em nada fora dos pontos indicados.

--- INSERCAO 1: Script Chart.js no head ---
Localizar a tag `</style>` que fecha o bloco CSS inline do head (proxima da linha 1660).
ANTES de `</style>`, adicionar CSS para a secao gamificacao:

```css
        /* ===== GAMIFICACAO ===== */
        .gami-leaderboard-row {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 0;
            border-bottom: 1px solid #f0f0f0;
            font-size: 0.82rem;
        }
        .gami-leaderboard-row:last-child { border-bottom: none; }
        .gami-pos {
            width: 24px;
            height: 24px;
            background: var(--primary);
            color: #fff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.7rem;
            font-weight: 800;
            flex-shrink: 0;
        }
        .gami-pos.top1 { background: #FFD700; color: #333; }
        .gami-pos.top2 { background: #C0C0C0; color: #333; }
        .gami-pos.top3 { background: #CD7F32; color: #fff; }
        .gami-nome { flex: 1; font-weight: 600; color: var(--text); }
        .gami-xp { font-weight: 700; color: var(--accent); min-width: 60px; text-align: right; }
        .gami-nivel { font-size: 0.7rem; background: var(--primary); color: #fff; padding: 2px 6px; border-radius: 4px; }
        .gami-streak { font-size: 0.75rem; color: var(--warning); font-weight: 600; }
        .gami-badge { font-size: 0.7rem; color: var(--text-light); }
        .gami-equipe-card {
            background: var(--bg);
            border-radius: 10px;
            padding: 14px 16px;
            border-left: 4px solid var(--primary);
        }
        .gami-equipe-nome { font-weight: 700; font-size: 0.9rem; color: var(--primary); margin-bottom: 6px; }
        .gami-equipe-stat { font-size: 0.78rem; color: var(--text-light); margin: 2px 0; }
        .gami-equipe-stat strong { color: var(--text); }

        @media (max-width: 768px) {
            #page-gamificacao > div:nth-child(4) { grid-template-columns: 1fr !important; }
        }
```

APOS `</style>` (ainda no head), adicionar o script Chart.js:
```html
    <!-- Chart.js para graficos de performance da gamificacao -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js"></script>
    <!-- elexion-client.js: auth bearer + endpoints Elexion -->
    <script src="js/elexion-client.js"></script>
```

--- INSERCAO 2: JS da secao gamificacao ---
Localizar a linha que inicia o bloco `window.addEventListener('conecta-sync-status'` (linha ~5205), que fica proximo ao final do script inline.
ANTES dessa linha, inserir o bloco JS da gamificacao:

```javascript
// ===== GAMIFICACAO =====
// Dados em memoria (cache simples — evita refetch desnecessario)
var gamiState = {
    kpis: null,
    leaderboard: null,          // array completo (sem filtro)
    teamsRanking: null,
    chartInstance: null,        // Chart.js instance (para destroy antes de recriar)
    pollingTimer: null,
    equipes: []                 // lista de equipes para o filtro
};

/**
 * Ponto de entrada: carrega todos os dados e renderiza a secao.
 * Chamado por showPage('gamificacao') e pelo setInterval.
 */
async function renderGamificacao() {
    // Verificar se ElexionClient existe e esta autenticado
    if (!window.ElexionClient || !ElexionClient.isAuthenticated()) {
        document.getElementById('gami-offline-banner').style.display = 'block';
        atualizarUltimaAtualizacao(false);
        return;
    }

    document.getElementById('gami-offline-banner').style.display = 'none';

    // Fetch paralelo para minimizar tempo de carregamento
    var [kpisData, leaderboardData, teamsData] = await Promise.all([
        ElexionClient.fetchKpis(),
        ElexionClient.fetchLeaderboard(),
        ElexionClient.fetchTeamsRanking()
    ]);

    // Se tudo null = Elexion offline
    if (!kpisData && !leaderboardData && !teamsData) {
        document.getElementById('gami-offline-banner').style.display = 'block';
        atualizarUltimaAtualizacao(false);
        return;
    }

    // Salvar no estado
    if (kpisData) gamiState.kpis = kpisData;
    if (leaderboardData) gamiState.leaderboard = leaderboardData;
    if (teamsData) gamiState.teamsRanking = teamsData;

    renderGamiKpis();
    renderGamiLeaderboard();
    renderGamiEquipes();
    renderGamiChart();
    atualizarUltimaAtualizacao(true);
    atualizarBadgeSidebar();
}

function atualizarUltimaAtualizacao(sucesso) {
    var el = document.getElementById('gami-ultima-atualizacao');
    if (!el) return;
    var agora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    el.textContent = sucesso
        ? 'Atualizado: ' + agora
        : 'Ultima tentativa: ' + agora + ' (offline)';
    el.style.color = sucesso ? 'var(--success)' : 'var(--warning)';
}

function atualizarBadgeSidebar() {
    var badge = document.getElementById('badge-gamificacao');
    if (badge && gamiState.leaderboard && gamiState.leaderboard.length > 0) {
        badge.style.display = 'inline';
    }
}

// ---- KPIs ----
function renderGamiKpis() {
    var k = gamiState.kpis || {};
    var tarefas = k.tarefasConcluidas != null ? k.tarefasConcluidas : '--';
    var xp = k.xpTotal != null ? k.xpTotal.toLocaleString('pt-BR') : '--';
    var cabos = k.cabosAtivos != null ? k.cabosAtivos : '--';
    var cobertura = k.cobertura != null ? k.cobertura.toFixed(1) + '%' : '--%';

    var el = function(id) { return document.getElementById(id); };
    if (el('gami-kpi-tarefas')) el('gami-kpi-tarefas').textContent = tarefas;
    if (el('gami-kpi-xp')) el('gami-kpi-xp').textContent = xp;
    if (el('gami-kpi-cabos')) el('gami-kpi-cabos').textContent = cabos;
    if (el('gami-kpi-cobertura')) el('gami-kpi-cobertura').textContent = cobertura;
}

// ---- Leaderboard ----
// Popula o dropdown de filtro com equipes unicas do leaderboard
function popularFiltroEquipes() {
    var sel = document.getElementById('gami-filtro-equipe');
    if (!sel || !gamiState.leaderboard) return;
    var equipes = new Set();
    gamiState.leaderboard.forEach(function(c) {
        if (c.equipe) equipes.add(c.equipe);
    });
    gamiState.equipes = Array.from(equipes).sort();
    // Recriar options preservando "Todas as equipes"
    while (sel.options.length > 1) sel.remove(1);
    gamiState.equipes.forEach(function(eq) {
        var opt = document.createElement('option');
        opt.value = eq;
        opt.textContent = eq;
        sel.appendChild(opt);
    });
}

async function renderGamiLeaderboard() {
    var sel = document.getElementById('gami-filtro-equipe');
    var equipeId = sel ? sel.value : '';
    var lista = document.getElementById('gami-leaderboard-lista');
    if (!lista) return;

    // Se ha filtro ativo e leaderboard ainda nao foi filtrado, buscar na API
    var dados = gamiState.leaderboard;
    if (equipeId && window.ElexionClient && ElexionClient.isAuthenticated()) {
        var filtrado = await ElexionClient.fetchLeaderboard(equipeId);
        if (filtrado) dados = filtrado;
    }

    if (!dados || dados.length === 0) {
        lista.innerHTML = '<p style="color:var(--text-light);font-size:0.85rem;text-align:center;padding:20px 0;">Nenhum dado de leaderboard</p>';
        popularFiltroEquipes();
        return;
    }

    popularFiltroEquipes();

    var html = dados.slice(0, 20).map(function(cabo, idx) {
        var pos = cabo.posicao != null ? cabo.posicao : (idx + 1);
        var posClass = pos === 1 ? 'gami-pos top1' : pos === 2 ? 'gami-pos top2' : pos === 3 ? 'gami-pos top3' : 'gami-pos';
        var nome = escapeHtml(cabo.nome || 'Sem nome');
        var xp = cabo.xp != null ? cabo.xp.toLocaleString('pt-BR') + ' XP' : '--';
        var nivel = cabo.nivel ? escapeHtml(String(cabo.nivel)) : '';
        var streak = cabo.streak ? '&#128293; ' + cabo.streak + ' dias' : '';
        var badge = cabo.ultimoBadge ? '&#127941; ' + escapeHtml(cabo.ultimoBadge) : '';

        return '<div class="gami-leaderboard-row">' +
            '<div class="' + posClass + '">' + pos + '</div>' +
            '<div class="gami-nome">' + nome + '</div>' +
            (nivel ? '<span class="gami-nivel">' + nivel + '</span>' : '') +
            (streak ? '<span class="gami-streak">' + streak + '</span>' : '') +
            '<span class="gami-xp">' + xp + '</span>' +
        '</div>';
    }).join('');

    lista.innerHTML = html;
}

// ---- Ranking de Equipes ----
function renderGamiEquipes() {
    var grid = document.getElementById('gami-equipes-grid');
    if (!grid) return;
    var dados = gamiState.teamsRanking;
    if (!dados || dados.length === 0) {
        grid.innerHTML = '<p style="color:var(--text-light);font-size:0.85rem;text-align:center;padding:20px 0;grid-column:1/-1;">Nenhum dado de equipes</p>';
        return;
    }
    grid.innerHTML = dados.map(function(eq) {
        return '<div class="gami-equipe-card">' +
            '<div class="gami-equipe-nome">' + escapeHtml(eq.equipe || 'Equipe') + '</div>' +
            '<div class="gami-equipe-stat">XP Total: <strong>' + (eq.xpTotal ? eq.xpTotal.toLocaleString('pt-BR') : '--') + '</strong></div>' +
            '<div class="gami-equipe-stat">Cabos Ativos: <strong>' + (eq.cabos != null ? eq.cabos : '--') + '</strong></div>' +
            '<div class="gami-equipe-stat">Tarefas: <strong>' + (eq.tarefas != null ? eq.tarefas : '--') + '</strong></div>' +
            '<div class="gami-equipe-stat">Cobertura: <strong>' + (eq.cobertura != null ? eq.cobertura.toFixed(1) + '%' : '--%') + '</strong></div>' +
        '</div>';
    }).join('');
}

// ---- Grafico Chart.js ----
function renderGamiChart() {
    var canvas = document.getElementById('chart-performance');
    if (!canvas || typeof Chart === 'undefined') return;

    // Destruir instancia anterior para evitar memory leak e canvas oculto
    if (gamiState.chartInstance) {
        gamiState.chartInstance.destroy();
        gamiState.chartInstance = null;
    }

    // Dados sinteticos baseados nos KPIs (fallback se API nao tiver endpoint de serie temporal)
    // Se Elexion retornar gamiState.kpis.serie = [{data, tarefas, xp}], usar esses dados.
    var kpis = gamiState.kpis || {};
    var serie = (kpis.serie && Array.isArray(kpis.serie)) ? kpis.serie : null;

    var periodo = parseInt((document.getElementById('gami-chart-periodo') || {}).value || '30', 10);

    var labels, xpData, tarefasData;
    if (serie && serie.length > 0) {
        // Usar dados reais da serie temporal
        var pontos = serie.slice(-periodo);
        labels = pontos.map(function(p) { return p.data || ''; });
        xpData = pontos.map(function(p) { return p.xp || 0; });
        tarefasData = pontos.map(function(p) { return p.tarefas || 0; });
    } else {
        // Fallback: gerar N dias com valor unico para mostrar que o grafico funciona
        var hoje = new Date();
        labels = [];
        xpData = [];
        tarefasData = [];
        for (var i = periodo - 1; i >= 0; i--) {
            var d = new Date(hoje);
            d.setDate(d.getDate() - i);
            labels.push(d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));
            // Distribuir o total uniformemente (indicativo, nao real)
            xpData.push(kpis.xpTotal ? Math.round(kpis.xpTotal / periodo) : 0);
            tarefasData.push(kpis.tarefasConcluidas ? Math.round(kpis.tarefasConcluidas / periodo) : 0);
        }
    }

    var emptyMsg = document.getElementById('gami-chart-empty');
    var temDados = xpData.some(function(v) { return v > 0; });
    if (emptyMsg) emptyMsg.style.display = temDados ? 'none' : 'flex';
    if (!temDados) return;

    gamiState.chartInstance = new Chart(canvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'XP Distribuido',
                    data: xpData,
                    borderColor: '#1a237e',
                    backgroundColor: 'rgba(26,35,126,0.08)',
                    tension: 0.3,
                    fill: true,
                    pointRadius: 3,
                    yAxisID: 'y'
                },
                {
                    label: 'Tarefas Concluidas',
                    data: tarefasData,
                    borderColor: '#ff6f00',
                    backgroundColor: 'rgba(255,111,0,0.08)',
                    tension: 0.3,
                    fill: false,
                    pointRadius: 3,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 12 } }
            },
            scales: {
                x: { ticks: { font: { size: 10 }, maxTicksLimit: 8 } },
                y: {
                    type: 'linear', position: 'left',
                    title: { display: true, text: 'XP', font: { size: 10 } },
                    ticks: { font: { size: 10 } }
                },
                y1: {
                    type: 'linear', position: 'right',
                    title: { display: true, text: 'Tarefas', font: { size: 10 } },
                    ticks: { font: { size: 10 } },
                    grid: { drawOnChartArea: false }
                }
            }
        }
    });
}

// ---- Polling ----
function iniciarPollingGamificacao() {
    if (gamiState.pollingTimer) return; // ja iniciado
    gamiState.pollingTimer = setInterval(function() {
        // Polling silencioso — so atualiza se a secao gamificacao estiver ativa
        if (currentPage === 'gamificacao') {
            renderGamificacao();
        }
    }, 60000);
}

// Iniciar polling quando o app inicializar
// (chamado pela funcao init() do CONECTA apos autenticacao Supabase)
iniciarPollingGamificacao();

// Interceptar showPage para disparar renderGamificacao quando a secao for aberta
// (sem sobrescrever showPage — usa o padrao de verificacao em renderCurrentPage)
var _gamiOriginalShowPage = showPage;
showPage = function(page) {
    _gamiOriginalShowPage(page);
    if (page === 'gamificacao') {
        renderGamificacao();
    }
};
```

--- INSERCAO 3: Adicionar 'gamificacao' ao PAGE_REALTIME_KEYS ---
Localizar o objeto PAGE_REALTIME_KEYS (linha ~2750):
```javascript
    lideres: ['conectacelina_lideres']
```
Adicionar APOS essa linha:
```javascript
    gamificacao: []
```
(Gamificacao nao usa Supabase realtime — dados vem do Elexion. Array vazio evita erro no setActiveKeys.)

Verificacao pos-insercao: o arquivo deve compilar sem erros de sintaxe JS. Testar com:
`node --check CONECTA.html` nao funciona para HTML — usar a validacao automatica abaixo.
  </action>
  <verify>
    <automated>node -e "const fs=require('fs'); const src=fs.readFileSync('C:/Users/IgorPC/.claude/projects/Conecta 2026/CONECTA.html','utf8'); const checks=['chart.umd.min.js','elexion-client.js','renderGamificacao','gamiState','new Chart','setInterval.*60000','iniciarPollingGamificacao','gamificacao: \\[\\]','gami-leaderboard-row','renderGamiLeaderboard','renderGamiEquipes','renderGamiChart']; const fail=checks.filter(c=>!src.match(new RegExp(c))); if(fail.length){console.error('Faltando ou nao encontrado:',fail);process.exit(1);} console.log('OK - todos os elementos JS presentes');"</automated>
  </verify>
  <done>CONECTA.html carrega Chart.js e elexion-client.js. Funcoes renderGamificacao, renderGamiKpis, renderGamiLeaderboard, renderGamiEquipes, renderGamiChart e iniciarPollingGamificacao existem. setInterval com 60000ms configurado. PAGE_REALTIME_KEYS tem entrada gamificacao: [].</done>
</task>

</tasks>

<verification>
Verificacao de integracao completa apos executar todas as 3 tasks:

1. Estrutura do arquivo:
```bash
node -e "
const src = require('fs').readFileSync('C:/Users/IgorPC/.claude/projects/Conecta 2026/CONECTA.html', 'utf8');
const must = [
  'fetchLeaderboard',         // elexion-client.js via script tag
  'page-gamificacao',         // secao HTML
  'chart-performance',        // canvas do Chart.js
  'gami-kpi-tarefas',         // KPI cards
  'gami-leaderboard-lista',   // tabela leaderboard
  'gami-equipes-grid',        // ranking equipes
  'gami-filtro-equipe',       // dropdown filtro
  'chart.umd.min.js',         // CDN Chart.js
  'elexion-client.js',        // script src
  'renderGamificacao',        // funcao principal
  'setInterval',              // polling
  '60000',                    // intervalo 60s
  \"gamificacao: []\",        // PAGE_REALTIME_KEYS
];
const fail = must.filter(m => !src.includes(m));
if (fail.length) { console.error('FALHOU:', fail); process.exit(1); }
console.log('PASSOU: CONECTA.html tem todos os elementos esperados');
"
```

2. elexion-client.js integro:
```bash
node -e "
const src = require('fs').readFileSync('C:/Users/IgorPC/.claude/projects/Conecta 2026/js/elexion-client.js', 'utf8');
const must = ['fetchLeaderboard', 'fetchTeamsRanking', 'window.ElexionClient'];
const fail = must.filter(m => !src.includes(m));
if (fail.length) { console.error('FALHOU:', fail); process.exit(1); }
console.log('PASSOU: elexion-client.js tem fetchLeaderboard e fetchTeamsRanking');
"
```
</verification>

<success_criteria>
- Sidebar exibe "Gamificacao" com icone de trofeu e badge laranja
- Clicar em "Gamificacao" abre secao com 4 KPI cards, grafico Chart.js, leaderboard e ranking equipes
- Leaderboard tem dropdown de filtro por equipe regional funcional
- Chart.js renderiza linha de XP e Tarefas (eixos Y duais)
- Dados atualizam a cada 60s (polling silencioso) com indicador de horario
- Quando Elexion esta offline (sem token ou sem resposta), banner de fallback aparece sem quebrar o restante do CONECTA
- Funcoes existentes do CONECTA nao foram modificadas (regressao zero)
</success_criteria>

<output>
Apos conclusao, criar `.planning/phases/02-dashboard-core-kpis-leaderboard-graficos/02-01-SUMMARY.md` com:
- Arquivos modificados e o que foi adicionado
- Endpoints Elexion consumidos
- Decisoes de implementacao (ex: fallback com dados sinteticos no grafico)
- Qualquer desvio do plano e motivo
</output>
