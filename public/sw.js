// Service Worker — каркас (Фаза 0)
// Полная реализация с Workbox будет добавлена позже

const CACHE_NAME = 'minigame-v1'

// Событие установки — кэшируем базовый shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/manifest.json',
      ])
    })
  )
  self.skipWaiting()
})

// Событие активации — очистка старого кэша
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    })
  )
  self.clients.claim()
})

// Стратегия: Network First с фоллбэком на кэш
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok && event.request.method === 'GET') {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone)
          })
        }
        return response
      })
      .catch(() => {
        return caches.match(event.request)
      })
  )
})

