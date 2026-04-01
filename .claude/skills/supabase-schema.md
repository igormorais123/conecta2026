---
name: supabase-schema
description: Referência do schema Supabase (PostgreSQL) do projeto
---

# Skill: Supabase Schema

## Quando usar
Para consultar estrutura do banco, tabelas, RLS ou mapeamento.

## Fonte da verdade
- setup/migration.sql - Schema completo (18 tabelas + RLS)
- setup/migration_username_login.sql - Patch de login por username

## Tabelas principais

| Tabela | Descrição |
|--------|----------|
| perfis | Perfil do usuário (username, role, nome) |
| eventos | Eventos de campanha |
| veiculos | Frota da campanha |
| pessoas | Cadastro de apoiadores |
| lideres | Líderes comunitários |
| equipes | Equipes de campanha |
| tarefas | Tarefas com fase e prioridade |
| materiais | Inventário de materiais |
| fornecedores | Cadastro de fornecedores |
| orcamento | Itens de orçamento |
| distribuicao | Registro de distribuição |
| agenda_salas | Reserva de salas |
| vales_combustivel | Controle de combustível |
| logistica_reversa | Materiais em campo |
| escala_bandeiracos | Escala de bandeiraços |
| patrimonio | Inventário patrimonial |
| coordenadores_regionais | Coordenadores por RA |
| config_app | Configurações do app |

## RLS (Row Level Security)
- Todas as tabelas usam RLS habilitado
- Política padrão: usuário só vê/edita seus próprios dados (user_id = auth.uid())
- Admin vê tudo

## Mapeamento localStorage -> Supabase
conecta-db.js mapeia chaves do localStorage para tabelas.
Consultar o arquivo para mapeamento exato.

## Como adicionar nova tabela
1. Criar migration SQL em setup/
2. Adicionar mapeamento em conecta-db.js
3. Adicionar RLS policy
4. Adicionar default em defaultData() do HTML correspondente
5. Testar sync bidirecional
