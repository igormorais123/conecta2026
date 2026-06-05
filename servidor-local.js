// servidor-local.js — Servidor de desenvolvimento do CONECTA (Node puro, sem dependencias)
// Uso: node servidor-local.js   (ou duplo clique em abrir-local.bat)
// Serve a pasta atual em http://localhost:8080 para programar localmente,
// sem depender da Vercel/hospedagem. O login continua funcionando porque o
// Supabase e um servico online separado.
//
// Extra de DEV: desliga o cache do navegador e neutraliza o service worker
// (PWA) em localhost, para que toda edicao apareca na hora (sem versao antiga).

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORTA = process.env.PORT || 8080;
const RAIZ = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8'
};

// Service worker neutralizado para DEV: remove caches antigos e se desregistra,
// para nao servir versoes velhas enquanto voce programa.
const SW_DEV = `
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const chaves = await caches.keys();
    await Promise.all(chaves.map((k) => caches.delete(k)));
    await self.clients.claim();
    const reg = await self.registration.unregister();
    const clientes = await self.clients.matchAll({ type: 'window' });
    clientes.forEach((c) => c.navigate(c.url));
  })());
});
// Em DEV nao intercepta nada: tudo vai direto para o servidor local.
`;

function enviar(res, status, tipo, corpo) {
  res.writeHead(status, {
    'Content-Type': tipo,
    // Sem cache em DEV: sempre busca a versao mais nova
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.end(corpo);
}

const servidor = http.createServer((req, res) => {
  let url = decodeURIComponent(req.url.split('?')[0]);
  if (url === '/') url = '/index.html';

  // Intercepta o service worker e serve a versao DEV (auto-limpeza)
  if (url === '/js/service-worker.js') {
    return enviar(res, 200, 'text/javascript; charset=utf-8', SW_DEV);
  }

  // Resolve o caminho com seguranca (impede sair da pasta raiz)
  const destino = path.join(RAIZ, path.normalize(url));
  if (!destino.startsWith(RAIZ)) {
    return enviar(res, 403, 'text/plain; charset=utf-8', '403 - Acesso negado');
  }

  fs.stat(destino, (err, info) => {
    if (err || !info.isFile()) {
      return enviar(res, 404, 'text/plain; charset=utf-8', '404 - Nao encontrado: ' + url);
    }
    const ext = path.extname(destino).toLowerCase();
    const tipo = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': tipo,
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    fs.createReadStream(destino).pipe(res);
  });
});

servidor.listen(PORTA, () => {
  console.log('');
  console.log('  CONECTA rodando localmente!');
  console.log('  Abra no navegador:  http://localhost:' + PORTA + '/');
  console.log('');
  console.log('  (O login funciona normal - o Supabase e online.)');
  console.log('  Para parar: feche esta janela preta.');
  console.log('');
});

servidor.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error('A porta ' + PORTA + ' ja esta em uso. Feche o outro servidor ou use outra porta.');
  } else {
    console.error('Erro no servidor:', e.message);
  }
});
