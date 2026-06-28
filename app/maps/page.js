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

export default function MapsPage() {
  const { lang } = useLang()
  const T = i18n[lang]
  const [maps, setMaps] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('maps').select('name, image_url').order('name'),
      supabase.from('results').select('map_name, lap_time, riders(name)').eq('approved', true),
    ]).then(([mapsRes, runsRes]) => {
      const dbMaps = mapsRes.data || []
      const runs = runsRes.data || []

      const stats = {}
      for (const r of runs) {
        const name = r.map_name
        if (!stats[name]) stats[name] = { totalRuns: 0, riders: new Set(), bestTime: Infinity, bestRider: null }
        const s = stats[name]
        s.totalRuns++
        if (r.riders?.name) s.riders.add(r.riders.name)
        const t = Number(r.lap_time)
        if (t < s.bestTime) { s.bestTime = t; s.bestRider = r.riders?.name }
      }

      setMaps(dbMaps.map(m => ({
        name: m.name,
        image_url: m.image_url,
        totalRuns: stats[m.name]?.totalRuns ?? 0,
        uniqueRiders: stats[m.name]?.riders.size ?? 0,
        bestTime: stats[m.name]?.bestTime < Infinity ? stats[m.name].bestTime : null,
        bestRider: stats[m.name]?.bestRider ?? null,
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
              {maps.map(map => (
                <MapCard key={map.name} map={map} lang={lang} />
              ))}
            </div>
          )}
        </div>
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
                <div style={{ fontSize: 12, color: MUTED, marginTop: 3 }}>
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
