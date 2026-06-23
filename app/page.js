'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [data, setData] = useState([])
  const [mapFilter, setMapFilter] = useState('')
  const [bikeFilter, setBikeFilter] = useState('')
  const [riderFilter, setRiderFilter] = useState('')
  const [modalVideo, setModalVideo] = useState(null)
  const [showAllBikes, setShowAllBikes] = useState(false)
  const [showAllMaps, setShowAllMaps] = useState(false)
  const [showAllRiders, setShowAllRiders] = useState(false) 

  const fetchData = async () => {
    const { data } = await supabase
      .from('results')
      .select(`
        id,
        map_name,
        lap_time,
        bike,
        youtube_url,
        riders ( name )
      `)
      .eq('approved', true)
      .order('lap_time', { ascending: true })

    setData(data || [])
  }

  useEffect(() => {
    fetchData()
  }, [])

  // dynamic filters
  const maps = [...new Set(data.map(r => r.map_name))]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))

  const bikes = [...new Set(data.map(r => r.bike))]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))

  const riders = [...new Set(data.map(r => r.riders?.name))]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))

  // filtering logic
  const filteredData = data
    .filter(r => !mapFilter || r.map_name === mapFilter)
    .filter(r => !bikeFilter ||r.bike === bikeFilter)
    .filter(r => !riderFilter || r.riders?.name === riderFilter)

  const podiumMaps = mapFilter
    ? [mapFilter]
    : [...new Set(filteredData.map(r => r.map_name))].filter(Boolean).sort()

  function getYoutubeId(url) {
    if (!url) return null
    if (url.includes("watch?v=")) return url.split("v=")[1].split("&")[0]
    if (url.includes("youtu.be/")) return url.split("youtu.be/")[1]
    return null
  }

  return (
    <div style={{
      padding: 20,
      fontFamily: 'Arial',
      background: '#0f0f0f',
      minHeight: '100vh',
      color: 'white',
    }}>

      {/* HEADER */}
      <div style={{ textAlign: 'center', marginBottom: 30 }}>
        <h1 style={{ fontSize: 40, margin: 0 }}>🏁 Israeli Moto Gymkhana</h1>
        <p style={{ color: '#aaa' }}>Live competition leaderboard</p>
      </div>
      {/* NAVIGATION */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 20,
        flexWrap: 'wrap'
      }}>

        <a href="/submit" style={navBtnStyle}>
          ➕ Submit Run
        </a>

        <a href="/admin" style={navBtnStyleSecondary}>
          🛠 Admin Panel
        </a>

      </div>
      {/* FILTERS */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        alignItems: 'center',
        marginBottom: 20
      }}>

        {/* MAPS */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Chip label="🏁 All Maps" active={!mapFilter} onClick={() => setMapFilter('')} />

          {(showAllMaps ? maps : maps.slice(0, 1)).map((m, i) => (
            <Chip key={i} label={m} active={mapFilter === m} onClick={() => setMapFilter(m)} />
          ))}

          {maps.length > 1 && (
            <Chip
              label={showAllMaps ? 'Less' : `+${maps.length - 1}`}
              onClick={() => setShowAllMaps(!showAllMaps)}
            />
          )}
        </div>

        {/* BIKES */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Chip label="🏍 All Bikes" active={!bikeFilter} onClick={() => setBikeFilter('')} />

          {(showAllBikes ? bikes : bikes.slice(0, 1)).map((b, i) => (
            <Chip key={i} label={b} active={bikeFilter === b} onClick={() => setBikeFilter(b)} />
          ))}

          {bikes.length > 1 && (
            <Chip
              label={showAllBikes ? 'Less' : `+${bikes.length - 1}`}
              onClick={() => setShowAllBikes(!showAllBikes)}
            />
          )}
        </div>

        {/* RIDERS */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Chip label="👤 All Riders" active={!riderFilter} onClick={() => setRiderFilter('')} />

          {(showAllRiders ? riders : riders.slice(0, 1)).map((r, i) => (
            <Chip key={i} label={r} active={riderFilter === r} onClick={() => setRiderFilter(r)} />
          ))}

          {riders.length > 1 && (
            <Chip
              label={showAllRiders ? 'Less' : `+${riders.length - 1}`}
              onClick={() => setShowAllRiders(!showAllRiders)}
            />
          )}
        </div>

      </div> 

      {/* PODIUM — per map when no filter, single when filtered */}
      <div style={{ marginBottom: 20 }}>
        {podiumMaps.map(mapName => {
          const colors = ['#ffd700', '#c0c0c0', '#cd7f32']
          const top3 = filteredData.filter(r => r.map_name === mapName).slice(0, 3)
          if (top3.length === 0) return null
          return (
            <div key={mapName} style={{ marginBottom: 16 }}>
              {!mapFilter && (
                <div style={{ textAlign: 'center', color: '#aaa', fontSize: 12, letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' }}>
                  🏁 {mapName}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
                {top3.map((r, i) => (
                  <div key={r.id} style={{
                    background: '#1a1a1a',
                    border: `2px solid ${colors[i]}`,
                    borderRadius: 12,
                    padding: 5,
                    width: 100,
                    textAlign: 'center',
                    boxShadow: `0 0 25px ${colors[i]}33`
                  }}>
                    <div style={{ fontSize: 22 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</div>
                    <div style={{ fontWeight: 'bold', fontSize: 16 }}>{r.riders?.name}</div>
                    <div style={{ color: colors[i], fontSize: 20, fontWeight: 'bold' }}>{Number(r.lap_time).toFixed(2)}s</div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* TABLE → MOBILE FRIENDLY CARDS */}
      <div style={{ maxWidth: 320, margin: '0 auto' }}>

        {filteredData.map((r, i) => {
          const videoId = getYoutubeId(r.youtube_url)

          return (
            <div
              key={r.id}
              style={{
                background: '#1a1a1a',
                borderRadius: 10,
                padding: 12,
                marginBottom: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: 6
              }}
            >

              {/* TOP LINE: position + rider */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#aaa' }}>Name:</span>
                <span style={{ fontWeight: 'bold' }}>{r.riders?.name}</span>
              </div>

              {/* MAP + BIKE */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#aaa' }}>Map:</span>
                <span>{r.map_name}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#aaa' }}>Bike:</span>
                <span>{r.bike}</span>
              </div>

              {/* TIME (highlighted) */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 15,
                fontWeight: 'bold',
                color: '#00ff99'
              }}>
                <span style={{ color: '#aaa', fontWeight: 'normal' }}>Time:</span>
                <span>{Number(r.lap_time).toFixed(2)}s</span>
              </div>

              {/* VIDEO */}
              {videoId && (
                <img
                  onClick={() => setModalVideo(videoId)}
                  src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                  style={{
                    width: '100%',
                    maxWidth: 300,
                    borderRadius: 8,
                    marginTop: 6,
                    cursor: 'pointer'
                  }}
                />
              )}

            </div>
          )
        })}

      </div>

      {/* MODAL VIDEO */}
      {modalVideo && (
        <div
          onClick={() => setModalVideo(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '80%',
              maxWidth: 900,
              aspectRatio: '16 / 9',
              background: '#000',
              borderRadius: 10,
              overflow: 'hidden'
            }}
          >
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${modalVideo}?autoplay=1`}
              frameBorder="0"
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
            />
          </div>
        </div>
      )}

    </div>
  )
}

/* CHIP UI */
function Chip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 12px',
        borderRadius: 20,
        border: active ? '1px solid #00ff99' : '1px solid #333',
        background: active ? '#00ff99' : '#1a1a1a',
        color: active ? '#000' : '#fff',
        cursor: 'pointer',
        fontSize: 13,
        transition: '0.2s',
        boxShadow: active ? '0 0 10px #00ff9955' : 'none'
      }}
    >
      {label}
    </button>
  )
  
}
const navBtnStyle = {
  padding: '10px 16px',
  background: '#1a1a1a',
  color: '#fff',
  borderRadius: 10,
  textDecoration: 'none',
  fontWeight: 'bold',
  fontSize: 14,
  boxShadow: '0 0 10px #00ff9955'
}

const navBtnStyleSecondary = {
  padding: '10px 16px',
  background: '#1a1a1a',
  color: '#fff',
  borderRadius: 10,
  textDecoration: 'none',
  fontWeight: 'bold',
  fontSize: 14,
  border: '1px solid #333',
  boxShadow: '0 0 10px #00ff9955'
}