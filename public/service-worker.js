const CACHE_NAME = 'image-analysis-lab-v63'; // Versão do cache atualizada para forçar a atualização

// A lista de URLs foi limpa e ajustada para a nova estrutura com Vite
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  
  // Assets na pasta 'public'
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/exceljs.min.js',
  '/jspdf.umd.min.js',
  '/jspdf.autotable.min.js', 
  '/chart.min.js',
  '/chartjs-adapter-date-fns.bundle.min.js',
  '/opencv.js',

  // --- INÍCIO DA ALTERAÇÃO: Adicionando KaTeX para funcionamento offline ---
  '/katex/katex.min.css',
  '/katex/katex.min.js',
  '/katex/contrib/auto-render.min.js',
  // Fontes essenciais para garantir a renderização correta offline
  '/katex/fonts/KaTeX_Main-Regular.woff2',
  '/katex/fonts/KaTeX_Math-Italic.woff2',
  '/katex/fonts/KaTeX_Size1-Regular.woff2',
  '/katex/fonts/KaTeX_Size2-Regular.woff2',
  // --- FIM DA ALTERAÇÃO ---

  // Scripts que agora são clássicos e estão na 'public'
  '/js/calculation.worker.js',
  '/js/utils.js',
  '/js/config.js',
  '/js/log.js'

  // NOTA: Os arquivos de 'src' não são cacheados aqui diretamente.
  // O Vite os agrupa no build final. Para o dev server, o cache é menos crítico.
];

self.addEventListener('install', (event) => {
  console.log(`[Service Worker] v${CACHE_NAME.split('-v')[1]}: Instalando...`);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log(`[Service Worker] Cacheando ${urlsToCache.length} arquivos da aplicação.`);
        // Usamos addAll com um catch individual para maior resiliência
        const cachePromises = urlsToCache.map(url => {
          return cache.add(new Request(url, {cache: 'reload'})).catch(err => {
            console.warn(`[Service Worker] Falha ao cachear ${url}:`, err);
          });
        });
        return Promise.all(cachePromises);
      })
      .then(() => {
        console.log('[Service Worker] Arquivos essenciais cacheados. Pulando espera.');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[Service Worker] Falha crítica ao cachear arquivos:', error);
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log(`[Service Worker] v${CACHE_NAME.split('-v')[1]}: Ativando...`);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deletando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
        console.log('[Service Worker] Pronto para operar.');
        return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Estratégia "Cache first" para arquivos cacheados, e "Network first" para o resto.
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request);
      })
  );
});