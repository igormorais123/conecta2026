# PLANO CONECTA 2026 — Versao 4.0 (Consolidado Final)

> **Versao**: 4.0 | **Data**: 27/03/2026 | **Status**: Aprovado para implementacao
> **Origem**: Plano v3.0 + 11 achados da verificacao de codigo + complementos operacionais
> **Implementado por**: INTEIA — Inteligencia Estrategica Eleitoral
> **Sistema desenvolvido por**: Silvio Morais Vieira
> **Logo vetorial**: `C:\Users\IgorPC\Downloads\inteia-logo-vetorial.svg`

---

## INDICE

1. [Resumo Executivo](#1-resumo-executivo)
2. [Inventario Atual](#2-inventario-atual)
3. [11 Bugs da Review](#3-bugs-identificados-na-review)
4. [Fase 0 — Correcoes Criticas](#fase-0--correcoes-criticas-bloqueadoras)
5. [Fase 1 — Redesign Completo](#fase-1--redesign-completo)
6. [Fase 2 — PWA Mobile](#fase-2--pwa-progressive-web-app)
7. [Fase 3 — Contratacao e Setup Supabase Pro (Playwright)](#fase-3--contratacao-e-setup-supabase-pro-guiado-por-playwright)
8. [Fase 4 — Backup Automatico](#fase-4--backup-automatico)
9. [Fase 5 — Integracao CONECTA.html](#fase-5--integracao-conectahtml-completa)
10. [Fase 6 — Integracao Logistica](#fase-6--integracao-logistica-completa)
11. [Fase 7 — Realtime](#fase-7--sincronizacao-realtime)
12. [Fase 8 — Seguranca](#fase-8--seguranca)
13. [Fase 9 — Deploy](#fase-9--deploy)
14. [Fase 10 — Testes](#fase-10--testes)
15. [Fase 11 — Creditos e Branding INTEIA](#fase-11--creditos-e-branding-inteia)
16. [Fase 12 — WhatsApp Business (Futura)](#fase-12--whatsapp-business-integracao-futura)
17. [Skills Recomendadas por Fase](#skills-recomendadas-por-fase)
18. [Divisao de Trabalho entre 3 IAs](#divisao-de-trabalho-entre-3-ias-em-paralelo)
19. [Cronograma e Dependencias](#cronograma-e-dependencias)
20. [Decisoes Pendentes](#decisoes-pendentes)
21. [Metricas de Sucesso](#metricas-de-sucesso)

---

## 1. RESUMO EXECUTIVO

Transformacao do sistema CONECTA Celina Leao 2026 de 6 paginas HTML standalone em plataforma web multi-usuario hospedada em **inteia.com.br/conecta2026** com:

- Autenticacao por username (silvio2026, karla2026, igor2026)
- Supabase Pro como backend (banco, auth, storage, realtime, backup diario)
- Sincronizacao em tempo real entre usuarios
- PWA para acesso mobile offline
- Backup automatico diario (Supabase Pro)
- Redesign visual unificado
- Branding INTEIA + creditos Silvio Morais Vieira em todo o sistema
- WhatsApp Business (fase futura)

### Investimento mensal

| Item | Custo | Nota |
|------|-------|------|
| Supabase Pro | R$ 150 | $25/mes, 8GB banco, 100GB storage, backup diario |
| Vercel Pro | JA CONTRATADO | Igor ja possui — sem custo adicional |
| **TOTAL** | **R$ 150/mes** | ~R$ 1.800/ano |

---

## 2. INVENTARIO ATUAL

### 2.1 Arquivos do repositorio

| Arquivo | Tamanho | Estado | Descricao |
|---------|---------|--------|-----------|
| `CONECTA.html` | ~217KB | MODIFICAR | App principal SPA-like, sidebar + 12 secoes |
| `Logistica Campanha.html` | ~grande | MODIFICAR | Gestao logistica, dark theme, 10 abas |
| `login.html` | ~440 linhas | REESCREVER | Login email+magic link (errado, precisa username) |
| `cadastro-apoiador.html` | ~700 linhas | MODIFICAR | Formulario publico mobile-first |
| `qrcode-cartao.html` | ~400 linhas | MODIFICAR | Gerador QR code cartao de visita |
| `Coordenadores Regionais.html` | media | MODIFICAR | Grid de cards coordenadores |
| `Cadastro - lideres 2026.htm` | media | SEM MUDANCA | Cadastro lideres Valdelino (outro candidato) |
| `js/supabase-config.js` | 18 linhas | REESCREVER | Config Supabase (duplicacao de credenciais) |
| `js/conecta-db.js` | 390 linhas | MODIFICAR | Sync layer localStorage <-> Supabase (incompleto) |
| `setup/migration.sql` | ~560 linhas | SEM MUDANCA | 18 tabelas + RLS + triggers |
| `setup/SETUP.md` | 111 linhas | REESCREVER | Guia de setup (URLs erradas) |

### 2.2 Arquivos a criar

| Arquivo | Descricao |
|---------|-----------|
| `index.html` | Redirect para login.html |
| `conta.html` | Pagina de conta (trocar senha, perfil, logout) |
| `manifest.json` | PWA manifest |
| `service-worker.js` | PWA service worker (cache offline) |
| `icons/icon-192.png` | Icone PWA 192x192 (gerado da logo INTEIA) |
| `icons/icon-512.png` | Icone PWA 512x512 (gerado da logo INTEIA) |
| `icons/inteia-logo.svg` | Logo INTEIA para rodape (copiar de Downloads) |

### 2.3 Sidebar atual do CONECTA.html

```
Principal:       Dashboard, Organograma
Operacional:     Agenda, Veiculos, Quem e Quem, Lideres, Mapa DF
Estrategico:     Pesquisas, Comunicacao, Demandas
Administrativo:  Juridico, Materiais

FALTAM: Logistica, Coordenadores, QR Code, Conta, Sair
```

### 2.4 Tabelas no migration.sql (18)

CONECTA: perfis, eventos, veiculos, pessoas, lideres, apoiadores, demandas, pesquisas, juridico, materiais, comunicacao, visitas, tarefas, atividades
LOGISTICA: logistica_tarefas, logistica_fornecedores, logistica_equipes, logistica_membros

---

## 3. BUGS IDENTIFICADOS NA REVIEW

Todos os 11 itens abaixo sao bloqueadores que DEVEM ser corrigidos antes de qualquer nova funcionalidade.

### BUG-01: CONECTA.html sem integracao Supabase
- **Onde**: CONECTA.html (arquivo inteiro)
- **Problema**: Zero `<script>` tags para supabase-config.js ou conecta-db.js. Sem auth guard. Sem logout. Dados so em localStorage.
- **Impacto**: Multi-usuario nao funciona. Acesso sem login.
- **Correcao**: Adicionar scripts + auth guard + logout + links na sidebar.
- **IA responsavel**: Opus (Fase 5)

### BUG-02: Login usa email em vez de username
- **Onde**: login.html (linhas 274-276, 362-396)
- **Problema**: Campo `type="email"`, placeholder "seu@email.com", botao Magic Link. Nao usa usernames solicitados (silvio2026/karla2026/igor2026).
- **Impacto**: Usuarios nao conseguem fazer login como especificado.
- **Correcao**: Reescrever com campo username + mapa USUARIOS_AUTORIZADOS + remover magic link.
- **IA responsavel**: GPT 5.4 (Fase 0.2)

### BUG-03: URLs usam /conecta/ em vez de /conecta2026/
- **Onde**: login.html (linhas 324, 416), conecta-db.js (linhas 297, 305), qrcode-cartao.html (linha 363), SETUP.md (linhas 41, 42, 89)
- **Problema**: Todas as URLs internas usam `/conecta/` mas o deploy e em `/conecta2026/`.
- **Impacto**: Deploy nao funciona na URL pretendida.
- **Correcao**: Buscar e substituir todas as ocorrencias.
- **IA responsavel**: Gemini (Fase 0.5)

### BUG-04: Nao existe conta.html
- **Onde**: Projeto inteiro
- **Problema**: Nao foi criada pagina para trocar senha e ver perfil.
- **Impacto**: Usuarios nao podem trocar senha inicial.
- **Correcao**: Criar conta.html com formulario de troca de senha + perfil + logout.
- **IA responsavel**: GPT 5.4 (Fase 0.4)

### BUG-05: Nao existe index.html
- **Onde**: Projeto inteiro
- **Problema**: Acessar /conecta2026/ da 404.
- **Impacto**: Ponto de entrada quebrado.
- **Correcao**: Criar index.html com meta refresh + JS redirect para login.html.
- **IA responsavel**: Gemini (Fase 0.3)

### BUG-06: Logistica sem Supabase
- **Onde**: Logistica Campanha.html (arquivo inteiro)
- **Problema**: Nenhum script Supabase, nenhum auth guard, nenhum sync.
- **Impacto**: Modulo mais importante nao compartilha dados.
- **Correcao**: Adicionar scripts + auth guard + botao voltar.
- **IA responsavel**: GPT 5.4 (Lote 2)

### BUG-07: conecta-db.js sem tabelas de logistica
- **Onde**: js/conecta-db.js (linhas 12-25 TABLES, linhas 367-371 CONECTA_KEYS, linha 222 realtime)
- **Problema**: TABLES e CONECTA_KEYS so mapeiam `conectacelina_*`. Nao incluem `logistica_celina_2026_*`.
- **Impacto**: Dados de logistica nunca sincronizam mesmo com scripts carregados.
- **Correcao**: Adicionar 4 entradas ao TABLES, ao CONECTA_KEYS e ao realtime.
- **IA responsavel**: GPT 5.4 (Fase 0.8)

### BUG-08: Credenciais Supabase sao placeholders
- **Onde**: js/supabase-config.js (linhas 4-5), login.html (linhas 305-306), cadastro-apoiador.html (linhas 687-688)
- **Problema**: `'https://SEU-PROJETO.supabase.co'` e `'SUA-ANON-KEY'` em 3 arquivos diferentes.
- **Impacto**: Sistema nao funciona. Sem validacao de placeholder.
- **Correcao**: Centralizar em supabase-config.js unico + adicionar validacao de placeholder.
- **IA responsavel**: GPT 5.4 (Fase 0.1)

### BUG-09: Race condition no cadastro-apoiador.html
- **Onde**: cadastro-apoiador.html (linhas 582-627 vs 684-696)
- **Problema**: Supabase CDN carrega DEPOIS do handler de submit. Submit rapido = dados so em localStorage.
- **Impacto**: Dados podem nao chegar ao Supabase.
- **Correcao**: Mover Supabase para antes do handler. Usar supabase-config.js centralizado.
- **IA responsavel**: Gemini (Fase 0.9)

### BUG-10: Duplicacao de cliente Supabase
- **Onde**: login.html (linha 311), cadastro-apoiador.html (linha 692), vs js/supabase-config.js
- **Problema**: Cada pagina cria seu proprio `createClient` com credenciais inline.
- **Impacto**: Atualizar credenciais em 1 arquivo nao propaga para os outros.
- **Correcao**: Todas as paginas usam `<script src="js/supabase-config.js">` como unica fonte.
- **IA responsavel**: Resolvido automaticamente quando BUG-08 for corrigido.

### BUG-11: syncToSupabase nao funciona para arrays
- **Onde**: js/conecta-db.js (linhas 143-147)
- **Problema**: `syncToSupabase` para type 'array' tem so um comentario, zero codigo.
- **Impacto**: Eventos, veiculos, pessoas, pesquisas, demandas, juridico, materiais, lideres, atividades NUNCA sincronizam.
- **Correcao**: Implementar upsert por item ou converter CONECTA.html para usar saveItem/deleteItem.
- **IA responsavel**: GPT 5.4 (Fase 0.8)

---

## FASE 0 — CORRECOES CRITICAS (Bloqueadoras)

> **Prioridade**: MAXIMA. Nada mais funciona sem estas correcoes.
> **Dependencia**: 0.1 deve ser feito ANTES de 0.2, 0.4, 0.6, 0.7, 0.9

### 0.1 Refatorar supabase-config.js (corrige BUG-08, BUG-10)

**Arquivo**: `js/supabase-config.js`
**Acao**: Reescrever completamente.
**IA**: GPT 5.4

O arquivo deve ser a UNICA fonte de credenciais e cliente Supabase no sistema inteiro.

```javascript
// js/supabase-config.js — v4.0
(function() {
    'use strict';
    var SUPABASE_URL = 'https://SEU-PROJETO.supabase.co';
    var SUPABASE_ANON_KEY = 'SUA-ANON-KEY';

    // Validacao de placeholder — mostra banner vermelho se nao configurado
    if (SUPABASE_URL.indexOf('SEU-PROJETO') !== -1) {
        console.error('[CONECTA] Credenciais Supabase nao configuradas! Edite js/supabase-config.js');
        window._conectaSupabaseError = true;
        document.addEventListener('DOMContentLoaded', function() {
            var banner = document.createElement('div');
            banner.style.cssText = 'position:fixed;top:0;left:0;right:0;padding:12px;background:#c62828;color:#fff;text-align:center;z-index:9999;font-weight:bold;font-family:sans-serif;';
            banner.textContent = 'ATENCAO: Credenciais Supabase nao configuradas. Edite js/supabase-config.js';
            document.body.prepend(banner);
        });
    }

    // Expor globalmente
    window.CONECTA_SUPABASE_URL = SUPABASE_URL;
    window.CONECTA_SUPABASE_KEY = SUPABASE_ANON_KEY;

    // Carregar CDN do Supabase
    var script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
    script.onload = function() {
        var lib = window.supabase;
        window._supabaseLib = lib;
        window.supabase = lib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        window._conectaSupabase = window.supabase; // alias para cadastro-apoiador
        window.dispatchEvent(new Event('supabase-ready'));
    };
    script.onerror = function() {
        console.error('[CONECTA] Falha ao carregar Supabase CDN');
        window.dispatchEvent(new Event('supabase-ready'));
    };
    document.head.appendChild(script);
})();
```

**REGRA INVIOLAVEL**: Nenhuma outra pagina chama `createClient`. Todas usam `window.supabase` apos `supabase-ready`.

---

### 0.2 Reescrever login.html (corrige BUG-02, BUG-03, BUG-10)

**Arquivo**: `login.html`
**Acao**: Reescrever completamente.
**IA**: GPT 5.4

Mudancas obrigatorias:
- Campo `type="text"` para username (NAO email)
- Placeholder: "silvio2026, karla2026 ou igor2026"
- Mapa USUARIOS_AUTORIZADOS traduzindo username -> email interno
- Remover magic link (botao e divider "ou")
- Toggle show/hide senha (botao olho)
- Usa `<script src="js/supabase-config.js">` (NAO cria cliente proprio)
- Todas as URLs com `/conecta2026/`
- Redesign com gradiente animado (fundo)
- Rodape com creditos INTEIA + Silvio Morais Vieira

```javascript
// Mapa de usuarios autorizados
var USUARIOS_AUTORIZADOS = {
    'silvio2026': { email: 'silvio2026@conecta.interno', nome: 'Silvio Vieira', papel: 'admin' },
    'karla2026':  { email: 'karla2026@conecta.interno', nome: 'Karla Silva', papel: 'coordenador' },
    'igor2026':   { email: 'igor2026@conecta.interno', nome: 'Igor Morais', papel: 'admin' }
};

// Login: traduz username -> email e autentica via Supabase
form.addEventListener('submit', async function(e) {
    e.preventDefault();
    var username = inputUsername.value.trim().toLowerCase();
    var password = inputPassword.value;

    var user = USUARIOS_AUTORIZADOS[username];
    if (!user) {
        showMsg('Usuario nao autorizado.', 'error');
        return;
    }

    var result = await window.supabase.auth.signInWithPassword({
        email: user.email,
        password: password
    });

    if (result.error) {
        showMsg('Senha incorreta.', 'error');
    } else {
        window.location.href = '/conecta2026/CONECTA.html';
    }
});
```

**Senha inicial**: Igual ao username. Usuario troca em conta.html.

---

### 0.3 Criar index.html (corrige BUG-05)

**Arquivo**: `index.html` (NOVO)
**Acao**: Criar arquivo minimo.
**IA**: Gemini 3.1

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="refresh" content="0;url=login.html">
    <title>CONECTA 2026</title>
</head>
<body>
    <p>Redirecionando...</p>
    <script>window.location.href='login.html';</script>
</body>
</html>
```

---

### 0.4 Criar conta.html (corrige BUG-04)

**Arquivo**: `conta.html` (NOVO)
**Acao**: Criar pagina completa.
**IA**: GPT 5.4

Requisitos:
- Auth guard (redirect para login se nao autenticado)
- Display do username e nome do usuario logado
- Formulario: nova senha + confirmar nova senha (minimo 6 chars)
- Botao "Alterar Senha" chama `supabase.auth.updateUser({ password })`
- Botao "Voltar ao CONECTA" (link para CONECTA.html)
- Botao "Sair" (logout + redirect login)
- Usa `<script src="js/supabase-config.js">` centralizado
- Design consistente com login.html (mesma paleta, mesma tipografia Inter)
- Responsivo mobile
- Meta tags PWA no head
- Rodape com creditos INTEIA + Silvio Morais Vieira

```javascript
// Troca de senha
async function trocarSenha() {
    var nova = document.getElementById('novaSenha').value;
    var confirma = document.getElementById('confirmarSenha').value;
    if (nova !== confirma) { showMsg('Senhas nao conferem.', 'error'); return; }
    if (nova.length < 6) { showMsg('Minimo 6 caracteres.', 'error'); return; }

    var result = await window.supabase.auth.updateUser({ password: nova });
    if (result.error) showMsg('Erro: ' + result.error.message, 'error');
    else showMsg('Senha alterada com sucesso!', 'success');
}
```

---

### 0.5 Corrigir URLs /conecta/ -> /conecta2026/ (corrige BUG-03)

**IA**: Gemini 3.1

**Arquivos afetados e localizacao EXATA**:

| Arquivo | Linha | Texto atual | Texto correto |
|---------|-------|-------------|---------------|
| `qrcode-cartao.html` | 363 | `inteia.com.br/conecta/cadastro` | `inteia.com.br/conecta2026/cadastro` |
| `setup/SETUP.md` | 41 | `inteia.com.br/conecta/` | `inteia.com.br/conecta2026/` |
| `setup/SETUP.md` | 42 | `inteia.com.br/conecta/login` | `inteia.com.br/conecta2026/login` |
| `setup/SETUP.md` | 89 | `inteia.com.br/conecta/login` | `inteia.com.br/conecta2026/login` |

**NOTA**: login.html e conecta-db.js serao reescritos pelo GPT 5.4 ja com URLs corretas. Gemini so corrige qrcode-cartao.html e SETUP.md.

---

### 0.6 Integrar Supabase no CONECTA.html (corrige BUG-01)

**Arquivo**: `CONECTA.html`
**Acao**: Adicionar 3 blocos SEM alterar funcionalidade existente.
**IA**: Opus (Lote 2)

**Bloco 1 — Scripts (antes do `</body>`, APOS todos os scripts existentes)**:
```html
<!-- Supabase Integration -->
<script src="js/supabase-config.js"></script>
<script src="js/conecta-db.js"></script>
<script>
window.addEventListener('supabase-ready', async function() {
    // Auth guard
    var session = await window.supabase.auth.getSession();
    if (!session.data.session) {
        window.location.href = '/conecta2026/login.html';
        return;
    }
    // Inicializar sync
    ConectaDB.init();
    // Nome do usuario no header
    var perfil = await ConectaDB.getUserProfile();
    if (perfil && perfil.nome) {
        var el = document.getElementById('userName');
        if (el) el.textContent = perfil.nome;
    }
});
</script>
```

**Bloco 2 — Header (adicionar dentro de `.header-actions`)**:
```html
<span id="userName" style="font-size:0.8rem;color:var(--text-light);font-weight:600;"></span>
<button class="btn-header" onclick="ConectaDB.logout()" style="background:var(--danger);">Sair</button>
```

**Bloco 3 — Sidebar (adicionar antes de `</nav>`, apos secao "Administrativo")**:
```html
<div class="nav-section">Paginas</div>
<div class="nav-item" onclick="window.location.href='Logistica Campanha.html'">
    <span class="nav-icon">&#128666;</span>
    <span>Logistica</span>
</div>
<div class="nav-item" onclick="window.location.href='Coordenadores Regionais.html'">
    <span class="nav-icon">&#127919;</span>
    <span>Coordenadores</span>
</div>
<div class="nav-item" onclick="window.location.href='qrcode-cartao.html'">
    <span class="nav-icon">&#128246;</span>
    <span>QR Code</span>
</div>

<div class="nav-section">Usuario</div>
<div class="nav-item" onclick="window.location.href='conta.html'">
    <span class="nav-icon">&#9881;</span>
    <span>Minha Conta</span>
</div>
<div class="nav-item" onclick="ConectaDB.logout()">
    <span class="nav-icon">&#128682;</span>
    <span>Sair</span>
</div>
```

---

### 0.7 Integrar Supabase na Logistica (corrige BUG-06)

**Arquivo**: `Logistica Campanha.html`
**Acao**: Adicionar 2 blocos.
**IA**: GPT 5.4 (Lote 2)

**Bloco 1 — Nav (dentro de `.nav`, ao lado do botao QR Code)**:
```html
<a href="CONECTA.html" class="btn btn-sm" style="background:var(--green);color:#fff;text-decoration:none;margin-right:8px;">&#8592; CONECTA</a>
```

**Bloco 2 — Scripts (antes do `</body>`, APOS todos os scripts existentes)**:
```html
<script src="js/supabase-config.js"></script>
<script src="js/conecta-db.js"></script>
<script>
window.addEventListener('supabase-ready', async function() {
    var session = await window.supabase.auth.getSession();
    if (!session.data.session) {
        window.location.href = '/conecta2026/login.html';
        return;
    }
    ConectaDB.init();
});
</script>
```

---

### 0.8 Atualizar conecta-db.js (corrige BUG-07 e BUG-11)

**Arquivo**: `js/conecta-db.js`
**Acao**: 4 modificacoes pontuais.
**IA**: GPT 5.4

**Modificacao 1 — Adicionar tabelas logistica ao TABLES (apos linha 24)**:
```javascript
'logistica_celina_2026_tarefas':      { table: 'logistica_tarefas', type: 'array' },
'logistica_celina_2026_fornecedores': { table: 'logistica_fornecedores', type: 'array' },
'logistica_celina_2026_equipes':      { table: 'logistica_equipes', type: 'array' },
'logistica_celina_2026_membros':      { table: 'logistica_membros', type: 'array' },
```

**Modificacao 2 — Adicionar ao CONECTA_KEYS (apos linha 371)**:
```javascript
'logistica_celina_2026_tarefas', 'logistica_celina_2026_fornecedores',
'logistica_celina_2026_equipes', 'logistica_celina_2026_membros'
```

**Modificacao 3 — Adicionar ao realtime (linha 222, array tables)**:
```javascript
'logistica_tarefas', 'logistica_fornecedores', 'logistica_equipes', 'logistica_membros'
```

**Modificacao 4 — Implementar syncToSupabase para arrays (substituir linhas 143-147)**:
```javascript
if (config.type === 'array') {
    var rows = Array.isArray(data) ? data : [];
    for (var i = 0; i < rows.length; i++) {
        var item = Object.assign({}, rows[i]);
        if (currentUser) {
            item.criado_por = item.criado_por || currentUser.id;
        }
        delete item.criado_em;
        if (item.id && typeof item.id === 'number') {
            var itemId = item.id;
            delete item.id;
            await supabase.from(config.table).update(item).eq('id', itemId);
        } else {
            delete item.id;
            await supabase.from(config.table).insert(item);
        }
    }
}
```

**Modificacao 5 — Corrigir URLs /conecta/ -> /conecta2026/ (linhas 297 e 305)**:
```javascript
// Linha 297: emailRedirectTo
options: { emailRedirectTo: window.location.origin + '/conecta2026/' }

// Linha 305: logout redirect
window.location.href = '/conecta2026/login.html';
```

---

### 0.9 Corrigir cadastro-apoiador.html (corrige BUG-09, BUG-10)

**Arquivo**: `cadastro-apoiador.html`
**Acao**: 2 modificacoes.
**IA**: Gemini 3.1

**Modificacao 1 — REMOVER o bloco de script Supabase inline (linhas 684-696)**:
Deletar completamente:
```html
<!-- DELETAR TUDO ISTO -->
<script>
(function() {
    var SUPABASE_URL = 'https://SEU-PROJETO.supabase.co';
    var SUPABASE_ANON_KEY = 'SUA-ANON-KEY';
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
    s.onload = function() {
        window._conectaSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    };
    document.head.appendChild(s);
})();
</script>
```

**Modificacao 2 — ADICIONAR antes do `<script>` principal do formulario (antes da linha ~500)**:
```html
<script src="js/supabase-config.js"></script>
```

O handler ja usa `window._conectaSupabase` que agora e alias do supabase-config.js.

---

### 0.10 Reescrever SETUP.md

**Arquivo**: `setup/SETUP.md`
**Acao**: Reescrever completamente.
**IA**: Gemini 3.1

Conteudo atualizado deve refletir:
- Autenticacao por username (NAO email)
- URLs com /conecta2026/
- Supabase Pro (NAO free)
- Unico local de credenciais: js/supabase-config.js
- Criar 3 usuarios no Supabase Auth com emails @conecta.interno
- Vercel Pro ja contratado
- Referencia ao script Playwright da Fase 3

---

## FASE 1 — REDESIGN COMPLETO

### 1.1 Paleta de Cores Unificada

Todas as paginas protegidas usam:

```css
:root {
    --primary: #1a237e;   --primary-light: #3949ab;   --primary-dark: #0d1442;
    --accent: #ff6f00;    --accent-light: #ffa040;     --accent-dark: #e65100;
    --success: #2e7d32;   --danger: #c62828;           --warning: #f57f17;
    --info: #0277bd;
    --bg: #f5f7fa;        --bg-secondary: #eef2f7;     --card-bg: #ffffff;
    --text: #1a1a1a;      --text-light: #666666;       --text-lighter: #999999;
    --border: #e0e0e0;    --border-light: #f0f0f0;
    --shadow-sm: 0 1px 3px rgba(0,0,0,0.08);
    --shadow-md: 0 2px 8px rgba(0,0,0,0.12);
    --shadow-lg: 0 4px 16px rgba(0,0,0,0.15);
    --font-family: 'Inter', 'Segoe UI', sans-serif;
    --radius-sm: 6px;  --radius-md: 8px;  --radius-lg: 12px;
    --transition-base: 0.2s ease;
}
```

**Excecoes**:
- `Logistica Campanha.html`: manter dark theme, alinhar tipografia Inter
- `cadastro-apoiador.html`: manter paleta azul/dourado (publico, identidade propria)

### 1.2 Layout Responsivo

| Breakpoint | Comportamento |
|-----------|---------------|
| Desktop 1920px+ | Sidebar 280px fixo, header 64px, grid 3 colunas |
| Tablet 768-1024px | Sidebar colapsavel 60px (so icones), grid 2 colunas |
| Mobile < 768px | Sidebar drawer (hamburger), grid 1 coluna, tabelas viram cards |

### 1.3 Componentes Redesenhados

**Botoes**: padding 12-16px, radius 8px, hover translateY(-2px), sombra, transicao 0.2s.
**Cards**: branco, radius 12px, shadow-sm, hover shadow-lg + translateY(-4px).
**Inputs**: padding 12px 16px, border 1.5px, radius 8px, focus com ring azul 3px.
**Tabelas**: thead gradiente primary, th uppercase letter-spacing, hover bg-secondary.
**Modais**: overlay backdrop-filter blur(4px), modal radius 16px, animacao slideIn.

### 1.4 Animacoes

- Page fadeIn (0.3s opacity)
- Sidebar slideInLeft (0.3s)
- Cards hover transition (0.2s)
- Skeleton loading para dados carregando
- SEM animacoes infinitas (bounce, pulse)

---

## FASE 2 — PWA (Progressive Web App)

### 2.1 manifest.json

```json
{
    "name": "CONECTA 2026 — Celina Leao",
    "short_name": "CONECTA",
    "description": "Sistema de gestao de campanha. Implementado por INTEIA.",
    "start_url": "/conecta2026/",
    "scope": "/conecta2026/",
    "display": "standalone",
    "orientation": "portrait-primary",
    "theme_color": "#1a237e",
    "background_color": "#ffffff",
    "icons": [
        { "src": "/conecta2026/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
        { "src": "/conecta2026/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" }
    ]
}
```

### 2.2 service-worker.js

```javascript
var CACHE_NAME = 'conecta-2026-v1';
var urlsToCache = [
    '/conecta2026/', '/conecta2026/login.html', '/conecta2026/CONECTA.html',
    '/conecta2026/Logistica Campanha.html', '/conecta2026/conta.html',
    '/conecta2026/js/supabase-config.js', '/conecta2026/js/conecta-db.js'
];

self.addEventListener('install', function(e) {
    e.waitUntil(caches.open(CACHE_NAME).then(function(c) { return c.addAll(urlsToCache); }));
});

self.addEventListener('fetch', function(e) {
    e.respondWith(caches.match(e.request).then(function(r) { return r || fetch(e.request); }));
});

self.addEventListener('activate', function(e) {
    e.waitUntil(caches.keys().then(function(names) {
        return Promise.all(names.filter(function(n) { return n !== CACHE_NAME; }).map(function(n) { return caches.delete(n); }));
    }));
});
```

### 2.3 Meta tags PWA (adicionar no `<head>` de TODAS as paginas protegidas)

```html
<link rel="manifest" href="/conecta2026/manifest.json">
<meta name="theme-color" content="#1a237e">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="CONECTA">
<link rel="apple-touch-icon" href="/conecta2026/icons/icon-192.png">
```

### 2.4 Registro do Service Worker (adicionar antes do `</body>`)

```html
<script>
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/conecta2026/service-worker.js');
}
</script>
```

### 2.5 Icones PWA

Gerar a partir da logo INTEIA (`C:\Users\IgorPC\Downloads\inteia-logo-vetorial.svg`):
- `icons/icon-192.png` — 192x192, logo sobre fundo #1a237e
- `icons/icon-512.png` — 512x512, logo sobre fundo #1a237e

Usar skill `ai-image-generation` ou `flux-image` via inference.sh, ou converter SVG->PNG com canvas/Python.

---

## FASE 3 — CONTRATACAO E SETUP SUPABASE PRO (Guiado por Playwright)

> **REQUER PARTICIPACAO DE IGOR** apenas para:
> - Inserir dados de pagamento (cartao de credito)
> - Confirmar email de verificacao se necessario
>
> TODO O RESTO e automatizavel via Playwright ou Claude in Chrome.

### 3.1 Script Playwright para Setup Completo

```javascript
// setup/setup-supabase.js — executar via: npx playwright test setup/setup-supabase.js
const { test, expect } = require('@playwright/test');

test('Setup Supabase CONECTA 2026', async ({ page }) => {

    // === PASSO 1: Login no Supabase ===
    await page.goto('https://supabase.com/dashboard');
    // Se ja tem conta: login com igormorais123@gmail.com
    // Se nao: signup
    // >>> IGOR: inserir senha/2FA manualmente se solicitado <<<

    // === PASSO 2: Criar novo projeto ===
    await page.click('text=New Project');
    await page.fill('[name="name"]', 'conecta-2026');
    await page.fill('[name="db_pass"]', 'GERAR_SENHA_FORTE_AQUI');
    // Regiao South America (Sao Paulo)
    await page.selectOption('[name="region"]', 'sa-east-1');
    // Plano Pro
    await page.click('text=Pro');
    // >>> IGOR: inserir cartao de credito ($25/mes) <<<
    await page.click('text=Create new project');
    // Aguardar provisionamento (~2 min)
    await page.waitForSelector('text=Project ready', { timeout: 180000 });

    // === PASSO 3: Copiar credenciais ===
    await page.goto('https://supabase.com/dashboard/project/_/settings/api');
    const projectUrl = await page.inputValue('[aria-label="Project URL"]');
    const anonKey = await page.inputValue('[aria-label="anon key"]');
    console.log('SUPABASE_URL:', projectUrl);
    console.log('SUPABASE_ANON_KEY:', anonKey);

    // === PASSO 4: Executar migration.sql ===
    await page.goto('https://supabase.com/dashboard/project/_/sql');
    await page.click('text=New Query');
    const fs = require('fs');
    const migrationSQL = fs.readFileSync('setup/migration.sql', 'utf-8');
    await page.fill('.monaco-editor textarea', migrationSQL);
    await page.click('text=Run');
    await page.waitForSelector('text=Success');

    // === PASSO 5: Criar bucket de storage ===
    await page.goto('https://supabase.com/dashboard/project/_/storage');
    await page.click('text=New Bucket');
    await page.fill('[name="name"]', 'fotos-campanha');
    await page.check('[name="public"]');
    await page.click('text=Create bucket');

    // === PASSO 6: Configurar Auth URLs ===
    await page.goto('https://supabase.com/dashboard/project/_/auth/url-configuration');
    await page.fill('[name="site_url"]', 'https://inteia.com.br/conecta2026/');
    await page.click('text=Save');

    // === PASSO 7: Criar 3 usuarios ===
    await page.goto('https://supabase.com/dashboard/project/_/auth/users');
    var users = [
        { email: 'silvio2026@conecta.interno', password: 'silvio2026' },
        { email: 'karla2026@conecta.interno', password: 'karla2026' },
        { email: 'igor2026@conecta.interno', password: 'igor2026' }
    ];
    for (var u of users) {
        await page.click('text=Add user');
        await page.click('text=Create new user');
        await page.fill('[name="email"]', u.email);
        await page.fill('[name="password"]', u.password);
        await page.check('[name="autoConfirmUser"]');
        await page.click('text=Create user');
        await page.waitForTimeout(1500);
    }

    // === PASSO 8: Atribuir papeis via SQL ===
    await page.goto('https://supabase.com/dashboard/project/_/sql');
    await page.click('text=New Query');
    await page.fill('.monaco-editor textarea', `
        UPDATE perfis SET papel='admin', nome='Silvio Vieira' WHERE email='silvio2026@conecta.interno';
        UPDATE perfis SET papel='coordenador', nome='Karla Silva' WHERE email='karla2026@conecta.interno';
        UPDATE perfis SET papel='admin', nome='Igor Morais' WHERE email='igor2026@conecta.interno';
    `);
    await page.click('text=Run');

    // === PASSO 9: Ativar backup (ja vem no Pro) ===
    await page.goto('https://supabase.com/dashboard/project/_/settings/backups');
    await expect(page.locator('text=Automatic backups')).toBeVisible();

    console.log('=== SETUP COMPLETO ===');
    console.log('Atualize js/supabase-config.js com URL e KEY acima');
});
```

### 3.2 Procedimento Manual (fallback)

1. https://supabase.com → Login com igormorais123@gmail.com
2. New Project → `conecta-2026`, South America, Pro
3. **IGOR**: Cartao de credito ($25/mes)
4. Settings → API → Copiar URL e anon key
5. SQL Editor → Colar migration.sql → Run
6. Storage → `fotos-campanha` (publico)
7. Auth → Users → 3 usuarios @conecta.interno (auto-confirm)
8. SQL Editor → UPDATEs de papeis
9. Editar `js/supabase-config.js` com credenciais reais

### 3.3 Participacao de Igor

| Passo | Igor necessario? | Motivo |
|-------|-----------------|--------|
| Login Supabase | SIM (1x) | Credenciais pessoais |
| Cartao de credito | SIM (1x) | Dados de pagamento |
| Confirmar email | SIM (se pedido) | Verificacao |
| Todo o resto | NAO | Automatizavel |

---

## FASE 4 — BACKUP AUTOMATICO

### 4.1 Supabase Pro Backup (automatico, incluso)

- Frequencia: diaria
- Retencao: 7 dias
- Restauracao: Dashboard → Settings → Backups → Restore (~5 min)
- Custo: incluso no Pro ($25/mes)

### 4.2 Export JSON Manual (botao no CONECTA.html)

Adicionar botao "Backup" no header do CONECTA.html:

```javascript
async function exportarBackupJSON() {
    var dados = {};
    var tabelas = ['eventos','veiculos','pessoas','lideres','demandas','pesquisas',
                   'juridico','materiais','comunicacao','visitas','tarefas','atividades',
                   'logistica_tarefas','logistica_fornecedores','logistica_equipes','logistica_membros'];

    for (var i = 0; i < tabelas.length; i++) {
        var r = await window.supabase.from(tabelas[i]).select('*');
        dados[tabelas[i]] = r.data || [];
    }

    var blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'backup-conecta-' + new Date().toISOString().slice(0,10) + '.json';
    a.click();
}
```

---

## FASE 5 — INTEGRACAO CONECTA.HTML COMPLETA

Detalhado na Fase 0.6. Complementos adicionais:

### 5.1 Dashboard ampliado
- Secao "Atividades Recentes" (ultimas 10 da tabela atividades)
- Botao "Backup JSON" no header

### 5.2 Botao Backup no header
```html
<button class="btn-header" onclick="exportarBackupJSON()" title="Exportar backup JSON">Backup</button>
```

---

## FASE 6 — INTEGRACAO LOGISTICA COMPLETA

Detalhado na Fase 0.7. Manter dark theme, alinhar tipografia Inter.

---

## FASE 7 — SINCRONIZACAO REALTIME

Ja parcialmente implementado em conecta-db.js. Com a correcao da Fase 0.8, tabelas de logistica tambem recebem updates realtime.

Futuro (opcional): Supabase Presence para mostrar quem esta online.

---

## FASE 8 — SEGURANCA

### 8.1 Auth Guard em TODAS as paginas protegidas

| Pagina | Auth Guard | IA |
|--------|-----------|-----|
| CONECTA.html | SIM | Opus |
| Logistica Campanha.html | SIM | GPT 5.4 |
| Coordenadores Regionais.html | SIM | Gemini |
| qrcode-cartao.html | SIM | Gemini |
| conta.html | SIM | GPT 5.4 |
| login.html | NAO (publica) | — |
| index.html | NAO (redirect) | — |
| cadastro-apoiador.html | NAO (publico) | — |

### 8.2 RLS (Row Level Security)
Ja implementado no migration.sql. Sem acao adicional.

---

## FASE 9 — DEPLOY

### 9.1 Estrutura de arquivos para deploy

```
frontend/public/conecta2026/
    index.html                    [NOVO]
    login.html                    [REESCRITO]
    CONECTA.html                  [MODIFICADO]
    Logistica Campanha.html       [MODIFICADO]
    cadastro-apoiador.html        [MODIFICADO]
    qrcode-cartao.html            [MODIFICADO]
    Coordenadores Regionais.html  [MODIFICADO]
    conta.html                    [NOVO]
    manifest.json                 [NOVO]
    service-worker.js             [NOVO]
    js/
        supabase-config.js        [REESCRITO]
        conecta-db.js             [MODIFICADO]
    icons/
        icon-192.png              [NOVO]
        icon-512.png              [NOVO]
        inteia-logo.svg           [NOVO]
```

### 9.2 vercel.json

```json
{
    "rewrites": [
        { "source": "/conecta2026", "destination": "/conecta2026/index.html" },
        { "source": "/conecta2026/", "destination": "/conecta2026/index.html" }
    ]
}
```

### 9.3 Deploy (Vercel Pro ja contratado)

```bash
cd C:\Agentes
cp -r "C:\Users\IgorPC\.claude\projects\Conecta 2026\"* frontend/public/conecta2026/
git add frontend/public/conecta2026/
git commit -m "CONECTA 2026 v4.0 — integracao Supabase completa"
git push origin main
# Vercel faz deploy automatico
```

---

## FASE 10 — TESTES

| # | Teste | Esperado | IA |
|---|-------|----------|-----|
| 1 | Acesso CONECTA.html sem login | Redirect para login | Opus |
| 2 | Login silvio2026 + senha | Entra no CONECTA | Opus |
| 3 | Username invalido | Erro "nao autorizado" | Opus |
| 4 | Senha errada | Erro "incorreta" | Opus |
| 5 | Silvio cria evento, Karla ve | Dados compartilhados | GPT 5.4 |
| 6 | Realtime < 2s | Auto-update | GPT 5.4 |
| 7 | Tarefa logistica sync | Compartilha | GPT 5.4 |
| 8 | Trocar senha | Nova senha funciona | GPT 5.4 |
| 9 | Botao Sair | Logout + redirect | Opus |
| 10 | Cadastro apoiador sem login | Dados no Supabase | Gemini |
| 11 | PWA install mobile | App instala | Gemini |
| 12 | Offline | Cache funciona | Gemini |
| 13 | Backup JSON | Download todos dados | Opus |
| 14 | Credenciais placeholder | Banner vermelho | Gemini |
| 15 | Mobile layout | Sidebar drawer | Gemini |
| 16 | /conecta2026/ | Redirect login | Gemini |
| 17 | Sidebar Logistica | Abre Logistica.html | Opus |

---

## FASE 11 — CREDITOS E BRANDING INTEIA

### 11.1 Logo INTEIA

**Fonte**: `C:\Users\IgorPC\Downloads\inteia-logo-vetorial.svg`
**Destino**: `icons/inteia-logo.svg` (copiar para o projeto)

Usar em:
- Rodape de todas as paginas protegidas
- Tela de login (pequeno, abaixo do formulario)

### 11.2 Rodape padrao (TODAS as paginas protegidas)

```html
<footer style="text-align:center;padding:20px;font-size:0.7rem;color:var(--text-lighter,#999);border-top:1px solid var(--border,#e0e0e0);margin-top:40px;">
    <div style="margin-bottom:4px;">
        <img src="icons/inteia-logo.svg" alt="INTEIA" style="height:24px;vertical-align:middle;margin-right:6px;">
        Implementado por <strong>INTEIA — Inteligencia Estrategica Eleitoral</strong>
    </div>
    <div>Sistema desenvolvido por <strong>Silvio Morais Vieira</strong></div>
</footer>
```

### 11.3 Login — creditos no footer

```html
<div class="login-footer">
    <div style="margin-bottom:8px;">Sistema de campanha — Acesso restrito</div>
    <div style="font-size:0.65rem;color:#999;">
        Implementado por INTEIA — Inteligencia Estrategica Eleitoral<br>
        Sistema desenvolvido por Silvio Morais Vieira
    </div>
</div>
```

### 11.4 Paginas que recebem o rodape

- CONECTA.html
- Logistica Campanha.html
- Coordenadores Regionais.html
- qrcode-cartao.html
- conta.html

---

## FASE 12 — WHATSAPP BUSINESS (Integracao Futura)

> **Status**: Planejamento. Implementar apos go-live do sistema principal.

### 12.1 Objetivo
- Enviar mensagens para apoiadores cadastrados
- Receber mensagens e encaminhar para equipe
- Chatbot FAQ automatico
- Agendamento de mensagens em massa

### 12.2 Stack sugerida
- WhatsApp Business API via Twilio ou Meta Cloud API
- Webhook recebendo mensagens -> Supabase Edge Function -> salva no banco
- Interface no CONECTA.html (nova aba "WhatsApp" na sidebar)

### 12.3 Custo estimado
- Meta Cloud API: gratuito ate 1.000 conversas/mes
- Twilio: ~R$ 0.01/mensagem
- Estimativa: R$ 50-100/mes dependendo do volume

### 12.4 Prerequisitos
- Sistema principal funcionando (Fases 0-10 completas)
- Numero de telefone comercial da campanha
- Conta Meta Business verificada

---

## SKILLS RECOMENDADAS POR FASE

### Skills Omni Skills (instalar via npx)

| Skill | Comando | Fases | Uso |
|-------|---------|-------|-----|
| Architecture | `npx omni-skills --skill architecture` | 0, 5, 6 | Planejar refatoracoes |
| Debugging | `npx omni-skills --skill debugging` | 0, 7, 10 | Isolar bugs de integracao |
| Full-Stack | `npx omni-skills --bundle full-stack` | Todas | Pacote completo |

### Skills locais INTEIA (ja instaladas no Claude Code do Igor)

| Skill | Trigger | Fases | Uso |
|-------|---------|-------|-----|
| Ares Tekhton | `/ares` | 3, 9 | Deploy Vercel, automacao de infra |
| Chrome Browser | `/chrome` | 3, 10 | Automacao setup Supabase e testes |
| Browser Orchestrator | `/browser` | 3, 10 | Orquestrar Playwright |
| Visual Thinking | `/visual-thinking` | 2, 11 | Gerar icones PWA, logo para footer |
| Health Check | `/health-check` | 9, 10 | Diagnostico pre-deploy |

### Skills inference.sh (para assets)

| Skill | Fases | Para que |
|-------|-------|---------|
| `ai-image-generation` / `flux-image` | 2 | Gerar icon-192 e icon-512 PWA |
| `image-upscaling` | 2 | Upscale icones se necessario |
| `background-removal` | 2 | Limpar logo para icone transparente |
| `python-executor` | 3 | Scripts de setup/migracao |

---

## DIVISAO DE TRABALHO ENTRE 3 IAS EM PARALELO

### Perfil de cada IA

| IA | Ferramenta | Perfil | Forte em | Fraco em |
|----|-----------|--------|----------|----------|
| **Claude Opus 4.5** | Claude Code | Criativo, bom com ferramentas, rapido | Redesign, integracao, PWA, branding, browser | — |
| **GPT 5.4** | Codex | Metodico, rigoroso, detalhista, mais lento | Logica critica, sync, auth, bugs complexos | Demora mais |
| **Gemini 3.1** | Antigravity | Inteligente, critico, implementacao completa | Review, testes, correcoes mecanicas | Pode alucinar detalhes |

### REGRA DE OURO: NENHUMA IA EDITA O MESMO ARQUIVO QUE OUTRA (no mesmo lote)

Para evitar conflitos de merge, cada IA trabalha em arquivos exclusivos dentro de cada lote.

---

### LOTE 1 — Correcoes Criticas (executar PRIMEIRO, 3 IAs em paralelo)

```
┌─────────────────────────────────────────────────────────────────┐
│  LOTE 1 — Fase 0 (Correcoes Criticas)                          │
│  3 IAs em paralelo. Cada uma edita arquivos EXCLUSIVOS.         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  GPT 5.4 (Codex) — JS CORE + AUTENTICACAO                      │
│  ├─ 0.1  Reescrever js/supabase-config.js                      │
│  ├─ 0.8  Atualizar js/conecta-db.js (logistica + sync arrays)  │
│  ├─ 0.2  Reescrever login.html (username auth)                 │
│  └─ 0.4  Criar conta.html (NOVO)                               │
│  Arquivos EXCLUSIVOS: supabase-config.js, conecta-db.js,       │
│                       login.html, conta.html                    │
│                                                                 │
│  Gemini 3.1 (Antigravity) — FIXES SIMPLES + DOCS               │
│  ├─ 0.3  Criar index.html (NOVO, trivial)                      │
│  ├─ 0.5  Corrigir URLs em qrcode-cartao.html                   │
│  ├─ 0.9  Corrigir cadastro-apoiador.html (remover duplicacao)   │
│  └─ 0.10 Reescrever setup/SETUP.md                             │
│  Arquivos EXCLUSIVOS: index.html, qrcode-cartao.html,          │
│                       cadastro-apoiador.html, setup/SETUP.md    │
│                                                                 │
│  Claude Opus (Claude Code) — PWA ASSETS (preparacao)            │
│  ├─ Criar manifest.json (NOVO)                                  │
│  ├─ Criar service-worker.js (NOVO)                              │
│  ├─ Gerar icones PWA (icons/)                                   │
│  └─ Copiar inteia-logo.svg para icons/                          │
│  Arquivos EXCLUSIVOS: manifest.json, service-worker.js, icons/  │
│                                                                 │
│  NENHUM CONFLITO: cada IA toca arquivos diferentes.             │
└─────────────────────────────────────────────────────────────────┘
```

**CHECKPOINT apos Lote 1**: Fazer merge. Validar que login funciona com username.

---

### LOTE 2 — Integracao + Redesign (apos Lote 1, 3 IAs em paralelo)

```
┌─────────────────────────────────────────────────────────────────┐
│  LOTE 2 — Fases 0.6, 0.7, 1, 2, 8, 11                         │
│  Depende do Lote 1 completo (merge feito).                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Claude Opus — CONECTA.HTML (arquivo principal)                  │
│  ├─ 0.6  Integrar Supabase (scripts, sidebar, auth guard)      │
│  ├─ 1.x  Redesign visual                                       │
│  ├─ 2.3  Meta tags PWA no head                                 │
│  ├─ 4.2  Botao backup JSON                                     │
│  ├─ 5.x  Dashboard ampliado                                    │
│  └─ 11.2 Rodape INTEIA + Silvio                                │
│  Arquivo EXCLUSIVO: CONECTA.html                                │
│                                                                 │
│  GPT 5.4 (Codex) — LOGISTICA (arquivo grande/complexo)          │
│  ├─ 0.7  Integrar Supabase (scripts, auth guard, voltar)       │
│  ├─ 2.3  Meta tags PWA no head                                 │
│  └─ 11.2 Rodape INTEIA + Silvio                                │
│  Arquivo EXCLUSIVO: Logistica Campanha.html                     │
│                                                                 │
│  Gemini 3.1 — PAGINAS SECUNDARIAS                               │
│  ├─ 8.1  Auth guard Coordenadores Regionais.html               │
│  ├─ 8.1  Auth guard qrcode-cartao.html (complementar 0.5)      │
│  ├─ 2.3  Meta tags PWA em ambas                                │
│  ├─ 11.2 Rodape INTEIA + Silvio em ambas                       │
│  └─ 10.x Preparar checklist de testes (documento)              │
│  Arquivos EXCLUSIVOS: Coordenadores Regionais.html,             │
│                       qrcode-cartao.html                        │
│                                                                 │
│  NENHUM CONFLITO: cada IA toca arquivos diferentes.             │
└─────────────────────────────────────────────────────────────────┘
```

**CHECKPOINT apos Lote 2**: Fazer merge. Validar auth guard em todas as paginas.

---

### LOTE 3 — Setup Supabase + Deploy (REQUER IGOR)

```
┌─────────────────────────────────────────────────────────────────┐
│  LOTE 3 — Fases 3, 9 (Setup + Deploy)                          │
│  UMA IA conduz. Igor presente para pagamento.                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Claude Opus (Claude Code) — conduz o setup                     │
│  ├─ 3.x  Setup Supabase via Playwright/Chrome                  │
│  ├─ 3.5  Inserir credenciais reais em supabase-config.js       │
│  ├─ 9.x  Deploy no Vercel (Pro, ja contratado)                 │
│  └─ 4.1  Verificar backup automatico                           │
│  IGOR: Cartao de credito + confirmar email (5 min presenca)    │
│                                                                 │
│  GPT 5.4 + Gemini — REVIEW cruzada                              │
│  Enquanto Opus faz deploy, as outras fazem code review          │
│  do trabalho dos Lotes 1 e 2 de cada uma.                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### LOTE 4 — Testes e Validacao (pos-deploy, 3 IAs em paralelo)

```
┌─────────────────────────────────────────────────────────────────┐
│  LOTE 4 — Fase 10 (Testes)                                      │
│  Cada IA testa area diferente, sem conflito.                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Claude Opus — Testes funcionais                                 │
│  Login, navegacao, sidebar, PWA install, backup JSON             │
│                                                                 │
│  GPT 5.4 — Testes de dados                                      │
│  Sync localStorage<->Supabase, realtime, troca de senha          │
│                                                                 │
│  Gemini 3.1 — Testes de seguranca e mobile                       │
│  Auth guard todas paginas, RLS, layout mobile, credencial vazia  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### INSTRUCOES PARA COPIAR E COLAR EM CADA IA

#### Para GPT 5.4 (Codex) — LOTE 1:
```
Voce e responsavel pelo LOTE 1 do projeto CONECTA 2026.
Repositorio: github.com/silviomvieira-hub/Conecta-2026
Leia PLANO_CONECTA_v4.md para contexto completo.

Suas tarefas:
1. Reescrever js/supabase-config.js (Fase 0.1 do plano)
2. Atualizar js/conecta-db.js (Fase 0.8 — tabelas logistica + sync arrays + URLs)
3. Reescrever login.html (Fase 0.2 — username auth silvio2026/karla2026/igor2026)
4. Criar conta.html (Fase 0.4 — trocar senha, perfil, logout)

REGRAS:
- NAO edite: CONECTA.html, Logistica Campanha.html, qrcode-cartao.html, cadastro-apoiador.html, index.html, SETUP.md
- Use /conecta2026/ em TODAS as URLs (NAO /conecta/)
- Rodape: "Implementado por INTEIA — Inteligencia Estrategica Eleitoral" + "Sistema desenvolvido por Silvio Morais Vieira"
- Senha inicial = username (silvio2026 etc)
- Commit em portugues

Apos terminar, faca commit e push para main.
```

#### Para Gemini 3.1 (Antigravity) — LOTE 1:
```
Voce e responsavel pelo LOTE 1 do projeto CONECTA 2026.
Repositorio: github.com/silviomvieira-hub/Conecta-2026
Leia PLANO_CONECTA_v4.md para contexto completo.

Suas tarefas:
1. Criar index.html (Fase 0.3 — redirect simples para login.html)
2. Corrigir URLs em qrcode-cartao.html (Fase 0.5 — /conecta/ -> /conecta2026/)
3. Corrigir cadastro-apoiador.html (Fase 0.9 — remover script Supabase duplicado, adicionar <script src="js/supabase-config.js"> ANTES do formulario)
4. Reescrever setup/SETUP.md (Fase 0.10 — refletir username auth, URLs corretas, Supabase Pro)

REGRAS:
- NAO edite: CONECTA.html, Logistica Campanha.html, login.html, conta.html, supabase-config.js, conecta-db.js
- Use /conecta2026/ em TODAS as URLs
- Creditos onde aplicavel: INTEIA + Silvio Morais Vieira
- Commit em portugues

Apos terminar, faca commit e push para main.
```

#### Para Claude Opus (Claude Code) — LOTE 1:
```
Enquanto GPT 5.4 e Gemini fazem correcoes, voce prepara assets PWA.

Suas tarefas:
1. Criar manifest.json na raiz (Fase 2.1 do PLANO_CONECTA_v4.md)
2. Criar service-worker.js na raiz (Fase 2.2)
3. Criar pasta icons/ e gerar icon-192.png e icon-512.png (logo INTEIA sobre fundo #1a237e)
4. Copiar C:\Users\IgorPC\Downloads\inteia-logo-vetorial.svg para icons/inteia-logo.svg

NAO edite nenhum arquivo .html ou .js existente neste lote.

Apos terminar, faca commit e push para main.
```

---

## CRONOGRAMA E DEPENDENCIAS

```
SEMANA 1:
  Dia 1-2: LOTE 1 (3 IAs em paralelo — correcoes criticas + PWA assets)
  Dia 3:   CHECKPOINT — merge, validar login com username
  Dia 3-5: LOTE 2 (3 IAs em paralelo — integracao CONECTA/Logistica/Secundarias)

SEMANA 2:
  Dia 1:   LOTE 3 (Setup Supabase — Igor presente ~15 min para pagamento)
  Dia 2:   Deploy no Vercel
  Dia 3-4: LOTE 4 (Testes — 3 IAs em paralelo)
  Dia 5:   Go-live

DEPENDENCIAS:
  Lote 1 ──→ Lote 2 (merge obrigatorio)
  Lote 2 ──→ Lote 3 (codigo pronto antes de deploy)
  Lote 3 ──→ Lote 4 (Supabase real necessario para testes)
```

### Diagrama visual

```
Dia 1-2:   [GPT 5.4: JS+Login+Conta] [Gemini: Index+Fixes+Docs] [Opus: PWA Assets]
               ↓                           ↓                          ↓
Dia 3:     ======================== MERGE + CHECKPOINT ========================
               ↓                           ↓                          ↓
Dia 3-5:   [GPT 5.4: Logistica]    [Gemini: Coord+QR+Testes]   [Opus: CONECTA.html]
               ↓                           ↓                          ↓
Dia 6:     ======================== MERGE + CHECKPOINT ========================
               ↓
Dia 7:     [Opus: Setup Supabase + Deploy] (Igor ~15 min)
               ↓
Dia 8-9:   [Opus: Tests func]  [GPT 5.4: Tests dados]  [Gemini: Tests seg]
               ↓
Dia 10:    ========================== GO-LIVE ==========================
```

---

## DECISOES PENDENTES

| # | Decisao | Opcoes | Impacto |
|---|---------|--------|---------|
| D1 | Incluir cadastro Valdelino? | Mesmo sistema / Separado | Escopo |
| D2 | Dominio conecta2026.com.br? | Sim / Nao (inteia.com.br/conecta2026) | DNS, custo |
| D3 | Emails @conecta.interno ou reais? | Interno (sem recuperacao) / Real | Recuperacao de senha |
| D4 | WhatsApp Business — quando? | Apos go-live / Nunca | Fase 12 |

---

## METRICAS DE SUCESSO

- [ ] 3 usuarios fazem login por username
- [ ] Dados sincronizam entre usuarios em < 2 segundos
- [ ] Sistema funciona em inteia.com.br/conecta2026
- [ ] PWA instalavel em mobile
- [ ] Backup automatico diario ativo (Supabase Pro)
- [ ] 18 tabelas sincronizando (incluindo 4 de logistica)
- [ ] Zero paginas protegidas acessiveis sem login
- [ ] Credenciais em unico arquivo (supabase-config.js)
- [ ] Logo INTEIA e creditos Silvio visiveis em todas as paginas
- [ ] Tempo de carregamento < 3 segundos

---

> **Implementado por INTEIA — Inteligencia Estrategica Eleitoral**
> **Sistema desenvolvido por Silvio Morais Vieira**
> **PLANO CONECTA v4.0 — Consolidado em 27/03/2026**
> **Endereco deste plano**: `C:\Users\IgorPC\.claude\projects\Conecta 2026\PLANO_CONECTA_v4.md`
> **Repositorio**: https://github.com/silviomvieira-hub/Conecta-2026
