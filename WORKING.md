# CONECTA 2026 — Status de Implementacao

> Atualizado: 2026-03-26
> Projeto: Sistema de campanha Celina Leao — migracao para producao online

---

## CONTEXTO

Sistema web de gestao de campanha politica (CONECTA Celina Leao 2026).
Originalmente: 6 arquivos HTML standalone com localStorage.
Objetivo: colocar online em inteia.com.br/conecta com banco de dados real, multi-usuario, autenticacao.

### Repositorios

| Repo | Local | GitHub | Funcao |
|------|-------|--------|--------|
| Conecta-2026 (original Silvio) | `C:\Users\IgorPC\.claude\projects\Conecta 2026` | silviomvieira-hub/Conecta-2026 | Repo original |
| Conecta-2026 (fork Igor) | mesmo diretorio, remote `fork` | igormorais123/Conecta-2026 | Fork com integracoes Supabase |
| pesquisa-eleitoral-df | `C:\Agentes` | igormorais123/pesquisa-eleitoral-df | Vercel deploy (inteia.com.br) |

### Dominio

- **URL alvo**: `inteia.com.br/conecta`
- **Hosting**: Vercel (via repo pesquisa-eleitoral-df em C:\Agentes)
- **Arquivos ficam em**: `C:\Agentes\frontend\public\conecta\`

---

## O QUE JA FOI FEITO

### 1. Analise completa do sistema (FEITO)
- [x] Mapeamento das 6 paginas HTML e suas funcionalidades
- [x] Identificacao de 12 entidades no localStorage
- [x] Diagnostico: sem auth, sem backend, dados presos no navegador

### 2. Plano de arquitetura (FEITO)
- [x] Decisao: Supabase (banco + auth + storage + realtime) + Vercel (hosting)
- [x] Modelagem de 18 tabelas PostgreSQL
- [x] Definicao de 4 papeis (admin, coordenador, operador, visualizador)
- [x] Row Level Security desenhado

### 3. Arquivos criados no fork (FEITO — commitados em igormorais123/Conecta-2026)

| Arquivo | Status | O que faz |
|---------|--------|-----------|
| `js/supabase-config.js` | CRIADO | Carrega client Supabase via CDN. **TEM PLACEHOLDER** |
| `js/conecta-db.js` | CRIADO | Camada de sincronizacao localStorage <-> Supabase com cache e realtime |
| `login.html` | CRIADO | Tela de login (senha + magic link). **TEM PLACEHOLDER** |
| `setup/migration.sql` | CRIADO | Schema completo: 18 tabelas, RLS, triggers, seeds (37 RAs do DF) |
| `setup/SETUP.md` | CRIADO | Guia passo-a-passo de configuracao do Supabase |
| `CONECTA.html` | MODIFICADO | Scripts Supabase injetados + auth check + iframes corrigidos |
| `cadastro-apoiador.html` | MODIFICADO | Insert no Supabase (publico) com fallback localStorage. **TEM PLACEHOLDER** |
| `qrcode-cartao.html` | MODIFICADO | URL corrigida para inteia.com.br/conecta/cadastro-apoiador.html |
| `CLAUDE.md` | MODIFICADO | Documentacao completa da arquitetura e convencoes |

### 4. Correcoes aplicadas (FEITO)
- [x] Iframes quebrados (organograma e agenda) substituidos por placeholders funcionais
- [x] Link do PDF do organograma corrigido
- [x] QR Code apontando para URL de producao
- [x] API fetch /api/cadastros (inexistente) substituida por Supabase + fallback

### 5. Deploy parcial (FEITO — mas REVERTIDO)
- [x] Arquivos copiados para `C:\Agentes\frontend\public\conecta\`
- [x] Commit feito e pushado no pesquisa-eleitoral-df (commit 304f9547)
- [x] vercel.json teve rewrite adicionado para /conecta
- [ ] **PROBLEMA**: as mudancas no C:\Agentes foram revertidas com `git checkout` porque Igor pediu para usar o fork
- [ ] Os arquivos atualizados (com Supabase) foram copiados de volta para C:\Agentes mas NAO foram commitados

---

## O QUE FALTA FAZER

### FASE A — Supabase (BLOQUEANTE — precisa de acao do Igor)

1. [ ] **Criar projeto Supabase** em supabase.com
   - Plano Free
   - Regiao: South America (Sao Paulo) — `sa-east-1`
   - Nome sugerido: `conecta-2026`

2. [ ] **Rodar migration.sql** no SQL Editor do Supabase
   - Arquivo: `setup/migration.sql` (esta no fork)
   - Cria 18 tabelas + RLS + triggers + seeds

3. [ ] **Copiar credenciais** e substituir placeholders em 3 arquivos:
   - `js/supabase-config.js` — linhas 2-3 (SUPABASE_URL e SUPABASE_ANON_KEY)
   - `login.html` — linhas 19-20
   - `cadastro-apoiador.html` — linhas 687-688
   - As credenciais ficam em: Supabase Dashboard > Settings > API

4. [ ] **Criar bucket** `fotos-campanha` no Supabase Storage
   - Dashboard > Storage > New Bucket
   - Marcar como publico

5. [ ] **Criar primeiro usuario admin**
   - Dashboard > Authentication > Users > Add User
   - Email do Igor ou do Silvio
   - Depois rodar SQL para setar papel admin:
   ```sql
   UPDATE perfis SET papel = 'admin' WHERE email = 'EMAIL_AQUI';
   ```

### FASE B — Deploy no Vercel (apos Fase A)

6. [ ] **Commitar arquivos no C:\Agentes** (pesquisa-eleitoral-df)
   - Os arquivos ja estao em `frontend/public/conecta/` (copiados mas nao commitados)
   - Precisa tambem do rewrite no vercel.json:
   ```json
   { "source": "/conecta", "destination": "/conecta/index.html" },
   { "source": "/conecta/", "destination": "/conecta/index.html" }
   ```
   - Push para main → Vercel deploya automaticamente

7. [ ] **Testar URLs** apos deploy:
   - [ ] inteia.com.br/conecta → redireciona para login
   - [ ] inteia.com.br/conecta/login.html → tela de login funciona
   - [ ] inteia.com.br/conecta/cadastro-apoiador.html → formulario publico (sem login)
   - [ ] inteia.com.br/conecta/organograma.pdf → PDF abre
   - [ ] inteia.com.br/conecta/qrcode-cartao.html → QR code aponta para URL correta

### FASE C — Validacao funcional

8. [ ] **Testar fluxo completo**:
   - [ ] Login com magic link
   - [ ] Login com senha
   - [ ] Criar evento e ver se persiste (Supabase, nao localStorage)
   - [ ] Abrir em outro navegador e ver os mesmos dados (multi-usuario)
   - [ ] Cadastro de apoiador (pagina publica) salva no banco
   - [ ] Upload de foto de pessoa

9. [ ] **Criar usuarios para a equipe**
   - Definir quem sao os primeiros usuarios e seus papeis
   - Admin: Igor e/ou Silvio
   - Coordenadores: definir
   - Operadores: equipe de campo

### FASE D — Melhorias futuras (nao bloqueante)

10. [ ] Realtime — quando um usuario edita, outros veem em tempo real (conecta-db.js ja tem o codigo, mas precisa testar)
11. [ ] Migrar dados existentes do localStorage para Supabase (importar JSON)
12. [ ] Organograma interativo (substituir placeholder pelo HTML original ou embeds do PDF)
13. [ ] Agenda integrada (substituir placeholder)
14. [ ] Dashboard com dados reais do banco (contadores, graficos)
15. [ ] Backup automatico (Supabase Pro faz diario, ou script de export)

---

## DECISOES PENDENTES

| # | Decisao | Contexto |
|---|---------|----------|
| D1 | Cadastro de lideres do Valdelino Barcelos entra no mesmo sistema? | Arquivo `Cadastro - lideres 2026.htm` tem paleta verde e candidato diferente |
| D2 | Quem sao os primeiros usuarios e seus papeis? | Necessario para criar perfis apos o Supabase estar rodando |
| D3 | Dominio proprio (conecta2026.com.br) ou manter subpath inteia.com.br/conecta? | Subpath ja funciona, dominio proprio custa ~R$40/ano |

---

## CUSTOS

| Item | Mensal | Nota |
|------|--------|------|
| Supabase Free | R$0 | 500MB banco, 1GB storage, 50K auth |
| Vercel Free | R$0 | Ja em uso |
| Total | R$0 | Ate precisar escalar |
| Supabase Pro (se escalar) | ~R$150 | $25/mes, backup diario |

---

## ARQUIVOS-CHAVE

```
Fork (igormorais123/Conecta-2026):
  CONECTA.html          ← pagina principal (217KB, com Supabase injetado)
  cadastro-apoiador.html ← formulario publico (com Supabase)
  qrcode-cartao.html     ← URL corrigida
  login.html             ← NOVO: tela de login
  js/supabase-config.js  ← NOVO: config Supabase (TEM PLACEHOLDER)
  js/conecta-db.js       ← NOVO: camada de dados
  setup/migration.sql    ← NOVO: schema PostgreSQL completo
  setup/SETUP.md         ← NOVO: guia de configuracao

Deploy (C:\Agentes\frontend\public\conecta\):
  Mesmos arquivos copiados, NAO commitados ainda
```

---

## PARA CONTINUAR

Comando rapido para retomar:
```
"Continuar implementacao do CONECTA 2026 — ler WORKING.md para status"
```

Proximo passo imediato: **Fase A** — criar projeto Supabase e rodar migration.
