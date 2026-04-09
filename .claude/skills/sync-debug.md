---
name: sync-debug
description: Diagnóstico de problemas de sincronização localStorage-Supabase
---

# Skill: Sync Debug

## Quando usar
Quando dados não estão sincronizando entre localStorage e Supabase.

## Arquitetura de sync

```
localStorage  <-->  conecta-db.js  <-->  Supabase (PostgreSQL)
                    (override setItem)    (RLS por user_id)
```

## Protocolo de diagnóstico

### 1. Identificar a chave afetada
- Qual chave localStorage não está sincronizando?
- A chave está no mapeamento de conecta-db.js?

### 2. Verificar mapeamento
conecta-db.js mapeia chaves localStorage para tabelas Supabase.
Chaves conhecidas SEM mapeamento (problemas conhecidos):
- coordSegmentosSociais
- organograma_lista_completa

### 3. Verificar RLS
- Tabelas usam Row Level Security por user_id
- Verificar se o usuário tem permissão na tabela

### 4. Verificar fila offline
- conecta-db.js mantém fila de operações offline
- Se o dispositivo estava offline, verificar se a fila foi processada
- ATENÇÃO: replay da fila offline ainda não foi homologado

### 5. Problema de recursão
- conecta-db.js faz override de localStorage.setItem()
- Isso pode causar loop infinito se setItem chama syncToSupabase que chama setItem
- Verificar stack trace no console

### 6. Arrays não sincronizam
- syncToSupabase() atualmente NÃO sincroniza valores que são arrays
- Se o valor é um array, precisa de tratamento especial
