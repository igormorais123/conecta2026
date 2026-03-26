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
3. Para Magic Link: já funciona por padrão
4. Em Authentication → URL Configuration:
   - Site URL: `https://inteia.com.br/conecta/`
   - Redirect URLs: adicione `https://inteia.com.br/conecta/login.html`

## 6. Criar primeiro usuário admin

1. Vá em Authentication → Users
2. Clique "Add user" → "Create new user"
3. Email e senha do admin
4. Após criar, vá em SQL Editor e execute:
```sql
UPDATE perfis SET papel = 'admin' WHERE email = 'SEU-EMAIL@AQUI';
```

## 7. Configurar credenciais no código

Edite os 3 arquivos e substitua os placeholders:

### `js/supabase-config.js`:
```javascript
var SUPABASE_URL = 'https://SEU-PROJETO.supabase.co';
var SUPABASE_ANON_KEY = 'SUA-ANON-KEY';
```

### `login.html`:
```javascript
var SUPABASE_URL = 'https://SEU-PROJETO.supabase.co';
var SUPABASE_ANON_KEY = 'SUA-ANON-KEY-AQUI';
```

### `cadastro-apoiador.html`:
```javascript
var SUPABASE_URL = 'https://SEU-PROJETO.supabase.co';
var SUPABASE_ANON_KEY = 'SUA-ANON-KEY-AQUI';
```

## 8. Deploy

Faça commit e push — o Vercel deploya automaticamente.

```bash
cd C:\Agentes
git add frontend/public/conecta/
git commit -m "Configurar Supabase para CONECTA"
git push origin main
```

## 9. Verificar

1. Acesse https://inteia.com.br/conecta/login.html
2. Faça login com o admin criado no passo 6
3. O sistema deve carregar os dados do Supabase

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
