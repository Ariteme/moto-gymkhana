'use client'

import { useRef, useCallback } from 'react'

const CARD   = '#101821'
const BORDER = '#1a2840'
const GREEN  = '#00ff99'
const BLUE   = '#1a5cff'
const TEXT   = '#dce8f4'
const MUTED  = '#7a90a8'
const GOLD   = '#ffc947'
const BG     = '#07090f'

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

// Send a command to a YouTube iframe via postMessage
function ytCmd(iframeRef, func, args = []) {
  iframeRef.current?.contentWindow?.postMessage(
    JSON.stringify({ event: 'command', func, args }),
    'https://www.youtube.com'
  )
}

export default function CompareModal({ runs, onClose }) {
  const ref1 = useRef(null)
  const ref2 = useRef(null)

  const [run1, run2] = runs
  const vid1 = ytId(run1?.youtube_url)
  const vid2 = ytId(run2?.youtube_url)
  const bothHaveVideo = vid1 && vid2

  const time1 = Number(run1?.lap_time)
  const time2 = Number(run2?.lap_time)
  const delta  = Math.abs(time1 - time2).toFixed(2)
  const faster = time1 <= time2 ? run1 : run2
  const slower = time1 <= time2 ? run2 : run1

  const playBoth    = useCallback(() => { ytCmd(ref1, 'playVideo');  ytCmd(ref2, 'playVideo')  }, [])
  const pauseBoth   = useCallback(() => { ytCmd(ref1, 'pauseVideo'); ytCmd(ref2, 'pauseVideo') }, [])
  const restartBoth = useCallback(() => {
    ytCmd(ref1, 'seekTo', [0, true]); ytCmd(ref2, 'seekTo', [0, true])
    // tiny delay lets seek settle before play
    setTimeout(() => { ytCmd(ref1, 'playVideo'); ytCmd(ref2, 'playVideo') }, 150)
  }, [])

  if (!run1 || !run2) return null

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 1000, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 700, margin: '0 auto', padding: '16px 12px 40px', fontFamily: 'var(--font-geist-sans, Arial, sans-serif)' }}
      >

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ color: TEXT, fontWeight: 700, fontSize: 16 }}>⚖ Run Comparison</div>
          <button onClick={onClose} style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '6px 12px', color: MUTED, cursor: 'pointer', fontSize: 14 }}>✕ Close</button>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          {[run1, run2].map((run, i) => {
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
                  <span>📅 {formatDate(run.created_at)}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Delta banner */}
        <div style={{ background: GOLD + '18', border: `1px solid ${GOLD}33`, borderRadius: 10, padding: '10px 16px', textAlign: 'center', marginBottom: 20 }}>
          <span style={{ color: GOLD, fontWeight: 700 }}>{faster.riders?.name}</span>
          <span style={{ color: MUTED }}> is </span>
          <span style={{ color: GOLD, fontWeight: 900 }}>{delta}s</span>
          <span style={{ color: MUTED }}> faster than </span>
          <span style={{ color: TEXT, fontWeight: 600 }}>{slower.riders?.name}</span>
        </div>

        {/* Videos */}
        {bothHaveVideo && (
          <>
            {/* Sync controls */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 12 }}>
              {[
                { label: '⏮ Restart', fn: restartBoth },
                { label: '▶ Play',    fn: playBoth    },
                { label: '⏸ Pause',   fn: pauseBoth   },
              ].map(({ label, fn }) => (
                <button key={label} onClick={fn} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '8px 14px', color: TEXT, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  {label}
                </button>
              ))}
            </div>

            {/* Two iframes side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {[{ ref: ref1, vid: vid1, run: run1 }, { ref: ref2, vid: vid2, run: run2 }].map(({ ref, vid, run }) => (
                <div key={run.id}>
                  <div style={{ fontSize: 11, color: MUTED, marginBottom: 4, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {run.riders?.name} · {Number(run.lap_time).toFixed(2)}s
                  </div>
                  <iframe
                    ref={ref}
                    src={`https://www.youtube.com/embed/${vid}?enablejsapi=1&rel=0&modestbranding=1`}
                    style={{ width: '100%', aspectRatio: '9/16', border: 'none', borderRadius: 8, display: 'block', background: '#000' }}
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                  />
                </div>
              ))}
            </div>

            <div style={{ marginTop: 10, textAlign: 'center', fontSize: 11, color: MUTED }}>
              Tap ▶ Play to start both videos simultaneously
            </div>
          </>
        )}

        {/* One has video, one doesn't */}
        {(vid1 || vid2) && !bothHaveVideo && (
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
        )}

      </div>
    </div>
  )
}
