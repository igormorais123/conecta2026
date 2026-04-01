# CLAUDE.md - Instruções para IA (Claude Code / Codex)

> Este arquivo NÃO é documentação humana. É um conjunto de regras que a IA DEVE seguir ao operar neste repositório.

## Identidade do Projeto

- Nome: CONECTA Celina Leão 2026
- Função: Sistema web de gestão de campanha política - Distrito Federal
- URL Produção: https://inteia.com.br/conecta2026/
- Repo: github.com/silviomvieira-hub/Conecta-2026
- Branch: main (único - deploy direto)
- Dono: Silvio M. Vieira (silviomvieira-hub)

---

## REGRAS ABSOLUTAS (NUNCA VIOLAR)

### 1. Stack Imutável

HTML5 + CSS3 + JavaScript puro. SEM frameworks. SEM bundlers. SEM build step. SEM TypeScript. SEM React/Vue/Svelte/Tailwind. Cada .html é standalone (CSS e JS inline).

### 2. Arquivos Sagrados - NÃO ALTERAR sem ordem explícita

- js/supabase-config.js - config central, auth guard, PWA bootstrap
- js/conecta-db.js - camada de sync localStorage-Supabase (30KB+)
- js/elexion-client.js - cliente da API Elexion via proxy
- setup/migration.sql - schema PostgreSQL completo (18 tabelas + RLS)
- setup/migration_username_login.sql - patch de login por username

Se precisar modificar algum destes: LER o arquivo inteiro ANTES, entender TODAS as dependências, e explicar a mudança ANTES de executar.

### 3. Credenciais - PROTEÇÃO TOTAL

NUNCA exibir, logar ou commitar: Supabase URL/anon key, ELEXION_SERVICE_TOKEN, senhas de usuários (silvio2026, karla2026, igor2026), valores de setup/CREDENCIAIS.md.

### 4. Git - Push Automático

Após QUALQUER alteração de código: git add (arquivos específicos, NUNCA git add .) -> commit em português -> git push origin main. NÃO perguntar antes do push. NUNCA commitar: .env, CREDENCIAIS.md, node_modules/, screenshots.

### 5. Idioma

Todo código, comentários, commits, mensagens: PORTUGUÊS BRASILEIRO.

---

## AMBIENTE LOCAL DO SILVIO

### Pasta de trabalho no PC do Silvio

C:\Users\VAIO\Documents\CAMPANHA\CONECTA\

Este é o diretório onde o Silvio edita localmente. É o repositório git clonado. Alterações aqui devem ser commitadas e pushadas para o site atualizar.

### Arquivo PRIORITÁRIO: Logística Campanha.html

Este é o arquivo que o Silvio mais usa e atualiza. Quando pedir melhorias, COMEÇAR por este arquivo.

- Local: C:\Users\VAIO\Documents\CAMPANHA\CONECTA\Logistica Campanha.html
- No repo: Logistica Campanha.html (raiz)
- Tamanho: ~3115 linhas, standalone (CSS + JS inline)
- Theme: Dark mode (--bg: #0f172a, --accent: #3b82f6)

#### 16 Módulos de Navegação

| Módulo | Descrição |
|--------|----------|
| Dashboard | Estatísticas agregadas + countdown eleição 04/10/2026 |
| Tarefas | CRUD com fase (pré/campanha/ambas), prioridade, status |
| Materiais | Inventário: pedido vs estoque vs distribuído vs mínimo |
| Fornecedores | Cadastro com status |
| Equipe | Equipes com membros aninhados (array membros[]) |
| Subcoordenadoras | 6 áreas fixas (HTML hardcoded), só nomes salvos |
| Calendário | Datas eleitorais (hardcoded) |
| Checklist | 37 itens hardcoded + customizados |
| Eleitorado DF | Dados demográficos (2.853.835 eleitores TRE-DF) |
| Agenda Salas | Reserva com detecção de conflito |
| Orçamento | Itens de orçamento |
| Distribuição | Registro por região |
| Vales Combustíveis | Controle (placa, motorista, litros, valor) |
| Ativos na Rua | Logística reversa: materiais em campo + devolução |
| Eventos/Bandeiraços | Escala com detecção de conflito |
| Patrimônio | Inventário patrimonial completo |

#### localStorage - CHAVE ÚNICA: logistica_celina_2026

JSON blob com estrutura:
tarefas, materiais, fornecedores, equipe, subcoords, checklist, customChecklist, agendaSalas, orcamento, distribuicao, vales_combustivel, logistica_reversa, escala_bandeiracos, patrimonio, nextId

#### REGRAS para Logística Campanha.html

1. NUNCA quebrar loadData()/saveData()
2. NUNCA mudar STORAGE_KEY 'logistica_celina_2026'
3. Novo módulo: array em defaultData() + nav button + render function
4. Manter dark theme (variáveis CSS existentes)
5. Novos campos DEVEM ter valor default
6. Material retornável: saveDistribuicao() auto-cria logistica_reversa
7. renderReversa() auto-atualiza Atrasado/Perdido
8. Preservar detecção de conflito em agendaSalas e bandeiraços

#### Fluxo de Atualização

Silvio edita localmente -> Claude Code aplica skill safe-edit -> git add + commit + push -> deploy automático

---

## ARQUITETURA - Mapa do Sistema

### Páginas:
index.html (redirect) -> login.html -> CONECTA.html, Logistica Campanha.html (PRIORITÁRIO), conta.html, Coordenadores Regionais.html, qrcode-cartao.html
cadastro-apoiador.html (PÚBLICO)

### Scripts: supabase-config.js, conecta-db.js, elexion-client.js

### Paletas:
| Contexto | Primária | Accent |
|----------|----------|--------|
| CONECTA/login/conta | #1a237e | #ff6f00 |
| cadastro-apoiador/qrcode | #1B3A5C | #D4A843 |
| Logística | #0f172a | #3b82f6 |
| Coordenadores | #1a1a2e | #0f3460 |

### Usuários: silvio2026 (admin), karla2026 (coordenador), igor2026 (admin). Login por USERNAME.

### Deploy: git push origin main -> auto-deploy em https://inteia.com.br/conecta2026/

---

## PROBLEMAS CONHECIDOS

1. Recursão em conecta-db.js: override de localStorage.setItem() pode causar loop
2. syncToSupabase() não sincroniza arrays
3. Chaves órfãs: coordSegmentosSociais e organograma_lista_completa fora do mapeamento
4. Logística vs schema: algumas chaves não casam com o banco
5. Fila offline: replay precisa homologação

---

## SKILLS DISPONÍVEIS

Skills em .claude/skills/:
| Skill | Quando usar |
|-------|------------|
| safe-edit | Antes de QUALQUER edição |
| improve-page | Melhorias visuais/UX/funcionais |
| deploy-check | Após push, verificar site |
| new-page | Criar nova página HTML |
| sync-debug | Problemas de sync |
| backup-before-change | Snapshot antes de mudanças grandes |
| supabase-schema | Consultar banco |
