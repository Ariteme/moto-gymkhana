import { NextResponse } from 'next/server'

export const revalidate = 3600

const BASE = 'https://mgym.fun/online'
const HEADERS = { 'User-Agent': 'Mozilla/5.0 (compatible; moto-gymkhana-il; bot)' }

function stripHtml(html) {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ').trim()
}

function parseOlcTime(str) {
  if (!str) return null
  const [min, sec] = str.split(':')
  return parseInt(min, 10) * 60 + parseFloat(sec)
}

async function fetchRounds() {
  const res = await fetch(`${BASE}/Competitions.php`, {
    next: { revalidate: 86400 },
    headers: HEADERS,
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const html = await res.text()

  const now = Date.now()
  const rows = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/g) || []
  const seen = new Set()
  const rounds = []

  for (const row of rows) {
    const idMatch = row.match(/fk0=(\d+)/)
    const mapMatch = row.match(/https?:\/\/mgym\.fun\/online\/map\/[^\s"']+/)
    if (!idMatch || !mapMatch) continue

    const id = parseInt(idMatch[1], 10)
    if (seen.has(id)) continue
    seen.add(id)

    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)]
      .map(m => stripHtml(m[1])).filter(c => c)

    const name = cells.find(c => /\d{4}MGym/.test(c)) || ''
    const dates = cells.filter(c => /^\d{4}-\d{2}-\d{2}/.test(c))
    if (!name || dates.length < 2) continue

    const start = new Date(dates[0]).getTime()
    const end = new Date(dates[1]).getTime()
    const roundMatch = name.match(/Round\s*(\d+)/i)
    const seasonMatch = name.match(/^(\d{4})/)

    rounds.push({
      id,
      name,
      season: seasonMatch ? parseInt(seasonMatch[1], 10) : null,
      round: roundMatch ? parseInt(roundMatch[1], 10) : null,
      startDate: dates[0],
      endDate: dates[1],
      mapUrl: mapMatch[0].trim(),
      isCurrent: start <= now && now <= end,
    })
  }

  return rounds.sort((a, b) => b.id - a.id)
}

async function fetchIlResults(id) {
  const url = `${BASE}/Competitions.php?hname=OnLineZawody_vOnLineProcentoweBest02_handler&fk0=${id}&master_viewmode=0`
  const res = await fetch(url, { next: { revalidate: 3600 }, headers: HEADERS })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const html = await res.text()

  const rows = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/g) || []
  const ilRiders = []
  let totalRiders = 0

  for (const row of rows) {
    const riderIdMatch = row.match(/RidersList[^"']*?fk0=(\d+)/)
    const flagMatch = row.match(/flags\/([a-z]{2})\.png/)
    if (!riderIdMatch || !flagMatch) continue

    totalRiders++

    if (flagMatch[1] !== 'il') continue

    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)]
      .map(m => stripHtml(m[1])).filter(c => c)

    const rankNum = parseInt(cells[0], 10)
    const nameCell = cells.find(c => c.includes('Israel')) || ''
    const name = nameCell.split(' Israel')[0].trim()
    const cityMatch = nameCell.match(/\(([^)]+)\)/)

    const times = row.match(/\d+:\d{2}\.\d{3}/g) || []
    const pctMatch = row.match(/(\d+\.\d+)%/)

    // Bike: not name/location, not a rank number, not a time, not a date, not a percentage
    const bike = cells.find(c =>
      c && !c.includes('Israel') &&
      !/^\d+$/.test(c) && !/\d:\d{2}/.test(c) &&
      !c.includes('%') && !/^\d{4}-/.test(c) && c.length > 2
    ) || ''

    ilRiders.push({
      rank: isNaN(rankNum) ? totalRiders : rankNum,
      olcRiderId: parseInt(riderIdMatch[1], 10),
      name,
      city: cityMatch?.[1]?.trim() || null,
      bike: bike.slice(0, 50),
      finalTimeStr: times.at(-1) || null,
      finalTime: times.length ? parseOlcTime(times.at(-1)) : null,
      pct: pctMatch ? parseFloat(pctMatch[1]) : null,
    })
  }

  return { ilRiders, totalRiders }
}

export async function GET(request) {
  const { searchParams } = request.nextUrl
  const action = searchParams.get('action')
  const id = parseInt(searchParams.get('id') || '0', 10)

  try {
    if (action === 'rounds') return NextResponse.json({ rounds: await fetchRounds() })
    if (action === 'results' && id) return NextResponse.json(await fetchIlResults(id))
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch (err) {
    console.error('[olc]', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
