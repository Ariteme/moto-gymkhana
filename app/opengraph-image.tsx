import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Israel Moto Gymkhana Leaderboard'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0f0f0f',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Arial, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative background rings */}
        <div style={{ position: 'absolute', width: 700, height: 700, borderRadius: '50%', border: '1px solid #00ff9918', display: 'flex' }} />
        <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', border: '1px solid #00ff9925', display: 'flex' }} />
        <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', border: '1px solid #00ff9935', display: 'flex' }} />

        {/* Wheel icon */}
        <svg width="110" height="110" viewBox="0 0 100 100" style={{ marginBottom: 36 }}>
          <circle cx="50" cy="50" r="44" stroke="#00ff99" strokeWidth="4" fill="none" />
          <line x1="50" y1="42" x2="50" y2="13"   stroke="#00ff99" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="57" y1="46" x2="82" y2="31.5" stroke="#00ff99" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="57" y1="54" x2="82" y2="68.5" stroke="#00ff99" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="50" y1="58" x2="50" y2="87"   stroke="#00ff99" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="43" y1="54" x2="18" y2="68.5" stroke="#00ff99" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="43" y1="46" x2="18" y2="31.5" stroke="#00ff99" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="50" cy="50" r="7" fill="#00ff99" />
        </svg>

        {/* Title */}
        <div style={{ color: '#00ff99', fontSize: 72, fontWeight: 'bold', letterSpacing: -1, display: 'flex' }}>
          Israel Moto Gymkhana
        </div>

        {/* Subtitle */}
        <div style={{ color: '#666666', fontSize: 34, marginTop: 20, display: 'flex' }}>
          Live Competition Leaderboard
        </div>

        {/* URL */}
        <div style={{ color: '#333333', fontSize: 22, marginTop: 48, display: 'flex' }}>
          moto-gymkhana.vercel.app
        </div>
      </div>
    ),
    { ...size }
  )
}
