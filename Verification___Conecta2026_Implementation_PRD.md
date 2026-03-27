I have the following verification comments after thorough review and exploration of the codebase. Implement the comments by following the instructions in the comments verbatim.

---
The context section for each comment explains the problem and its significance. The fix section defines the scope of changes to make — implement only what the fix describes.

## Comment 1: Login page uses email field instead of username-based auth as user explicitly requested

### Context
The user's core requirement was login by username (`silvio2026`, `karla2026`, `igor2026`) — not by email. The plan specifies mapping usernames to internal emails (e.g., `silvio2026@conecta.interno`) via a `USUARIOS_AUTORIZADOS` map. The current `login.html` still has `<input type='email'>` with label 'E-mail', placeholder 'seu@email.com', and no username-to-email mapping. This fundamentally misaligns with the user's intent — the 3 users won't know what email to type.

### Fix

In `login.html`, change the email input to `type='text'` with `id='username'`, label 'Usuário', and placeholder 'silvio2026, karla2026 ou igor2026'. Add a `USUARIOS_AUTORIZADOS` JavaScript object mapping each username to its internal email (`silvio2026@conecta.interno`, etc.). In the submit handler, look up the typed username in this map before calling `signInWithPassword` with the mapped email. Show 'Usuário não autorizado' if the username isn't in the map.

### Referred Files
- c:\Users\IgorPC\.claude\projects\Conecta 2026\login.html
---
## Comment 2: REDIRECT_URL and all path references use /conecta/ instead of /conecta2026/ as user specified

### Context
The user explicitly requested the system at `inteia.com.br/conecta2026`. The `login.html` `REDIRECT_URL` is `/conecta/`, the magic link redirect is `/conecta/`, `conecta-db.js` logout redirects to `/conecta/login.html`, and `SETUP.md` references `/conecta/` throughout. After login, users would be redirected to the wrong path, resulting in a 404.

### Fix

Update `REDIRECT_URL` in `login.html` from `/conecta/` to `/conecta2026/`. Update `ConectaDB.logout()` in `js/conecta-db.js` from `/conecta/login.html` to `/conecta2026/login.html`. Update `ConectaDB.loginMagicLink()` redirect URL from `/conecta/` to `/conecta2026/`. Update all references in `setup/SETUP.md` from `/conecta/` to `/conecta2026/`.

### Referred Files
- c:\Users\IgorPC\.claude\projects\Conecta 2026\login.html
- c:\Users\IgorPC\.claude\projects\Conecta 2026\js\conecta-db.js
- c:\Users\IgorPC\.claude\projects\Conecta 2026\setup\SETUP.md
---
## Comment 3: CONECTA.html has no Supabase integration — scripts not loaded, no auth guard

### Context
The main application page `CONECTA.html` does not include `<script src='js/supabase-config.js'>` or `<script src='js/conecta-db.js'>` anywhere. This means: (1) the ConectaDB sync layer is never initialized, so all data stays in localStorage only — defeating the multi-user sync requirement; (2) there's no auth guard, so anyone with the URL sees all campaign data without logging in; (3) the realtime subscriptions never activate, so changes by one user are invisible to others. This breaks the core requirement that 'tudo cadastrado seja automaticamente salvo e visível por todas as contas'.

### Fix

In `CONECTA.html`, add `<script src='js/supabase-config.js'></script>` and `<script src='js/conecta-db.js'></script>` in the `<head>` before the closing `</head>` tag. Add an auth guard at the beginning of the main `<script>` block that checks `window.supabase.auth.getSession()` and redirects to `login.html` if no session exists. Add `ConectaDB.init()` call in the initialization flow, before `renderDashboard()` is called.

### Referred Files
- c:\Users\IgorPC\.claude\projects\Conecta 2026\CONECTA.html
---
## Comment 4: Logistica Campanha.html has no Supabase integration or auth guard

### Context
The Logística page — identified in the plan as the 'módulo principal' — has no Supabase scripts loaded, no auth guard, and no data sync to the database. It operates entirely on localStorage (`logistica_celina_2026`), meaning data entered here is isolated to the user's browser and invisible to other users. Additionally, the logística localStorage keys are not mapped in `conecta-db.js`'s `TABLES` config, so even if the scripts were loaded, the sync wouldn't cover logística data.

### Fix

In `Logistica Campanha.html`, add `<script src='js/supabase-config.js'></script>` and `<script src='js/conecta-db.js'></script>` in the `<head>`. Add an auth guard that redirects to `login.html` if not authenticated. In `js/conecta-db.js`, add the logística localStorage keys to the `TABLES` map: `'logistica_tarefas'`, `'logistica_materiais'`, `'logistica_fornecedores'`, `'logistica_equipes'` mapped to their corresponding Supabase tables. Also add these tables to the realtime subscriptions array in `setupRealtimeSubscriptions()`.

### Referred Files
- c:\Users\IgorPC\.claude\projects\Conecta 2026\Logistica Campanha.html
- c:\Users\IgorPC\.claude\projects\Conecta 2026\js\conecta-db.js
---
## Comment 5: Magic Link button still present — plan says to remove it for username-only auth

### Context
The login page still shows an 'Entrar com link mágico' button with an 'ou' divider. Since the system uses only 3 fixed usernames with internal `@conecta.interno` emails, Magic Link would send emails to non-existent mailboxes, confusing users and creating a broken UX flow.

### Fix

In `login.html`, remove the `.divider` element and the `btnMagicLink` button from the HTML. Remove the corresponding `btnMagic` click event listener and `spinMagic`/`txtMagic` variable declarations from the JavaScript.

### Referred Files
- c:\Users\IgorPC\.claude\projects\Conecta 2026\login.html
---
## Comment 6: Missing conta.html — password change page required by user was not created

### Context
The user explicitly requested 'opção para trocar senha na configuração da conta'. The plan details a `conta.html` page with password change form, username display, and logout button. This file was not created, and no link to it exists in CONECTA.html's header or sidebar. Without it, users cannot change their default passwords (which equal their usernames — a security concern).

### Fix

Create `conta.html` as specified in the plan: a standalone page with the same visual style as `login.html`, displaying the logged-in username, a password change form (new password + confirm password fields), validation (min 6 chars, match check), calling `supabase.auth.updateUser({ password })`, a logout button, and an auth guard. Add a link to `conta.html` in `CONECTA.html`'s header area (e.g., a '⚙️ Minha Conta' button).

### Referred Files
- c:\Users\IgorPC\.claude\projects\Conecta 2026\login.html
---
## Comment 7: Missing index.html redirect — /conecta2026/ will show directory listing or 404

### Context
The plan requires an `index.html` that redirects to `login.html` so that accessing `inteia.com.br/conecta2026/` takes users to the login page. Without this file, the root URL will either show a directory listing (security risk) or a 404 error, depending on Vercel config.

### Fix

Create `index.html` in the project root with a `<meta http-equiv='refresh' content='0; url=login.html'>` tag and a fallback `window.location.href = 'login.html'` script for immediate redirect to the login page.

### Referred Files
- c:\Users\IgorPC\.claude\projects\Conecta 2026\login.html
---
## Comment 8: syncToSupabase for array-type tables is a no-op — data never actually syncs to Supabase

### Context
In `conecta-db.js`, the `syncToSupabase` function handles `config.type === 'object'` (comunicacao) and `'object-by-cidade'` (visitas), but for `config.type === 'array'` (eventos, veiculos, pessoas, pesquisas, demandas, juridico, materiais, lideres, atividades) — which is the majority of tables — the code only has a comment saying 'The calling code should use saveItem/deleteItem instead' and does nothing. Since `CONECTA.html` calls `localStorage.setItem` with full arrays (via its existing save pattern), the localStorage override intercepts and calls `ConectaDB.set()` → `syncToSupabase()` which silently does nothing for arrays. This means **no array data will ever be written to Supabase** — only read from it if manually seeded.

### Fix

Implement the array sync logic in `syncToSupabase` within `js/conecta-db.js`. For `config.type === 'array'`, compare the new array with the existing cache to determine inserts, updates, and deletes, then issue the corresponding Supabase operations. Alternatively, implement a simpler approach: delete all rows from the table and re-insert the full array (with appropriate batching). A third option is to modify `CONECTA.html`'s save functions to call `ConectaDB.saveItem()` and `ConectaDB.deleteItem()` directly for individual operations instead of saving the full array.

### Referred Files
- c:\Users\IgorPC\.claude\projects\Conecta 2026\js\conecta-db.js
---
## Comment 9: cadastro-apoiador.html has race condition — form uses Supabase before CDN script loads

### Context
In `cadastro-apoiador.html`, the Supabase CDN script is loaded at the bottom of the page via a dynamically created `<script>` tag. If the user fills and submits the form quickly (before the CDN finishes loading), `window._conectaSupabase` will be `undefined`, and the fallback silently saves to localStorage only. There's no loading indicator or retry mechanism, and the user sees 'Cadastro registrado!' thinking the data was saved to the server when it wasn't.

### Fix

In `cadastro-apoiador.html`, move the Supabase CDN `<script>` loading block from the bottom to the `<head>` so it starts loading immediately. Alternatively, add a visual indicator when the Supabase client isn't ready yet (e.g., show a brief 'Conectando...' state), and implement a retry to attempt Supabase insert once the client becomes available instead of immediately falling back to localStorage.

### Referred Files
- c:\Users\IgorPC\.claude\projects\Conecta 2026\cadastro-apoiador.html
---
## Comment 10: supabase-config.js overwrites window.supabase — conflicts with login.html's own Supabase client

### Context
In `js/supabase-config.js`, `window.supabase` is overwritten from the Supabase library namespace (`{createClient}`) to a Supabase client instance. Meanwhile, `login.html` loads the Supabase CDN directly and calls `window.supabase.createClient()` — but if `supabase-config.js` is also loaded (or the page order changes), `window.supabase` would already be a client instance, not the library, causing `createClient is not a function` errors. Additionally, `login.html` creates its own separate client (`sb`) that is different from the one in `supabase-config.js`. This dual-initialization pattern is fragile.

### Fix

Standardize all pages to use `js/supabase-config.js` as the single source of Supabase initialization. In `login.html`, remove the direct CDN `<script>` tag and the inline `createClient` call. Instead, add `<script src='js/supabase-config.js'></script>` and listen for the `'supabase-ready'` event to access `window.supabase` (the client). Update the login logic to use `window.supabase.auth.signInWithPassword()` instead of the local `sb` variable.

### Referred Files
- c:\Users\IgorPC\.claude\projects\Conecta 2026\js\supabase-config.js
- c:\Users\IgorPC\.claude\projects\Conecta 2026\login.html
---
## Comment 11: SETUP.md still references generic admin setup instead of the 3 specific users from the plan

### Context
The setup guide says 'Criar primeiro usuário admin' with a generic email placeholder, but the plan specifically requires creating 3 users: `silvio2026@conecta.interno`, `karla2026@conecta.interno`, `igor2026@conecta.interno` with passwords equal to usernames and specific roles (silvio=admin, karla=coordenador, igor=admin). The current SETUP.md won't guide the deployer to create the correct user accounts.

### Fix

Update `setup/SETUP.md` section 6 to specify creating the 3 required users with their exact emails (`silvio2026@conecta.interno`, `karla2026@conecta.interno`, `igor2026@conecta.interno`), default passwords (`silvio2026`, `karla2026`, `igor2026`), and the SQL to set their roles. Update the URL references throughout from `/conecta/` to `/conecta2026/`.

### Referred Files
- c:\Users\IgorPC\.claude\projects\Conecta 2026\setup\SETUP.md
---