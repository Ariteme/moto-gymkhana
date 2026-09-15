'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useLang, LangSwitcher } from '@/lib/LangContext'
import { calcClass, CLASS_COLORS } from '@/lib/gymkhana'

const BG = '#07090f'
const SURFACE = '#0c1118'
const CARD = '#101821'
const BORDER = '#1a2840'
const GREEN = '#00ff99'
const BLUE = '#1a5cff'
const TEXT = '#dce8f4'
const MUTED = '#7a90a8'
const GOLD = '#ffc947'

function fmtDate(str) {
  return new Date(str).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function daysStatus(endStr) {
  const left = Math.ceil((new Date(endStr) - Date.now()) / 86400000)
  if (left > 0) return `${left}d left`
  return `ended ${Math.abs(left)}d ago`
}

function ClassBadge({ pct }) {
  const cls = calcClass(pct, 100)
  if (!cls) return null
  const c = CLASS_COLORS[cls]
  return (
    <span style={{
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
      borderRadius: 5, padding: '1px 5px', fontSize: 10, fontWeight: 800, letterSpacing: 0.5,
    }}>
      {cls}
    </span>
  )
}

function RiderRow({ rider, totalRiders }) {
  return (
    <div style={{
      background: SURFACE, borderRadius: 10, padding: '10px 12px',
      border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 8, flexShrink: 0,
        background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: TEXT, lineHeight: 1 }}>{rider.rank}</span>
        <span style={{ fontSize: 9, color: MUTED, lineHeight: 1 }}>/{totalRiders}</span>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {rider.name}
        </div>
        <div style={{ fontSize: 11, color: MUTED, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {[rider.bike, rider.city].filter(Boolean).join(' · ')}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {rider.pct && <ClassBadge pct={rider.pct} />}
          {rider.youtubeUrl && (
            <a href={rider.youtubeUrl} target="_blank" rel="noopener noreferrer"
              style={{ color: MUTED, fontSize: 15, lineHeight: 1 }}>▶</a>
          )}
          <span style={{ color: GREEN, fontWeight: 800, fontSize: 16 }}>{rider.finalTimeStr}</span>
        </div>
        {rider.pct && (
          <span style={{ fontSize: 11, color: MUTED }}>{rider.pct.toFixed(2)}% of leader</span>
        )}
      </div>
    </div>
  )
}

function RoundResults({ results, loading }) {
  if (loading) return <div style={{ color: MUTED, fontSize: 13, textAlign: 'center', padding: '16px 0' }}>Loading…</div>
  if (!results) return null
  const { ilRiders, totalRiders } = results
  if (!ilRiders?.length) {
    return <div style={{ color: MUTED, fontSize: 13, textAlign: 'center', padding: '12px 0' }}>No Israeli riders in this round</div>
  }
  return (
    <div>
      <div style={{ fontSize: 11, color: MUTED, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>
        🇮🇱 Israel — {ilRiders.length} of {totalRiders} riders globally
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {ilRiders.map(r => <RiderRow key={r.olcRiderId} rider={r} totalRiders={totalRiders} />)}
      </div>
    </div>
  )
}

export default function OlcPage() {
  const { lang } = useLang()
  const [rounds, setRounds] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingPast, setLoadingPast] = useState(true)
  const [error, setError] = useState(null)
  const [resultsMap, setResultsMap] = useState({})
  const [loadingResults, setLoadingResults] = useState({})
  const [expanded, setExpanded] = useState({})

  useEffect(() => {
    fetch('/api/olc?action=rounds')
      .then(r => r.json())
      .then(data => {
        const rds = data.rounds || []
        setRounds(rds)
        setLoading(false)
        const current = rds.find(r => r.isCurrent) ?? rds[0]
        const past = rds.filter(r => r.id !== current?.id)
        // Auto-load current round results
        if (current) loadResults(current.id)
        // Eagerly fetch all past rounds to filter out ones without IL riders
        Promise.allSettled(
          past.map(r => fetch(`/api/olc?action=results&id=${r.id}`).then(res => res.json()))
        ).then(results => {
          const map = {}
          past.forEach((r, i) => {
            if (results[i].status === 'fulfilled') map[r.id] = results[i].value
          })
          setResultsMap(prev => ({ ...prev, ...map }))
          setLoadingPast(false)
        })
      })
      .catch(e => { setError(e.message); setLoading(false); setLoadingPast(false) })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function loadResults(id) {
    if (resultsMap[id] || loadingResults[id]) return
    setLoadingResults(prev => ({ ...prev, [id]: true }))
    fetch(`/api/olc?action=results&id=${id}`)
      .then(r => r.json())
      .then(data => {
        setResultsMap(prev => ({ ...prev, [id]: data }))
        setLoadingResults(prev => ({ ...prev, [id]: false }))
      })
      .catch(() => setLoadingResults(prev => ({ ...prev, [id]: false })))
  }

  function toggleRound(id) {
    const opening = !expanded[id]
    setExpanded(prev => ({ ...prev, [id]: opening }))
    if (opening) loadResults(id)
  }

  const current = rounds.find(r => r.isCurrent) ?? rounds[0]
  const allPast = rounds.filter(r => r !== current)
  // Only show past rounds where Israeli riders participated
  const past = allPast.filter(r => (resultsMap[r.id]?.ilRiders?.length ?? -1) > 0)

  return (
    <div style={{ background: '#030508', minHeight: '100vh', fontFamily: 'var(--font-geist-sans, Arial, sans-serif)' }}>
      <div style={{ maxWidth: 700, margin: '0 auto', background: BG, minHeight: '100vh', color: TEXT, boxShadow: '0 0 80px rgba(0,0,0,0.7)' }}>

        {/* HEADER */}
        <div style={{ background: `linear-gradient(180deg, #0a1020 0%, ${SURFACE} 100%)`, borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ height: 4, background: `linear-gradient(90deg, ${BLUE}, ${GREEN}, ${BLUE})` }} />
          <div style={{ padding: '16px 16px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/" style={{ color: MUTED, fontSize: 13, textDecoration: 'none', flexShrink: 0 }}>
              {lang === 'ru' ? '← Назад' : '← Back'}
            </Link>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ color: BLUE, fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', fontWeight: 700, marginBottom: 3 }}>
                mgym.fun · OLC
              </div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: TEXT }}>
                🌍 {lang === 'ru' ? 'Польский OLC' : 'Polish OLC'}
              </h1>
              <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>
                {lang === 'ru' ? 'Израильские гонщики' : 'Israeli riders'}
              </div>
            </div>
            <LangSwitcher />
          </div>
        </div>

        {loading && <div style={{ textAlign: 'center', padding: '64px 20px', color: MUTED }}>Loading…</div>}
        {error && <div style={{ textAlign: 'center', padding: '64px 20px', color: '#ff6b6b' }}>Failed to load: {error}</div>}

        {!loading && !error && (
          <div style={{ padding: '16px 14px 56px', display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* CURRENT / MOST RECENT ROUND */}
            {current && (
              <div style={{ background: CARD, borderRadius: 16, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {current.mapUrl && <img src={current.mapUrl} alt={current.name} style={{ width: '100%', display: 'block' }} />}
                <div style={{ padding: '14px 16px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{ fontWeight: 800, fontSize: 17, color: TEXT, flex: 1 }}>{current.name}</div>
                    {current.isCurrent && (
                      <span style={{ background: 'rgba(0,255,153,0.15)', color: GREEN, border: `1px solid ${GREEN}40`, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>
                        LIVE
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: MUTED, marginBottom: 16 }}>
                    {fmtDate(current.startDate)} – {fmtDate(current.endDate)} · {daysStatus(current.endDate)}
                  </div>
                  <RoundResults results={resultsMap[current.id]} loading={!!loadingResults[current.id]} />
                </div>
              </div>
            )}

            {/* PAST ROUNDS */}
            {(loadingPast || past.length > 0) && (
              <div>
                <div style={{ fontSize: 11, color: MUTED, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>
                  {lang === 'ru' ? 'Прошлые раунды' : 'Past rounds'}
                  {loadingPast && <span style={{ marginLeft: 8, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>loading…</span>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {past.map(round => {
                    const isOpen = !!expanded[round.id]
                    const res = resultsMap[round.id]
                    const isLoading = !!loadingResults[round.id]
                    return (
                      <div key={round.id} style={{ background: CARD, borderRadius: 12, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
                        <button
                          onClick={() => toggleRound(round.id)}
                          style={{ width: '100%', background: 'none', border: 'none', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: TEXT }}
                        >
                          <div style={{ flex: 1, textAlign: 'left' }}>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>{round.name}</div>
                            <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>
                              {fmtDate(round.startDate)} – {fmtDate(round.endDate)}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                            {res && (
                              <span style={{ fontSize: 12, color: MUTED }}>🇮🇱 {res.ilRiders?.length ?? 0}</span>
                            )}
                            <span style={{ color: MUTED, fontSize: 13 }}>{isOpen ? '▲' : '▼'}</span>
                          </div>
                        </button>

                        {isOpen && (
                          <div style={{ borderTop: `1px solid ${BORDER}` }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            {round.mapUrl && <img src={round.mapUrl} alt={round.name} style={{ width: '100%', display: 'block' }} />}
                            <div style={{ padding: '12px 14px 16px' }}>
                              <RoundResults results={res} loading={isLoading} />
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div style={{ textAlign: 'center', fontSize: 11, color: MUTED }}>
              Data from{' '}
              <a href="https://mgym.fun/online/Competitions.php" target="_blank" rel="noopener noreferrer" style={{ color: MUTED }}>mgym.fun</a>
              {' · '}updated hourly
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
