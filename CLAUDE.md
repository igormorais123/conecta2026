# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projeto

Sistema web da campanha **CONECTA Celina Leão 2026** — conjunto de páginas HTML standalone para gestão de campanha política no Distrito Federal.

- **Repositório**: https://github.com/silviomvieira-hub/Conecta-2026
- **Branch principal**: main

## Regra de Sincronização Automática

Sempre que qualquer arquivo for criado ou alterado neste projeto:
1. `git add` dos arquivos modificados
2. Commit com mensagem descritiva em português
3. `git push origin main` automaticamente
4. **Não perguntar antes de fazer push** — o push é sempre automático após qualquer alteração

## Deploy Automático

O deploy é contínuo via **Vercel** conectado ao GitHub:
- Cada `git push origin main` dispara deploy automático no Vercel
- O site fica disponível em: **https://inteia.com.br/conecta2026/**
- `vercel.json` contém rewrites de `/conecta2026` → `index.html`
- **Qualquer alteração pushada aqui vai direto para produção** — não há ambiente de staging

## Stack e Convenções

- **HTML5 + CSS3 + JavaScript puro** — sem frameworks, sem bundlers, sem build step
- Cada arquivo `.html` é uma aplicação standalone (CSS e JS inline, tudo num único arquivo)
- Fontes via Google Fonts CDN (Inter principal, Segoe UI fallback)
- Persistência local via `localStorage` (chave prefixada `conectacelina_`)
- Sem servidor backend — única exceção: `cadastro-apoiador.html` faz `fetch` para `/api/cadastros`
- Todos os textos em **português brasileiro**
- Mensagens de commit em **português brasileiro**

## Arquitetura

### Página principal: CONECTA.html (~217KB)
Aplicação SPA-like com sidebar + múltiplas seções (dashboard, organograma, equipe de campo, tarefas). Usa variáveis CSS em `:root` com paleta `--primary: #1a237e` / `--accent: #ff6f00`. Estado global gerenciado via `localStorage` com prefixo `STORAGE_KEY`.

### Páginas de cadastro
- **cadastro-apoiador.html** — formulário público mobile-first para apoiadores. Paleta azul/dourado (`--azul: #1B3A5C`, `--dourado: #D4A843`). Envia dados via fetch API.
- **Cadastro - lideres 2026.htm** — cadastro de líderes para Valdelino Barcelos (candidato separado). Paleta verde (`#1B5E20`). CSS minificado com classes curtas (`.ct`, `.hd`, `.bd`, `.ip`). Usa radio/checkbox nativos sem JS.

### Páginas operacionais
- **Logistica Campanha.html** — gestão logística com countdown para eleição, fases de campanha, dark theme. Persiste em `localStorage`.
- **Coordenadores Regionais.html** — grid de cards dos coordenadores regionais.
- **qrcode-cartao.html** — gerador de QR code para cartão de visita (usa lib `qrcode-generator` via CDN).

### Arquivos não-web
- **Organograma da Campanha.docx/.pdf** — organograma oficial (documento estático)
- **Coordenadores Regionais - WhatsApp.txt** — contatos dos coordenadores

## Paletas de Cores (atenção ao editar)

As páginas usam paletas de cores **diferentes** entre si:
- CONECTA.html: azul escuro/laranja (`#1a237e` / `#ff6f00`)
- cadastro-apoiador.html e qrcode-cartao.html: azul/dourado (`#1B3A5C` / `#D4A843`)
- Cadastro - lideres 2026.htm: verde (`#1B5E20` / `#2E7D32`) — este é de outro candidato
- Logistica Campanha.html: dark theme azul (`#0f172a` / `#3b82f6`)
- Coordenadores Regionais.html: dark gradient (`#1a1a2e` → `#0f3460`)
