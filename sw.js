const CACHE_NAME = 'cohi-survey-v1';
const ASSETS = [
    '/', '/index.html', '/style.css', '/app.js', '/designers.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js'
];

self.addEventListener('install', (e) => e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS))));
self.addEventListener('fetch', (e) => e.respondWith(caches.match(e.request).then(res => res || fetch(e.request))));
