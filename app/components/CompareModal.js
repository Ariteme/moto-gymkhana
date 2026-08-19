'use client'

import { useRef, useCallback, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const CARD   = '#101821'
const BORDER = '#1a2840'
const GREEN  = '#00ff99'
const BLUE   = '#1a5cff'
const TEXT   = '#dce8f4'
const MUTED  = '#7a90a8'
const GOLD   = '#ffc947'

function ytId(url) {
  if (!url) return null
  if (url.includes('watch?v=')) return url.split('v=')[1].split('&')[0]
  if (url.includes('youtu.be/')) return url.split('youtu.be/')[1].split('?')[0]
  if (url.includes('/shorts/')) return url.split('/shorts/')[1].split('?')[0]
  return null
}

function formatDate(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-IL', { day: 'numeric', month: 'short', year: 'numeric' })
}

function ytCmd(iframeRef, func, args = []) {
  iframeRef.current?.contentWindow?.postMessage(
    JSON.stringify({ event: 'command', func, args }),
    'https://www.youtube.com'
  )
}

// Best run per map keyed by map name
function bestPerMap(runs) {
  return (runs || []).reduce((acc, r) => {
    if (!acc[r.map_name] || Number(r.lap_time) < Number(acc[r.map_name].lap_time)) acc[r.map_name] = r
    return acc
  }, {})
}

// ─── Comparison table ────────────────────────────────────────────────────────

function CompareTable({ run1, run2 }) {
  const t1 = Number(run1.lap_time)
  const t2 = Number(run2.lap_time)
  const delta   = Math.abs(t1 - t2).toFixed(2)
  const faster  = t1 <= t2 ? run1 : run2

  const rows = [
    { label: 'TIME', v1: `${t1.toFixed(2)}s`, v2: `${t2.toFixed(2)}s`, big: true },
    { label: 'MAP',  v1: run1.map_name,        v2: run2.map_name },
    ...(run1.bike || run2.bike
      ? [{ label: 'BIKE', v1: run1.bike || '—', v2: run2.bike || '—' }]
      : []),
    ...(run1.created_at || run2.created_at
      ? [{ label: 'DATE', v1: formatDate(run1.created_at) || '—', v2: formatDate(run2.created_at) || '—' }]
      : []),
  ]

  const colLabel  = { padding: '9px 10px 9px 14px', color: MUTED, fontSize: 10, fontWeight: 700, letterSpacing: 1, display: 'flex', alignItems: 'center' }
  const colBorder = `1px solid ${BORDER}22`

  return (
    <div style={{ background: CARD, borderRadius: 14, overflow: 'hidden', border: `1px solid ${BORDER}`, marginBottom: 14 }}>

      {/* Header: rider names */}
      <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr', background: '#080e18', borderBottom: `1px solid ${BORDER}` }}>
        <div />
        {[run1, run2].map(run => {
          const isFaster = run === faster
          return (
            <div key={run.id} style={{ padding: '7px 10px', borderLeft: colBorder, borderTop: `3px solid ${isFaster ? GREEN : BORDER}`, display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              <div style={{ color: isFaster ? GREEN : TEXT, fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {run.riders?.name}
              </div>
              {isFaster && <span style={{ fontSize: 9, color: GREEN, fontWeight: 700, letterSpacing: 0.5, flexShrink: 0 }}>✓</span>}
            </div>
          )
        })}
      </div>

      {/* Data rows */}
      {rows.map(({ label, v1, v2, big }, i) => (
        <div key={label} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr', borderBottom: i < rows.length - 1 ? colBorder : 'none' }}>
          <div style={colLabel}>{label}</div>
          <div style={{ padding: '9px 14px', borderLeft: colBorder, color: big && run1 === faster ? GREEN : TEXT, fontWeight: big ? 800 : 400, fontSize: big ? 20 : 13, display: 'flex', alignItems: 'center' }}>{v1}</div>
          <div style={{ padding: '9px 14px', borderLeft: colBorder, color: big && run2 === faster ? GREEN : TEXT, fontWeight: big ? 800 : 400, fontSize: big ? 20 : 13, display: 'flex', alignItems: 'center' }}>{v2}</div>
        </div>
      ))}

      {/* Delta footer */}
      <div style={{ padding: '9px 14px', textAlign: 'center', background: GOLD + '10', borderTop: `1px solid ${GOLD}22`, fontSize: 13 }}>
        <span style={{ color: GOLD, fontWeight: 700 }}>{faster.riders?.name}</span>
        <span style={{ color: MUTED }}> is faster by </span>
        <span style={{ color: GOLD, fontWeight: 900, fontSize: 16 }}>{delta}s</span>
      </div>
    </div>
  )
}

// ─── Main modal ──────────────────────────────────────────────────────────────

export default function CompareModal({ runs, onClose, initialT1 = 0, initialT2 = 0 }) {
  const ref1 = useRef(null)
  const ref2 = useRef(null)

  const [rawT1, setRawT1] = useState(String(initialT1))
  const [rawT2, setRawT2] = useState(String(initialT2))
  const t1 = Math.max(0, parseInt(rawT1, 10) || 0)
  const t2 = Math.max(0, parseInt(rawT2, 10) || 0)

  const [copied,      setCopied]      = useState(false)
  const [cinemaMode,  setCinemaMode]  = useState(false)
  const [isLandscape, setIsLandscape] = useState(true)
  const [isWide,      setIsWide]      = useState(false)
  const [isPlaying,   setIsPlaying]   = useState(false)

  // Active runs (may change when user switches map)
  const [activeRun1, setActiveRun1] = useState(runs[0])
  const [activeRun2, setActiveRun2] = useState(runs[1])

  // Map switching: fetch best-per-map for each rider
  const [riderMaps, setRiderMaps]   = useState(null)  // { r1: {mapName: run}, r2: ... }
  const [selectedMap, setSelectedMap] = useState(
    runs[0]?.map_name === runs[1]?.map_name ? runs[0]?.map_name : null
  )

  // Live timecode capture from YouTube postMessage
  const [liveT1, setLiveT1]   = useState(null)
  const [liveT2, setLiveT2]   = useState(null)
  const playerIdMap = useRef({})
  const seenIds     = useRef([])

  const seeked = useRef(false)

  const vid1 = ytId(activeRun1?.youtube_url)
  const vid2 = ytId(activeRun2?.youtube_url)
  const bothHaveVideo = vid1 && vid2

  // Extracted for stable useEffect deps (avoids optional-chaining in dep arrays)
  const run0Id     = runs[0]?.id
  const run1Id     = runs[1]?.id
  const riderName1 = runs[0]?.riders?.name
  const riderName2 = runs[1]?.riders?.name

  // ── Orientation / body scroll lock ────────────────────────────────────────
  useEffect(() => {
    const mq = window.matchMedia('(orientation: landscape)')
    setIsLandscape(mq.matches)
    const h1 = e => setIsLandscape(e.matches)
    mq.addEventListener('change', h1)

    const mqW = window.matchMedia('(min-width: 900px)')
    setIsWide(mqW.matches)
    const h2 = e => setIsWide(e.matches)
    mqW.addEventListener('change', h2)

    screen.orientation?.lock?.('landscape').catch(() => {})
    document.body.style.overflow = 'hidden'

    return () => {
      mq.removeEventListener('change', h1)
      mqW.removeEventListener('change', h2)
      screen.orientation?.unlock?.()
      document.body.style.overflow = ''
    }
  }, [])

  // ── Fetch all runs for both riders (for map switching) ────────────────────
  useEffect(() => {
    if (!riderName1 || !riderName2) return

    Promise.all([
      supabase.from('results')
        .select('id, map_name, lap_time, bike, youtube_url, created_at, riders!inner(name)')
        .eq('approved', true).eq('riders.name', riderName1),
      supabase.from('results')
        .select('id, map_name, lap_time, bike, youtube_url, created_at, riders!inner(name)')
        .eq('approved', true).eq('riders.name', riderName2),
    ]).then(([res1, res2]) => {
      setRiderMaps({ r1: bestPerMap(res1.data), r2: bestPerMap(res2.data) })
    })
  }, [run0Id, run1Id, riderName1, riderName2])

  // Maps where BOTH riders have an approved run
  const commonMaps = riderMaps
    ? Object.keys(riderMaps.r1).filter(m => riderMaps.r2[m]).sort()
    : []

  function selectMap(mapName) {
    setSelectedMap(mapName)
    setActiveRun1(riderMaps.r1[mapName])
    setActiveRun2(riderMaps.r2[mapName])
    seeked.current = false
    setCinemaMode(false)
    setIsPlaying(false)
    setRawT1('0')
    setRawT2('0')
    setLiveT1(null)
    setLiveT2(null)
    playerIdMap.current = {}
    seenIds.current = []
  }

  // ── YouTube postMessage live timecode ──────────────────────────────────────
  useEffect(() => {
    if (!vid1 || !vid2) return

    const subTimer = setTimeout(() => {
      ref1.current?.contentWindow?.postMessage(JSON.stringify({ event: 'listening' }), 'https://www.youtube.com')
      ref2.current?.contentWindow?.postMessage(JSON.stringify({ event: 'listening' }), 'https://www.youtube.com')
    }, 2500)

    const handler = (event) => {
      if (event.origin !== 'https://www.youtube.com') return
      let data
      try { data = JSON.parse(event.data) } catch { return }
      const msgId = data.id
      if (msgId === undefined) return
      if (!playerIdMap.current[msgId]) {
        seenIds.current.push(msgId)
        playerIdMap.current[msgId] = seenIds.current.length === 1 ? 'p1' : 'p2'
      }
      if (data.event === 'infoDelivery' && data.info?.currentTime !== undefined) {
        const secs = Math.floor(data.info.currentTime)
        if (playerIdMap.current[msgId] === 'p1') setLiveT1(p => p === secs ? p : secs)
        else if (playerIdMap.current[msgId] === 'p2') setLiveT2(p => p === secs ? p : secs)
      }
    }

    window.addEventListener('message', handler)
    return () => { clearTimeout(subTimer); window.removeEventListener('message', handler) }
  }, [vid1, vid2])   // re-subscribe when videos change (map switch)

  // ── Playback controls ──────────────────────────────────────────────────────
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      ytCmd(ref1, 'pauseVideo'); ytCmd(ref2, 'pauseVideo')
      setIsPlaying(false)
    } else {
      if (!seeked.current) {
        ytCmd(ref1, 'seekTo', [t1, true]); ytCmd(ref2, 'seekTo', [t2, true])
        seeked.current = true
        setTimeout(() => { ytCmd(ref1, 'playVideo'); ytCmd(ref2, 'playVideo') }, 150)
      } else {
        ytCmd(ref1, 'playVideo'); ytCmd(ref2, 'playVideo')
      }
      setIsPlaying(true)
    }
  }, [isPlaying, t1, t2])

  const restartBoth = useCallback(() => {
    seeked.current = true
    ytCmd(ref1, 'seekTo', [t1, true]); ytCmd(ref2, 'seekTo', [t2, true])
    setTimeout(() => { ytCmd(ref1, 'playVideo'); ytCmd(ref2, 'playVideo') }, 150)
    setIsPlaying(true)
  }, [t1, t2])

  const handleShare = useCallback(async () => {
    const url = `https://moto-gymkhana.vercel.app/compare?r1=${activeRun1.id}&r2=${activeRun2.id}&t1=${t1}&t2=${t2}`
    try {
      if (navigator.share) {
        await navigator.share({ title: `${activeRun1.riders?.name} vs ${activeRun2.riders?.name}`, url })
      } else {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch { /* cancelled */ }
  }, [activeRun1, activeRun2, t1, t2])

  if (!activeRun1 || !activeRun2) return null

  const inputStyle = {
    width: 56, background: '#07090f', border: `1px solid ${BORDER}`,
    borderRadius: 6, padding: '4px 8px', color: TEXT, fontSize: 13, textAlign: 'center',
  }

  const videoEntries = [
    { ref: ref1, vid: vid1, run: activeRun1, rawT: rawT1, setRawT: setRawT1, live: liveT1 },
    { ref: ref2, vid: vid2, run: activeRun2, rawT: rawT2, setRawT: setRawT2, live: liveT2 },
  ]

  return (
    <div
      onClick={cinemaMode ? () => setCinemaMode(false) : onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 1000, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: isWide && cinemaMode ? 'none' : 700, margin: '0 auto', padding: '16px 12px 40px', fontFamily: 'var(--font-geist-sans, Arial, sans-serif)' }}
      >

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ color: TEXT, fontWeight: 700, fontSize: 16 }}>⚖ Run Comparison</div>
          <button onClick={onClose} style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '6px 12px', color: MUTED, cursor: 'pointer', fontSize: 14 }}>✕ Close</button>
        </div>

        {/* Collapsible section: table + map selector */}
        <div style={{ maxHeight: cinemaMode ? 0 : '600px', overflow: 'hidden', transition: 'max-height 0.35s ease' }}>

          <CompareTable run1={activeRun1} run2={activeRun2} />

          {/* Map selector — only when both riders share at least one map */}
          {commonMaps.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: MUTED, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
                🗺 Switch map
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {commonMaps.map(mapName => {
                  const active = mapName === selectedMap
                  return (
                    <button
                      key={mapName}
                      onClick={() => selectMap(mapName)}
                      style={{
                        background: active ? BLUE : 'transparent',
                        border: `1px solid ${active ? BLUE : BORDER}`,
                        borderRadius: 20, padding: '5px 12px',
                        color: active ? '#fff' : MUTED,
                        fontSize: 12, cursor: 'pointer', fontWeight: active ? 600 : 400,
                        transition: 'all 0.15s',
                      }}
                    >
                      {mapName}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Videos */}
        {bothHaveVideo && (
          <>
            {!isLandscape && (
              <div style={{ textAlign: 'center', padding: '7px 12px', background: GOLD + '18', border: `1px solid ${GOLD}33`, borderRadius: 8, marginBottom: 10, fontSize: 12, color: GOLD }}>
                🔄 Rotate your phone for a better view
              </div>
            )}

            {/* Videos */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: isWide ? 16 : 6, marginBottom: 14 }}>
              {videoEntries.map(({ ref, vid, run }) => (
                <div key={run.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ fontSize: 11, color: MUTED, marginBottom: 4, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                    {run.riders?.name} · {Number(run.lap_time).toFixed(2)}s
                  </div>
                  <iframe
                    ref={ref}
                    src={`https://www.youtube.com/embed/${vid}?enablejsapi=1&rel=0&modestbranding=1`}
                    style={{
                      aspectRatio: '9/16', border: 'none', borderRadius: 8, display: 'block', background: '#000',
                      transition: 'height 0.35s ease, width 0.35s ease',
                      ...(isWide && cinemaMode
                        ? { height: 'calc(100vh - 120px)', width: 'auto' }
                        : { width: '100%' }),
                    }}
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                  />
                </div>
              ))}
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
              <button onClick={restartBoth} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '8px 14px', color: TEXT, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                ⏮ Restart
              </button>
              <button onClick={togglePlay} style={{ background: isPlaying ? GREEN + '22' : CARD, border: `1px solid ${isPlaying ? GREEN + '66' : BORDER}`, borderRadius: 8, padding: '8px 18px', color: isPlaying ? GREEN : TEXT, cursor: 'pointer', fontSize: 13, fontWeight: 700, minWidth: 90 }}>
                {isPlaying ? '⏸ Pause' : '▶ Play'}
              </button>
              <div style={{ width: 1, height: 28, background: BORDER }} />
              <button
                onClick={() => setCinemaMode(v => !v)}
                title={cinemaMode ? 'Show stats' : 'Hide stats / expand videos'}
                style={{ background: cinemaMode ? BLUE + '22' : CARD, border: `1px solid ${cinemaMode ? BLUE + '66' : BORDER}`, borderRadius: 8, padding: '8px 12px', color: cinemaMode ? BLUE : MUTED, cursor: 'pointer', fontSize: 13 }}
              >
                {cinemaMode ? '▼' : '▲'}
              </button>
              <div style={{ width: 1, height: 28, background: BORDER }} />
              <button
                onClick={handleShare}
                style={{ background: CARD, border: `1px solid ${copied ? GREEN + '66' : BORDER}`, borderRadius: 8, padding: '8px 14px', color: copied ? GREEN : MUTED, cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'color 0.2s, border-color 0.2s' }}
              >
                {copied ? '✓ Copied!' : '🔗 Share'}
              </button>
            </div>

            {/* Start points */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 10, flexWrap: 'wrap' }}>
              {videoEntries.map(({ run, rawT, setRawT, live }) => (
                <div key={run.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, color: MUTED, fontWeight: 600 }}>{run.riders?.name}</span>
                  <span style={{ fontSize: 11, color: MUTED }}>start</span>
                  <input
                    type="text" inputMode="numeric" pattern="[0-9]*"
                    value={rawT}
                    onChange={e => { seeked.current = false; setIsPlaying(false); setRawT(e.target.value.replace(/[^0-9]/g, '')) }}
                    style={inputStyle}
                  />
                  <span style={{ fontSize: 11, color: MUTED }}>s</span>
                  {live !== null && (
                    <button
                      onClick={() => { seeked.current = false; setIsPlaying(false); setRawT(String(live)) }}
                      title="Capture current video time"
                      style={{ background: BLUE + '22', border: `1px solid ${BLUE}55`, borderRadius: 6, padding: '3px 7px', color: BLUE, cursor: 'pointer', fontSize: 11, fontWeight: 700 }}
                    >
                      📍 {live}s
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'center', fontSize: 11, color: MUTED }}>
              Play each video, pause where you want the sync to start, tap 📍 to save that moment — then ⏮ Restart plays both from those points.
            </div>
          </>
        )}

        {/* One has video */}
        {(vid1 || vid2) && !bothHaveVideo && (
          <>
            <div style={{ background: CARD, borderRadius: 12, overflow: 'hidden', border: `1px solid ${BORDER}` }}>
              <div style={{ fontSize: 12, color: MUTED, padding: '8px 12px' }}>
                {vid1 ? `▶ ${activeRun1.riders?.name}'s video` : `▶ ${activeRun2.riders?.name}'s video`}
              </div>
              <iframe
                src={`https://www.youtube.com/embed/${vid1 || vid2}?rel=0&modestbranding=1`}
                style={{ width: '100%', aspectRatio: '9/16', border: 'none', display: 'block' }}
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
              <div style={{ padding: '10px 12px', fontSize: 12, color: MUTED }}>
                No video for {!vid1 ? activeRun1.riders?.name : activeRun2.riders?.name}
              </div>
            </div>
            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <button onClick={handleShare} style={{ background: CARD, border: `1px solid ${copied ? GREEN + '66' : BORDER}`, borderRadius: 10, padding: '10px 20px', color: copied ? GREEN : MUTED, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                {copied ? '✓ Link copied!' : '🔗 Share comparison'}
              </button>
            </div>
          </>
        )}

        {/* No videos */}
        {!vid1 && !vid2 && (
          <div style={{ textAlign: 'center' }}>
            <button onClick={handleShare} style={{ background: CARD, border: `1px solid ${copied ? GREEN + '66' : BORDER}`, borderRadius: 10, padding: '10px 20px', color: copied ? GREEN : TEXT, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
              {copied ? '✓ Link copied!' : '🔗 Share this comparison'}
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
