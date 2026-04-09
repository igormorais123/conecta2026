# CONECTA 2026 — Checklist de Testes e Homologação

Checklist operacional alinhado ao estado atual do repositório em 27/03/2026.

## 1. Entrada, rotas e sessão
- [ ] Abrir `/conecta2026/` e confirmar redirect imediato para `login.html`.
- [ ] Tentar abrir `CONECTA.html`, `Logistica Campanha.html`, `conta.html`, `qrcode-cartao.html` e `Coordenadores Regionais.html` sem sessão.
Deve redirecionar para login.
- [ ] Fazer login com `silvio2026`.
Deve abrir `CONECTA.html`.
- [ ] Testar username inválido.
Deve mostrar erro claro antes do `signInWithPassword`.
- [ ] Clicar em `Sair` em páginas protegidas.
Deve encerrar a sessão e voltar para `/conecta2026/login.html`.

## 2. Conta e credenciais
- [ ] Abrir `conta.html` autenticado e conferir nome e e-mail do usuário.
- [ ] Alterar a senha com mínimo de 8 caracteres.
- [ ] Confirmar que a senha antiga deixa de funcionar.
- [ ] Confirmar que a nova senha funciona no login.

## 3. Sync do CONECTA
- [ ] Criar ou editar um evento na agenda.
- [ ] Recarregar a página e confirmar persistência.
- [ ] Abrir uma segunda sessão com outro usuário e validar leitura do mesmo dado.
- [ ] Alterar `coordSegmentosSociais` e confirmar persistência após refresh.
- [ ] Alterar o organograma customizado e confirmar persistência após refresh.
- [ ] Validar o badge de sync no cabeçalho:
deve indicar `Offline`, `Fila pendente: N`, `Sync HH:MM` ou `Erro de sync` conforme o estado.
- [ ] Clicar em `Sincronizar` e confirmar replay manual sem erro visual.

## 4. Sync da Logística
- [ ] Alterar qualquer bloco de `logistica_celina_2026` e recarregar.
- [ ] Confirmar persistência do estado completo.
- [ ] Abrir uma segunda sessão autenticada e validar o mesmo estado.

## 5. Offline e fila
- [ ] Desligar a rede no app autenticado, fazer alterações e religar a conexão.
- [ ] Confirmar replay da fila do `ConectaDB` no evento `online`.
- [ ] Confirmar que o badge mostra `Offline` sem rede e volta para `Sync`/`Fila pendente` ao reconectar.
- [ ] Abrir `cadastro-apoiador.html` offline, enviar um cadastro e verificar gravação em `conecta_apoiadores_fila`.
- [ ] Reabrir a página online e confirmar replay da fila pública.

## 6. Formulário público
- [ ] Acessar `cadastro-apoiador.html` sem login.
- [ ] Enviar um cadastro válido e confirmar mensagem coerente com o resultado real.
- [ ] Repetir com submit rápido e confirmar que não há perda silenciosa de dados.

## 7. Páginas secundárias
- [ ] Abrir `qrcode-cartao.html` autenticado e validar que o QR aponta para `cadastro-apoiador.html` na base correta.
- [ ] Abrir `Coordenadores Regionais.html` autenticado e validar carregamento sem redirect indevido.
- [ ] Confirmar rodapé com marca INTEIA nas páginas secundárias protegidas.

## 8. Realtime e carga
- [ ] Navegar entre páginas do `CONECTA.html` e confirmar que não há erro visual ao trocar de seção.
- [ ] Confirmar que o realtime reage a mudanças visíveis da página ativa.
- [ ] Confirmar que a troca de páginas não deixa múltiplos canais acumulados no console/rede.

## 9. PWA e deploy
- [ ] Verificar `manifest` nas páginas que já receberam metatags PWA.
- [ ] Confirmar que o cache do service worker não mascara rota quebrada.
Se o service worker ainda não existir, marcar como pendente e não bloquear go-live técnico.
