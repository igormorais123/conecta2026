# CONECTA 2026 — Guia de Setup

## 1. Criar projeto no Supabase

1. Acesse https://supabase.com e crie uma conta (grátis)
2. Clique "New Project"
3. Nome: `conecta-2026`
4. Região: South America (São Paulo)
5. Crie uma senha para o banco (guarde em local seguro)
6. Aguarde ~2 minutos para o projeto ser provisionado

## 2. Obter credenciais

1. No Supabase Dashboard, vá em Settings → API
2. Copie:
   - **Project URL**: `https://xxx.supabase.co`
   - **anon public key**: `eyJ...` (é segura para usar no frontend)

## 3. Executar migração do banco

1. No Supabase Dashboard, vá em SQL Editor
2. Clique "New Query"
3. Cole o conteúdo do arquivo `migration.sql` (que está nesta pasta)
4. Clique "Run"
5. Verifique que todas as 18 tabelas foram criadas em Table Editor

## 4. Configurar Storage (fotos)

1. No Supabase Dashboard, vá em Storage
2. Clique "New Bucket"
3. Nome: `fotos-campanha`
4. Marque "Public bucket"
5. Clique "Create bucket"

## 5. Configurar autenticação

1. No Supabase Dashboard, vá em Authentication → Providers
2. Email está habilitado por padrão
3. Para Magic Link: desativar (não usaremos magic links neste projeto)
4. Em Authentication → URL Configuration:
   - Site URL: `https://inteia.com.br/conecta2026/`
   - Redirect URLs: adicione `https://inteia.com.br/conecta2026/login.html`

## 6. Criar 3 usuários operacionais iniciais

1. Vá em Authentication → Users
2. Clique "Add user" → "Create new user" (desmarque o Auto Confirm se for forçar mas o recomendado é deixá-los ativados se o e-mail não existir de verdade)
3. Crie os três emails exatos abaixo (gerar senhas fortes por conta e enviá-las a cada um):
   - `silvio2026@conecta.interno`
   - `karla2026@conecta.interno`
   - `igor2026@conecta.interno`
4. Após criar todos, vá em SQL Editor e defina os papéis executando a query abaixo:
```sql
UPDATE perfis SET papel = 'admin' WHERE email = 'silvio2026@conecta.interno';
UPDATE perfis SET papel = 'coordenador' WHERE email = 'karla2026@conecta.interno';
UPDATE perfis SET papel = 'admin' WHERE email = 'igor2026@conecta.interno';
```

## 7. Configurar credenciais no código

Hoje o projeto centraliza as credenciais em um unico arquivo:

### `js/supabase-config.js`
Substitua apenas os dois placeholders abaixo:

```javascript
var supabaseUrl = window.CONECTA_SUPABASE_URL || 'https://SEU-PROJETO.supabase.co';
var supabaseAnonKey = window.CONECTA_SUPABASE_KEY || 'SUA-ANON-KEY';
```

Observacoes:
- `login.html`, `CONECTA.html`, `Logistica Campanha.html`, `conta.html` e `cadastro-apoiador.html` consomem esse arquivo compartilhado; nao replique credenciais neles.
- O login atual usa `username` na interface, mas ainda faz um mapeamento temporario local para os e-mails internos no frontend.
- Para producao, o ideal continua sendo substituir esse fallback por RPC ou Edge Function para resolver `username -> email` fora do navegador.

## 8. Deploy

Faça commit e push no proprio repositorio do projeto.

```bash
cd "C:\Users\IgorPC\.claude\projects\Conecta 2026"
git add .
git commit -m "Configura Supabase do CONECTA 2026"
git push origin main
```

## 9. Verificar

1. Acesse `https://inteia.com.br/conecta2026/login.html`
2. Faça login com um dos usuarios criados no passo 6
3. Confirme que o redirecionamento vai para `CONECTA.html`
4. Acesse tambem `Logistica Campanha.html` e `conta.html` com a sessao ativa
5. Teste `cadastro-apoiador.html` sem login e confirme persistencia no Supabase

## Custos

| Recurso | Plano Free | Limite |
|---------|-----------|--------|
| Banco PostgreSQL | 500 MB | Suficiente para campanha |
| Storage | 1 GB | ~10.000 fotos |
| Auth | 50.000 MAU | Mais que suficiente |
| Realtime | 200 conexões | OK para equipe |
| Bandwidth | 5 GB/mês | OK para dashboard |

## Papéis de usuário

| Papel | Pode ver | Pode editar | Pode excluir |
|-------|---------|-------------|-------------|
| admin | Tudo | Tudo | Tudo |
| coordenador | Tudo | Tudo | Com confirmação |
| operador | Tudo | Cadastros | Não |
| visualizador | Tudo | Nada | Nada |
