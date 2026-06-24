// Server Component — fetches t.me/s/moto_israel, cached 1 hour by Vercel ISR
export const revalidate = 3600

import Link from 'next/link'

const BG = '#07090f'
const SURFACE = '#0c1118'
const CARD = '#101821'
const BORDER = '#1a2840'
const GREEN = '#00ff99'
const BLUE = '#1a5cff'
const TEXT = '#dce8f4'
const MUTED = '#7a90a8'

/* ── Parse t.me/s/ HTML into post objects ── */
function parsePosts(html) {
  const chunks = html.split(/(?=data-post="moto_israel\/\d+")/)
  const posts = []

  for (const chunk of chunks.slice(1)) {
    const idMatch = chunk.match(/data-post="moto_israel\/(\d+)"/)
    const dateMatch = chunk.match(/<time datetime="([^"]+)"/)
    const linkMatch = chunk.match(/<a class="tgme_widget_message_date"[^>]+href="([^"]+)"/)
    const textMatch = chunk.match(/<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/)
    const photos = [...chunk.matchAll(/tgme_widget_message_photo_wrap[^>]+style="[^"]*background-image:url\('([^']+)'\)/g)].map(m => m[1])

    if (!idMatch) continue

    let text = ''
    if (textMatch) {
      text = textMatch[1]
        .replace(/<i class="emoji"[^>]*><b>([^<]*)<\/b><\/i>/g, '$1')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ')
        .trim()
    }

    posts.push({
      id: idMatch[1],
      date: dateMatch ? dateMatch[1] : null,
      link: linkMatch ? linkMatch[1] : `https://t.me/moto_israel/${idMatch[1]}`,
      text,
      photos,
    })
  }

  return posts.reverse() // newest first
}

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-IL', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function News() {
  let posts = []
  let error = false

  try {
    const res = await fetch('https://t.me/s/moto_israel', {
      next: { revalidate: 3600 },
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; bot)' },
    })
    if (!res.ok) throw new Error('fetch failed')
    const html = await res.text()
    posts = parsePosts(html)
  } catch {
    error = true
  }

  return (
    <div style={{ background: '#030508', minHeight: '100vh', fontFamily: 'var(--font-geist-sans, Arial, sans-serif)' }}>
    <div style={{ maxWidth: 700, margin: '0 auto', background: BG, minHeight: '100vh', color: TEXT, boxShadow: '0 0 80px rgba(0,0,0,0.7)' }}>

      {/* HEADER */}
      <div style={{ background: `linear-gradient(180deg, #0a1020 0%, ${SURFACE} 100%)`, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ height: 4, background: `linear-gradient(90deg, ${BLUE}, ${GREEN}, ${BLUE})` }} />
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px 16px', gap: 12 }}>
          <Link href="/" style={{ color: MUTED, fontSize: 13, padding: '6px 10px', border: `1px solid ${BORDER}`, borderRadius: 8 }}>
            ← Back
          </Link>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: TEXT }}>📰 Moto News</div>
            <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>
              <a href="https://t.me/moto_israel" target="_blank" rel="noopener noreferrer" style={{ color: MUTED }}>
                t.me/moto_israel
              </a>
            </div>
          </div>
          <div style={{ width: 64 }} />
        </div>
      </div>

      {/* POSTS */}
      <div style={{ padding: '16px 12px 60px' }}>
        {error && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: MUTED }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📡</div>
            <div style={{ fontSize: 16, color: TEXT, marginBottom: 6 }}>Could not load news</div>
            <div style={{ fontSize: 13 }}>
              <a href="https://t.me/moto_israel" target="_blank" rel="noopener noreferrer" style={{ color: GREEN }}>
                Open channel on Telegram →
              </a>
            </div>
          </div>
        )}

        {!error && posts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: MUTED }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <div>No posts found</div>
          </div>
        )}

        {posts.map(post => (
          <div key={post.id} style={{
            background: CARD, borderRadius: 14, marginBottom: 10,
            overflow: 'hidden', border: `1px solid ${BORDER}`,
          }}>
            {/* Photos */}
            {post.photos.length > 0 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: post.photos.length === 1 ? '1fr' : '1fr 1fr',
                gap: 2,
              }}>
                {post.photos.slice(0, 4).map((src, i) => (
                  <a key={i} href={post.link} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
                    <img
                      src={src}
                      alt=""
                      style={{
                        width: '100%', display: 'block',
                        aspectRatio: post.photos.length === 1 ? '16/9' : '1/1',
                        objectFit: 'cover',
                      }}
                    />
                  </a>
                ))}
              </div>
            )}

            {/* Text + footer */}
            {(post.text || true) && (
              <div style={{ padding: '12px 14px' }}>
                {post.text && (
                  <p style={{ margin: '0 0 12px', fontSize: 14, color: TEXT, whiteSpace: 'pre-line', lineHeight: 1.65 }}>
                    {post.text}
                  </p>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: MUTED }}>{formatDate(post.date)}</span>
                  <a
                    href={post.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 12, color: GREEN, fontWeight: 500 }}
                  >
                    Open in Telegram →
                  </a>
                </div>
              </div>
            )}
          </div>
        ))}

        {posts.length > 0 && (
          <div style={{ textAlign: 'center', paddingTop: 8 }}>
            <a
              href="https://t.me/moto_israel"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 13, color: MUTED }}
            >
              See all posts on Telegram →
            </a>
          </div>
        )}
      </div>

    </div>
    </div>
  )
}
