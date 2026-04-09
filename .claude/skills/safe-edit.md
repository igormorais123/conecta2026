---
name: safe-edit
description: Protocolo obrigatório antes de qualquer edição de código
---

# Skill: Safe Edit

## Quando usar
Antes de QUALQUER edição em qualquer arquivo do projeto.

## Protocolo

### 1. Ler o arquivo completo
- Ler o arquivo inteiro antes de propor mudanças
- Para arquivos grandes (>500 linhas), ler por seções

### 2. Verificar dependências
- O arquivo importa ou é importado por outros?
- Usa funções de supabase-config.js ou conecta-db.js?
- Acessa localStorage? Qual chave?

### 3. Verificar paleta de cores
- CONECTA/login/conta: #1a237e / #ff6f00
- cadastro-apoiador/qrcode: #1B3A5C / #D4A843
- Logística: #0f172a / #3b82f6
- Coordenadores: #1a1a2e / #0f3460

### 4. Verificar chaves localStorage
- Não criar novas chaves sem necessidade
- Respeitar STORAGE_KEY existente
- Novos campos devem ter valor default

### 5. Implementar mudança mínima
- Só alterar o necessário
- Não refatorar código adjacente
- Preservar estilo existente (indentação, nomenclatura)

### 6. Testar offline
- A página deve funcionar sem conexão (localStorage)
- Verificar que loadData()/saveData() não quebraram

### 7. Commit e push
- git add (arquivo específico)
- git commit -m "descrição em português"
- git push origin main
