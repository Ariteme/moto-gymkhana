'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

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
  const [data, setData] = useState([])
  const [mapFilter, setMapFilter] = useState('')
  const [bikeFilter, setBikeFilter] = useState('')
  const [riderFilter, setRiderFilter] = useState('')
  const [modalVideo, setModalVideo] = useState(null)
  const [showAllBikes, setShowAllBikes] = useState(false)
  const [showAllMaps, setShowAllMaps] = useState(false)
  const [showAllRiders, setShowAllRiders] = useState(false)

  useEffect(() => {
    supabase
      .from('results')
      .select('id, map_name, lap_time, bike, youtube_url, riders(name)')
      .eq('approved', true)
      .order('lap_time', { ascending: true })
      .then(({ data }) => setData(data || []))
  }, [])

  const maps = [...new Set(data.map(r => r.map_name))].filter(Boolean).sort()
  const bikes = [...new Set(data.map(r => r.bike))].filter(Boolean).sort()
  const riders = [...new Set(data.map(r => r.riders?.name))].filter(Boolean).sort()

  const filteredData = data
    .filter(r => !mapFilter || r.map_name === mapFilter)
    .filter(r => !bikeFilter || r.bike === bikeFilter)
    .filter(r => !riderFilter || r.riders?.name === riderFilter)

  const podiumMaps = mapFilter
    ? [mapFilter]
    : [...new Set(filteredData.map(r => r.map_name))].filter(Boolean).sort()

  const hasFilters = mapFilter || bikeFilter || riderFilter

  function ytId(url) {
    if (!url) return null
    if (url.includes('watch?v=')) return url.split('v=')[1].split('&')[0]
    if (url.includes('youtu.be/')) return url.split('youtu.be/')[1]
    return null
  }

  return (
    <div style={{ background: BG, minHeight: '100vh', color: TEXT, fontFamily: 'var(--font-geist-sans, Arial, sans-serif)' }}>

      {/* HEADER */}
      <div style={{ background: `linear-gradient(180deg, #0a1020 0%, ${SURFACE} 100%)`, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ height: 4, background: `linear-gradient(90deg, ${BLUE}, ${GREEN}, ${BLUE})` }} />
        <div style={{ textAlign: 'center', padding: '20px 16px 22px' }}>
          <div style={{ color: BLUE, fontSize: 11, letterSpacing: 4, textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>
            🇮🇱&nbsp;&nbsp;Israel
          </div>
          <h1 style={{ margin: '0 0 5px', fontSize: 'clamp(28px, 7vw, 38px)', fontWeight: 900, color: TEXT, letterSpacing: -1 }}>
            Moto Gymkhana
          </h1>
          <p style={{ margin: '0 0 22px', color: MUTED, fontSize: 14 }}>
            Live competition leaderboard
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/submit" style={{
              padding: '11px 22px', background: GREEN, color: '#000',
              borderRadius: 10, fontWeight: 700, fontSize: 14,
              boxShadow: '0 0 24px rgba(0,255,153,0.3)',
            }}>
              ➕ Submit Run
            </Link>
            <Link href="/admin" style={{
              padding: '11px 22px', background: 'transparent', color: MUTED,
              borderRadius: 10, fontWeight: 600, fontSize: 14,
              border: `1px solid ${BORDER}`,
            }}>
              🛠 Admin
            </Link>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div style={{ background: SURFACE, borderBottom: `1px solid ${BORDER}`, padding: '12px 14px 8px' }}>
        <FilterRow>
          <Chip label="All Maps" icon="🏁" active={!mapFilter} onClick={() => setMapFilter('')} />
          {(showAllMaps ? maps : maps.slice(0, 3)).map(m => (
            <Chip key={m} label={m} active={mapFilter === m} onClick={() => setMapFilter(m)} />
          ))}
          {maps.length > 3 && (
            <Chip label={showAllMaps ? '← Less' : `+${maps.length - 3}`} onClick={() => setShowAllMaps(v => !v)} />
          )}
        </FilterRow>

        <FilterRow>
          <Chip label="All Bikes" icon="🏍" active={!bikeFilter} onClick={() => setBikeFilter('')} />
          {(showAllBikes ? bikes : bikes.slice(0, 2)).map(b => (
            <Chip key={b} label={b} active={bikeFilter === b} onClick={() => setBikeFilter(b)} />
          ))}
          {bikes.length > 2 && (
            <Chip label={showAllBikes ? '← Less' : `+${bikes.length - 2}`} onClick={() => setShowAllBikes(v => !v)} />
          )}
        </FilterRow>

        <FilterRow style={{ marginBottom: 0 }}>
          <Chip label="All Riders" icon="👤" active={!riderFilter} onClick={() => setRiderFilter('')} />
          {(showAllRiders ? riders : riders.slice(0, 2)).map(r => (
            <Chip key={r} label={r} active={riderFilter === r} onClick={() => setRiderFilter(r)} />
          ))}
          {riders.length > 2 && (
            <Chip label={showAllRiders ? '← Less' : `+${riders.length - 2}`} onClick={() => setShowAllRiders(v => !v)} />
          )}
        </FilterRow>

        {hasFilters && (
          <button
            onClick={() => { setMapFilter(''); setBikeFilter(''); setRiderFilter('') }}
            style={{ marginTop: 8, background: 'none', border: 'none', color: '#ff6b6b', fontSize: 12, cursor: 'pointer', padding: '4px 0', display: 'block' }}
          >
            ✕ Clear filters
          </button>
        )}
      </div>

      {/* PODIUM */}
      {filteredData.length > 0 && podiumMaps.length > 0 && (
        <div style={{ padding: '22px 16px 8px' }}>
          {podiumMaps.map(mapName => {
            const top3 = filteredData.filter(r => r.map_name === mapName).slice(0, 3)
            if (top3.length === 0) return null

            // Visual order: 2nd left, 1st center elevated, 3rd right
            const podium = [
              top3[1] && { r: top3[1], medal: { emoji: '🥈', color: SILVER, glow: '#b8c8d430' } },
              top3[0] && { r: top3[0], medal: { emoji: '🥇', color: GOLD, glow: '#ffc94740' }, first: true },
              top3[2] && { r: top3[2], medal: { emoji: '🥉', color: BRONZE, glow: '#cd8b4e30' } },
            ].filter(Boolean)

            return (
              <div key={mapName} style={{ marginBottom: 22 }}>
                {podiumMaps.length > 1 && (
                  <div style={{ textAlign: 'center', fontSize: 11, color: MUTED, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 14 }}>
                    ── {mapName} ──
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 8 }}>
                  {podium.map(({ r, medal, first }) => (
                    <div key={r.id} style={{
                      background: CARD,
                      border: `2px solid ${medal.color}`,
                      borderRadius: 14,
                      padding: first ? '20px 10px 14px' : '13px 10px 14px',
                      width: first ? 122 : 102,
                      textAlign: 'center',
                      boxShadow: `0 0 30px ${medal.glow}, 0 4px 20px rgba(0,0,0,0.5)`,
                    }}>
                      <div style={{ fontSize: first ? 34 : 26, lineHeight: 1 }}>{medal.emoji}</div>
                      <div style={{ fontWeight: 700, fontSize: 13, marginTop: 6, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.riders?.name}
                      </div>
                      <div style={{ color: medal.color, fontSize: first ? 20 : 17, fontWeight: 800, marginTop: 3 }}>
                        {Number(r.lap_time).toFixed(2)}s
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
          <div style={{ height: 1, background: BORDER, margin: '4px 0 16px' }} />
        </div>
      )}

      {/* RESULTS */}
      <div style={{ padding: '0 12px 80px', maxWidth: 500, margin: '0 auto' }}>
        {filteredData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 20px', color: MUTED }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>🏁</div>
            <div style={{ fontSize: 17, marginBottom: 8, color: TEXT }}>No results yet</div>
            <Link href="/submit" style={{ color: GREEN, fontSize: 14 }}>
              Be the first to submit a run →
            </Link>
          </div>
        ) : filteredData.map((r, i) => {
          const rankColor = i === 0 ? GOLD : i === 1 ? SILVER : i === 2 ? BRONZE : null
          const videoId = ytId(r.youtube_url)

          return (
            <div key={r.id} style={{
              background: CARD,
              borderRadius: 12,
              padding: '13px 14px',
              marginBottom: 8,
              border: `1px solid ${rankColor ? rankColor + '40' : BORDER}`,
              borderLeft: `3px solid ${rankColor || BORDER}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Rank badge */}
                <div style={{
                  width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                  background: rankColor ? `${rankColor}18` : '#ffffff07',
                  border: `1px solid ${rankColor ? rankColor + '55' : '#ffffff10'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 14, color: rankColor || MUTED,
                }}>
                  {i + 1}
                </div>

                {/* Name + meta */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.riders?.name}
                  </div>
                  <div style={{ fontSize: 12, color: MUTED, marginTop: 2, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <span>🏁 {r.map_name}</span>
                    {r.bike && <span>🏍 {r.bike}</span>}
                  </div>
                </div>

                {/* Time */}
                <div style={{ color: GREEN, fontWeight: 800, fontSize: 19, flexShrink: 0 }}>
                  {Number(r.lap_time).toFixed(2)}s
                </div>
              </div>

              {videoId && (
                <div
                  onClick={() => setModalVideo(videoId)}
                  style={{ marginTop: 10, position: 'relative', cursor: 'pointer', borderRadius: 8, overflow: 'hidden' }}
                >
                  <img
                    src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                    style={{ width: '100%', display: 'block' }}
                    alt="Run video"
                  />
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.35)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%',
                      background: 'rgba(255,255,255,0.92)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <div style={{ width: 0, height: 0, borderTop: '9px solid transparent', borderBottom: '9px solid transparent', borderLeft: '16px solid #000', marginLeft: 4 }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* VIDEO MODAL */}
      {modalVideo && (
        <div
          onClick={() => setModalVideo(null)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, padding: 16,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 860, aspectRatio: '16/9', borderRadius: 12, overflow: 'hidden' }}
          >
            <iframe
              width="100%" height="100%"
              src={`https://www.youtube.com/embed/${modalVideo}?autoplay=1`}
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
              style={{ border: 'none', display: 'block' }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function FilterRow({ children, style }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8, ...style }}>
      {children}
    </div>
  )
}

function Chip({ label, icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '5px 12px', height: 30, borderRadius: 20,
        border: `1px solid ${active ? GREEN : BORDER}`,
        background: active ? 'rgba(0,255,153,0.12)' : 'transparent',
        color: active ? GREEN : MUTED,
        cursor: 'pointer', fontSize: 12,
        fontWeight: active ? 600 : 400,
        whiteSpace: 'nowrap',
      }}
    >
      {icon && <span style={{ marginRight: 2 }}>{icon}</span>}
      {label}
    </button>
  )
}
