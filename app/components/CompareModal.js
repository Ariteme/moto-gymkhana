'use client'

import { useRef, useCallback, useState, useEffect } from 'react'

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

export default function CompareModal({ runs, onClose, initialT1 = 0, initialT2 = 0 }) {
  const ref1 = useRef(null)
  const ref2 = useRef(null)
  // Raw string state so the input field can be fully cleared before retyping
  const [rawT1, setRawT1] = useState(String(initialT1))
  const [rawT2, setRawT2] = useState(String(initialT2))
  const t1 = Math.max(0, parseInt(rawT1, 10) || 0)
  const t2 = Math.max(0, parseInt(rawT2, 10) || 0)
  const [copied, setCopied] = useState(false)
  const seeked = useRef(false)

  // Live current-time display per video, read from YouTube postMessage
  const [liveT1, setLiveT1] = useState(null)
  const [liveT2, setLiveT2] = useState(null)
  const playerIdMap = useRef({})  // msgId -> 'p1' | 'p2'
  const seenIds = useRef([])

  const [isLandscape, setIsLandscape] = useState(true)
  const [isWide, setIsWide] = useState(false)
  const [cinemaMode, setCinemaMode] = useState(false)

  const [run1, run2] = runs
  const vid1 = ytId(run1?.youtube_url)
  const vid2 = ytId(run2?.youtube_url)
  const bothHaveVideo = vid1 && vid2

  useEffect(() => {
    const mq = window.matchMedia('(orientation: landscape)')
    setIsLandscape(mq.matches)
    const handler = e => setIsLandscape(e.matches)
    mq.addEventListener('change', handler)

    const mqWide = window.matchMedia('(min-width: 900px)')
    setIsWide(mqWide.matches)
    const handlerWide = e => setIsWide(e.matches)
    mqWide.addEventListener('change', handlerWide)
    screen.orientation?.lock?.('landscape').catch(() => {})

    // Prevent background page from scrolling while modal is open
    document.body.style.overflow = 'hidden'

    return () => {
      mq.removeEventListener('change', handler)
      mqWide.removeEventListener('change', handlerWide)
      screen.orientation?.unlock?.()
      document.body.style.overflow = ''
    }
  }, [])

  // Subscribe both iframes to YouTube info delivery so we can read current time
  useEffect(() => {
    if (!bothHaveVideo) return

    // Give iframes time to load before subscribing
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

      // Assign first-seen ID to p1, second to p2 (iframes load in DOM order)
      if (!playerIdMap.current[msgId]) {
        seenIds.current.push(msgId)
        playerIdMap.current[msgId] = seenIds.current.length === 1 ? 'p1' : 'p2'
      }

      if (data.event === 'infoDelivery' && data.info?.currentTime !== undefined) {
        const secs = Math.floor(data.info.currentTime)
        if (playerIdMap.current[msgId] === 'p1') setLiveT1(prev => prev === secs ? prev : secs)
        else if (playerIdMap.current[msgId] === 'p2') setLiveT2(prev => prev === secs ? prev : secs)
      }
    }

    window.addEventListener('message', handler)
    return () => {
      clearTimeout(subTimer)
      window.removeEventListener('message', handler)
    }
  }, [bothHaveVideo])

  const time1 = Number(run1?.lap_time)
  const time2 = Number(run2?.lap_time)
  const delta  = Math.abs(time1 - time2).toFixed(2)
  const faster = time1 <= time2 ? run1 : run2
  const slower = time1 <= time2 ? run2 : run1

  const playBoth = useCallback(() => {
    setCinemaMode(true)
    if (!seeked.current) {
      ytCmd(ref1, 'seekTo', [t1, true])
      ytCmd(ref2, 'seekTo', [t2, true])
      seeked.current = true
      setTimeout(() => { ytCmd(ref1, 'playVideo'); ytCmd(ref2, 'playVideo') }, 150)
    } else {
      ytCmd(ref1, 'playVideo')
      ytCmd(ref2, 'playVideo')
    }
  }, [t1, t2])

  const pauseBoth = useCallback(() => {
    setCinemaMode(false)
    ytCmd(ref1, 'pauseVideo')
    ytCmd(ref2, 'pauseVideo')
  }, [])

  const restartBoth = useCallback(() => {
    setCinemaMode(true)
    seeked.current = true
    ytCmd(ref1, 'seekTo', [t1, true])
    ytCmd(ref2, 'seekTo', [t2, true])
    setTimeout(() => { ytCmd(ref1, 'playVideo'); ytCmd(ref2, 'playVideo') }, 150)
  }, [t1, t2])

  const handleShare = useCallback(async () => {
    const url = `https://moto-gymkhana.vercel.app/compare?r1=${run1.id}&r2=${run2.id}&t1=${t1}&t2=${t2}`
    try {
      if (navigator.share) {
        await navigator.share({ title: `${run1.riders?.name} vs ${run2.riders?.name}`, url })
      } else {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch { /* cancelled */ }
  }, [run1, run2, t1, t2])

  if (!run1 || !run2) return null

  const inputStyle = {
    width: 56,
    background: '#07090f',
    border: `1px solid ${BORDER}`,
    borderRadius: 6,
    padding: '4px 8px',
    color: TEXT,
    fontSize: 13,
    textAlign: 'center',
  }

  const videos = [
    { ref: ref1, vid: vid1, run: run1, rawT: rawT1, setRawT: setRawT1, live: liveT1 },
    { ref: ref2, vid: vid2, run: run2, rawT: rawT2, setRawT: setRawT2, live: liveT2 },
  ]

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 1000, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: isWide ? 'none' : 700, margin: '0 auto', padding: isWide ? '12px 24px 16px' : '16px 12px 40px', fontFamily: 'var(--font-geist-sans, Arial, sans-serif)' }}
      >

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ color: TEXT, fontWeight: 700, fontSize: 16 }}>⚖ Run Comparison</div>
          <button onClick={onClose} style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '6px 12px', color: MUTED, cursor: 'pointer', fontSize: 14 }}>✕ Close</button>
        </div>

        {/* Stat cards + delta — collapse when playing to free up space for videos */}
        <div style={{ maxHeight: cinemaMode ? 0 : '400px', overflow: 'hidden', transition: 'max-height 0.35s ease' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            {[run1, run2].map((run) => {
              const isFaster = run === faster
              return (
                <div key={run.id} style={{ background: CARD, borderRadius: 12, padding: '12px 14px', border: `1px solid ${isFaster ? GREEN + '55' : BORDER}`, borderTop: `3px solid ${isFaster ? GREEN : BORDER}` }}>
                  <div style={{ color: isFaster ? GREEN : TEXT, fontWeight: 900, fontSize: 24, marginBottom: 4 }}>
                    {Number(run.lap_time).toFixed(2)}s
                    {isFaster && <span style={{ fontSize: 11, fontWeight: 600, marginLeft: 6, background: GREEN + '22', color: GREEN, borderRadius: 4, padding: '2px 6px' }}>FASTER</span>}
                  </div>
                  <div style={{ color: TEXT, fontWeight: 700, fontSize: 14, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {run.riders?.name}
                  </div>
                  <div style={{ fontSize: 11, color: MUTED, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span>🏁 {run.map_name}</span>
                    {run.bike && <span>🏍 {run.bike}</span>}
                    {formatDate(run.created_at) && <span>📅 {formatDate(run.created_at)}</span>}
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{ background: GOLD + '18', border: `1px solid ${GOLD}33`, borderRadius: 10, padding: '10px 16px', textAlign: 'center', marginBottom: 20 }}>
            <span style={{ color: GOLD, fontWeight: 700 }}>{faster.riders?.name}</span>
            <span style={{ color: MUTED }}> is </span>
            <span style={{ color: GOLD, fontWeight: 900 }}>{delta}s</span>
            <span style={{ color: MUTED }}> faster than </span>
            <span style={{ color: TEXT, fontWeight: 600 }}>{slower.riders?.name}</span>
          </div>
        </div>

        {/* Videos + offset controls */}
        {bothHaveVideo && (
          <>
            {/* Sync controls + share */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
              {[
                { label: '⏮ Restart', fn: restartBoth },
                { label: '▶ Play',    fn: playBoth    },
                { label: '⏸ Pause',   fn: pauseBoth   },
              ].map(({ label, fn }) => (
                <button key={label} onClick={fn} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '8px 14px', color: TEXT, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  {label}
                </button>
              ))}
              <div style={{ width: 1, height: 28, background: BORDER }} />
              <button
                onClick={handleShare}
                style={{ background: CARD, border: `1px solid ${copied ? GREEN + '66' : BORDER}`, borderRadius: 8, padding: '8px 14px', color: copied ? GREEN : MUTED, cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'color 0.2s, border-color 0.2s' }}
              >
                {copied ? '✓ Copied!' : '🔗 Share'}
              </button>
            </div>

            {!isLandscape && (
              <div style={{ textAlign: 'center', padding: '7px 12px', background: GOLD + '18', border: `1px solid ${GOLD}33`, borderRadius: 8, marginBottom: 10, fontSize: 12, color: GOLD }}>
                🔄 Rotate your phone for a better view
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', gap: isWide ? 16 : 6 }}>
              {videos.map(({ ref, vid, run, rawT, setRawT, live }) => (
                <div key={run.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ fontSize: 11, color: MUTED, marginBottom: 4, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: isWide ? '300px' : '100%' }}>
                    {run.riders?.name} · {Number(run.lap_time).toFixed(2)}s
                  </div>
                  <iframe
                    ref={ref}
                    src={`https://www.youtube.com/embed/${vid}?enablejsapi=1&rel=0&modestbranding=1`}
                    style={{
                      aspectRatio: '9/16',
                      border: 'none',
                      borderRadius: 8,
                      display: 'block',
                      background: '#000',
                      transition: 'height 0.35s ease',
                      ...(isWide
                        ? { height: cinemaMode ? 'calc(100vh - 120px)' : 'calc(100vh - 340px)', width: 'auto' }
                        : { width: '100%' }),
                    }}
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                  />
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, color: MUTED }}>Start at</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={rawT}
                      onChange={e => { seeked.current = false; setRawT(e.target.value.replace(/[^0-9]/g, '')) }}
                      style={inputStyle}
                    />
                    <span style={{ fontSize: 11, color: MUTED }}>s</span>
                    {live !== null && (
                      <button
                        onClick={() => { seeked.current = false; setRawT(String(live)) }}
                        title="Capture current video time"
                        style={{ background: BLUE + '22', border: `1px solid ${BLUE}55`, borderRadius: 6, padding: '3px 7px', color: BLUE, cursor: 'pointer', fontSize: 11, fontWeight: 700 }}
                      >
                        📍 {live}s
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 10, textAlign: 'center', fontSize: 11, color: MUTED }}>
              Play → pause at sync point → tap 📍 to capture · ⏮ Restart syncs both
            </div>
          </>
        )}

        {/* One has video, one doesn't */}
        {(vid1 || vid2) && !bothHaveVideo && (
          <>
            <div style={{ background: CARD, borderRadius: 12, overflow: 'hidden', border: `1px solid ${BORDER}` }}>
              <div style={{ fontSize: 12, color: MUTED, padding: '8px 12px' }}>
                {vid1 ? `▶ ${run1.riders?.name}'s video` : `▶ ${run2.riders?.name}'s video`}
              </div>
              <iframe
                src={`https://www.youtube.com/embed/${vid1 || vid2}?rel=0&modestbranding=1`}
                style={{ width: '100%', aspectRatio: '9/16', border: 'none', display: 'block' }}
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
              <div style={{ padding: '10px 12px', fontSize: 12, color: MUTED }}>
                No video for {!vid1 ? run1.riders?.name : run2.riders?.name}
              </div>
            </div>
            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <button
                onClick={handleShare}
                style={{ background: CARD, border: `1px solid ${copied ? GREEN + '66' : BORDER}`, borderRadius: 10, padding: '10px 20px', color: copied ? GREEN : MUTED, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
              >
                {copied ? '✓ Link copied!' : '🔗 Share comparison'}
              </button>
            </div>
          </>
        )}

        {/* No videos — share stats only */}
        {!vid1 && !vid2 && (
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={handleShare}
              style={{ background: CARD, border: `1px solid ${copied ? GREEN + '66' : BORDER}`, borderRadius: 10, padding: '10px 20px', color: copied ? GREEN : TEXT, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
            >
              {copied ? '✓ Link copied!' : '🔗 Share this comparison'}
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
