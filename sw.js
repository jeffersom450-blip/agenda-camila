// Guarda o app no iPhone para abrir sem internet. Ao publicar mudança, suba a VERSAO.
const VERSAO = 'agenda-v1.1.0';
const FONTES = ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'];
const ARQUIVOS = [
  './',
  'index.html',
  'estilo.css',
  'manifest.webmanifest',
  'js/app.js',
  'js/dados.js',
  'js/whatsapp.js',
  'icones/apple-touch-icon.png',
  'icones/icone-192.png',
  'icones/icone-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSAO).then((c) => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n !== VERSAO).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

// rede primeiro (pega as atualizações); sem internet, usa a cópia guardada
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const origem = new URL(e.request.url).origin;
  // fonte Montserrat: guardada na primeira vez e servida do iPhone depois
  if (FONTES.includes(origem)) {
    e.respondWith(
      caches.match(e.request).then((salvo) => salvo || fetch(e.request).then((r) => {
        const copia = r.clone();
        caches.open(VERSAO).then((c) => c.put(e.request, copia));
        return r;
      }))
    );
    return;
  }
  if (origem !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((r) => {
        const copia = r.clone();
        caches.open(VERSAO).then((c) => c.put(e.request, copia));
        return r;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
