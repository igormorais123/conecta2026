# CLAUDE.md

Instruções para o Claude Code que trabalha neste repositório.

## Projeto

Sistema web da campanha **CONECTA Celina Leão 2026** — páginas HTML standalone para gestão de campanha política no Distrito Federal.

- **Repositório fonte**: https://github.com/silviomvieira-hub/Conecta-2026
- **Site em produção**: https://inteia.com.br/conecta2026
- **Branch principal**: main
- **Criador**: Silvio Morais Vieira
- **Suporte técnico**: Igor Morais (igormorais123@gmail.com)

## REGRA OBRIGATÓRIA: Publicar Automaticamente

**Sempre que qualquer arquivo for criado ou alterado neste projeto, FAÇA AUTOMATICAMENTE:**

```
git add -A
git commit -m "descrição clara do que mudou em português"
git push origin main
```

- **NUNCA perguntar** antes de fazer commit ou push — é SEMPRE automático
- **Mensagens de commit** devem ser em português brasileiro, curtas e claras
- Exemplo: `"adicionar seção de patrimônio na logística"`, `"corrigir botão de salvar no cadastro"`
- Após o push, o site em **inteia.com.br/conecta2026** atualiza sozinho em ~5 minutos

## Como Funciona o Deploy (não precisa fazer nada)

1. Silvio edita os arquivos aqui com o Claude Code
2. O Claude Code faz commit e push automaticamente (regra acima)
3. Um robô no GitHub detecta as mudanças a cada 15 minutos
4. O robô copia os arquivos para o servidor da INTEIA
5. O site atualiza sozinho — **zero ação manual necessária**

## Stack e Convenções

- **HTML5 + CSS3 + JavaScript puro** — sem frameworks, sem bundlers
- Cada arquivo `.html` é independente (CSS e JS inline, tudo num arquivo só)
- Fontes via Google Fonts CDN (Inter principal, Segoe UI fallback)
- Dados salvos no navegador via `localStorage` (prefixo `conectacelina_`)
- Banco de dados online: Supabase (já configurado em `js/supabase-config.js`)
- Todos os textos em **português brasileiro**

## Arquivos do Sistema

### Página principal: CONECTA.html
Dashboard completo com sidebar, organograma, equipe de campo, tarefas, gamificação, mapa de cobertura e war room. Paleta azul/laranja (`#1a237e` / `#ff6f00`).

### Páginas de cadastro
- **cadastro-apoiador.html** — formulário para apoiadores (azul/dourado)
- **Cadastro - lideres 2026.htm** — cadastro de líderes do Valdelino (verde) — candidato separado

### Páginas operacionais
- **Logistica Campanha.html** — gestão logística + patrimônio (dark theme azul)
- **Coordenadores Regionais.html** — cards dos coordenadores regionais
- **qrcode-cartao.html** — gerador de QR code para cartão de visita
- **login.html** — tela de login do sistema
- **conta.html** — gerenciamento de conta do usuário
- **index.html** — redirecionador para login

### Configurações (pasta js/)
- **js/supabase-config.js** — conexão com banco de dados
- **js/conecta-db.js** — funções de banco de dados
- **js/elexion-client.js** — integração com plataforma Elexion

## Paletas de Cores (ATENÇÃO ao editar)

Cada página tem sua própria paleta — **não misturar**:
- CONECTA.html: azul escuro/laranja (`#1a237e` / `#ff6f00`)
- cadastro-apoiador.html e qrcode-cartao.html: azul/dourado (`#1B3A5C` / `#D4A843`)
- Cadastro - lideres 2026.htm: verde (`#1B5E20`) — outro candidato
- Logistica Campanha.html: dark theme (`#0f172a` / `#3b82f6`)
- Coordenadores Regionais.html: dark gradient (`#1a1a2e` → `#0f3460`)

## Para Testar Localmente

Basta abrir qualquer arquivo `.html` no navegador (duplo clique). Não precisa de servidor.

## Se Algo Der Errado

- Se o push falhar: verificar se está conectado à internet e tentar de novo
- Se o site não atualizar em 20 minutos: avisar Igor (igormorais123@gmail.com)
- Se der erro no código: o Claude Code pode corrigir, basta descrever o problema
