---
name: backup-before-change
description: Snapshot de segurança antes de mudanças grandes
---

# Skill: Backup Before Change

## Quando usar
Antes de mudanças estruturais, migrações ou alterações em arquivos sagrados.

## Protocolo

### 1. Criar tag git
```
git tag backup-YYYYMMDD-HHMM
git push origin backup-YYYYMMDD-HHMM
```
Usar data/hora atual no nome da tag.

### 2. Documentar estado atual
- Anotar quais arquivos serão alterados
- Anotar estado atual do localStorage (chaves e estrutura)
- Anotar versão atual do schema se aplicável

### 3. Prosseguir com safe-edit
- Aplicar skill safe-edit normalmente
- Cada alteração em commit separado

### 4. Instruções de rollback
Se algo der errado:
```
git revert HEAD --no-edit
git push origin main
```

Para rollback completo até o backup:
```
git revert --no-commit HEAD..backup-YYYYMMDD-HHMM
git commit -m "rollback: revertendo para estado anterior"
git push origin main
```

### 5. Limpeza
Após confirmar que tudo funciona (deploy-check):
- Tag pode ser removida após 7 dias
- Ou manter indefinidamente se foi mudança crítica
