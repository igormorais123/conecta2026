---
name: deploy
description: Publicar alteracoes no site inteia.com.br/conecta2026
triggers:
  - coloca no ar
  - bota no ar
  - publica
  - deploy
  - manda pro site
  - coloca isso no site
  - atualiza o site
  - sobe isso
---

# Skill: Deploy (Coloca no Ar)

## Quando usar
Sempre que o Silvio pedir para publicar, colocar no ar, fazer deploy, ou qualquer variacao.

## Protocolo

### 1. Verificar se ha alteracoes pendentes
```bash
git status
```

### 2. Se houver alteracoes: commitar e pushar
```bash
git add <arquivos alterados>
git commit -m "descricao em portugues"
git push origin main
```

### 3. Se NAO houver alteracoes mas push pendente:
```bash
git push origin main
```

### 4. Se tudo ja esta pushado:
Informar: "Ja esta no ar. Ultimo push: [hash do commit]"

### 5. Confirmar
Responder de forma curta:
- "Pronto, pushado. Site atualiza em alguns minutos."
- Se o webhook estiver configurado: "Pronto, deploy disparado. Site atualiza em 1-2 minutos."

## REGRAS
- NUNCA perguntar "tem certeza?" — so fazer
- NUNCA dar explicacao longa sobre o processo de deploy
- Ser direto e rapido
- Usar `git add` com arquivos especificos (NUNCA `git add .`)
