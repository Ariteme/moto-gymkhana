import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Israel Moto Gymkhana Leaderboard'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  // Star center and radius
  const cx = 300
  const cy = 290
  const R = 210

  // Triangle 1 (upward): vertices at 0°, 120°, 240° from top
  const t1 = [
    [cx, cy - R],
    [cx + R * Math.sin((2 * Math.PI) / 3), cy - R * Math.cos((2 * Math.PI) / 3)],
    [cx - R * Math.sin((2 * Math.PI) / 3), cy - R * Math.cos((2 * Math.PI) / 3)],
  ]
  // Triangle 2 (downward): vertices at 60°, 180°, 300°
  const t2 = [
    [cx + R * Math.sin(Math.PI / 3), cy - R * Math.cos(Math.PI / 3)],
    [cx, cy + R],
    [cx - R * Math.sin(Math.PI / 3), cy - R * Math.cos(Math.PI / 3)],
  ]

  const poly = (pts: number[][]): string => pts.map(p => p.map(Math.round).join(',')).join(' ')

  // Motorcycle scaled 4x relative to the 100×100 icon, offset to star center (cx=300, cy~=290)
  // Icon origin (50,60) maps to (cx, cy)
  const s = 4.4
  const mx = (ix: number) => cx + (ix - 50) * s
  const my = (iy: number) => cy + (iy - 60) * s

  return new ImageResponse(
    (
      <div
        style={{
          background: '#0a0a0a',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        {/* Left: Star + Motorcycle */}
        <div style={{ width: 620, height: 630, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <svg width="620" height="630" viewBox="0 0 620 630">
            {/* Magen David */}
            <polygon points={poly(t1)} fill="none" stroke="#4488ff" strokeWidth="6" strokeLinejoin="round"/>
            <polygon points={poly(t2)} fill="none" stroke="#4488ff" strokeWidth="6" strokeLinejoin="round"/>

            {/* Rear wheel */}
            <circle cx={mx(33)} cy={my(62)} r={8 * s} fill="none" stroke="white" strokeWidth={2.5 * s}/>
            <circle cx={mx(33)} cy={my(62)} r={2 * s} fill="white"/>
            {/* Front wheel */}
            <circle cx={mx(67)} cy={my(59)} r={8 * s} fill="none" stroke="white" strokeWidth={2.5 * s}/>
            <circle cx={mx(67)} cy={my(59)} r={2 * s} fill="white"/>
            {/* Frame */}
            <path
              d={`M${mx(33)},${my(54)} L${mx(42)},${my(42)} L${mx(59)},${my(39)} L${mx(67)},${my(51)}`}
              fill="none" stroke="white" strokeWidth={2.5 * s} strokeLinecap="round" strokeLinejoin="round"
            />
            {/* Seat */}
            <line x1={mx(40)} y1={my(44)} x2={mx(58)} y2={my(40)} stroke="white" strokeWidth={3.5 * s} strokeLinecap="round"/>
            {/* Fork */}
            <line x1={mx(62)} y1={my(40)} x2={mx(67)} y2={my(51)} stroke="white" strokeWidth={2.5 * s} strokeLinecap="round"/>

            {/* Cones */}
            <polygon points={`${mx(41)},${my(77)} ${mx(44.5)},${my(70)} ${mx(48)},${my(77)}`} fill="#4488ff"/>
            <polygon points={`${mx(52)},${my(77)} ${mx(55.5)},${my(70)} ${mx(59)},${my(77)}`} fill="#4488ff"/>
          </svg>
        </div>

        {/* Right: Text */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 60px' }}>
          <div style={{ color: '#4488ff', fontSize: 22, letterSpacing: 3, marginBottom: 16, display: 'flex' }}>
            🏍 MOTO GYMKHANA
          </div>
          <div style={{ color: 'white', fontSize: 64, fontWeight: 'bold', lineHeight: 1.1, marginBottom: 24, display: 'flex', flexDirection: 'column' }}>
            <span>Israel</span>
            <span style={{ color: '#4488ff' }}>Leaderboard</span>
          </div>
          <div style={{ color: '#555', fontSize: 26, display: 'flex' }}>
            Live competition results
          </div>
          <div style={{ color: '#333', fontSize: 20, marginTop: 48, display: 'flex' }}>
            moto-gymkhana.vercel.app
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
