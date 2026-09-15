import { NextResponse } from 'next/server'
import { GYMKHANA_MAPS } from '@/lib/gymkhana'

export const revalidate = 86400

function parseTimeToSeconds(timeStr) {
  const [min, sec] = timeStr.split(':')
  return parseInt(min, 10) * 60 + parseFloat(sec)
}

async function fetchWorldRecord(trackId) {
  const res = await fetch(`https://gymkhana-cup.ru/competitions/figure?id=${trackId}`, {
    next: { revalidate: 86400 },
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; bot)' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const html = await res.text()

  const idx = html.indexOf('World record:')
  if (idx < 0) throw new Error('World record section not found')

  const segment = html.slice(idx, idx + 300)
  const match = segment.match(/(\d{2}:\d{2}\.\d{2})/)
  if (!match) throw new Error('Could not parse time')

  return parseTimeToSeconds(match[1])
}

export async function GET(request) {
  const mapName = request.nextUrl.searchParams.get('map')
  const trackId = GYMKHANA_MAPS[mapName]

  if (!trackId) {
    return NextResponse.json({ error: 'Unknown map' }, { status: 404 })
  }

  try {
    const worldRecord = await fetchWorldRecord(trackId)
    return NextResponse.json({ worldRecord })
  } catch (err) {
    console.error('[gymkhana-class]', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
