// Регистрация Service Worker
export async function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    })

    // Регистрация Background Sync для Outbox
    if ('sync' in registration) {
      await (registration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register('outbox-drain')
    }

    console.log('Service Worker зарегистрирован:', registration.scope)
  } catch (error) {
    console.error('Ошибка регистрации Service Worker:', error)
  }
}
