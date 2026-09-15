'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
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
const YT_RED = '#ff0000'

function ytId(url) {
  if (!url) return null
  if (url.includes('watch?v=')) return url.split('v=')[1].split('&')[0]
  if (url.includes('youtu.be/')) return url.split('youtu.be/')[1].split('?')[0]
  if (url.includes('/shorts/')) return url.split('/shorts/')[1].split('?')[0]
  return null
}

function fmtDate(str) {
  return new Date(str).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function daysStatus(endStr) {
  const left = Math.ceil((new Date(endStr) - Date.now()) / 86400000)
  return left > 0 ? `${left}d left` : 'ended'
}

export default function MapsPage() {
  const { lang } = useLang()
  const T = i18n[lang]
  const [maps, setMaps] = useState([])
  const [loading, setLoading] = useState(true)
  const [olcRound, setOlcRound] = useState(null)
  const [olcResults, setOlcResults] = useState(null)
  const [modalVideo, setModalVideo] = useState(null)

  useEffect(() => {
    // Fetch OLC current round alongside local maps
    fetch('/api/olc?action=rounds')
      .then(r => r.json())
      .then(({ rounds = [] }) => {
        const current = rounds.find(r => r.isCurrent) ?? rounds[0]
        if (!current) return
        setOlcRound(current)
        return fetch(`/api/olc?action=results&id=${current.id}`).then(r => r.json())
      })
      .then(data => { if (data) setOlcResults(data) })
      .catch(() => {})

    Promise.all([
      supabase.from('maps').select('name, image_url').order('name'),
      supabase.from('results').select('map_name, lap_time, riders(name, number)').eq('approved', true),
    ]).then(([mapsRes, runsRes]) => {
      const dbMaps = (mapsRes.data || []).filter(m => !/^Gymfun OLC/i.test(m.name))
      const runs = (runsRes.data || []).filter(r => !/^Gymfun OLC/i.test(r.map_name))

      const stats = {}
      for (const r of runs) {
        const name = r.map_name
        if (!stats[name]) stats[name] = { totalRuns: 0, riders: new Set(), bestTime: Infinity, bestRider: null }
        const s = stats[name]
        s.totalRuns++
        if (r.riders?.name) s.riders.add(r.riders.name)
        const t = Number(r.lap_time)
        if (t < s.bestTime) { s.bestTime = t; s.bestRider = r.riders?.name; s.bestRiderNumber = r.riders?.number ?? null }
      }

      setMaps(dbMaps.map(m => ({
        name: m.name,
        image_url: m.image_url,
        totalRuns: stats[m.name]?.totalRuns ?? 0,
        uniqueRiders: stats[m.name]?.riders.size ?? 0,
        bestTime: stats[m.name]?.bestTime < Infinity ? stats[m.name].bestTime : null,
        bestRider: stats[m.name]?.bestRider ?? null,
        bestRiderNumber: stats[m.name]?.bestRiderNumber ?? null,
      })))
      setLoading(false)
    })
  }, [])

  return (
    <div style={{ background: '#030508', minHeight: '100vh', fontFamily: 'var(--font-geist-sans, Arial, sans-serif)' }}>
      <div style={{ maxWidth: 700, margin: '0 auto', background: BG, minHeight: '100vh', color: TEXT, boxShadow: '0 0 80px rgba(0,0,0,0.7)' }}>

        {/* HEADER */}
        <div style={{ background: `linear-gradient(180deg, #0a1020 0%, ${SURFACE} 100%)`, borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ height: 4, background: `linear-gradient(90deg, ${BLUE}, ${GREEN}, ${BLUE})` }} />
          <div style={{ padding: '16px 16px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/" style={{ color: MUTED, fontSize: 13, textDecoration: 'none', flexShrink: 0 }}>
              {T.back}
            </Link>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ color: BLUE, fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', fontWeight: 700, marginBottom: 3 }}>
                {T.israel}
              </div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: TEXT, letterSpacing: -0.5 }}>
                🗺 {lang === 'ru' ? 'Карты трасс' : 'Course Maps'}
              </h1>
            </div>
            <LangSwitcher />
          </div>
        </div>

        {/* MAPS */}
        <div style={{ padding: '16px 14px 40px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '64px 20px', color: MUTED }}>{T.loading}</div>
          ) : maps.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 20px', color: MUTED }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🗺</div>
              <div style={{ fontSize: 16, color: TEXT }}>No maps yet</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {olcRound && (
                <OlcCard round={olcRound} results={olcResults} lang={lang} onVideoClick={setModalVideo} />
              )}
              {maps.map(map => (
                <MapCard key={map.name} map={map} lang={lang} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>

    {modalVideo && (
      <div onClick={() => setModalVideo(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.94)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
        <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 900, aspectRatio: '16/9', borderRadius: 12, overflow: 'hidden' }}>
          <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${modalVideo}?autoplay=1`} allow="autoplay; encrypted-media; fullscreen" allowFullScreen style={{ border: 'none', display: 'block' }} />
        </div>
      </div>
    )}
  )
}

function OlcCard({ round, results, lang, onVideoClick }) {
  const il = results?.ilRiders ?? []
  const total = results?.totalRiders ?? 0
  return (
    <div style={{ background: CARD, borderRadius: 16, overflow: 'hidden', border: `2px solid ${BLUE}30` }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {round.mapUrl && <img src={round.mapUrl} alt={round.name} style={{ width: '100%', display: 'block' }} />}
      <div style={{ padding: '14px 16px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{ fontWeight: 800, fontSize: 17, color: TEXT, flex: 1 }}>🌍 {round.name}</div>
          {round.isCurrent && (
            <span style={{ background: 'rgba(0,255,153,0.15)', color: GREEN, border: `1px solid ${GREEN}40`, borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
              LIVE
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, color: MUTED, marginBottom: 14 }}>
          {fmtDate(round.startDate)} – {fmtDate(round.endDate)} · {daysStatus(round.endDate)}
        </div>

        {results === null ? (
          <div style={{ color: MUTED, fontSize: 13, marginBottom: 14 }}>{lang === 'ru' ? 'Загрузка…' : 'Loading…'}</div>
        ) : il.length === 0 ? (
          <div style={{ color: MUTED, fontSize: 13, marginBottom: 14 }}>
            {lang === 'ru' ? 'Израильских гонщиков пока нет' : 'No Israeli riders yet'}
          </div>
        ) : (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>
              🇮🇱 {il.length} {lang === 'ru' ? 'израильских из' : 'Israeli of'} {total} {lang === 'ru' ? 'глобально' : 'globally'}
            </div>
            {il.slice(0, 3).map(r => (
              <div key={r.olcRiderId} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <span style={{ fontSize: 11, color: MUTED, width: 44, flexShrink: 0 }}>#{r.rank}/{total}</span>
                <span style={{ flex: 1, fontSize: 13, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
                {r.youtubeUrl && (
                  <button onClick={() => { const id = ytId(r.youtubeUrl); if (id) onVideoClick(id) }}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: YT_RED, fontSize: 16, lineHeight: 1, flexShrink: 0 }}>▶</button>
                )}
                <span style={{ color: GOLD, fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{r.finalTimeStr}</span>
              </div>
            ))}
            {il.length > 3 && (
              <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>+{il.length - 3} more…</div>
            )}
          </div>
        )}

        <Link href="/olc" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '8px 16px', borderRadius: 8,
          background: 'rgba(26,92,255,0.08)', border: `1px solid ${BLUE}50`,
          color: BLUE, fontSize: 13, fontWeight: 600, textDecoration: 'none',
        }}>
          {lang === 'ru' ? 'Все результаты OLC →' : 'Full OLC standings →'}
        </Link>
      </div>
    </div>
  )
}

function MapCard({ map, lang }) {
  return (
    <div style={{ background: CARD, borderRadius: 16, overflow: 'hidden', border: `1px solid ${BORDER}` }}>
      {map.image_url && (
        <Image
          src={map.image_url}
          alt={`${map.name} course layout`}
          width={800}
          height={500}
          style={{ width: '100%', height: 'auto', display: 'block' }}
          sizes="(max-width: 700px) calc(100vw - 28px), 658px"
        />
      )}
      <div style={{ padding: '14px 16px 16px' }}>
        <div style={{ fontWeight: 800, fontSize: 17, color: TEXT, marginBottom: 12 }}>🏁 {map.name}</div>

        <div style={{ display: 'flex', gap: 20, marginBottom: 14, flexWrap: 'wrap' }}>
          {map.bestTime && (
            <div>
              <div style={{ fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 3 }}>
                {lang === 'ru' ? 'Лучшее время' : 'Best time'}
              </div>
              <div style={{ color: GOLD, fontWeight: 800, fontSize: 22, lineHeight: 1 }}>
                {map.bestTime.toFixed(2)}s
              </div>
              {map.bestRider && (
                <div style={{ fontSize: 12, color: MUTED, marginTop: 3, display: 'flex', alignItems: 'center', gap: 5 }}>
                  {map.bestRiderNumber && <span style={{ fontSize: 11, fontWeight: 700, color: GOLD }}>#{map.bestRiderNumber}</span>}
                  {map.bestRider}
                </div>
              )}
            </div>
          )}
          <div>
            <div style={{ fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 3 }}>
              {lang === 'ru' ? 'Гонщики' : 'Riders'}
            </div>
            <div style={{ color: TEXT, fontWeight: 700, fontSize: 22, lineHeight: 1 }}>{map.uniqueRiders}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 3 }}>
              {lang === 'ru' ? 'Заездов' : 'Total runs'}
            </div>
            <div style={{ color: TEXT, fontWeight: 700, fontSize: 22, lineHeight: 1 }}>{map.totalRuns}</div>
          </div>
        </div>

        <Link
          href={`/?map=${encodeURIComponent(map.name)}`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 8,
            background: 'rgba(0,255,153,0.08)', border: `1px solid ${GREEN}50`,
            color: GREEN, fontSize: 13, fontWeight: 600, textDecoration: 'none',
          }}
        >
          {lang === 'ru' ? 'Таблица лидеров →' : 'View leaderboard →'}
        </Link>
      </div>
    </div>
  )
}
