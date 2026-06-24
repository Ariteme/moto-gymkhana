import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{
        width: 180, height: 180,
        background: 'white',
        borderRadius: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <svg width="152" height="152" viewBox="0 0 100 100">
          <polygon points="50,8 87,68 13,68" fill="none" stroke="#0038A8" strokeWidth="3.5" strokeLinejoin="round"/>
          <polygon points="50,92 87,32 13,32" fill="none" stroke="#0038A8" strokeWidth="3.5" strokeLinejoin="round"/>
          <circle cx="33" cy="62" r="8" fill="none" stroke="#0038A8" strokeWidth="2.5"/>
          <circle cx="33" cy="62" r="2" fill="#0038A8"/>
          <circle cx="67" cy="59" r="8" fill="none" stroke="#0038A8" strokeWidth="2.5"/>
          <circle cx="67" cy="59" r="2" fill="#0038A8"/>
          <path d="M33,54 L42,42 L59,39 L67,51" fill="none" stroke="#0038A8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="40" y1="44" x2="58" y2="40" stroke="#0038A8" strokeWidth="3.5" strokeLinecap="round"/>
          <line x1="62" y1="40" x2="67" y2="51" stroke="#0038A8" strokeWidth="2.5" strokeLinecap="round"/>
          <polygon points="41,77 44.5,70 48,77" fill="#0038A8"/>
          <polygon points="52,77 55.5,70 59,77" fill="#0038A8"/>
        </svg>
      </div>
    ),
    { ...size }
  )
}
