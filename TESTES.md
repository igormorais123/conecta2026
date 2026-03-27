# CONECTA 2026 — Checklist de Testes e Homologação

Este documento centraliza os testes funcionais para garantir que a migração para o Supabase e implantação do sistema (Versão 4.x) ocorreu com sucesso.

## 1. Testes de Autenticação (Login)
- [ ] Acessar `login.html` sem credenciais.
- [ ] Tentar burlar o login acessando `CONECTA.html` diretamente (deve redirecionar para login).
- [ ] Efetuar login com usuário `silvio2026` usando senha forte. Deve redirecionar para `CONECTA.html`.
- [ ] Deslogar ou limpar cache do LocalStorage e verificar se o Auth Guard do Supabase bloqueia o acesso via URL direta.

## 2. Testes de Dashboard e Sessão (`CONECTA.html`)
- [ ] Verificar se as informações do usuário (nome, papel) aparecem na sidebar (carregadas via `js/conecta-db.js`).
- [ ] Acessar a página principal em múltiplos navegadores e observar se há estabilidade na sessão, sem duplicação de perfis.
- [ ] Simular clique no botão "Sair" (Logout), certificando-se de que a sessão é destruída remotamente e direciona para `/conecta2026/login.html`.

## 3. Testes de Banco de Dados (`conecta-db.js`)
- [ ] Cadastrar uma nova "Tarefa" ou modificar o "Cronograma" e salvar. O salvamento deve ativar o método *Bulk Upsert* e refletir no Supabase Web Console na tabela respectiva.
- [ ] Abrir uma aba anônima (com usuário logado diferente) e checar se os arrays estão lendo do banco e preenchendo as varáveis globais no startup.
- [ ] Teste Offline: desligar a aba NETWORK, interagir com o sistema, religar a internet e testar se os relatórios agendados locais se unem aos dados remotos por união array ou upsert assíncrono.

## 4. Testes do Formulário Público (`cadastro-apoiador.html`)
- [ ] Acessar `cadastro-apoiador.html` num ambiente deslogado do app (é página puramente expositiva e liberada ao público móvel).
- [ ] Preencher com nome e telefone válidos. Clicar em Enviar e constatar Sucesso.
- [ ] Validar integridade forçando um rate-limit ou descarregando dependências e notar se a falha aciona com êxito o Fallback para o `localStorage.getItem('conecta_apoiadores')`, viabilizando recuperar esses dados pro DB mais tarde manualmente.

## 5. Testes da Interface Privativa Secundária
- [ ] Tentar visitar `Coordenadores Regionais.html` desconectado (Espera-se redirect imediato e automático p/ login).
- [ ] Fazer login e visitar `Coordenadores Regionais.html` ou `qrcode-cartao.html`. (Acesso liberado e guard transposto sem exibir relâmpagos visuais do layout antes do redirect).
- [ ] Ao final de ambas as páginas, confirmar a renderização perfeita da logomarca SVG da **INTEIA** em rodapé.

## 6. Homologação PWA (Mobile e Web-App)
- [ ] DevTools (Aba Application → Manifest): Confirme se o sistema já captou o JSON do Manifest assim que a IA Opus provisioná-lo.
- [ ] Confirmar se a barra status do aparelho mobile iOS tingiu corretamente usando o hexa da nossa metatag (`#1a237e` - primary color e transparente).
- [ ] Adicionar um Web-Clip na Home Screen do Celular e abrir o app enxergando em Full Screen (Standalone).
