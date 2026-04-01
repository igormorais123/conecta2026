---
name: new-page
description: Template para criar nova página HTML no projeto
---

# Skill: New Page

## Quando usar
Quando precisar criar uma nova página HTML.

## Template base

Toda nova página DEVE conter:

### Estrutura obrigatória
1. DOCTYPE html + lang="pt-BR" + charset UTF-8
2. Meta viewport para mobile
3. Título com prefixo "CONECTA -"
4. CSS inline com variáveis da paleta correta
5. Script src="js/supabase-config.js"
6. Script src="js/conecta-db.js"
7. Chamada CONECTA_APPLY_PWA() no final do body
8. Auth guard: verificar sessão no início

### Paleta de cores
Escolher conforme o contexto:
- Sistema interno: #1a237e / #ff6f00
- Público: #1B3A5C / #D4A843
- Logística: #0f172a / #3b82f6

### Checklist antes do commit
- Página funciona offline (localStorage)
- Auth guard ativo (redireciona para login se não logado)
- Mobile responsivo
- Dark/light conforme contexto
- Links de navegação atualizados nas outras páginas
