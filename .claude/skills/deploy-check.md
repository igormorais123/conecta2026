---
name: deploy-check
description: Verificação pós-deploy do site em produção
---

# Skill: Deploy Check

## Quando usar
Após qualquer git push origin main.

## Protocolo

### 1. Aguardar deploy
- Esperar 30 segundos após o push

### 2. Verificar URLs
Checar HTTP status (esperar 200) para:
- https://inteia.com.br/conecta2026/login.html
- https://inteia.com.br/conecta2026/CONECTA.html
- https://inteia.com.br/conecta2026/cadastro-apoiador.html
- https://inteia.com.br/conecta2026/manifest.json

### 3. Reportar resultado
- Listar status de cada URL
- Se algum retornar erro: alertar imediatamente

### 4. Rollback se necessário
Se o site estiver quebrado:
```
git revert HEAD --no-edit
git push origin main
```
Depois investigar o problema no código revertido.
