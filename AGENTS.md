# AGENTS.md - Instruções para Agentes de IA

> Versão resumida do CLAUDE.md. Para detalhes completos, consulte CLAUDE.md.

## Regras Essenciais

- **Stack**: HTML5 + CSS3 + JavaScript puro. SEM frameworks, SEM bundlers, SEM build step.
- **Push automático**: Após qualquer alteração de código -> git add (arquivos específicos) -> commit em português -> git push origin main.
- **Credenciais protegidas**: NUNCA exibir, logar ou commitar Supabase keys, tokens ou senhas.
- **Paleta por página**: Cada página tem sua própria paleta de cores. Consultar tabela em CLAUDE.md.
- **Arquivos sagrados**: js/supabase-config.js, js/conecta-db.js, js/elexion-client.js, setup/migration.sql, setup/migration_username_login.sql. LER inteiro antes de alterar.
- **Idioma**: Português brasileiro em todo código, comentários, commits e mensagens.
- **Skills**: Disponíveis em .claude/skills/ - usar safe-edit antes de qualquer edição.

## Arquivo Prioritário

Logistica Campanha.html - Standalone, ~3115 linhas, dark mode. 16 módulos. localStorage key: logistica_celina_2026.

## Deploy

git push origin main -> auto-deploy em https://inteia.com.br/conecta2026/
