'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { use } from 'react'
import { useLang, LangSwitcher } from '@/lib/LangContext'
import { i18n } from '@/lib/i18n'

const BG = '#07090f'
const SURFACE = '#0c1118'
const CARD = '#101821'
const BORDER = '#1a2840'
const GREEN = '#00ff99'
const BLUE = '#1a5cff'
const TEXT = '#dce8f4'
const MUTED = '#7a90a8'
const GOLD = '#ffc947'

export default function RiderProfile({ params }) {
  const { name } = use(params)
  const riderName = decodeURIComponent(name)
  const { lang } = useLang()
  const T = i18n[lang]

  const [runs, setRuns] = useState([])
  const [loading, setLoading] = useState(true)
  const [mapFilter, setMapFilter] = useState(null)
  const [copiedId, setCopiedId] = useState(null)

  useEffect(() => {
    supabase
      .from('results')
      .select('id, map_name, lap_time, bike, youtube_url, created_at, riders!inner(name, number)')
      .eq('approved', true)
      .eq('riders.name', riderName)
      .order('created_at', { ascending: true })
      .then(({ data }) => { setRuns(data || []); setLoading(false) })
  }, [riderName])

  const bestPerMap = {}
  for (const r of runs) {
    if (!bestPerMap[r.map_name] || r.lap_time < bestPerMap[r.map_name].lap_time) bestPerMap[r.map_name] = r
  }
  const sortedMaps = Object.entries(bestPerMap).sort((a, b) => a[0].localeCompare(b[0]))
  const overallBest = runs.length ? [...runs].sort((a, b) => a.lap_time - b.lap_time)[0] : null
  const bikes = [...new Set(runs.map(r => r.bike).filter(Boolean))]
  const riderNumber = runs[0]?.riders?.number ?? null
  const initials = riderName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  const filteredRuns = mapFilter ? runs.filter(r => r.map_name === mapFilter) : runs
  const allMapNames = [...new Set(runs.map(r => r.map_name))].sort()

  function ytId(url) {
    if (!url) return null
    if (url.includes('watch?v=')) return url.split('v=')[1].split('&')[0]
    if (url.includes('youtu.be/')) return url.split('youtu.be/')[1].split('?')[0]
    if (url.includes('/shorts/')) return url.split('/shorts/')[1].split('?')[0]
    return null
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('en-IL', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const handleShare = useCallback(async (run) => {
    const time = Number(run.lap_time).toFixed(2)
    const profileUrl = `https://moto-gymkhana.vercel.app/riders/${encodeURIComponent(riderName)}`
    const lines = [
      `🏁 ${riderName} — ${time}s on ${run.map_name}`,
      run.bike ? `🏍 ${run.bike}` : null,
      run.youtube_url ? `📹 ${run.youtube_url}` : null,
      profileUrl,
    ].filter(Boolean).join('\n')

    try {
      if (navigator.share) {
        await navigator.share({ text: lines })
      } else {
        await navigator.clipboard.writeText(lines)
        setCopiedId(run.id)
        setTimeout(() => setCopiedId(null), 2000)
      }
    } catch {
      // user cancelled share — do nothing
    }
  }, [riderName])

  return (
    <div style={{ background: '#030508', minHeight: '100vh', fontFamily: 'var(--font-geist-sans, Arial, sans-serif)' }}>
    <div style={{ maxWidth: 700, margin: '0 auto', background: BG, minHeight: '100vh', color: TEXT, boxShadow: '0 0 80px rgba(0,0,0,0.7)' }}>

      <div style={{ background: `linear-gradient(180deg, #0a1020 0%, ${SURFACE} 100%)`, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ height: 4, background: `linear-gradient(90deg, ${BLUE}, ${GREEN}, ${BLUE})` }} />
        <div style={{ padding: '14px 16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Link href="/" style={{ color: MUTED, fontSize: 13, padding: '6px 10px', border: `1px solid ${BORDER}`, borderRadius: 8 }}>{T.leaderboard}</Link>
            <LangSwitcher />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: `linear-gradient(135deg, ${BLUE}, ${GREEN})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, color: '#000' }}>
                {initials}
              </div>
              {riderNumber && (
                <div style={{ position: 'absolute', bottom: -4, right: -8, background: GOLD, color: '#000', fontSize: 11, fontWeight: 900, borderRadius: 6, padding: '1px 6px', lineHeight: 1.6 }}>
                  #{riderNumber}
                </div>
              )}
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: TEXT }}>{riderName}</h1>
              <div style={{ fontSize: 13, color: MUTED, marginTop: 3 }}>{bikes.length > 0 ? bikes.join(' · ') : T.rider}</div>
            </div>
          </div>

          {!loading && (
            <div style={{ display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap' }}>
              <StatPill label={T.runs} value={runs.length} />
              <StatPill label={T.maps} value={sortedMaps.length} />
              {overallBest && <StatPill label={T.best_time} value={`${Number(overallBest.lap_time).toFixed(2)}s`} color={GREEN} />}
            </div>
          )}
        </div>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 60, color: MUTED }}>{T.loading}</div>}

      {!loading && runs.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: MUTED }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏍️</div>
          <div>{T.no_runs}</div>
        </div>
      )}

      {!loading && runs.length > 0 && (
        <div style={{ padding: '20px 14px 60px' }}>

          {/* Best per map */}
          <SectionTitle>{T.best_per_map}</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
            {sortedMaps.map(([mapName, run], i) => (
              <div key={mapName} style={{ background: CARD, borderRadius: 12, padding: '12px 14px', border: `1px solid ${i === 0 ? GOLD + '40' : BORDER}`, borderLeft: `3px solid ${i === 0 ? GOLD : BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15, color: TEXT }}>🏁 {mapName}</div>
                  {run.bike && <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>🏍 {run.bike}</div>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  {ytId(run.youtube_url) && (
                    <a href={run.youtube_url} target="_blank" rel="noopener noreferrer" style={{ color: MUTED, fontSize: 18 }}>▶</a>
                  )}
                  <div style={{ color: i === 0 ? GOLD : GREEN, fontWeight: 800, fontSize: 20 }}>{Number(run.lap_time).toFixed(2)}s</div>
                </div>
              </div>
            ))}
          </div>

          {/* Map filter chips */}
          <SectionTitle>{T.all_runs_section} ({runs.length})</SectionTitle>
          {allMapNames.length > 1 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
              <FilterChip active={!mapFilter} onClick={() => setMapFilter(null)}>{T.all_maps_filter}</FilterChip>
              {allMapNames.map(m => (
                <FilterChip key={m} active={mapFilter === m} onClick={() => setMapFilter(mapFilter === m ? null : m)}>{m}</FilterChip>
              ))}
            </div>
          )}

          {/* Progression chart — only when a map is selected and has ≥2 runs */}
          {mapFilter && filteredRuns.length >= 2 && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, color: MUTED, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>{T.progression} · {mapFilter}</div>
              <ProgressionChart runs={filteredRuns} />
            </div>
          )}

          {/* Run cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[...filteredRuns].reverse().map(r => {
              const videoId = ytId(r.youtube_url)
              const isCopied = copiedId === r.id
              return (
                <div key={r.id} style={{ background: CARD, borderRadius: 12, overflow: 'hidden', border: `1px solid ${BORDER}` }}>
                  {videoId && (
                    <a href={r.youtube_url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', position: 'relative' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`} style={{ width: '100%', display: 'block', aspectRatio: '16/9', objectFit: 'cover' }} alt="Run video" />
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.65) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ width: 0, height: 0, borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderLeft: '14px solid #000', marginLeft: 3 }} />
                        </div>
                      </div>
                    </a>
                  )}
                  <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: TEXT }}>🏁 {r.map_name}</div>
                      <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{formatDate(r.created_at)}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <div style={{ color: GREEN, fontWeight: 800, fontSize: 18 }}>{Number(r.lap_time).toFixed(2)}s</div>
                      <button
                        onClick={() => handleShare(r)}
                        style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '5px 10px', cursor: 'pointer', color: isCopied ? GREEN : MUTED, fontSize: 13, transition: 'color 0.2s' }}
                      >
                        {isCopied ? T.copied : '↗'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
    </div>
  )
}

function ProgressionChart({ runs }) {
  const W = 580, H = 160
  const PAD = { top: 16, right: 16, bottom: 32, left: 52 }
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom

  const times = runs.map(r => Number(r.lap_time))
  const dates = runs.map(r => new Date(r.created_at).getTime())
  const minT = Math.min(...times), maxT = Math.max(...times)
  const minD = Math.min(...dates), maxD = Math.max(...dates)
  const spread = maxT - minT || 1
  const dateSpread = maxD - minD || 1

  const sx = d => PAD.left + ((d - minD) / dateSpread) * innerW
  const sy = t => PAD.top + ((t - minT) / spread) * innerH  // higher time = lower on chart

  const pts = runs.map((r, i) => ({ x: sx(dates[i]), y: sy(times[i]), t: times[i], date: r.created_at }))
  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')

  // Y-axis labels: show min and max
  const yLabels = [
    { y: PAD.top, val: minT.toFixed(2) + 's' },
    { y: PAD.top + innerH, val: maxT.toFixed(2) + 's' },
  ]

  return (
    <div style={{ background: CARD, borderRadius: 12, border: `1px solid ${BORDER}`, padding: '12px 8px 8px', overflowX: 'auto' }}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', minWidth: 260 }}>
        {/* Horizontal grid lines */}
        {[0, 0.5, 1].map(f => (
          <line key={f} x1={PAD.left} x2={W - PAD.right} y1={PAD.top + f * innerH} y2={PAD.top + f * innerH}
            stroke={BORDER} strokeWidth="1" />
        ))}

        {/* Y-axis labels */}
        {yLabels.map(({ y, val }) => (
          <text key={val} x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize="11" fill={MUTED}>{val}</text>
        ))}

        {/* Line */}
        <path d={pathD} fill="none" stroke={BLUE} strokeWidth="2" strokeLinejoin="round" />

        {/* Points */}
        {pts.map((p, i) => {
          const isBest = p.t === minT
          return (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={isBest ? 6 : 4}
                fill={isBest ? GREEN : CARD} stroke={isBest ? GREEN : BLUE} strokeWidth="2" />
              {isBest && (
                <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="11" fill={GREEN} fontWeight="bold">
                  {p.t.toFixed(2)}s
                </text>
              )}
            </g>
          )
        })}

        {/* X-axis date labels (first and last) */}
        {[pts[0], pts[pts.length - 1]].map((p, i) => (
          <text key={i} x={p.x} y={H - 4} textAnchor={i === 0 ? 'start' : 'end'} fontSize="10" fill={MUTED}>
            {new Date(p.date).toLocaleDateString('en-IL', { day: 'numeric', month: 'short' })}
          </text>
        ))}
      </svg>
    </div>
  )
}

function FilterChip({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      background: active ? BLUE : 'transparent',
      border: `1px solid ${active ? BLUE : BORDER}`,
      borderRadius: 20, padding: '5px 12px',
      color: active ? '#fff' : MUTED,
      fontSize: 12, cursor: 'pointer', fontWeight: active ? 600 : 400,
      transition: 'all 0.15s',
    }}>
      {children}
    </button>
  )
}

function StatPill({ label, value, color }) {
  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '8px 14px', textAlign: 'center', minWidth: 70 }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: color || TEXT }}>{value}</div>
      <div style={{ fontSize: 11, color: MUTED, marginTop: 1 }}>{label}</div>
    </div>
  )
}

function SectionTitle({ children }) {
  return <div style={{ fontSize: 11, color: MUTED, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>{children}</div>
}
