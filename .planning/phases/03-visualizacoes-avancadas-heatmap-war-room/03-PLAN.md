---
phase: 03-visualizacoes-avancadas-heatmap-war-room
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - "CONECTA.html"
autonomous: true
requirements: [VIS-01, VIS-02, VIS-03, VIS-04, VIS-05]

must_haves:
  truths:
    - "Sidebar exibe item 'Mapa de Cobertura' que abre secao com mapa Leaflet centrado no DF"
    - "Heatmap exibe pontos de calor das atividades dos cabos nas RAs do DF"
    - "Areas sem cobertura (gaps) aparecem destacadas com camada vermelha semitransparente"
    - "Sidebar exibe item 'War Room' que abre secao com feed de atividade em tempo real"
    - "War Room conecta via Socket.IO ao Elexion e exibe eventos task.completed, xp.awarded, alert.triggered"
    - "Indicador de pulso anima visivelmente quando evento Socket.IO chega"
    - "Lista de alertas ativos exibe severidade com cor e botao Resolver que chama PATCH /alerts/:id/resolve"
    - "Quando Elexion offline, ambas as secoes exibem banner de fallback sem quebrar o CONECTA"
  artifacts:
    - path: "CONECTA.html"
      provides: "Secoes page-mapa-cobertura e page-war-room com Leaflet + Socket.IO"
      contains: "page-mapa-cobertura"
    - path: "CONECTA.html"
      provides: "CDN scripts: Leaflet CSS/JS, Leaflet.heat, Socket.IO 4.8.3"
      contains: "leaflet"
    - path: "CONECTA.html"
      provides: "Funcoes renderMapaCobertura, iniciarWarRoom, conectarWarRoomSocket"
      contains: "renderMapaCobertura"
  key_links:
    - from: "sidebar nav-item mapa-cobertura"
      to: "page-mapa-cobertura"
      via: "onclick=\"showPage('mapa-cobertura')\""
      pattern: "showPage.*mapa-cobertura"
    - from: "page-mapa-cobertura"
      to: "ElexionClient.fetchHeatmap()"
      via: "renderMapaCobertura() chamado em showPage wrapper"
      pattern: "fetchHeatmap"
    - from: "page-war-room"
      to: "Socket.IO io()"
      via: "conectarWarRoomSocket() com auth JWT no handshake"
      pattern: "io\\(.*auth"
    - from: "Socket.IO socket"
      to: "renderWarRoomEvento()"
      via: "socket.on('task.completed', renderWarRoomEvento)"
      pattern: "socket\\.on.*task\\.completed"
    - from: "botao-resolver-alerta"
      to: "ElexionClient.request('/war-room/alerts/:id/resolve', {method:'PATCH'})"
      via: "onclick resolverAlerta(id)"
      pattern: "resolverAlerta"
---

<objective>
Adicionar duas secoes ao CONECTA.html: "Mapa de Cobertura" (heatmap Leaflet das RAs do DF) e "War Room" (feed em tempo real via Socket.IO com alertas e indicador de pulso).

Purpose: Coordenadores precisam enxergar onde os cabos estao atuando (cobertura geografica) e o que esta acontecendo agora (atividade em tempo real). Estas sao as visualizacoes de maior impacto operacional para o dia de campanha.

Output:
- CONECTA.html com CDN tags: Leaflet CSS/JS, Leaflet.heat, Socket.IO 4.8.3
- Secao "Mapa de Cobertura" (id=page-mapa-cobertura): mapa Leaflet + heatmap + gaps + overlay RAs
- Secao "War Room" (id=page-war-room): feed Socket.IO + alertas + indicador de pulso
- Dois novos itens na sidebar com integracao no wrapper showPage existente
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
<!-- ElexionClient — contrato completo ja existente em js/elexion-client.js -->
<!-- Todos os metodos retornam Promise<data|null>. Null = Elexion offline. NUNCA throw. -->

```javascript
ElexionClient.isAuthenticated()          // -> boolean
ElexionClient.getAccessToken()           // -> string|null  (via sessionStorage)
ElexionClient.fetchHeatmap()             // -> GET /analytics/heatmap
                                         //    retorno esperado: { points: [[lat, lng, intensity], ...] }
                                         //    fallback: array plano [[lat,lng,intensity],...] direto
ElexionClient.fetchHeatmapGaps()         // -> GET /analytics/heatmap/gaps
                                         //    retorno esperado: { gaps: [{lat,lng,raId,raName},...] }
ElexionClient.fetchGeofences()           // -> GET /geofences
                                         //    retorno esperado: { features: [...GeoJSON Feature...] }
                                         //    ou FeatureCollection diretamente
ElexionClient.fetchWarRoomFeed()         // -> GET /war-room/feed (snapshot inicial)
                                         //    retorno esperado: { items: [{type,cabo,xp,task,ts},...] }
ElexionClient.fetchAlerts()              // -> GET /war-room/alerts
                                         //    retorno esperado: { alerts: [{id,msg,severity,ts},...] }
ElexionClient.request(path, options)     // -> fetch autenticado com retry 401
                                         //    usar para PATCH /war-room/alerts/:id/resolve
```

<!-- IMPORTANTE: getAccessToken() e funcao interna do IIFE — NAO exposta publicamente. -->
<!-- Para passar JWT ao Socket.IO, usar: sessionStorage.getItem('elexion_access_token') -->

<!-- showPage() — padrao de integracao (Phase 2) -->
```javascript
// O wrapper showPage esta em CONECTA.html e ja foi reescrito pela fase 2:
var _gamiOriginalShowPage = showPage;
showPage = function(page) {
    _gamiOriginalShowPage(page);
    if (page === 'gamificacao') { renderGamificacao(); }
};
// Para Phase 3, encadear mais um wrapper no mesmo padrao:
var _vis3OriginalShowPage = showPage;
showPage = function(page) {
    _vis3OriginalShowPage(page);
    if (page === 'mapa-cobertura') { renderMapaCobertura(); }
    if (page === 'war-room') { iniciarWarRoom(); }
};
```

<!-- currentPage — variavel global do CONECTA, ja declarada em scope externo -->
<!-- Usada pelo polling: if (currentPage === 'mapa-cobertura') { ... } -->

<!-- CSS classes disponiveis no CONECTA (sem adicionar novas) -->
<!-- .page { display:none } .page.active { display:block } -->
<!-- .stat-card, .stats-grid, .card-bg — usados pela secao gamificacao -->
<!-- var(--primary): #1a237e  var(--accent): #ff6f00 -->
<!-- var(--card-bg), var(--text-light), var(--success), var(--warning) -->

<!-- Sidebar — adicionar apos o item gamificacao (linha ~1783) -->
<!-- Secao de visualizacoes antes da secao "Logistica" -->

<!-- showPage titles — adicionar ao objeto titles dentro de showPage() -->
<!-- 'mapa-cobertura': 'Mapa de Cobertura das RAs' -->
<!-- 'war-room': 'War Room — Atividade em Tempo Real' -->
</interfaces>

<!-- CDN tags ja existentes no <head> (antes de </head>, linha 1709) -->
<!-- <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js"></script> -->
<!-- <script src="js/elexion-client.js"></script>                                              -->
<!-- Adicionar APOS Chart.js e ANTES de elexion-client.js:                                    -->
<!-- Leaflet CSS, Leaflet JS, Leaflet.heat, Socket.IO                                         -->
</context>

<tasks>

<!-- ============================================================ -->
<!-- TASK 1: CDN scripts + Sidebar + Secao HTML Mapa de Cobertura -->
<!-- ============================================================ -->
<task type="auto">
  <name>Task 1: CDN + Sidebar + HTML do Mapa de Cobertura</name>
  <files>CONECTA.html</files>
  <action>
**1a. Adicionar CDN tags no `<head>`**

Inserir ANTES de `<script src="js/elexion-client.js"></script>` (linha ~1708):

```html
<!-- Leaflet.js para heatmap geografico (VIS-01, VIS-02) -->
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin=""/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
<script src="https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js"></script>
<!-- Socket.IO client para War Room em tempo real (VIS-03, VIS-04, VIS-05) -->
<script src="https://cdn.socket.io/4.8.3/socket.io.min.js" crossorigin="anonymous"></script>
```

Ordem final no `<head>`:
1. Chart.js (ja existe)
2. Leaflet CSS (novo)
3. Leaflet JS (novo)
4. Leaflet.heat (novo)
5. Socket.IO (novo)
6. elexion-client.js (ja existe — DEVE ser o ultimo script CDN)

**1b. Adicionar CSS inline para o mapa e war room**

Inserir dentro da tag `<style>` existente, ANTES do fechamento `</style>` (antes da linha com `@media (max-width: 768px)` da secao gamificacao):

```css
/* ===== MAPA DE COBERTURA (VIS-01, VIS-02) ===== */
#mapa-leaflet {
    height: 420px;
    border-radius: 12px;
    overflow: hidden;
    background: #e8edf2;
}
/* Corrigir z-index do controle Leaflet para nao sobrepor sidebar */
.leaflet-control { z-index: 400 !important; }

/* ===== WAR ROOM (VIS-03, VIS-04, VIS-05) ===== */
#war-room-feed {
    max-height: 380px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 8px;
}
.war-room-evento {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 10px 14px;
    border-radius: 10px;
    background: var(--card-bg);
    border-left: 3px solid var(--primary);
    font-size: 0.82rem;
    animation: warFadeIn 0.4s ease;
}
.war-room-evento.tipo-xp { border-left-color: #f59e0b; }
.war-room-evento.tipo-alerta { border-left-color: #ef4444; }
.war-room-evento.tipo-tarefa { border-left-color: #10b981; }
@keyframes warFadeIn {
    from { opacity: 0; transform: translateY(-6px); }
    to   { opacity: 1; transform: translateY(0); }
}
/* Pulso de atividade */
#pulso-campanha {
    width: 18px; height: 18px;
    border-radius: 50%;
    background: #10b981;
    display: inline-block;
    margin-right: 8px;
    vertical-align: middle;
    transition: box-shadow 0.2s;
}
#pulso-campanha.pulsando {
    animation: pulsarAtividade 0.8s ease-out;
}
@keyframes pulsarAtividade {
    0%   { box-shadow: 0 0 0 0 rgba(16,185,129,0.7); }
    70%  { box-shadow: 0 0 0 14px rgba(16,185,129,0); }
    100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
}
/* Alertas */
.alerta-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-radius: 10px;
    background: var(--card-bg);
    border-left: 4px solid #ef4444;
    font-size: 0.84rem;
    gap: 12px;
}
.alerta-card.severity-medium { border-left-color: #f59e0b; }
.alerta-card.severity-low    { border-left-color: #3b82f6; }
.alerta-card .btn-resolver {
    padding: 5px 14px;
    background: var(--primary);
    color: #fff;
    border: none;
    border-radius: 6px;
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;
}
.alerta-card .btn-resolver:hover { background: var(--primary-light); }
@media (max-width: 768px) {
    #mapa-leaflet { height: 260px; }
    #page-mapa-cobertura > div:nth-child(3),
    #page-war-room > div:nth-child(3) { grid-template-columns: 1fr !important; }
}
```

**1c. Adicionar itens na sidebar**

Localizar o bloco do item gamificacao (linha ~1779-1783):
```html
<div class="nav-item" onclick="showPage('gamificacao')">
    <span class="nav-icon">&#127942;</span>
    <span>Gamificação</span>
    <span class="nav-badge" id="badge-gamificacao" ...>NOVO</span>
</div>
```

Inserir logo APOS esse bloco (antes da `<div class="nav-section">Logística</div>`):

```html
        <div class="nav-item" onclick="showPage('mapa-cobertura')">
            <span class="nav-icon">&#128506;</span>
            <span>Mapa de Cobertura</span>
        </div>
        <div class="nav-item" onclick="showPage('war-room')">
            <span class="nav-icon">&#128312;</span>
            <span>War Room</span>
            <span class="nav-badge" id="badge-war-room" style="background:#ef4444;display:none;">0</span>
        </div>
```

**1d. Adicionar titulos no objeto titles dentro de showPage()**

Localizar o objeto `titles` dentro de `showPage()` (linha ~2931). Adicionar apos a entrada `gamificacao`:
```javascript
        'mapa-cobertura': 'Mapa de Cobertura das RAs',
        'war-room': 'War Room \u2014 Atividade em Tempo Real',
```

**1e. Criar secao HTML `page-mapa-cobertura`**

Inserir logo ANTES de `<!-- ========== GAMIFICACAO ========== -->` (linha ~1819):

```html
    <!-- ========== MAPA DE COBERTURA ========== -->
    <div class="page" id="page-mapa-cobertura">

        <!-- Cabecalho -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
            <div>
                <h2 style="font-size:1.4rem;font-weight:800;color:var(--primary);margin:0;">&#128506; Mapa de Cobertura das RAs</h2>
                <p style="font-size:0.8rem;color:var(--text-light);margin:4px 0 0;">Atividade dos cabos eleitorais por Regi&atilde;o Administrativa</p>
            </div>
            <div style="display:flex;align-items:center;gap:12px;">
                <span id="mapa-ultima-atualizacao" style="font-size:0.75rem;color:var(--text-light);">Aguardando dados...</span>
                <button onclick="renderMapaCobertura()" style="padding:7px 16px;background:var(--primary);color:#fff;border:none;border-radius:8px;font-size:0.8rem;font-weight:600;cursor:pointer;">&#8635; Atualizar</button>
            </div>
        </div>

        <!-- Banner offline -->
        <div id="mapa-offline-banner" style="display:none;background:#fff3e0;border:1px solid var(--accent);border-radius:10px;padding:12px 16px;margin-bottom:16px;font-size:0.85rem;color:#e65100;">
            &#9888; Elexion indispon&iacute;vel. Dados do mapa n&atilde;o puderam ser carregados.
            <a href="conta.html" style="color:var(--accent);font-weight:700;">Verificar vincula&ccedil;&atilde;o &rarr;</a>
        </div>

        <!-- Legenda -->
        <div style="display:flex;gap:16px;margin-bottom:12px;flex-wrap:wrap;">
            <span style="font-size:0.78rem;color:var(--text-light);display:flex;align-items:center;gap:6px;">
                <span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:rgba(255,111,0,0.7);"></span>
                Alta atividade
            </span>
            <span style="font-size:0.78rem;color:var(--text-light);display:flex;align-items:center;gap:6px;">
                <span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:rgba(255,200,0,0.5);"></span>
                Atividade moderada
            </span>
            <span style="font-size:0.78rem;color:var(--text-light);display:flex;align-items:center;gap:6px;">
                <span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:rgba(239,68,68,0.3);border:1px dashed #ef4444;"></span>
                Sem cobertura (gap)
            </span>
        </div>

        <!-- Container do mapa Leaflet -->
        <div style="background:var(--card-bg);border-radius:16px;padding:16px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
            <div id="mapa-leaflet"></div>
        </div>

        <!-- Stats de cobertura por RA -->
        <div style="margin-top:20px;background:var(--card-bg);border-radius:16px;padding:24px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
            <h3 style="font-size:1rem;font-weight:700;color:var(--primary);margin:0 0 14px;">Cobertura por Regi&atilde;o Administrativa</h3>
            <div id="mapa-ra-stats" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px;">
                <p style="color:var(--text-light);font-size:0.85rem;grid-column:1/-1;">Carregando...</p>
            </div>
        </div>

    </div><!-- /page-mapa-cobertura -->
```

**Critério de aceitação parcial desta task:** Abrir CONECTA.html no browser, clicar em "Mapa de Cobertura" na sidebar, ver a secao com o container do mapa (mesmo vazio/placeholder) sem erros JavaScript.
  </action>
  <verify>Abrir DevTools Console com a secao ativa: nenhum erro "Leaflet is not defined" ou "io is not defined". O elemento `#mapa-leaflet` existe no DOM com height:420px.</verify>
  <done>CDN tags inseridas no head. Dois itens adicionados na sidebar. Titulos registrados em showPage(). HTML das secoes inserido antes de page-gamificacao. Zero erros de script no console.</done>
</task>

<!-- ============================================================ -->
<!-- TASK 2: HTML War Room + JS Mapa de Cobertura                 -->
<!-- ============================================================ -->
<task type="auto">
  <name>Task 2: HTML War Room + JS renderMapaCobertura</name>
  <files>CONECTA.html</files>
  <action>
**2a. Criar secao HTML `page-war-room`**

Inserir logo APOS o fechamento `</div><!-- /page-mapa-cobertura -->` e ANTES de `<!-- ========== GAMIFICACAO ========== -->`:

```html
    <!-- ========== WAR ROOM ========== -->
    <div class="page" id="page-war-room">

        <!-- Cabecalho com indicador de pulso -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
            <div style="display:flex;align-items:center;">
                <span id="pulso-campanha"></span>
                <div>
                    <h2 style="font-size:1.4rem;font-weight:800;color:var(--primary);margin:0;">&#128312; War Room</h2>
                    <p style="font-size:0.8rem;color:var(--text-light);margin:4px 0 0;">Atividade em tempo real dos cabos eleitorais</p>
                </div>
            </div>
            <div style="display:flex;align-items:center;gap:12px;">
                <span id="war-room-status" style="font-size:0.75rem;color:var(--text-light);">Desconectado</span>
                <button onclick="reconectarWarRoom()" style="padding:7px 16px;background:var(--primary);color:#fff;border:none;border-radius:8px;font-size:0.8rem;font-weight:600;cursor:pointer;">&#8635; Reconectar</button>
            </div>
        </div>

        <!-- Banner offline -->
        <div id="war-room-offline-banner" style="display:none;background:#fff3e0;border:1px solid var(--accent);border-radius:10px;padding:12px 16px;margin-bottom:16px;font-size:0.85rem;color:#e65100;">
            &#9888; WebSocket desconectado. Tentando reconectar automaticamente...
        </div>

        <!-- Grid: Feed + Alertas -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">

            <!-- Feed de atividade -->
            <div style="background:var(--card-bg);border-radius:16px;padding:24px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
                <h3 style="font-size:1rem;font-weight:700;color:var(--primary);margin:0 0 16px;">&#128249; Feed de Atividade</h3>
                <div id="war-room-feed">
                    <p style="color:var(--text-light);font-size:0.85rem;text-align:center;padding:20px 0;">Aguardando conex&atilde;o...</p>
                </div>
            </div>

            <!-- Alertas ativos -->
            <div style="background:var(--card-bg);border-radius:16px;padding:24px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
                    <h3 style="font-size:1rem;font-weight:700;color:var(--primary);margin:0;">&#9888; Alertas Ativos</h3>
                    <span id="war-room-alertas-count" style="font-size:0.75rem;background:#ef4444;color:#fff;border-radius:999px;padding:2px 10px;font-weight:700;">0</span>
                </div>
                <div id="war-room-alertas-lista" style="display:flex;flex-direction:column;gap:10px;max-height:340px;overflow-y:auto;">
                    <p style="color:var(--text-light);font-size:0.85rem;text-align:center;padding:20px 0;">Sem alertas ativos</p>
                </div>
            </div>

        </div>
    </div><!-- /page-war-room -->
```

**2b. Implementar JS do Mapa de Cobertura**

Adicionar o bloco JavaScript a seguir logo ANTES do bloco `// ---- Polling ----` da gamificacao (linha ~5614, buscar pelo comentario `// ---- Polling ----`).

O bloco completo:

```javascript
// ============================================================
// MAPA DE COBERTURA (VIS-01, VIS-02)
// ============================================================

var mapaState = {
    mapa: null,           // instancia Leaflet
    heatLayer: null,      // camada Leaflet.heat
    gapLayer: null,       // camada de circles vermelhos (gaps)
    geofencesLayer: null, // camada GeoJSON das RAs
    pollingTimer: null
};

/**
 * Inicializar o mapa Leaflet uma unica vez.
 * Chamado na primeira vez que a secao e aberta.
 * Pitfall 10 (canvas oculto): so inicializar quando visivel.
 */
function inicializarLeaflet() {
    if (mapaState.mapa) return; // ja inicializado

    var container = document.getElementById('mapa-leaflet');
    if (!container) return;

    mapaState.mapa = L.map('mapa-leaflet', {
        center: [-15.78, -47.93],  // Centro do DF
        zoom: 10,
        zoomControl: true
    });

    // Tiles OpenStreetMap (gratuito, sem token)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18
    }).addTo(mapaState.mapa);
}

/**
 * Renderizar heatmap: fetch dados + pontos de calor + gaps + geofences.
 * Chamado pelo showPage wrapper e pelo botao Atualizar.
 * VIS-01, VIS-02
 */
async function renderMapaCobertura() {
    if (!window.ElexionClient || !ElexionClient.isAuthenticated()) {
        document.getElementById('mapa-offline-banner').style.display = 'block';
        var el = document.getElementById('mapa-ultima-atualizacao');
        if (el) { el.textContent = 'Elexion nao vinculado'; el.style.color = 'var(--warning)'; }
        return;
    }

    document.getElementById('mapa-offline-banner').style.display = 'none';

    // Inicializar mapa na primeira chamada (secao ja esta visivel aqui)
    inicializarLeaflet();

    // Fetch paralelo: heatmap + gaps + geofences
    var [heatData, gapsData, geofencesData] = await Promise.all([
        ElexionClient.fetchHeatmap(),
        ElexionClient.fetchHeatmapGaps(),
        ElexionClient.fetchGeofences()
    ]);

    if (!heatData && !gapsData) {
        document.getElementById('mapa-offline-banner').style.display = 'block';
        var el2 = document.getElementById('mapa-ultima-atualizacao');
        if (el2) { el2.textContent = 'Dados indisponíveis'; el2.style.color = 'var(--warning)'; }
        return;
    }

    // ---- Camada de heatmap ----
    if (mapaState.heatLayer) {
        mapaState.mapa.removeLayer(mapaState.heatLayer);
        mapaState.heatLayer = null;
    }

    if (heatData) {
        // Normalizar formato: aceitar { points: [...] } ou array plano diretamente
        var rawPoints = Array.isArray(heatData) ? heatData : (heatData.points || []);
        // Pitfall 11: limitar a 500 pontos para performance
        var pontos = rawPoints.slice(0, 500).map(function(p) {
            // Aceitar [lat, lng, intensity] ou {lat, lng, intensity} ou {latitude, longitude, weight}
            if (Array.isArray(p)) return p;
            return [
                p.lat || p.latitude || 0,
                p.lng || p.longitude || 0,
                p.intensity || p.weight || 0.5
            ];
        }).filter(function(p) { return p[0] !== 0 || p[1] !== 0; });

        if (pontos.length > 0) {
            mapaState.heatLayer = L.heatLayer(pontos, {
                radius: 25,
                blur: 15,
                maxZoom: 12,
                gradient: { 0.2: '#3b82f6', 0.5: '#f59e0b', 0.8: '#ff6f00', 1.0: '#ef4444' }
            }).addTo(mapaState.mapa);
        }
    }

    // ---- Camada de gaps (areas sem cobertura) ----
    if (mapaState.gapLayer) {
        mapaState.mapa.removeLayer(mapaState.gapLayer);
        mapaState.gapLayer = null;
    }

    if (gapsData) {
        var rawGaps = Array.isArray(gapsData) ? gapsData : (gapsData.gaps || []);
        if (rawGaps.length > 0) {
            var gapFeatures = rawGaps.map(function(g) {
                return L.circle([g.lat || g.latitude || 0, g.lng || g.longitude || 0], {
                    radius: 1500,
                    color: '#ef4444',
                    fillColor: '#ef4444',
                    fillOpacity: 0.18,
                    weight: 1,
                    dashArray: '4 4'
                }).bindTooltip(g.raName || g.ra_nome || 'Sem cobertura', { permanent: false });
            });
            mapaState.gapLayer = L.layerGroup(gapFeatures).addTo(mapaState.mapa);
        }
    }

    // ---- Overlay GeoJSON das 33 RAs ----
    if (mapaState.geofencesLayer) {
        mapaState.mapa.removeLayer(mapaState.geofencesLayer);
        mapaState.geofencesLayer = null;
    }

    if (geofencesData) {
        // Aceitar FeatureCollection ou { features: [...] }
        var geojson = geofencesData.type === 'FeatureCollection'
            ? geofencesData
            : { type: 'FeatureCollection', features: geofencesData.features || [] };

        if (geojson.features && geojson.features.length > 0) {
            mapaState.geofencesLayer = L.geoJSON(geojson, {
                style: {
                    color: '#1a237e',
                    weight: 1.5,
                    fillOpacity: 0,
                    dashArray: '3 3'
                },
                onEachFeature: function(feature, layer) {
                    var nome = (feature.properties && (feature.properties.nome || feature.properties.name)) || '';
                    if (nome) layer.bindTooltip(nome, { sticky: true });
                }
            }).addTo(mapaState.mapa);
        }
    }

    // ---- Stats de RAs na tabela abaixo do mapa ----
    renderMapaRaStats(heatData, gapsData);

    // ---- Indicador de ultima atualizacao ----
    var elAtual = document.getElementById('mapa-ultima-atualizacao');
    if (elAtual) {
        var agora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        elAtual.textContent = 'Atualizado: ' + agora;
        elAtual.style.color = 'var(--success, #10b981)';
    }

    // Forcar redraw do Leaflet (Pitfall 10 — layout pode ter mudado)
    setTimeout(function() {
        if (mapaState.mapa) mapaState.mapa.invalidateSize();
    }, 100);
}

/**
 * Renderizar cards de cobertura por RA abaixo do mapa.
 */
function renderMapaRaStats(heatData, gapsData) {
    var container = document.getElementById('mapa-ra-stats');
    if (!container) return;

    var rawGaps = gapsData
        ? (Array.isArray(gapsData) ? gapsData : (gapsData.gaps || []))
        : [];
    var gapSet = new Set(rawGaps.map(function(g) { return g.raId || g.ra_id || g.raName || g.ra_nome; }));

    var rawPoints = heatData
        ? (Array.isArray(heatData) ? heatData : (heatData.points || []))
        : [];

    // Agrupar pontos por RA (se tiverem campo raId)
    var raCounts = {};
    rawPoints.forEach(function(p) {
        var ra = Array.isArray(p) ? null : (p.raId || p.ra_id || p.raName || p.ra_nome);
        if (ra) raCounts[ra] = (raCounts[ra] || 0) + 1;
    });

    var raKeys = Object.keys(raCounts);
    if (raKeys.length === 0 && rawGaps.length === 0) {
        container.innerHTML = '<p style="color:var(--text-light);font-size:0.85rem;grid-column:1/-1;">Dados insuficientes para exibir cobertura por RA.</p>';
        return;
    }

    var totalRas = Math.max(raKeys.length + rawGaps.length, 33);
    var cobertosCount = raKeys.length;
    var html = '';

    raKeys.forEach(function(ra) {
        var pct = Math.min(100, Math.round((raCounts[ra] / Math.max(...Object.values(raCounts))) * 100));
        html += '<div style="background:#f0f4ff;border-radius:10px;padding:12px;">';
        html += '<div style="font-size:0.78rem;font-weight:700;color:var(--primary);margin-bottom:6px;">' + _safeText(ra) + '</div>';
        html += '<div style="background:#e0e7ff;border-radius:4px;height:6px;overflow:hidden;">';
        html += '<div style="background:var(--primary);height:100%;width:' + pct + '%;border-radius:4px;"></div>';
        html += '</div>';
        html += '<div style="font-size:0.72rem;color:var(--text-light);margin-top:4px;">' + raCounts[ra] + ' atividade(s)</div>';
        html += '</div>';
    });

    rawGaps.forEach(function(g) {
        var nome = g.raName || g.ra_nome || ('Gap ' + (g.raId || g.ra_id || ''));
        html += '<div style="background:#fff5f5;border-radius:10px;padding:12px;border:1px dashed #ef4444;">';
        html += '<div style="font-size:0.78rem;font-weight:700;color:#ef4444;margin-bottom:6px;">&#9888; ' + _safeText(nome) + '</div>';
        html += '<div style="font-size:0.72rem;color:#ef4444;">Sem cobertura</div>';
        html += '</div>';
    });

    container.innerHTML = html;
}

/** Sanitizar texto para insercao segura no DOM (evitar XSS — Pitfall 3) */
function _safeText(str) {
    var div = document.createElement('div');
    div.textContent = String(str || '');
    return div.innerHTML;
}
```
  </action>
  <verify>Com a secao "Mapa de Cobertura" aberta (mesmo sem Elexion conectado): o elemento `#mapa-leaflet` renderiza o mapa OpenStreetMap centralizado no DF. Sem erro "L is not defined" no console.</verify>
  <done>Secao War Room HTML inserida no DOM. JS de renderMapaCobertura implementado com: inicializarLeaflet, heatLayer, gapLayer, geofencesLayer, renderMapaRaStats, _safeText. Mapa Leaflet renderiza tiles OSM quando secao esta ativa.</done>
</task>

<!-- ============================================================ -->
<!-- TASK 3: JS War Room (Socket.IO + alertas + pulso + wrappers) -->
<!-- ============================================================ -->
<task type="auto">
  <name>Task 3: JS War Room — Socket.IO + Alertas + Pulso + Wrappers showPage</name>
  <files>CONECTA.html</files>
  <action>
**3a. Implementar JS completo do War Room**

Adicionar o bloco a seguir IMEDIATAMENTE APOS o bloco do Mapa de Cobertura inserido na Task 2 (logo apos a funcao `_safeText` e antes do comentario `// ---- Polling ----`):

```javascript
// ============================================================
// WAR ROOM (VIS-03, VIS-04, VIS-05)
// ============================================================

var warRoomState = {
    socket: null,
    conectado: false,
    eventos: [],          // historico para feed (max 100)
    alertas: [],          // alertas ativos
    pollingFallback: null // setInterval quando Socket.IO falha
};

/**
 * Iniciar War Room: carregar snapshot REST + conectar Socket.IO.
 * Chamado pelo wrapper showPage na primeira abertura.
 * VIS-03, VIS-04, VIS-05
 */
async function iniciarWarRoom() {
    if (!window.ElexionClient || !ElexionClient.isAuthenticated()) {
        document.getElementById('war-room-offline-banner').style.display = 'block';
        atualizarStatusWarRoom(false, 'Elexion nao vinculado');
        return;
    }

    document.getElementById('war-room-offline-banner').style.display = 'none';

    // Carregar snapshot inicial via REST (feed + alertas)
    var [feedData, alertsData] = await Promise.all([
        ElexionClient.fetchWarRoomFeed(),
        ElexionClient.fetchAlerts()
    ]);

    if (feedData) {
        var items = Array.isArray(feedData) ? feedData : (feedData.items || []);
        warRoomState.eventos = items.slice(0, 50);
        renderWarRoomFeed();
    }

    if (alertsData) {
        var alertsList = Array.isArray(alertsData) ? alertsData : (alertsData.alerts || []);
        warRoomState.alertas = alertsList;
        renderWarRoomAlertas();
    }

    // Conectar Socket.IO (apenas se ainda nao conectado)
    conectarWarRoomSocket();
}

/**
 * Conectar ao WebSocket do Elexion com JWT no handshake.
 * VIS-03 — Pitfall 5: CORS do gateway e separado do HTTP CORS.
 * O NestJS @WebSocketGateway deve ter cors: { origin: ['https://inteia.com.br'] }
 */
function conectarWarRoomSocket() {
    // Evitar multiplas conexoes
    if (warRoomState.socket && warRoomState.socket.connected) return;

    if (typeof io === 'undefined') {
        console.warn('[WarRoom] Socket.IO nao carregado. Ativando polling fallback.');
        ativarPollingFallbackWarRoom();
        return;
    }

    var token = sessionStorage.getItem('elexion_access_token');
    if (!token) {
        atualizarStatusWarRoom(false, 'Token ausente');
        return;
    }

    // Desconectar socket anterior se existir
    if (warRoomState.socket) {
        warRoomState.socket.disconnect();
    }

    try {
        warRoomState.socket = io('https://api.elexion.com.br', {
            path: '/socket.io/',
            transports: ['websocket', 'polling'], // polling como fallback automatico
            auth: {
                token: token  // JWT passado no handshake (nao em query string)
            },
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
            timeout: 10000
        });

        warRoomState.socket.on('connect', function() {
            warRoomState.conectado = true;
            document.getElementById('war-room-offline-banner').style.display = 'none';
            atualizarStatusWarRoom(true, 'Conectado — ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
            // Cancelar polling fallback se estava ativo
            if (warRoomState.pollingFallback) {
                clearInterval(warRoomState.pollingFallback);
                warRoomState.pollingFallback = null;
            }
        });

        warRoomState.socket.on('disconnect', function(reason) {
            warRoomState.conectado = false;
            atualizarStatusWarRoom(false, 'Desconectado (' + reason + ')');
            document.getElementById('war-room-offline-banner').style.display = 'block';
            // Se nao vai reconectar automaticamente, ativar polling
            if (reason === 'io server disconnect') {
                ativarPollingFallbackWarRoom();
            }
        });

        warRoomState.socket.on('connect_error', function(err) {
            console.warn('[WarRoom] Socket.IO connect_error:', err.message);
            atualizarStatusWarRoom(false, 'Erro de conexao');
            // Apos 5 tentativas falhas, Socket.IO para. Ativar polling.
        });

        // ---- Eventos de campanha ----

        // Tarefa concluida por um cabo
        warRoomState.socket.on('task.completed', function(data) {
            // data esperado: { cabo: string, task: string, xp: number, ts: string, equipe?: string }
            adicionarEventoFeed({
                tipo: 'tarefa',
                icone: '&#9989;',
                texto: _safeText(data.cabo || 'Cabo') + ' concluiu: <strong>' + _safeText(data.task || 'tarefa') + '</strong>',
                sub: data.equipe ? _safeText(data.equipe) : '',
                ts: data.ts || new Date().toISOString()
            });
            acionarPulso();
        });

        // XP concedido
        warRoomState.socket.on('xp.awarded', function(data) {
            // data esperado: { cabo: string, xp: number, razao?: string, ts: string }
            adicionarEventoFeed({
                tipo: 'xp',
                icone: '&#11088;',
                texto: '<strong>+' + (data.xp || 0) + ' XP</strong> para ' + _safeText(data.cabo || 'cabo'),
                sub: data.razao ? _safeText(data.razao) : '',
                ts: data.ts || new Date().toISOString()
            });
            acionarPulso();
        });

        // Alerta acionado
        warRoomState.socket.on('alert.triggered', function(data) {
            // data esperado: { id: string, msg: string, severity: 'high'|'medium'|'low', ts: string }
            adicionarEventoFeed({
                tipo: 'alerta',
                icone: '&#9888;',
                texto: _safeText(data.msg || 'Alerta'),
                sub: 'Severidade: ' + _safeText(data.severity || 'high'),
                ts: data.ts || new Date().toISOString()
            });
            // Adicionar aos alertas ativos
            if (data.id) {
                warRoomState.alertas.unshift(data);
                renderWarRoomAlertas();
            }
            acionarPulso();
        });

    } catch (err) {
        console.warn('[WarRoom] Erro ao criar socket:', err.message);
        atualizarStatusWarRoom(false, 'Erro: ' + err.message);
        ativarPollingFallbackWarRoom();
    }
}

/**
 * Reconectar manualmente (botao na UI).
 */
function reconectarWarRoom() {
    conectarWarRoomSocket();
}

/**
 * Polling fallback quando Socket.IO nao esta disponivel.
 * Busca feed e alertas a cada 30s via REST.
 */
function ativarPollingFallbackWarRoom() {
    if (warRoomState.pollingFallback) return; // ja ativo
    atualizarStatusWarRoom(false, 'Modo polling (30s)');
    warRoomState.pollingFallback = setInterval(async function() {
        if (currentPage !== 'war-room') return;
        var [feedData, alertsData] = await Promise.all([
            ElexionClient.fetchWarRoomFeed(),
            ElexionClient.fetchAlerts()
        ]);
        if (feedData) {
            var items = Array.isArray(feedData) ? feedData : (feedData.items || []);
            warRoomState.eventos = items.slice(0, 50);
            renderWarRoomFeed();
        }
        if (alertsData) {
            var alertsList = Array.isArray(alertsData) ? alertsData : (alertsData.alerts || []);
            warRoomState.alertas = alertsList;
            renderWarRoomAlertas();
        }
    }, 30000);
}

/**
 * Adicionar evento ao feed (max 100 itens, mais recente primeiro).
 */
function adicionarEventoFeed(evento) {
    warRoomState.eventos.unshift(evento);
    if (warRoomState.eventos.length > 100) {
        warRoomState.eventos = warRoomState.eventos.slice(0, 100);
    }
    // Atualizar badge da sidebar com contagem
    renderWarRoomFeed();
    atualizarBadgeWarRoom();
}

/**
 * Renderizar o feed de atividade no DOM.
 * Usa textContent/innerHTML controlado (sem dados externos diretos) — Pitfall 3.
 */
function renderWarRoomFeed() {
    var container = document.getElementById('war-room-feed');
    if (!container) return;

    if (warRoomState.eventos.length === 0) {
        container.innerHTML = '<p style="color:var(--text-light);font-size:0.85rem;text-align:center;padding:20px 0;">Nenhuma atividade recente</p>';
        return;
    }

    var html = '';
    warRoomState.eventos.forEach(function(ev) {
        var hora = '';
        try {
            hora = new Date(ev.ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        } catch(e) { hora = ''; }

        html += '<div class="war-room-evento tipo-' + (ev.tipo || 'tarefa') + '">';
        html += '<span style="font-size:1.2rem;flex-shrink:0;">' + (ev.icone || '&#9679;') + '</span>';
        html += '<div style="flex:1;min-width:0;">';
        // ev.texto ja foi sanitizado por _safeText() no handler
        html += '<div style="font-size:0.82rem;line-height:1.4;">' + (ev.texto || '') + '</div>';
        if (ev.sub) {
            html += '<div style="font-size:0.74rem;color:var(--text-light);margin-top:2px;">' + ev.sub + '</div>';
        }
        html += '</div>';
        if (hora) {
            html += '<span style="font-size:0.72rem;color:var(--text-light);flex-shrink:0;">' + hora + '</span>';
        }
        html += '</div>';
    });

    container.innerHTML = html;
}

/**
 * Renderizar lista de alertas ativos.
 * VIS-04
 */
function renderWarRoomAlertas() {
    var container = document.getElementById('war-room-alertas-lista');
    var countEl = document.getElementById('war-room-alertas-count');
    if (!container) return;

    var alertas = warRoomState.alertas || [];
    if (countEl) countEl.textContent = alertas.length;

    if (alertas.length === 0) {
        container.innerHTML = '<p style="color:var(--text-light);font-size:0.85rem;text-align:center;padding:20px 0;">&#9989; Sem alertas ativos</p>';
        return;
    }

    var html = '';
    alertas.forEach(function(a) {
        var severityClass = 'severity-high';
        if (a.severity === 'medium') severityClass = 'severity-medium';
        if (a.severity === 'low') severityClass = 'severity-low';

        var hora = '';
        try { hora = new Date(a.ts || a.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); } catch(e) {}

        html += '<div class="alerta-card ' + severityClass + '" id="alerta-' + _safeText(a.id || '') + '">';
        html += '<div style="flex:1;min-width:0;">';
        // Sanitizar msg antes de inserir — Pitfall 3
        html += '<div style="font-size:0.84rem;font-weight:600;">' + _safeText(a.msg || 'Alerta sem descricao') + '</div>';
        html += '<div style="font-size:0.74rem;color:var(--text-light);margin-top:3px;">' + hora + ' &bull; Severidade: ' + _safeText(a.severity || 'high') + '</div>';
        html += '</div>';
        if (a.id) {
            html += '<button class="btn-resolver" onclick="resolverAlerta(\'' + _safeText(a.id) + '\')">Resolver</button>';
        }
        html += '</div>';
    });

    container.innerHTML = html;
}

/**
 * Resolver um alerta via PATCH /war-room/alerts/:id/resolve.
 * VIS-04
 */
async function resolverAlerta(alertaId) {
    if (!alertaId) return;
    var resultado = await ElexionClient.request('/war-room/alerts/' + encodeURIComponent(alertaId) + '/resolve', {
        method: 'PATCH'
    });
    // Remover da lista local independente do resultado (otimista)
    warRoomState.alertas = warRoomState.alertas.filter(function(a) { return a.id !== alertaId; });
    renderWarRoomAlertas();
    if (!resultado) {
        console.warn('[WarRoom] resolverAlerta: falhou para id=' + alertaId + ' (otimista: removido localmente)');
    }
}

/**
 * Acionar animacao de pulso no indicador.
 * VIS-05
 */
function acionarPulso() {
    var el = document.getElementById('pulso-campanha');
    if (!el) return;
    el.classList.remove('pulsando');
    // Forcar reflow para reiniciar animacao
    void el.offsetWidth;
    el.classList.add('pulsando');
    setTimeout(function() { el.classList.remove('pulsando'); }, 900);
}

/**
 * Atualizar texto de status da conexao.
 */
function atualizarStatusWarRoom(conectado, msg) {
    var el = document.getElementById('war-room-status');
    if (!el) return;
    el.textContent = msg || (conectado ? 'Conectado' : 'Desconectado');
    el.style.color = conectado ? 'var(--success, #10b981)' : 'var(--warning, #f59e0b)';
    // Cor do pulso reflete conexao
    var pulso = document.getElementById('pulso-campanha');
    if (pulso) pulso.style.background = conectado ? '#10b981' : '#f59e0b';
}

/**
 * Atualizar badge na sidebar com contagem de eventos recentes.
 */
function atualizarBadgeWarRoom() {
    var badge = document.getElementById('badge-war-room');
    if (!badge) return;
    var count = warRoomState.alertas ? warRoomState.alertas.length : 0;
    if (count > 0) {
        badge.textContent = count > 99 ? '99+' : String(count);
        badge.style.display = 'inline';
    } else {
        badge.style.display = 'none';
    }
}

/**
 * Desconectar socket ao sair da secao War Room.
 * Chamado quando showPage muda para outra secao enquanto war-room estava ativo.
 * NAO destruir o socket — manter conectado para receber alertas em background.
 * Apenas parar o polling fallback se estiver na secao certa.
 */
```

**3b. Encadear o wrapper showPage para Fase 3**

Localizar o wrapper da gamificacao (linhas ~5631-5637):
```javascript
var _gamiOriginalShowPage = showPage;
showPage = function(page) {
    _gamiOriginalShowPage(page);
    if (page === 'gamificacao') {
        renderGamificacao();
    }
};
```

Substituir por (encadeia mapa e war-room sem remover gamificacao):
```javascript
var _gamiOriginalShowPage = showPage;
showPage = function(page) {
    _gamiOriginalShowPage(page);
    if (page === 'gamificacao') {
        renderGamificacao();
    }
    if (page === 'mapa-cobertura') {
        renderMapaCobertura();
    }
    if (page === 'war-room') {
        iniciarWarRoom();
    }
};
```

**3c. Adicionar 'mapa-cobertura' e 'war-room' ao PAGE_REALTIME_KEYS**

Localizar `PAGE_REALTIME_KEYS` (linha ~2902):
```javascript
var PAGE_REALTIME_KEYS = {
    ...
    gamificacao: []
};
```

Adicionar entradas apos `gamificacao: []`:
```javascript
    'mapa-cobertura': [],
    'war-room': []
```

**3d. Verificacao final**

Apos todas as insercoes, verificar:
1. `CONECTA.html` abre sem erros de sintaxe JavaScript (sem `SyntaxError` no console)
2. Navegar para "Mapa de Cobertura": mapa Leaflet renderiza tiles OSM com centro no DF
3. Navegar para "War Room": secao exibe estrutura (feed + alertas) sem crash
4. Com Elexion offline: banner laranja exibe em ambas as secoes sem quebrar o restante do CONECTA
5. `currentPage` e atualizado corretamente ao navegar entre secoes
  </action>
  <verify>
1. `grep -c "page-mapa-cobertura" CONECTA.html` retorna 3+ (nav-item + secao HTML + JS)
2. `grep -c "page-war-room" CONECTA.html` retorna 3+
3. `grep -c "conectarWarRoomSocket" CONECTA.html` retorna 2+ (definicao + chamada)
4. `grep -c "leaflet" CONECTA.html` (case-insensitive) retorna 4+ (CSS, JS, heat, ID do div)
5. Abrir CONECTA.html no browser: zero SyntaxError no DevTools Console
  </verify>
  <done>
- JS do War Room completo: conectarWarRoomSocket, iniciarWarRoom, reconectarWarRoom, adicionarEventoFeed, renderWarRoomFeed, renderWarRoomAlertas, resolverAlerta, acionarPulso, atualizarStatusWarRoom, atualizarBadgeWarRoom, ativarPollingFallbackWarRoom
- Wrapper showPage encadeado com mapa-cobertura e war-room
- PAGE_REALTIME_KEYS atualizado
- Ambas as secoes funcionam com Elexion offline (banner, sem crash)
- Badge war-room reflete contagem de alertas ativos
  </done>
</task>

</tasks>

<verification>
Verificacoes finais pos-execucao (executar apos todas as tasks):

1. **CDN carregado**: Abrir DevTools Network — requisicoes para unpkg.com/leaflet e cdn.socket.io com status 200
2. **Mapa Leaflet**: Navegar para "Mapa de Cobertura" — tiles OSM aparecem, sem erro "L is not defined"
3. **Heatmap com mock**: Com ElexionClient autenticado, `renderMapaCobertura()` no console — heatmap aparece
4. **War Room HTML**: Navegar para "War Room" — feed e alertas renderizados, indicador de pulso verde visivel
5. **Socket.IO**: DevTools Network > WS — tentativa de handshake para api.elexion.com.br/socket.io/
6. **Fallback offline**: Desconectar internet, recarregar, navegar para ambas as secoes — banners laranjas aparecem, CONECTA continua funcionando
7. **Sem quebrar gamificacao**: Navegar para "Gamificacao" — renderGamificacao() ainda e chamado, Chart.js ainda renderiza
8. **Sem memory leak**: Polling da gamificacao continua com 60s; war-room usa socket (nao setInterval em modo conectado)
9. **XSS prevention**: Todos os dados da API passam por `_safeText()` antes de `innerHTML`
10. **Badge war-room**: `warRoomState.alertas = [{id:'x',msg:'teste',severity:'high'}]; renderWarRoomAlertas(); atualizarBadgeWarRoom()` — badge aparece com "1" na sidebar
</verification>

<success_criteria>
- [ ] VIS-01: Mapa Leaflet renderiza com tiles OSM centrado no DF (-15.78, -47.93)
- [ ] VIS-01: fetchHeatmap() popula camada de pontos de calor (ou exibe mapa vazio sem erro)
- [ ] VIS-02: fetchHeatmapGaps() popula circles vermelhos dashed nas areas sem cobertura
- [ ] VIS-02: Overlay GeoJSON das RAs renderiza bordas azuis finas sobre o mapa
- [ ] VIS-03: War Room conecta via Socket.IO com JWT no handshake (`auth: { token }`)
- [ ] VIS-03: Eventos task.completed, xp.awarded, alert.triggered adicionam items ao feed
- [ ] VIS-04: Alertas ativos exibem severidade com cor (high=vermelho, medium=amarelo, low=azul)
- [ ] VIS-04: Botao "Resolver" chama PATCH /war-room/alerts/:id/resolve e remove da lista local
- [ ] VIS-05: Indicador de pulso (#pulso-campanha) anima a cada evento Socket.IO recebido
- [ ] Fallback: Com Elexion offline, banners laranjas aparecem em ambas as secoes sem SyntaxError
- [ ] Compatibilidade: Secao "Gamificacao" (Phase 2) continua funcional sem regressao
</success_criteria>

<output>
Apos conclusao, criar `.planning/phases/03-visualizacoes-avancadas-heatmap-war-room/03-01-SUMMARY.md` com:

```markdown
# Summary: Phase 03 — Visualizacoes Avancadas

**Completed:** {data}
**Plan:** 03-01
**Status:** Complete

## What was built

- CDN tags: Leaflet 1.9.4 + Leaflet.heat 0.2.0 + Socket.IO 4.8.3 inseridos no <head> do CONECTA.html
- Secao "Mapa de Cobertura" (id=page-mapa-cobertura): mapa Leaflet + heatmap + gaps + overlay RAs GeoJSON + cards de cobertura por RA
- Secao "War Room" (id=page-war-room): feed Socket.IO + alertas com severidade + botao Resolver + indicador de pulso
- Dois novos itens na sidebar com integracao no wrapper showPage

## Key decisions

- Tiles OSM (OpenStreetMap) em vez de Google Maps/Mapbox — gratuito, sem token
- Limite de 500 pontos no heatmap (Pitfall 11 — performance)
- JWT passado no `auth: { token }` do handshake Socket.IO (nao em query string — mais seguro)
- Polling fallback (30s) quando Socket.IO nao disponivel — robustez
- `_safeText()` como sanitizador universal para todos os dados externos no DOM (Pitfall 3)
- Socket mantido conectado em background mesmo ao sair da secao war-room

## Files modified

- CONECTA.html (CDN + CSS + HTML secoes + JS completo)

## Requirements addressed

- VIS-01: Heatmap geografico Leaflet.js com cobertura das RAs do DF
- VIS-02: Heatmap de gaps (areas nao visitadas) destacadas
- VIS-03: War Room: feed de atividade em tempo real via Socket.IO
- VIS-04: War Room: alertas ativos com indicador visual e resolucao
- VIS-05: War Room: pulso da campanha (indicador de atividade geral)
```
</output>
