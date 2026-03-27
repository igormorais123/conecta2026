# PLANO CONECTA 2026 - v4.1 revisado

> Data de revisao: 27/03/2026
> Status: revisado com base no codigo real do repositorio
> Escopo: colocar o CONECTA Celina Leao 2026 em operacao online, com autenticacao, sincronizacao multiusuario e deploy em `inteia.com.br/conecta2026/`
> Premissa obrigatoria: manter a stack atual (`HTML + CSS + JavaScript puro`, sem framework, sem bundler, sem build step)

---

## 1. Objetivo

Transformar o repositorio atual em uma versao operacional, segura e compartilhada do CONECTA 2026, sem descaracterizar a estrutura de paginas standalone ja existente.

O objetivo de v1 nao e "reescrever tudo". O objetivo e:

- autenticar os 3 usuarios previstos por username;
- garantir que os dados principais do `CONECTA.html` sejam compartilhados entre contas;
- proteger as paginas internas por sessao;
- preservar o formulario publico de apoiadores;
- publicar tudo em `https://inteia.com.br/conecta2026/`;
- deixar o projeto pronto para PWA e refinamento visual depois da base tecnica estar estavel.

---

## 2. Diagnostico validado no repositorio

### 2.1 Estado atual confirmado

- `CONECTA.html` continua sendo a aplicacao principal, com estado salvo em `localStorage` no prefixo `conectacelina_`.
- `Logistica Campanha.html` salva tudo em um unico objeto `logistica_celina_2026`.
- `login.html`, `js/supabase-config.js`, `js/conecta-db.js`, `setup/migration.sql` e `setup/SETUP.md` ja existem, mas ainda estao incompletos.
- `cadastro-apoiador.html` hoje tenta inserir direto no Supabase com credenciais inline e carga tardia do CDN.
- `qrcode-cartao.html` ainda aponta para `/conecta/`.
- O projeto foi pensado para `/conecta2026/`, mas parte da documentacao e do codigo ainda usa `/conecta/`.

### 2.2 Problemas tecnicos que o plano anterior nao tratava com precisao

1. `js/conecta-db.js` hoje tem um problema estrutural de recursao.
   A sobrescrita de `localStorage.setItem()` chama `ConectaDB.set()`, que por sua vez volta a chamar `localStorage.setItem()`. Isso precisa ser corrigido antes de qualquer tentativa de sincronizacao real.

2. `syncToSupabase()` nao implementa a sincronizacao dos tipos `array`.
   Na pratica, a maior parte dos dados do `CONECTA.html` nao sobe para o banco.

3. `CONECTA.html` tem chaves fora do mapeamento atual.
   Alem dos dados no prefixo `conectacelina_`, o arquivo usa:
   - `coordSegmentosSociais`
   - `organograma_lista_completa`
   Essas chaves nao entram na sincronizacao atual.

4. `Logistica Campanha.html` nao casa com o schema atual do banco.
   A tela usa um unico objeto com:
   - `tarefas`
   - `materiais`
   - `fornecedores`
   - `equipe`
   - `subcoords`
   - `checklist`
   - `customChecklist`
   - `agendaSalas`
   - `nextId`

   O `migration.sql` atual, por outro lado, so modela:
   - `logistica_tarefas`
   - `logistica_fornecedores`
   - `logistica_equipes`
   - `logistica_membros`

   Ou seja: o banco nao representa tudo o que a tela realmente salva hoje.

5. `login.html` ainda esta no modelo errado.
   Continua baseado em e-mail e magic link, quando a regra de negocio aprovada e login por username:
   - `silvio2026`
   - `karla2026`
   - `igor2026`

6. O carregamento do Supabase nao esta padronizado.
   `supabase-config.js` sobrescreve `window.supabase` com o client; `login.html` tambem cria client proprio; `cadastro-apoiador.html` cria outro client inline.
   Isso aumenta muito o risco de erro por ordem de carregamento.

7. O plano anterior colocava redesign, PWA e branding cedo demais.
   Esses itens sao importantes, mas nao podem entrar antes de:
   - autenticacao consistente;
   - sincronizacao estavel;
   - rotas corretas;
   - setup documentado.

---

## 3. Ajustes obrigatorios em relacao ao plano anterior

### 3.1 Padrao unico de rota

Toda referencia externa e toda URL absoluta do projeto devem usar:

- base path: `/conecta2026/`
- login: `/conecta2026/login.html`
- app principal: `/conecta2026/CONECTA.html`
- formulario publico: `/conecta2026/cadastro-apoiador.html`

Regra pratica:

- links internos entre arquivos da mesma pasta devem preferir caminho relativo;
- URLs absolutas so devem ser usadas em redirect de auth, QR code e documentacao de deploy.
- o helper de configuracao deve resolver a base path dinamicamente para evitar hardcode desnecessario em homologacao local.

Exemplo recomendado:

```javascript
var BASE_PATH = window.location.pathname.indexOf('/conecta2026/') !== -1 ? '/conecta2026/' : './';
```

### 3.2 Centralizacao de configuracao

O projeto precisa de um contrato unico de configuracao compartilhada.

Recomendacao:

```javascript
window.CONECTA_CONFIG = {
  basePath: '/conecta2026',
  loginPath: '/conecta2026/login.html',
  appPath: '/conecta2026/CONECTA.html',
  contaPath: '/conecta2026/conta.html',
  cadastroPublicoPath: '/conecta2026/cadastro-apoiador.html'
};
```

E para o Supabase:

```javascript
window.CONECTA_SUPABASE_LIB
window.CONECTA_SUPABASE
window.dispatchEvent(new Event('conecta-supabase-ready'))
```

Ajuste importante:

- nao sobrescrever o namespace original da biblioteca sem necessidade;
- nao criar clients paralelos em cada pagina;
- sempre esperar o evento de readiness antes de usar auth ou queries.

### 3.3 Ordem de entrega corrigida

Nova prioridade:

1. fundacao tecnica;
2. autenticacao;
3. sincronizacao do `CONECTA.html`;
4. sincronizacao da Logistica;
5. paginas secundarias e formulario publico;
6. setup operacional do Supabase;
7. migracao de dados e testes;
8. PWA, refinamento visual e branding.

### 3.4 Logistica: mudar o plano para refletir a tela real

A primeira versao online nao deve tentar normalizar toda a Logistica na marra.

Recomendacao para v1:

- criar uma tabela generica `configuracoes_app` com `payload JSONB`;
- usar essa tabela para persistir:
  - `logistica_estado`
  - `coord_segmentos_sociais`
  - `organograma_lista_completa`

Motivo:

- reduz risco de regressao na tela de Logistica;
- permite sincronizar o estado real sem reescrever toda a pagina;
- resolve tambem as chaves singleton do `CONECTA.html` que hoje ficam fora do sync.

Se depois houver interesse em relatorios ou filtros mais sofisticados de Logistica, as tabelas normalizadas ja existentes podem ser usadas em uma segunda etapa.

### 3.5 Formulario publico de apoiadores

O formulario publico nao deve depender de sessao autenticada.

Plano recomendado para v1:

- manter insert anonimo na tabela `apoiadores`, como o `migration.sql` ja permite via RLS;
- remover credenciais inline do HTML;
- carregar a configuracao compartilhada cedo;
- exibir estado visual de conexao;
- em caso de indisponibilidade, enfileirar no `localStorage` e tentar reenvio.

### 3.6 Execucao multiagente e Git

Se houver execucao paralela com multiplas IAs ou operadores, o plano nao deve usar push direto e concorrente na `main`.

Padrao recomendado:

- cada agente trabalha em branch propria;
- nomes sugestivos:
  - `codex/lote1-auth`
  - `codex/lote2-conecta-sync`
  - `codex/lote3-logistica`
- cada agente faz commit e push apenas da sua branch;
- o merge para `main` fica concentrado em um coordenador humano ou agente orquestrador;
- antes do merge, executar `git fetch`, revisar diff e integrar em ordem.

Observacao:

- esta recomendacao e para a estrategia do projeto;
- ela nao altera a regra operacional local deste repositorio para a execucao desta conversa.

---

## 4. Arquitetura alvo revisada

### 4.1 Frontend

- cada `.html` continua standalone;
- CSS e JS permanecem inline nos arquivos principais, exceto utilitarios compartilhados em `js/`;
- sem framework e sem build;
- navegacao protegida por sessao nas paginas internas;
- pagina publica de apoiadores continua sem login.

### 4.2 Autenticacao

Modelo aprovado:

| Username | Email interno | Papel | Senha inicial |
|----------|---------------|-------|---------------|
| `silvio2026` | `silvio2026@conecta.interno` | `admin` | forte e individual |
| `karla2026` | `karla2026@conecta.interno` | `coordenador` | forte e individual |
| `igor2026` | `igor2026@conecta.interno` | `admin` | forte e individual |

Regras:

- `login.html` recebe username, nao e-mail;
- o frontend nao deve conter hardcoded de papeis e e-mails internos em producao;
- o frontend nao deve armazenar senhas padrao previsiveis;
- a resolucao `username -> email de auth` deve ocorrer por mecanismo controlado, preferencialmente RPC ou Edge Function;
- os papeis devem ser lidos do `perfis` apos autenticacao, nunca definidos no HTML;
- magic link sai do escopo;
- como esses e-mails nao sao caixas reais, os usuarios devem ser criados ja confirmados no Supabase;
- troca de senha acontece em `conta.html`, nao por e-mail.

Implementacao recomendada:

- adicionar coluna `username` unica em `perfis` ou tabela dedicada de aliases de login;
- criar RPC ou Edge Function que receba `username` e retorne apenas o identificador de auth necessario para `signInWithPassword`;
- se for necessario um atalho temporario para homologacao, qualquer mapa no frontend deve ser tratado como provisório, sem papeis e removido antes de producao.

### 4.3 Persistencia e sincronizacao

#### 4.3.1 Mapeamento do `CONECTA.html`

| Origem atual | Destino recomendado |
|--------------|---------------------|
| `conectacelina_eventos` | `eventos` |
| `conectacelina_veiculos` | `veiculos` |
| `conectacelina_pessoas` | `pessoas` |
| `conectacelina_pesquisas` | `pesquisas` |
| `conectacelina_demandas` | `demandas` |
| `conectacelina_juridico` | `juridico` |
| `conectacelina_comunicacao` | `comunicacao` |
| `conectacelina_materiais` | `materiais` |
| `conectacelina_lideres` | `lideres` |
| `conectacelina_visitas` | `visitas` |
| `conectacelina_atividades` | `atividades` |
| `conectacelina_tarefas_pessoas` | `tarefas` |
| `coordSegmentosSociais` | `configuracoes_app.chave = 'coord_segmentos_sociais'` |
| `organograma_lista_completa` | `configuracoes_app.chave = 'organograma_lista_completa'` |

#### 4.3.2 Mapeamento da `Logistica Campanha.html`

| Origem atual | Destino recomendado para v1 |
|--------------|-----------------------------|
| `logistica_celina_2026` | `configuracoes_app.chave = 'logistica_estado'` |

Observacao importante:

- as tabelas `logistica_tarefas`, `logistica_fornecedores`, `logistica_equipes` e `logistica_membros` permanecem no schema, mas nao devem ser forçadas na v1 se isso implicar reescrever toda a tela;
- se a equipe insistir em usar essas 4 tabelas ja na primeira entrega, o escopo sobe porque `materiais`, `subcoords`, `checklist`, `customChecklist` e `agendaSalas` continuarao sem destino.

#### 4.3.3 Estrategia de sincronizacao

Para o `CONECTA.html`, a forma mais pragmatica e segura para v1 e:

- corrigir a interceptacao do `localStorage`;
- tornar `ConectaDB.init()` idempotente;
- implementar bulk upsert por lote para arrays, evitando loops de centenas de requests unitarias;
- usar JSON singleton para estados unicos;
- usar realtime apenas depois que o sync basico estiver estavel.

Recomendacao de sync para arrays:

- preferir `upsert()` em massa;
- processar em lotes previsiveis, por exemplo 100 a 300 registros por envio;
- so usar replace integral com `delete + insert` em migracao controlada ou tabelas muito pequenas;
- comparar hashes ou timestamps quando possivel para reduzir trafego desnecessario.

Exemplo conceitual:

```javascript
var rows = Array.isArray(data) ? data : [];
var batchSize = 200;

for (var i = 0; i < rows.length; i += batchSize) {
  var batch = rows.slice(i, i + batchSize);
  await supabase.from(config.table).upsert(batch);
}
```

#### 4.3.4 Fila offline e resiliencia

O modo offline nao pode depender apenas do cache do PWA.

Requisitos minimos:

- manter fila local de operacoes pendentes;
- registrar evento `online` para replay automatico;
- evitar perda silenciosa de dados quando a rede cair;
- marcar visualmente quando existem sincronizacoes pendentes.

Contrato recomendado:

```javascript
window.addEventListener('online', function() {
  ConectaDB.syncPendingQueue();
});
```

Estrutura sugerida:

- chave local `conectacelina_sync_queue`;
- cada item da fila contem:
  - tipo de operacao;
  - tabela ou chave logica;
  - payload;
  - timestamp;
  - tentativas;
- a fila deve ser drenada no `online`, no boot da app e apos login bem-sucedido.

#### 4.3.5 Realtime seletivo

O frontend nao deve abrir canais indiscriminadamente para todas as tabelas em todas as paginas.

Regra recomendada:

- assinar apenas as tabelas necessarias para a pagina ativa;
- agrupar listeners por contexto de tela;
- desmontar subscriptions ao sair da pagina ou trocar de modulo;
- priorizar refresh manual ou por foco para tabelas pouco mutaveis;
- reservar realtime amplo apenas para entidades realmente colaborativas.

### 4.4 Seguranca

- RLS ativo em todas as tabelas protegidas;
- `apoiadores` com insert anonimo restrito e select so para autenticados;
- nenhum mapa de usuarios com papeis exposto no HTML de producao;
- senhas iniciais devem ser fortes, aleatorias e entregues por canal seguro;
- `conta.html` obrigatoria para troca de senha;
- logout consistente em todas as paginas internas;
- rotas protegidas devem redirecionar para `login.html`;
- formulario publico nao pode expor mensagens enganosas de "salvo no servidor" quando o client nao estiver pronto.

### 4.5 Deploy

- host alvo: `inteia.com.br/conecta2026/`
- deploy via Vercel
- `index.html` obrigatorio na raiz do pacote publicado
- rewrites de `vercel.json` apontando para `/conecta2026/index.html`

---

## 5. Fases de implementacao

## Fase 0 - Fundacao tecnica e contratos

### Objetivo

Padronizar configuracao, rotas, usuarios e documentacao para que as paginas parem de divergir entre si.

### Entregas

- revisar `js/supabase-config.js`;
- padronizar `window.CONECTA_CONFIG`;
- atualizar `setup/SETUP.md`;
- atualizar `WORKING.md` para refletir `/conecta2026/`;
- definir a tabela `configuracoes_app` no plano SQL;
- documentar a criacao exata dos 3 usuarios;
- documentar a estrategia de branches para execucao paralela.

### Ajustes obrigatorios

- `supabase-config.js` passa a ser a unica fonte de:
  - URL do projeto;
  - chave anonima;
  - base path;
  - evento de readiness.
- remover criacao inline de client em `login.html` e `cadastro-apoiador.html`.
- evitar sobrescrita fragil de `window.supabase`.
- definir desde ja o contrato da fila offline de sincronizacao.

### Criterio de aceite

- existe um contrato unico de configuracao;
- nenhuma pagina cria client proprio do Supabase;
- toda documentacao usa `/conecta2026/`;
- o setup de usuarios esta descrito de forma exata;
- o plano de execucao paralela nao depende de push simultaneo na `main`.

---

## Fase 1 - Login, conta e rotas de entrada

### Objetivo

Trocar o fluxo atual por autenticacao real via username.

### Entregas

- reescrever `login.html`;
- criar `conta.html`;
- criar `index.html`;
- remover magic link do fluxo;
- corrigir redirects absolutos.

### Requisitos

- campo `Usuario`, nao `E-mail`;
- placeholder com `silvio2026, karla2026 ou igor2026`;
- resolver username sem expor papeis no frontend;
- `signInWithPassword` usando identificador de auth resolvido por camada controlada;
- exibicao clara de erro:
  - `Usuario nao autorizado`
  - `Senha incorreta`
  - `Sistema indisponivel`
- `conta.html` com:
  - auth guard;
  - nome/username do usuario;
  - troca de senha;
  - logout.

### Criterio de aceite

- acessar `/conecta2026/` redireciona para `login.html`;
- `silvio2026` entra com a senha forte provisionada;
- username invalido nao chega a chamar auth;
- magic link nao aparece mais;
- `conta.html` permite trocar senha com validacao minima;
- nenhum papel fica hardcoded no HTML.

---

## Fase 2 - Sincronizacao segura do `CONECTA.html`

### Objetivo

Fazer a pagina principal funcionar online sem quebrar o comportamento atual.

### Entregas

- incluir scripts compartilhados em `CONECTA.html`;
- adicionar auth guard antes da inicializacao principal;
- tornar `ConectaDB.init()` idempotente;
- corrigir a recursao da sobrescrita de `localStorage`;
- implementar bulk upsert real para arrays;
- mapear `coordSegmentosSociais` e `organograma_lista_completa`;
- exibir usuario logado no header;
- adicionar botoes `Minha Conta` e `Sair`;
- introduzir fila local de sincronizacao pendente.

### Decisao tecnica recomendada

Em vez de sair reescrevendo todos os CRUDs do `CONECTA.html`, a v1 deve:

- manter o padrao atual de gravacao por array completo;
- fazer `ConectaDB` traduzir isso para `upsert()` em massa com loteamento;
- usar storage local apenas como fallback e fila de resiliencia, nao como fonte principal.

### Criterio de aceite

- `CONECTA.html` nao abre sem sessao;
- criar ou editar um item em uma conta persiste no banco;
- outra conta ve o dado apos refresh;
- a pagina nao entra em loop ou trava ao salvar;
- `coordSegmentosSociais` e `organograma_lista_completa` tambem ficam compartilhados;
- operacoes feitas sem rede entram na fila e sobem quando a conexao volta.

---

## Fase 3 - Sincronizacao da `Logistica Campanha.html`

### Objetivo

Colocar a pagina de Logistica online com o menor risco possivel.

### Entregas

- incluir scripts compartilhados;
- aplicar auth guard;
- carregar o estado remoto de `logistica_estado`;
- salvar a tela inteira como JSON controlado em `configuracoes_app`;
- preservar o comportamento atual dos modais e do `saveData()`;
- colocar a Logistica na mesma fila offline da app principal.

### Decisao recomendada

Para v1, a tela de Logistica deve sincronizar como um unico documento JSON.

Motivos:

- e fiel ao estado atual da pagina;
- evita remapeamento forçado de muitos campos;
- reduz regressao em uma tela grande;
- entrega valor real mais rapido.

### O que fica para uma fase posterior

- normalizar materiais de Logistica em tabela propria;
- transformar checklist e agenda em entidades consultaveis;
- cruzar Logistica com relatórios analiticos.

### Criterio de aceite

- `Logistica Campanha.html` nao abre sem login;
- uma alteracao em tarefas, materiais, fornecedores ou equipe permanece apos refresh;
- o estado completo fica visivel para outra conta;
- nao ha perda de `subcoords`, `checklist`, `customChecklist` nem `agendaSalas`;
- alteracoes offline entram na fila e sao reaplicadas no retorno da rede.

---

## Fase 4 - Paginas secundarias e formulario publico

### Objetivo

Fechar os pontos de entrada e apoio ao usuario.

### Entregas

- corrigir `qrcode-cartao.html` para apontar a `/conecta2026/cadastro-apoiador.html`;
- proteger `qrcode-cartao.html` e `Coordenadores Regionais.html` se forem consideradas paginas internas;
- estabilizar `cadastro-apoiador.html` com inicializacao antecipada do Supabase;
- exibir status real de envio no formulario publico.

### Requisitos do formulario publico

- nao exigir login;
- nao depender de magic link;
- usar o client compartilhado ou um helper derivado da configuracao central;
- impedir falso positivo de sucesso quando o client ainda nao carregou;
- se houver fallback local, deixar claro que o envio ficou pendente;
- se houver fila local, tentar reenvio no evento `online`.

### Criterio de aceite

- o QR code abre a URL correta de producao;
- o formulario publico salva com submit rapido;
- se a rede falhar, o usuario recebe mensagem honesta e o cadastro pode ser reenviado;
- paginas internas secundarias respeitam auth.

---

## Fase 5 - Banco, seguranca e setup operacional

### Objetivo

Ajustar o schema para a aplicacao real e documentar o provisionamento sem ambiguidades.

### Entregas

- revisar `setup/migration.sql`;
- adicionar `configuracoes_app`;
- manter ou complementar RLS para os novos casos;
- revisar `setup/SETUP.md`;
- descrever a criacao dos 3 usuarios e seus papeis;
- documentar bucket `fotos-campanha`.

### Tabela adicional recomendada

```sql
CREATE TABLE IF NOT EXISTS configuracoes_app (
  chave         TEXT PRIMARY KEY,
  payload       JSONB NOT NULL DEFAULT '{}'::jsonb,
  atualizado_por UUID REFERENCES perfis(id),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Politicas recomendadas:

- `SELECT` para autenticados;
- `INSERT`, `UPDATE` e `DELETE` para `admin` e `coordenador`;
- nenhuma permissao anonima nessa tabela.

### Criterio de aceite

- o setup documenta exatamente os 3 usuarios iniciais;
- `configuracoes_app` existe e pode armazenar JSON singleton;
- nenhuma URL do setup aponta para `/conecta/`;
- a equipe consegue reproduzir o ambiente do zero sem adivinhacao.

---

## Fase 6 - Migracao de dados locais e homologacao

### Objetivo

Levar o historico ja existente para o ambiente online e validar com dados reais.

### Entregas

- criar rotina de importacao do `localStorage` atual para o banco;
- validar importacao do `CONECTA.html`;
- validar importacao do `logistica_celina_2026`;
- executar rodada de homologacao em 2 navegadores ou 2 perfis.

### Estrategia recomendada

- capturar snapshot do `localStorage` antes de qualquer deploy;
- importar primeiro em ambiente de homologacao;
- depois promover para producao;
- manter export JSON manual no app como seguranca adicional.

### Criterio de aceite

- dados existentes nao se perdem;
- pelo menos 2 usuarios conseguem ver o mesmo conjunto de dados;
- logout, relogin e refresh preservam o estado remoto.

---

## Fase 7 - PWA, refinamento visual e branding

### Objetivo

Melhorar experiencia e apresentacao depois da base estar estavel.

### Entregas

- `manifest.json`;
- `service-worker.js`;
- icones;
- rodape padrao;
- melhorias visuais em `login.html`, `conta.html` e cabecalhos internos.

### Regra de prioridade

Nenhum item desta fase deve bloquear:

- autenticacao;
- sincronizacao;
- setup;
- deploy.

### Criterio de aceite

- PWA instala no mobile;
- o service worker nao mascara bug de rota nem cacheia uma versao quebrada;
- branding aparece de forma consistente.

---

## Fase 8 - Deploy, checklist operacional e go-live

### Objetivo

Publicar com previsibilidade e rollback claro.

### Entregas

- `index.html` na raiz publicada;
- rewrite do `vercel.json` para `/conecta2026` e `/conecta2026/`;
- checklist de smoke test pos-deploy;
- plano de rollback.

### Smoke test minimo

1. abrir `/conecta2026/`;
2. validar redirect para login;
3. entrar com `silvio2026`;
4. criar item em `CONECTA.html`;
5. abrir segunda sessao com `karla2026`;
6. confirmar visualizacao do mesmo dado;
7. abrir Logistica e salvar alteracao;
8. confirmar persistencia apos refresh;
9. validar `cadastro-apoiador.html`;
10. validar QR code.

### Rollback

- manter snapshot dos arquivos publicados antes do go-live;
- manter export do `localStorage` antigo;
- se houver regressao critica, voltar imediatamente para a versao anterior dos arquivos estaticos enquanto o banco e preservado.

---

## 6. Matriz de arquivos e entregas

| Arquivo | Acao principal |
|---------|----------------|
| `js/supabase-config.js` | centralizar config, readiness e client unico |
| `js/conecta-db.js` | remover recursao, tornar init idempotente, sincronizar arrays e singletons |
| `login.html` | login por username, sem magic link |
| `conta.html` | novo arquivo para troca de senha e logout |
| `index.html` | novo arquivo para redirect de entrada |
| `CONECTA.html` | auth guard, init do sync, botoes de conta/logout, scripts compartilhados |
| `Logistica Campanha.html` | auth guard e sync do estado JSON |
| `cadastro-apoiador.html` | inicializacao segura do client e fluxo publico confiavel |
| `qrcode-cartao.html` | corrigir URL publica |
| `Coordenadores Regionais.html` | decidir se entra como pagina protegida |
| `setup/migration.sql` | incluir `configuracoes_app` e revisar alinhamento |
| `setup/SETUP.md` | documentar `/conecta2026/` e os 3 usuarios |
| `WORKING.md` | alinhar contexto operacional ao plano aprovado |

---

## 7. Setup inicial do Supabase

### 7.1 Projeto

- nome sugerido: `conecta-2026`
- regiao: Sao Paulo
- plano inicial: pode ser Free para homologacao
- upgrade para Pro apenas apos validacao de uso real ou necessidade de backup diario nativo

### 7.2 Auth

- provider: Email/Password
- magic link: fora do escopo
- usuarios devem ser criados ja confirmados
- sem recuperacao por e-mail para os enderecos `@conecta.interno`
- a resolucao de username deve ficar fora do HTML estatico sempre que possivel

### 7.3 Usuarios iniciais

Criar exatamente estes usuarios:

| Email | Username operacional | Papel |
|-------|----------------------|-------|
| `silvio2026@conecta.interno` | `silvio2026` | `admin` |
| `karla2026@conecta.interno` | `karla2026` | `coordenador` |
| `igor2026@conecta.interno` | `igor2026` | `admin` |

Senhas iniciais:

- fortes, aleatorias e diferentes dos usernames;
- entregues por canal seguro fora do repositorio;
- nunca versionadas;
- trocadas no primeiro acesso em `conta.html`.

Acao obrigatoria apos o primeiro login:

- trocar senha em `conta.html`
- validar se o perfil e o username esperado foram associados corretamente no banco

### 7.4 Storage

- bucket: `fotos-campanha`
- criar so depois de validar que o upload realmente sera usado na v1

---

## 8. Testes de aceitacao

1. Acessar `/conecta2026/` redireciona para `login.html`.
2. Username invalido mostra `Usuario nao autorizado`.
3. Senha errada mostra erro claro.
4. `silvio2026` autentica corretamente.
5. `conta.html` exige sessao.
6. Troca de senha funciona e a senha antiga deixa de funcionar.
7. `CONECTA.html` nao abre sem login.
8. Salvar evento em uma conta persiste no Supabase.
9. Segunda conta consegue ver o evento apos refresh.
10. `coordSegmentosSociais` sincroniza entre contas.
11. `organograma_lista_completa` sincroniza entre contas.
12. `Logistica Campanha.html` preserva `tarefas`, `materiais`, `fornecedores`, `equipe` e `agendaSalas`.
13. `qrcode-cartao.html` gera QR code para a URL correta.
14. `cadastro-apoiador.html` funciona mesmo com submit rapido.
15. RLS impede leitura anonima das paginas e dados internos.
16. Logout redireciona corretamente para `/conecta2026/login.html`.
17. Uma carga grande de registros usa `upsert` em lote, sem disparar centenas de requests unitarias.
18. Alteracoes offline entram em fila e sao sincronizadas ao disparar o evento `online`.
19. O frontend nao abre subscriptions realtime fora do contexto da pagina ativa.

---

## 9. Riscos principais e mitigacoes

### Risco 0 - Exposicao de mapeamento de usuarios e credenciais fracas

Mitigacao:

- nao expor papeis no frontend;
- nao usar senha igual ao username;
- preferir RPC ou Edge Function para resolver username;
- tratar mapa client-side apenas como expediente temporario de homologacao.

### Risco 1 - Recursao no override de `localStorage`

Mitigacao:

- corrigir isso antes de qualquer teste de sync;
- usar um writer interno sem chamar novamente o metodo sobrescrito.

### Risco 2 - Divergencia entre tela de Logistica e schema SQL

Mitigacao:

- usar `configuracoes_app` com JSON em v1;
- deixar normalizacao fina para fase futura.

### Risco 3 - Credenciais espalhadas em varios arquivos

Mitigacao:

- um unico helper compartilhado;
- nenhuma pagina criando client proprio.

### Risco 4 - Gargalo de performance por loop de inserts

Mitigacao:

- usar `upsert()` em massa;
- fatiar em lotes previsiveis;
- evitar `insert` ou `update` individual em massa;
- limitar realtime enquanto o sync base nao estiver estavel.

### Risco 5 - Conflito de Git em execucao paralela

Mitigacao:

- branches por agente;
- merge centralizado;
- nunca usar multiplos pushes diretos e simultaneos na `main` como estrategia oficial do projeto.

### Risco 6 - Rota quebrada por base path divergente

Mitigacao:

- revisar tudo para `/conecta2026/`;
- preferir caminhos relativos para navegacao local.

### Risco 7 - Usuario achar que o formulario publico salvou quando nao salvou

Mitigacao:

- estado visual de conexao;
- retry ou fila local;
- mensagem honesta de pendencia.

### Risco 8 - Offline do PWA sem replay real de dados

Mitigacao:

- fila local de mutacoes;
- listener explicito de `online`;
- replay no boot e apos login;
- opcionalmente avaliar Background Sync depois da v1.

### Risco 9 - Excesso de canais realtime e limite de WebSocket

Mitigacao:

- subscriptions apenas por pagina;
- consolidar listeners em menos canais;
- desinscrever ao trocar de modulo;
- manter fallback com refresh por foco quando realtime nao compensar.

### Risco 10 - Primeiro deploy com service worker cacheando erro

Mitigacao:

- PWA so entra depois da base funcional;
- limpar caches entre releases iniciais.

---

## 10. Decisoes pendentes

| Codigo | Decisao | Recomendacao |
|--------|---------|--------------|
| D1 | `Coordenadores Regionais.html` sera pagina protegida ou publica? | Proteger |
| D2 | `qrcode-cartao.html` sera uso interno ou publico? | Proteger, mantendo o cadastro publico |
| D3 | Upgrade para Supabase Pro entra antes ou depois da homologacao? | Depois da homologacao |
| D4 | As tabelas normalizadas de Logistica entram na v1 ou ficam para v2? | Ficam para v2 |
| D5 | `Cadastro - lideres 2026.htm` entra no escopo desta entrega? | Nao, manter fora do escopo |

---

## 11. Cronograma realista

### Semana 1

- Dia 1: Fase 0
- Dia 2: Fase 1
- Dia 3 e Dia 4: Fase 2
- Dia 5: Fase 3

### Semana 2

- Dia 1: Fase 4
- Dia 2: Fase 5
- Dia 3: Fase 6
- Dia 4: Fase 7
- Dia 5: Fase 8 e go-live controlado

Observacao:

- se a equipe optar por normalizar a Logistica ja na v1, adicionar pelo menos 3 dias uteis ao cronograma.

---

## 12. Definition of done

O projeto so deve ser considerado pronto quando:

- os 3 usuarios entram por username;
- `CONECTA.html` compartilha dados entre contas;
- `Logistica Campanha.html` compartilha o estado completo entre contas;
- as chaves `coordSegmentosSociais` e `organograma_lista_completa` tambem ficam remotas;
- `cadastro-apoiador.html` salva com confiabilidade;
- todas as rotas de producao usam `/conecta2026/`;
- o setup do zero esta documentado sem lacunas;
- o deploy passa no smoke test completo.

---

## 13. Resumo executivo final

O plano revisado muda a estrategia em tres pontos centrais:

1. prioriza a base tecnica antes de redesign e PWA;
2. corrige a divergencia entre o estado real da aplicacao e o schema de banco, especialmente na Logistica;
3. trata problemas concretos do codigo atual que bloqueiam a entrega, como recursao no sync, chaves fora do mapeamento e autenticacao ainda baseada em e-mail.

E a revisao critica complementar endurece mais quatro pontos:

1. remove a dependencia de mapa de usuarios exposto no frontend de producao;
2. troca loops de inserts por `upsert()` em lote;
3. formaliza fila offline com replay no retorno da rede;
4. define branches por agente e realtime seletivo para reduzir conflitos e gargalos.

Com isso, a v1 fica mais simples, mais segura e muito mais aderente ao repositorio real.

---

> Plano revisado em 27/03/2026
> Arquivo: `C:\Users\IgorPC\.claude\projects\Conecta 2026\PLANO_CONECTA_v4.md`
