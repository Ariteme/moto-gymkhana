'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { use } from 'react'

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

export default function RiderProfile({ params }) {
  const { name } = use(params)
  const riderName = decodeURIComponent(name)

  const [runs, setRuns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('results')
      .select('id, map_name, lap_time, bike, youtube_url, created_at, riders!inner(name)')
      .eq('approved', true)
      .eq('riders.name', riderName)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setRuns(data || [])
        setLoading(false)
      })
  }, [riderName])

  // Derived stats
  const bestPerMap = {}
  for (const r of runs) {
    if (!bestPerMap[r.map_name] || r.lap_time < bestPerMap[r.map_name].lap_time) {
      bestPerMap[r.map_name] = r
    }
  }
  const sortedMaps = Object.entries(bestPerMap).sort((a, b) => a[0].localeCompare(b[0]))
  const overallBest = runs.length ? [...runs].sort((a, b) => a.lap_time - b.lap_time)[0] : null
  const bikes = [...new Set(runs.map(r => r.bike).filter(Boolean))]
  const initials = riderName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  function ytId(url) {
    if (!url) return null
    if (url.includes('watch?v=')) return url.split('v=')[1].split('&')[0]
    if (url.includes('youtu.be/')) return url.split('youtu.be/')[1]
    return null
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('en-IL', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div style={{ background: '#030508', minHeight: '100vh', fontFamily: 'var(--font-geist-sans, Arial, sans-serif)' }}>
    <div style={{ maxWidth: 700, margin: '0 auto', background: BG, minHeight: '100vh', color: TEXT, boxShadow: '0 0 80px rgba(0,0,0,0.7)' }}>

      {/* HEADER */}
      <div style={{ background: `linear-gradient(180deg, #0a1020 0%, ${SURFACE} 100%)`, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ height: 4, background: `linear-gradient(90deg, ${BLUE}, ${GREEN}, ${BLUE})` }} />
        <div style={{ padding: '14px 16px 20px' }}>
          <Link href="/" style={{ color: MUTED, fontSize: 13, padding: '6px 10px', border: `1px solid ${BORDER}`, borderRadius: 8 }}>
            ← Leaderboard
          </Link>

          {/* Avatar + name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 20 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: `linear-gradient(135deg, ${BLUE}, ${GREEN})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, fontWeight: 800, color: '#000', flexShrink: 0,
            }}>
              {initials}
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: TEXT }}>{riderName}</h1>
              <div style={{ fontSize: 13, color: MUTED, marginTop: 3 }}>
                {bikes.length > 0 ? bikes.join(' · ') : 'Rider'}
              </div>
            </div>
          </div>

          {/* Stat pills */}
          {!loading && (
            <div style={{ display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap' }}>
              <StatPill label="Runs" value={runs.length} />
              <StatPill label="Maps" value={sortedMaps.length} />
              {overallBest && <StatPill label="Best time" value={`${Number(overallBest.lap_time).toFixed(2)}s`} color={GREEN} />}
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 60, color: MUTED }}>Loading...</div>
      )}

      {!loading && runs.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: MUTED }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏍️</div>
          <div>No approved runs yet</div>
        </div>
      )}

      {!loading && runs.length > 0 && (
        <div style={{ padding: '20px 14px 60px' }}>

          {/* BEST TIMES PER MAP */}
          <SectionTitle>Best times per map</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
            {sortedMaps.map(([mapName, run], i) => (
              <div key={mapName} style={{
                background: CARD, borderRadius: 12, padding: '12px 14px',
                border: `1px solid ${i === 0 ? GOLD + '40' : BORDER}`,
                borderLeft: `3px solid ${i === 0 ? GOLD : BORDER}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15, color: TEXT }}>🏁 {mapName}</div>
                  {run.bike && <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>🏍 {run.bike}</div>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  {ytId(run.youtube_url) && (
                    <a
                      href={run.youtube_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: MUTED, fontSize: 18 }}
                      title="Watch run"
                    >
                      ▶
                    </a>
                  )}
                  <div style={{ color: i === 0 ? GOLD : GREEN, fontWeight: 800, fontSize: 20 }}>
                    {Number(run.lap_time).toFixed(2)}s
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ALL RUNS */}
          <SectionTitle>All runs ({runs.length})</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {runs.map((r, i) => {
              const videoId = ytId(r.youtube_url)
              return (
                <div key={r.id} style={{
                  background: CARD, borderRadius: 12, overflow: 'hidden',
                  border: `1px solid ${BORDER}`,
                }}>
                  {videoId && (
                    <a href={r.youtube_url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', position: 'relative' }}>
                      <img
                        src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                        style={{ width: '100%', display: 'block', aspectRatio: '16/9', objectFit: 'cover' }}
                        alt="Run video"
                      />
                      <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.65) 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ width: 0, height: 0, borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderLeft: '14px solid #000', marginLeft: 3 }} />
                        </div>
                      </div>
                    </a>
                  )}
                  <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: TEXT }}>🏁 {r.map_name}</div>
                      <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{formatDate(r.created_at)}</div>
                    </div>
                    <div style={{ color: GREEN, fontWeight: 800, fontSize: 18 }}>
                      {Number(r.lap_time).toFixed(2)}s
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

function StatPill({ label, value, color }) {
  return (
    <div style={{
      background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10,
      padding: '8px 14px', textAlign: 'center', minWidth: 70,
    }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: color || TEXT }}>{value}</div>
      <div style={{ fontSize: 11, color: MUTED, marginTop: 1 }}>{label}</div>
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <div style={{ fontSize: 11, color: MUTED, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>
      {children}
    </div>
  )
}
