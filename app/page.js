'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useLang, LangSwitcher } from '@/lib/LangContext'
import { i18n } from '@/lib/i18n'
import CompareModal from '@/app/components/CompareModal'

const BG = '#07090f'
const SURFACE = '#0c1118'
const CARD = '#101821'
const BORDER = '#1a2840'
const GREEN = '#00ff99'
const BLUE = '#1a5cff'
const TEXT = '#dce8f4'
const MUTED = '#7a90a8'
const GOLD = '#ffc947'
const SILVER = '#b8c8d4'
const BRONZE = '#cd8b4e'

export default function Home() {
  const { lang } = useLang()
  const T = i18n[lang]

  const [data, setData] = useState([])
  const [dbMaps, setDbMaps] = useState([])
  const [mapFilter, setMapFilter] = useState('')
  const [bikeFilter, setBikeFilter] = useState('')
  const [riderFilter, setRiderFilter] = useState('')
  const [modalVideo, setModalVideo] = useState(null)
  const [showAllBikes, setShowAllBikes] = useState(false)
  const [showAllMaps, setShowAllMaps] = useState(false)
  const [showAllRiders, setShowAllRiders] = useState(false)
  const [expandedMaps, setExpandedMaps] = useState({})
  const [expandedPodiums, setExpandedPodiums] = useState({})
  const [copiedId, setCopiedId] = useState(null)
  const [compareRuns, setCompareRuns] = useState([])

  function toggleCompare(run) {
    setCompareRuns(prev => {
      if (prev.find(r => r.id === run.id)) return prev.filter(r => r.id !== run.id)
      if (prev.length >= 2) return [prev[1], run]
      return [...prev, run]
    })
  }

  async function handleShare(r) {
    const riderName = r.riders?.name
    const time = Number(r.lap_time).toFixed(2)
    const lines = [
      `🏁 ${riderName} — ${time}s on ${r.map_name}`,
      r.bike ? `🏍 ${r.bike}` : null,
      r.youtube_url ? `📹 ${r.youtube_url}` : null,
      `https://moto-gymkhana.vercel.app/riders/${encodeURIComponent(riderName)}`,
    ].filter(Boolean).join('\n')
    try {
      if (navigator.share) { await navigator.share({ text: lines }) }
      else {
        await navigator.clipboard.writeText(lines)
        setCopiedId(r.id)
        setTimeout(() => setCopiedId(null), 2000)
      }
    } catch { /* cancelled */ }
  }

  useEffect(() => {
    supabase
      .from('results')
      .select('id, map_name, lap_time, bike, youtube_url, created_at, riders(name)')
      .eq('approved', true)
      .order('lap_time', { ascending: true })
      .then(({ data }) => setData(data || []))

    supabase
      .from('maps')
      .select('name, image_url')
      .order('name')
      .then(({ data }) => setDbMaps(data || []))
  }, [])

  useEffect(() => {
    if (mapFilter) {
      setExpandedMaps(prev => ({ ...prev, [mapFilter]: true }))
      setExpandedPodiums(prev => ({ ...prev, [mapFilter]: true }))
    }
  }, [mapFilter])

  const maps = [...new Set(data.map(r => r.map_name))].filter(Boolean).sort()
  const bikes = [...new Set(data.map(r => r.bike))].filter(Boolean).sort()
  const riders = [...new Set(data.map(r => r.riders?.name))].filter(Boolean).sort()

  const filteredData = data
    .filter(r => !mapFilter || r.map_name === mapFilter)
    .filter(r => !bikeFilter || r.bike === bikeFilter)
    .filter(r => !riderFilter || r.riders?.name === riderFilter)

  // Rank of each rider's best run (unique riders only, sorted by lap_time)
  const riderRankMap = (() => {
    const seen = new Set()
    const map = {}
    let rank = 0
    for (const r of filteredData) {
      const n = r.riders?.name
      if (!n || seen.has(n)) continue
      seen.add(n)
      map[n] = rank++
    }
    return map
  })()

  const podiumMaps = mapFilter
    ? [mapFilter]
    : [...new Set(filteredData.map(r => r.map_name))].filter(Boolean).sort()

  const hasFilters = mapFilter || bikeFilter || riderFilter

  function ytId(url) {
    if (!url) return null
    if (url.includes('watch?v=')) return url.split('v=')[1].split('&')[0]
    if (url.includes('youtu.be/')) return url.split('youtu.be/')[1].split('?')[0]
    if (url.includes('/shorts/')) return url.split('/shorts/')[1].split('?')[0]
    return null
  }

  const toggleMap = (name) => setExpandedMaps(prev => ({ ...prev, [name]: !prev[name] }))
  const togglePodium = (name) => setExpandedPodiums(prev => ({ ...prev, [name]: !prev[name] }))

  return (
    <div style={{ background: '#030508', minHeight: '100vh', fontFamily: 'var(--font-geist-sans, Arial, sans-serif)' }}>
      <div style={{ maxWidth: 700, margin: '0 auto', background: BG, minHeight: '100vh', color: TEXT, boxShadow: '0 0 80px rgba(0,0,0,0.7)' }}>

        {/* HEADER */}
        <div style={{ background: `linear-gradient(180deg, #0a1020 0%, ${SURFACE} 100%)`, borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ height: 4, background: `linear-gradient(90deg, ${BLUE}, ${GREEN}, ${BLUE})` }} />
          <div style={{ textAlign: 'center', padding: '20px 16px 22px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 16, right: 16 }}>
              <LangSwitcher />
            </div>
            <div style={{ color: BLUE, fontSize: 11, letterSpacing: 4, textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>
              {T.israel}
            </div>
            <h1 style={{ margin: '0 0 5px', fontSize: 'clamp(26px, 5vw, 36px)', fontWeight: 900, color: TEXT, letterSpacing: -1 }}>
              Moto Gymkhana
            </h1>
            <p style={{ margin: '0 0 22px', color: MUTED, fontSize: 14 }}>{T.tagline}</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/submit" style={{ padding: '11px 22px', background: GREEN, color: '#000', borderRadius: 10, fontWeight: 700, fontSize: 14, boxShadow: '0 0 24px rgba(0,255,153,0.3)' }}>
                {T.submit_run}
              </Link>
              <Link href="/training" style={{ padding: '11px 22px', background: 'transparent', color: TEXT, borderRadius: 10, fontWeight: 600, fontSize: 14, border: `1px solid ${BORDER}` }}>
                {T.training}
              </Link>
              <Link href="/news" style={{ padding: '11px 22px', background: 'transparent', color: TEXT, borderRadius: 10, fontWeight: 600, fontSize: 14, border: `1px solid ${BORDER}` }}>
                {T.news}
              </Link>
              <Link href="/admin" style={{ padding: '11px 22px', background: 'transparent', color: MUTED, borderRadius: 10, fontWeight: 600, fontSize: 14, border: `1px solid ${BORDER}` }}>
                {T.admin}
              </Link>
            </div>
          </div>
        </div>

        {/* FILTERS */}
        <div style={{ background: SURFACE, borderBottom: `1px solid ${BORDER}`, padding: '12px 14px 8px' }}>
          <FilterRow>
            <Chip label={T.all_maps} icon="🏁" active={!mapFilter} onClick={() => setMapFilter('')} />
            {(showAllMaps ? maps : maps.slice(0, 3)).map(m => (
              <Chip key={m} label={m} active={mapFilter === m} onClick={() => setMapFilter(m)} />
            ))}
            {maps.length > 3 && (
              <Chip label={showAllMaps ? '← Less' : `+${maps.length - 3}`} onClick={() => setShowAllMaps(v => !v)} />
            )}
          </FilterRow>
          <FilterRow>
            <Chip label={T.all_bikes} icon="🏍" active={!bikeFilter} onClick={() => setBikeFilter('')} />
            {(showAllBikes ? bikes : bikes.slice(0, 2)).map(b => (
              <Chip key={b} label={b} active={bikeFilter === b} onClick={() => setBikeFilter(b)} />
            ))}
            {bikes.length > 2 && (
              <Chip label={showAllBikes ? '← Less' : `+${bikes.length - 2}`} onClick={() => setShowAllBikes(v => !v)} />
            )}
          </FilterRow>
          <FilterRow style={{ marginBottom: 0 }}>
            <Chip label={T.all_riders} icon="👤" active={!riderFilter} onClick={() => setRiderFilter('')} />
            {(showAllRiders ? riders : riders.slice(0, 2)).map(r => (
              <Chip key={r} label={r} active={riderFilter === r} onClick={() => setRiderFilter(r)} />
            ))}
            {riders.length > 2 && (
              <Chip label={showAllRiders ? '← Less' : `+${riders.length - 2}`} onClick={() => setShowAllRiders(v => !v)} />
            )}
          </FilterRow>
          {hasFilters && (
            <button onClick={() => { setMapFilter(''); setBikeFilter(''); setRiderFilter('') }} style={{ marginTop: 8, background: 'none', border: 'none', color: '#ff6b6b', fontSize: 12, cursor: 'pointer', padding: '4px 0', display: 'block' }}>
              {T.clear_filters}
            </button>
          )}
        </div>

        {/* PER-MAP SECTIONS */}
        {podiumMaps.map(mapName => {
          const seenRiders = new Set()
          const top3 = filteredData
            .filter(r => r.map_name === mapName)
            .filter(r => { const n = r.riders?.name; if (!n || seenRiders.has(n)) return false; seenRiders.add(n); return true })
            .slice(0, 3)
          if (top3.length === 0) return null
          const mapImage = dbMaps.find(m => m.name === mapName)?.image_url
          const mapOpen = !!expandedMaps[mapName]
          const podiumOpen = !!expandedPodiums[mapName]

          const medals = [
            { color: GOLD, emoji: '🥇', glow: '#ffc94740' },
            { color: SILVER, emoji: '🥈', glow: '#b8c8d430' },
            { color: BRONZE, emoji: '🥉', glow: '#cd8b4e30' },
          ]
          const podiumOrder = [top3[1], top3[0], top3[2]]
            .map((r, vi) => r ? { r, medal: medals[[1, 0, 2][vi]], first: vi === 1 } : null)
            .filter(Boolean)

          return (
            <div key={mapName} style={{ borderBottom: `1px solid ${BORDER}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 14px' }}>
                <div style={{ flex: 1, fontWeight: 700, fontSize: 15, color: TEXT }}>🏁 {mapName}</div>
                {mapImage && (
                  <ToggleBtn active={mapOpen} onClick={() => toggleMap(mapName)}>{T.map_btn}</ToggleBtn>
                )}
                <ToggleBtn active={podiumOpen} onClick={() => togglePodium(mapName)}>{T.podium_btn}</ToggleBtn>
              </div>

              {mapOpen && mapImage && (
                <div style={{ padding: '0 14px 14px' }}>
                  <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${BORDER}` }}>
                    <Image src={mapImage} alt={`${mapName} course layout`} width={800} height={600}
                      style={{ width: '100%', height: 'auto', display: 'block' }}
                      sizes="(max-width: 700px) calc(100vw - 28px), 658px" priority={!!mapFilter} />
                  </div>
                </div>
              )}

              {podiumOpen && (
                <div style={{ padding: '0 14px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 8 }}>
                    {podiumOrder.map(({ r, medal, first }) => {
                      const vid = ytId(r.youtube_url)
                      return (
                        <div key={r.id} style={{
                          background: CARD, border: `2px solid ${medal.color}`, borderRadius: 14,
                          padding: first ? '18px 10px 12px' : '12px 10px 12px',
                          width: first ? 140 : 118, textAlign: 'center',
                          boxShadow: `0 0 28px ${medal.glow}`,
                        }}>
                          <div style={{ fontSize: first ? 34 : 26, lineHeight: 1 }}>{medal.emoji}</div>
                          <Link href={`/riders/${encodeURIComponent(r.riders?.name)}`} style={{ fontWeight: 700, fontSize: 13, marginTop: 6, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', textDecoration: 'none' }}>
                            {r.riders?.name}
                          </Link>
                          <div style={{ color: medal.color, fontSize: first ? 20 : 17, fontWeight: 800, marginTop: 3 }}>
                            {Number(r.lap_time).toFixed(2)}s
                          </div>
                          {vid && (
                            <button onClick={() => setModalVideo(vid)} style={{
                              marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                              width: '100%', padding: '5px 0',
                              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: 6, color: MUTED, fontSize: 11, cursor: 'pointer',
                            }}>
                              {T.watch_run}
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {/* RESULTS FEED */}
        <div style={{ padding: '16px 14px 32px' }}>
          {filteredData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 20px', color: MUTED }}>
              <div style={{ fontSize: 52, marginBottom: 14 }}>🏁</div>
              <div style={{ fontSize: 17, marginBottom: 8, color: TEXT }}>{T.no_results}</div>
              <Link href="/submit" style={{ color: GREEN, fontSize: 14 }}>{T.first_submit}</Link>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 11, color: MUTED, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>
                {T.all_runs} · {filteredData.length} {T.total}
              </div>
              {filteredData.map((r, i) => {
                const videoId = ytId(r.youtube_url)
                const riderRank = riderRankMap[r.riders?.name]
                const rankColor = riderRank === 0 ? GOLD : riderRank === 1 ? SILVER : riderRank === 2 ? BRONZE : null

                return videoId ? (
                  <div key={r.id} style={{ background: CARD, borderRadius: 14, marginBottom: 10, overflow: 'hidden', border: `1px solid ${rankColor ? rankColor + '40' : BORDER}` }}>
                    <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setModalVideo(videoId)}>
                      <img src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`} style={{ width: '100%', display: 'block', aspectRatio: '16/9', objectFit: 'cover' }} alt="Run video" />
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.72) 100%)' }} />
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -60%)', width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: 0, height: 0, borderTop: '10px solid transparent', borderBottom: '10px solid transparent', borderLeft: '18px solid #000', marginLeft: 4 }} />
                      </div>
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 12px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <RankBadge rank={i + 1} color={rankColor} small />
                          <Link href={`/riders/${encodeURIComponent(r.riders?.name)}`} style={{ fontWeight: 700, fontSize: 15, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.8)', textDecoration: 'none' }}>{r.riders?.name}</Link>
                        </div>
                        <div style={{ color: GREEN, fontWeight: 900, fontSize: 20, textShadow: '0 1px 8px rgba(0,0,0,0.9)' }}>{Number(r.lap_time).toFixed(2)}s</div>
                      </div>
                    </div>
                    <div style={{ padding: '9px 12px', display: 'flex', gap: 8, fontSize: 12, color: MUTED, alignItems: 'center' }}>
                      <span style={{ flex: 1 }}>🏁 {r.map_name}{r.bike ? ` · 🏍 ${r.bike}` : ''}</span>
                      <button onClick={() => handleShare(r)} style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '3px 9px', cursor: 'pointer', color: copiedId === r.id ? GREEN : MUTED, fontSize: 12 }}>
                        {copiedId === r.id ? T.copied : '↗'}
                      </button>
                      <button onClick={() => toggleCompare(r)} style={{ background: compareRuns.find(c => c.id === r.id) ? BLUE : 'none', border: `1px solid ${compareRuns.find(c => c.id === r.id) ? BLUE : BORDER}`, borderRadius: 8, padding: '3px 9px', cursor: 'pointer', color: compareRuns.find(c => c.id === r.id) ? '#fff' : MUTED, fontSize: 12 }}>
                        ⚖
                      </button>
                    </div>
                  </div>
                ) : (
                  <div key={r.id} style={{ background: CARD, borderRadius: 12, padding: '13px 14px', marginBottom: 8, border: `1px solid ${rankColor ? rankColor + '40' : BORDER}`, borderLeft: `3px solid ${rankColor || BORDER}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <RankBadge rank={i + 1} color={rankColor} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Link href={`/riders/${encodeURIComponent(r.riders?.name)}`} style={{ fontWeight: 700, fontSize: 16, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', textDecoration: 'none' }}>{r.riders?.name}</Link>
                      <div style={{ fontSize: 12, color: MUTED, marginTop: 2, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <span>🏁 {r.map_name}</span>
                        {r.bike && <span>🏍 {r.bike}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <div style={{ color: GREEN, fontWeight: 800, fontSize: 19 }}>{Number(r.lap_time).toFixed(2)}s</div>
                      <button onClick={() => handleShare(r)} style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '5px 9px', cursor: 'pointer', color: copiedId === r.id ? GREEN : MUTED, fontSize: 12 }}>
                        {copiedId === r.id ? T.copied : '↗'}
                      </button>
                      <button onClick={() => toggleCompare(r)} style={{ background: compareRuns.find(c => c.id === r.id) ? BLUE : 'none', border: `1px solid ${compareRuns.find(c => c.id === r.id) ? BLUE : BORDER}`, borderRadius: 8, padding: '5px 9px', cursor: 'pointer', color: compareRuns.find(c => c.id === r.id) ? '#fff' : MUTED, fontSize: 12 }}>
                        ⚖
                      </button>
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>

        {/* FOOTER */}
        <footer style={{ borderTop: `1px solid ${BORDER}`, background: SURFACE, padding: '24px 16px 32px', textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: MUTED, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>{T.training_sessions}</div>
          <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 6, marginBottom: 24, textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, fontSize: 14 }}>
              <span style={{ color: MUTED }}>{T.friday}</span>
              <span style={{ color: TEXT, fontWeight: 600 }}>16:00 – 19:00</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, fontSize: 14 }}>
              <span style={{ color: MUTED }}>{T.saturday}</span>
              <span style={{ color: TEXT, fontWeight: 600 }}>10:00 – 13:00</span>
            </div>
          </div>
          <div style={{ fontSize: 11, color: MUTED, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>{T.community}</div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
            <FooterLink href="https://waze.com/ul/hsvbbd1mrv" label="📍 Hadera Rekevet" accent />
            <FooterLink href="https://www.facebook.com/groups/1413998699183513/?ref=share&mibextid=NSMWBT" label={T.facebook_group} />
            <FooterLink href="https://www.instagram.com/ariteme" label="📸 Instagram" />
            <FooterLink href="https://wa.me/972547263700?text=Hi%2C+I%27d+like+to+join+the+Moto+Gymkhana+WhatsApp+group" label={T.join_whatsapp} />
          </div>
          <div style={{ fontSize: 12, color: '#2a3a52', letterSpacing: 1 }}>🏁 Israeli Moto Gymkhana</div>
        </footer>
      </div>

      {/* COMPARE — floating hint when 1 run selected */}
      {compareRuns.length === 1 && (
        <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: BLUE, color: '#fff', borderRadius: 24, padding: '10px 20px', fontSize: 13, fontWeight: 600, zIndex: 500, whiteSpace: 'nowrap', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
          ⚖ Select a 2nd run to compare
          <button onClick={() => setCompareRuns([])} style={{ marginLeft: 12, background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 14, opacity: 0.7 }}>✕</button>
        </div>
      )}

      {/* COMPARE MODAL */}
      {compareRuns.length === 2 && (
        <CompareModal runs={compareRuns} onClose={() => setCompareRuns([])} />
      )}

      {/* VIDEO MODAL */}
      {modalVideo && (
        <div onClick={() => setModalVideo(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.94)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 900, aspectRatio: '16/9', borderRadius: 12, overflow: 'hidden' }}>
            <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${modalVideo}?autoplay=1`} allow="autoplay; encrypted-media; fullscreen" allowFullScreen style={{ border: 'none', display: 'block' }} />
          </div>
        </div>
      )}
    </div>
  )
}

function RankBadge({ rank, color, small }) {
  return (
    <div style={{ width: small ? 26 : 34, height: small ? 26 : 34, borderRadius: small ? 6 : 9, flexShrink: 0, background: color ? `${color}20` : '#ffffff08', border: `1px solid ${color ? color + '55' : '#ffffff10'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: small ? 11 : 14, color: color || MUTED }}>
      {rank}
    </div>
  )
}

function ToggleBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 12px', height: 34, borderRadius: 8, border: `1px solid ${active ? GREEN : BORDER}`, background: active ? 'rgba(0,255,153,0.1)' : 'transparent', color: active ? GREEN : MUTED, cursor: 'pointer', fontSize: 12, fontWeight: active ? 600 : 400, whiteSpace: 'nowrap' }}>
      {children} {active ? '▲' : '▼'}
    </button>
  )
}

function FilterRow({ children, style }) {
  return <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8, ...style }}>{children}</div>
}

function FooterLink({ href, label, accent }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, background: accent ? 'rgba(0,255,153,0.08)' : CARD, border: `1px solid ${accent ? GREEN + '50' : BORDER}`, color: accent ? GREEN : TEXT, fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>
      {label}
    </a>
  )
}

function Chip({ label, icon, active, onClick }) {
  return (
    <button onClick={onClick} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 12px', height: 30, borderRadius: 20, border: `1px solid ${active ? GREEN : BORDER}`, background: active ? 'rgba(0,255,153,0.12)' : 'transparent', color: active ? GREEN : MUTED, cursor: 'pointer', fontSize: 12, fontWeight: active ? 600 : 400, whiteSpace: 'nowrap' }}>
      {icon && <span style={{ marginRight: 2 }}>{icon}</span>}
      {label}
    </button>
  )
}
