import { ImageResponse } from 'next/og'
import { readFileSync } from 'fs'
import { join } from 'path'

export const alt = 'Israel Moto Gymkhana Leaderboard'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  const logoData = readFileSync(join(process.cwd(), 'public', 'gymkhana-logo.png'))
  const logoBase64 = `data:image/png;base64,${logoData.toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          background: '#07090f',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        {/* Left: logo */}
        <div style={{ width: 560, height: 630, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoBase64} width={520} height={520} style={{ objectFit: 'contain' }} alt="" />
        </div>

        {/* Right: text */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 60px' }}>
          <div style={{ color: '#00ff88', fontSize: 22, letterSpacing: 3, marginBottom: 16, display: 'flex' }}>
            🏍 MOTO GYMKHANA
          </div>
          <div style={{ color: 'white', fontSize: 64, fontWeight: 'bold', lineHeight: 1.1, marginBottom: 24, display: 'flex', flexDirection: 'column' }}>
            <span>Israel</span>
            <span style={{ color: '#1a5cff' }}>Leaderboard</span>
          </div>
          <div style={{ color: '#7a90a8', fontSize: 26, display: 'flex' }}>
            Live competition results
          </div>
          <div style={{ color: '#3a4a5a', fontSize: 20, marginTop: 48, display: 'flex' }}>
            moto-gymkhana.vercel.app
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
