/* Service worker: lưu toàn bộ game vào bộ nhớ đệm để chơi offline.
   Mỗi lần sửa game, đổi số VERSION để máy người chơi tải bản mới. */
const VERSION = 'pacman-v1';
const FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(VERSION)
      .then(c => c.addAll(FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // Mở trang: ưu tiên bản trong cache (chạy được khi mất mạng), cập nhật ngầm khi có mạng
  if (req.mode === 'navigate') {
    e.respondWith(
      caches.match('./index.html').then(cached => {
        const net = fetch(req).then(res => {
          if (res && res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put('./index.html', copy)); }
          return res;
        }).catch(() => null);
        return cached || net.then(r => r || caches.match('./'));
      })
    );
    return;
  }

  // Tài nguyên khác: cache trước, không có thì tải mạng rồi lưu lại
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(cached => cached ||
      fetch(req).then(res => {
        if (res && res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
        return res;
      })
    )
  );
});
