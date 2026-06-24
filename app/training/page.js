'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
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

export default function Training() {
  const { lang } = useLang()
  const T = i18n[lang]

  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTag, setActiveTag] = useState('')
  const [modalVideo, setModalVideo] = useState(null)

  useEffect(() => {
    supabase
      .from('training_videos')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => { setVideos(data || []); setLoading(false) })
  }, [])

  function ytId(url) {
    if (!url) return null
    if (url.includes('watch?v=')) return url.split('v=')[1].split('&')[0]
    if (url.includes('youtu.be/')) return url.split('youtu.be/')[1].split('?')[0]
    if (url.includes('/shorts/')) return url.split('/shorts/')[1].split('?')[0]
    return null
  }

  const allTags = [...new Set(videos.flatMap(v => v.tags || []))].sort()
  const filtered = activeTag ? videos.filter(v => (v.tags || []).includes(activeTag)) : videos

  function videoTitle(v) {
    return lang === 'ru' && v.title_ru ? v.title_ru : v.title
  }
  function videoDesc(v) {
    return lang === 'ru' && v.description_ru ? v.description_ru : v.description
  }

  return (
    <div style={{ background: '#030508', minHeight: '100vh', fontFamily: 'var(--font-geist-sans, Arial, sans-serif)' }}>
    <div style={{ maxWidth: 700, margin: '0 auto', background: BG, minHeight: '100vh', color: TEXT, boxShadow: '0 0 80px rgba(0,0,0,0.7)' }}>

      <div style={{ background: `linear-gradient(180deg, #0a1020 0%, ${SURFACE} 100%)`, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ height: 4, background: `linear-gradient(90deg, ${BLUE}, ${GREEN}, ${BLUE})` }} />
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px 16px', gap: 12 }}>
          <Link href="/" style={{ color: MUTED, fontSize: 13, padding: '6px 10px', border: `1px solid ${BORDER}`, borderRadius: 8, flexShrink: 0 }}>{T.back}</Link>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: TEXT }}>{T.training}</div>
            <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{T.training_subtitle}</div>
          </div>
          <LangSwitcher />
        </div>

        {allTags.length > 0 && (
          <div style={{ padding: '0 12px 12px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Chip label={T.all} active={!activeTag} onClick={() => setActiveTag('')} />
            {allTags.map(tag => (
              <Chip key={tag} label={tag} active={activeTag === tag} onClick={() => setActiveTag(tag === activeTag ? '' : tag)} />
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: '16px 12px 60px' }}>
        {loading && <div style={{ textAlign: 'center', padding: 60, color: MUTED }}>{T.loading}</div>}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: MUTED }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏍️</div>
            <div>{T.no_videos}</div>
          </div>
        )}

        {filtered.map(video => {
          const vid = ytId(video.youtube_url)
          return (
            <div key={video.id} style={{ background: CARD, borderRadius: 14, overflow: 'hidden', border: `1px solid ${BORDER}`, marginBottom: 12 }}>
              {vid && (
                <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setModalVideo(vid)}>
                  <img src={`https://img.youtube.com/vi/${vid}/mqdefault.jpg`} alt={videoTitle(video)} style={{ width: '100%', display: 'block', aspectRatio: '16/9', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.6) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: 0, height: 0, borderTop: '11px solid transparent', borderBottom: '11px solid transparent', borderLeft: '20px solid #000', marginLeft: 4 }} />
                    </div>
                  </div>
                </div>
              )}
              <div style={{ padding: '12px 14px' }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: TEXT, marginBottom: 4 }}>{videoTitle(video)}</div>
                {videoDesc(video) && <div style={{ fontSize: 13, color: MUTED, marginBottom: 8, lineHeight: 1.5 }}>{videoDesc(video)}</div>}
                {(video.tags || []).length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {video.tags.map(tag => (
                      <button key={tag} onClick={() => setActiveTag(tag === activeTag ? '' : tag)} style={{
                        fontSize: 11, padding: '3px 9px', borderRadius: 20, cursor: 'pointer',
                        background: activeTag === tag ? 'rgba(0,255,153,0.15)' : 'rgba(0,255,153,0.06)',
                        border: `1px solid ${activeTag === tag ? GREEN : GREEN + '30'}`,
                        color: GREEN, fontWeight: activeTag === tag ? 700 : 400,
                      }}>
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {modalVideo && (
        <div onClick={() => setModalVideo(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.94)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 900, aspectRatio: '16/9', borderRadius: 12, overflow: 'hidden' }}>
            <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${modalVideo}?autoplay=1`} allow="autoplay; encrypted-media; fullscreen" allowFullScreen style={{ border: 'none', display: 'block' }} />
          </div>
        </div>
      )}
    </div>
    </div>
  )
}

function Chip({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{ padding: '5px 12px', height: 30, borderRadius: 20, border: `1px solid ${active ? GREEN : BORDER}`, background: active ? 'rgba(0,255,153,0.12)' : 'transparent', color: active ? GREEN : MUTED, cursor: 'pointer', fontSize: 12, fontWeight: active ? 600 : 400, whiteSpace: 'nowrap' }}>
      {label}
    </button>
  )
}
