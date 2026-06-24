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
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
