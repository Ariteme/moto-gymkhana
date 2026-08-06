'use client'

import { useEffect, useState } from 'react'
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

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-IL', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function News() {
  const { lang } = useLang()
  const T = i18n[lang]

  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [displayPosts, setDisplayPosts] = useState([])
  const [translating, setTranslating] = useState(false)

  useEffect(() => {
    fetch('/api/news')
      .then(r => r.json())
      .then(({ posts, error }) => {
        setPosts(posts || [])
        setLoading(false)
        if (error) setError(true)
      })
      .catch(() => { setError(true); setLoading(false) })
  }, [])

  useEffect(() => {
    if (posts.length === 0) { setDisplayPosts([]); return }

    const textsToTranslate = posts.map(p => p.text || '')
    setTranslating(true)

    fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: textsToTranslate, targetLang: lang }),
    })
      .then(r => r.json())
      .then(({ translations }) => {
        setDisplayPosts(posts.map((p, i) => ({ ...p, text: translations[i] || p.text })))
        setTranslating(false)
      })
      .catch(() => { setDisplayPosts(posts); setTranslating(false) })
  }, [lang, posts])

  return (
    <div style={{ background: '#030508', minHeight: '100vh', fontFamily: 'var(--font-geist-sans, Arial, sans-serif)' }}>
    <div style={{ maxWidth: 700, margin: '0 auto', background: BG, minHeight: '100vh', color: TEXT, boxShadow: '0 0 80px rgba(0,0,0,0.7)' }}>

      <div style={{ background: `linear-gradient(180deg, #0a1020 0%, ${SURFACE} 100%)`, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ height: 4, background: `linear-gradient(90deg, ${BLUE}, ${GREEN}, ${BLUE})` }} />
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px 16px', gap: 12 }}>
          <Link href="/" style={{ color: MUTED, fontSize: 13, padding: '6px 10px', border: `1px solid ${BORDER}`, borderRadius: 8 }}>{T.back}</Link>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: TEXT }}>{T.news_title}</div>
            <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>
              <a href="https://t.me/moto_israel" target="_blank" rel="noopener noreferrer" style={{ color: MUTED }}>{T.news_source}</a>
            </div>
          </div>
          <LangSwitcher />
        </div>
      </div>

      <div style={{ padding: '16px 12px 60px' }}>
        {(loading || translating) && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: MUTED }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📡</div>
            <div>{translating ? T.translating : T.loading}</div>
          </div>
        )}

        {!loading && !translating && error && displayPosts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: MUTED }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📡</div>
            <div style={{ fontSize: 16, color: TEXT, marginBottom: 6 }}>{T.news_error_title}</div>
            <a href="https://t.me/moto_israel" target="_blank" rel="noopener noreferrer" style={{ color: GREEN, fontSize: 14 }}>{T.open_telegram}</a>
          </div>
        )}

        {!loading && !translating && !error && displayPosts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: MUTED }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <div>{T.no_posts}</div>
          </div>
        )}

        {!translating && displayPosts.map(post => (
          <div key={post.id} style={{ background: CARD, borderRadius: 14, marginBottom: 10, overflow: 'hidden', border: `1px solid ${BORDER}` }}>
            {post.photos.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: post.photos.length === 1 ? '1fr' : '1fr 1fr', gap: 2 }}>
                {post.photos.slice(0, 4).map((src, i) => (
                  <a key={i} href={post.link} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" style={{ width: '100%', display: 'block', aspectRatio: post.photos.length === 1 ? '16/9' : '1/1', objectFit: 'cover' }} />
                  </a>
                ))}
              </div>
            )}
            <div style={{ padding: '12px 14px' }}>
              {post.text && <p style={{ margin: '0 0 12px', fontSize: 14, color: TEXT, whiteSpace: 'pre-line', lineHeight: 1.65 }}>{post.text}</p>}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: MUTED }}>{formatDate(post.date)}</span>
                <a href={post.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: GREEN, fontWeight: 500 }}>{T.open_in_telegram}</a>
              </div>
            </div>
          </div>
        ))}

        {!loading && !translating && displayPosts.length > 0 && (
          <div style={{ textAlign: 'center', paddingTop: 8 }}>
            <a href="https://t.me/moto_israel" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: MUTED }}>{T.see_all_telegram}</a>
          </div>
        )}
      </div>
    </div>
    </div>
  )
}
