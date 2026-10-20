import { NextResponse } from 'next/server'

export const revalidate = 86400

const BASE = 'https://gymkhana-cup.ru'
const HEADERS = { 'User-Agent': 'Mozilla/5.0 (compatible; moto-gymkhana-il; bot)' }

const TRACKS = [
  { name: '8 GP',         id: 1  },
  { name: 'Pita GP',      id: 3  },
  { name: 'Rotations GP', id: 19 },
  { name: 'Shiso GP',     id: 2  },
  { name: 'Umigame GP',   id: 10 },
]

function parseSeconds(str) {
  if (!str) return null
  const [min, sec] = str.split(':')
  return parseInt(min, 10) * 60 + parseFloat(sec)
}

async function fetchFigurePage(id) {
  try {
    const res = await fetch(`${BASE}/competitions/figure?id=${id}`, {
      next: { revalidate: 86400 },
      headers: HEADERS,
    })
    const html = await res.text()
    const imgMatch = html.match(/toggle-content[\s\S]*?<img src="([^"]+)"/)
    const wrMatch  = html.match(/World record[\s\S]*?(\d{2}:\d{2}\.\d{2})/)
    return {
      imageUrl:       imgMatch?.[1] ?? null,
      worldRecordStr: wrMatch?.[1] ?? null,
      worldRecord:    wrMatch ? parseSeconds(wrMatch[1]) : null,
    }
  } catch {
    return { imageUrl: null, worldRecordStr: null, worldRecord: null }
  }
}

async function fetchParticipants() {
  try {
    const res = await fetch(`${BASE}/competitions/results?by=figure`, {
      next: { revalidate: 86400 },
      headers: HEADERS,
    })
    const html = await res.text()
    const counts = {}
    for (const { name } of TRACKS) {
      const idx = html.indexOf(name)
      if (idx === -1) continue
      const ctx = html.slice(idx, idx + 600)
      const m = ctx.match(/fa-users[\s\S]*?>\s*(\d+)/)
      if (m) counts[name] = parseInt(m[1], 10)
    }
    return counts
  } catch {
    return {}
  }
}

export async function GET() {
  try {
    const [figureResults, participants] = await Promise.all([
      Promise.all(TRACKS.map(t => fetchFigurePage(t.id).then(d => ({ ...t, ...d })))),
      fetchParticipants(),
    ])

    const maps = figureResults.map(m => ({
      ...m,
      participants: participants[m.name] ?? null,
    }))

    return NextResponse.json({ maps })
  } catch (err) {
    console.error('[gymkhana-maps]', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
