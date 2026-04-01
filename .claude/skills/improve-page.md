---
name: improve-page
description: Melhorias visuais, UX e funcionais em páginas existentes
---

# Skill: Improve Page

## Quando usar
Quando o usuário pedir melhorias visuais, de UX ou funcionais em uma página.

## Protocolo

### 1. Identificar a página
- Qual arquivo HTML?
- Se não especificado, assumir Logística Campanha.html (prioritário)

### 2. Entender código existente
- Executar skill safe-edit primeiro
- Mapear CSS variáveis, funções JS, estrutura HTML

### 3. Classificar risco
- **Baixo** (visual): cores, fontes, espaçamento, ícones
- **Médio** (funcional): novos botões, filtros, ordenação
- **Alto** (estrutural): novo módulo, mudança de dados, localStorage

### 4. Implementar minimamente
- Alterar só o necessário
- Manter compatibilidade com dados existentes
- Novos campos com valor default

### 5. Validar
- Visual: cores respeitam paleta da página
- Funcional: loadData()/saveData() intactos
- Responsivo: funciona em mobile

### 6. Commit e push
- Descrever melhoria no commit
