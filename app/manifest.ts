import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ReplySequence',
    short_name: 'ReplySequence',
    description: 'Turn Zoom, Teams, and Meet calls into perfect follow-up emails in 8 seconds.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0a',
    theme_color: '#6366f1',
    orientation: 'portrait-primary',
    categories: ['productivity', 'business', 'utilities'],
    icons: [
      {
        src: '/icons/icon-192.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icons/icon-192-maskable.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512-maskable.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
    shortcuts: [
      {
        name: 'Dashboard',
        short_name: 'Dashboard',
        url: '/dashboard',
        icons: [{ src: '/icons/icon-192.svg', sizes: '192x192' }],
      },
      {
        name: 'Upload Transcript',
        short_name: 'Upload',
        url: '/dashboard?upload=true',
        icons: [{ src: '/icons/icon-192.svg', sizes: '192x192' }],
      },
    ],
  }
}
