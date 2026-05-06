import type { MetadataRoute } from 'next'

// PWA манифест
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'МиниИгры — Портал классических мини-игр',
    short_name: 'МиниИгры',
    description: 'Классические мини-игры прямо в браузере. Играй онлайн и оффлайн.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#3b82f6',
    orientation: 'portrait-primary',
    categories: ['games', 'entertainment'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
