import { NextResponse } from 'next/server'

export const revalidate = 3600

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

  return posts.reverse()
}

export async function GET() {
  try {
    const res = await fetch('https://t.me/s/moto_israel', {
      next: { revalidate: 3600 },
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; bot)' },
    })
    if (!res.ok) throw new Error('fetch failed')
    const html = await res.text()
    const posts = parsePosts(html)
    return NextResponse.json({ posts })
  } catch {
    return NextResponse.json({ posts: [], error: true })
  }
}
