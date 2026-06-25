import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Israel Moto Gymkhana',
    short_name: 'MotoGymkhana',
    description: 'Live lap time leaderboard for Moto Gymkhana competitions in Israel',
    start_url: '/',
    display: 'standalone',
    background_color: '#07090f',
    theme_color: '#07090f',
    orientation: 'any',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
