import Link from 'next/link'

const BG = '#07090f'
const SURFACE = '#0c1118'
const CARD = '#101821'
const BORDER = '#1a2840'
const GREEN = '#00ff99'
const BLUE = '#1a5cff'
const TEXT = '#dce8f4'
const MUTED = '#7a90a8'

const VIDEOS = [
  {
    id: 'XEFSFQICBzs',
    title: 'Gymkhana Basic Patterns',
    description: 'Fundamental patterns and exercises for beginners and intermediate riders.',
    category: 'Patterns',
  },
]

const CATEGORIES = [...new Set(VIDEOS.map(v => v.category))]

export default function Training() {
  return (
    <div style={{ background: '#030508', minHeight: '100vh', fontFamily: 'var(--font-geist-sans, Arial, sans-serif)' }}>
    <div style={{ maxWidth: 700, margin: '0 auto', background: BG, minHeight: '100vh', color: TEXT, boxShadow: '0 0 80px rgba(0,0,0,0.7)' }}>

      {/* HEADER */}
      <div style={{ background: `linear-gradient(180deg, #0a1020 0%, ${SURFACE} 100%)`, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ height: 4, background: `linear-gradient(90deg, ${BLUE}, ${GREEN}, ${BLUE})` }} />
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px 16px', gap: 12 }}>
          <Link href="/" style={{ color: MUTED, fontSize: 13, padding: '6px 10px', border: `1px solid ${BORDER}`, borderRadius: 8, flexShrink: 0 }}>
            ← Back
          </Link>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: TEXT }}>🏋️ Training</div>
            <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>Patterns · Techniques · Exercises</div>
          </div>
          <div style={{ width: 64 }} />
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ padding: '20px 12px 60px' }}>
        {CATEGORIES.map(cat => (
          <div key={cat} style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 11, color: MUTED, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>
              {cat}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {VIDEOS.filter(v => v.category === cat).map(video => (
                <a
                  key={video.id}
                  href={`https://www.youtube.com/watch?v=${video.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'block', textDecoration: 'none' }}
                >
                  <div style={{
                    background: CARD, borderRadius: 14, overflow: 'hidden',
                    border: `1px solid ${BORDER}`,
                  }}>
                    {/* Thumbnail */}
                    <div style={{ position: 'relative' }}>
                      <img
                        src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`}
                        alt={video.title}
                        style={{ width: '100%', display: 'block', aspectRatio: '16/9', objectFit: 'cover' }}
                      />
                      <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.6) 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <div style={{
                          width: 52, height: 52, borderRadius: '50%',
                          background: 'rgba(255,255,255,0.92)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <div style={{ width: 0, height: 0, borderTop: '11px solid transparent', borderBottom: '11px solid transparent', borderLeft: '20px solid #000', marginLeft: 4 }} />
                        </div>
                      </div>
                    </div>
                    {/* Info */}
                    <div style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: TEXT, marginBottom: 4 }}>{video.title}</div>
                      {video.description && (
                        <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.5 }}>{video.description}</div>
                      )}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>

    </div>
    </div>
  )
}
