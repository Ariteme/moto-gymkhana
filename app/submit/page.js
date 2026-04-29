'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function Submit() {

    const [form, setForm] = useState({
      name: '',
      plate: '',
      map: '',
      time: '',
      bike: '',
      youtube: ''
    })

  const MAPS = [
    "Pita GP",
    "Gymfun OLC1",
    "Moldova GP",
    "8Rings"
  ]

  const [bikeSearch, setBikeSearch] = useState('')
  const [allRiders, setAllRiders] = useState([])
  const [riderSuggestions, setRiderSuggestions] = useState([])
  const [mapSearch, setMapSearch] = useState('')
  const [showMapDropdown, setShowMapDropdown] = useState(false)

  useEffect(() => {
    async function fetchRiders() {
      const { data } = await supabase.from('riders').select('name, plate, bike')
      if (data) {
        setAllRiders(data)
      }
    }
    fetchRiders()
  }, [])

  const handleNameChange = (e) => {
    const value = e.target.value
    // English-only validation
    if (!/^[A-Za-z0-9\s]*$/.test(value)) {
      alert("Please use English characters only.")
      return
    }
    setForm(prev => ({ ...prev, name: value }))
    setRiderSuggestions(allRiders.filter(r => r.name.toLowerCase().includes(value.toLowerCase())))
  }

  const selectRider = (rider) => {
    setForm(prev => ({ ...prev, name: rider.name, plate: rider.plate, bike: rider.bike }))
    setBikeSearch(rider.bike)
    setRiderSuggestions([])
  }

  const BIKES = [

  // 🟦 YAMAHA
  "yamaha xsr125",
  "yamaha mt125",
  "yamaha yzf-r125",
  "yamaha wr125",

  "yamaha mt03",
  "yamaha yzf-r3",
  "yamaha r3",

  "yamaha xsr700",
  "yamaha mt07",
  "yamaha yzf-r7",
  "yamaha tracer 7",

  "yamaha xsr900",
  "yamaha mt09",
  "yamaha tracer 9",
  "yamaha yzf-r1",
  "yamaha mt10",
  "yamaha wr250r",
  "yamaha wr450f",

  // 🟥 KTM
  "ktm duke125",
  "ktm rc125",

  "ktm duke390",
  "ktm rc390",

  "ktm duke690",
  "ktm 690 smc r",

  "ktm duke790",
  "ktm duke890",
  "ktm 890 smt",
  "ktm 890 adventure",

  "ktm duke990",

  "ktm exc 250",
  "ktm exc 300",
  "ktm exc 500",

  // 🟧 HONDA
  "honda cb125r",
  "honda cbr125r",

  "honda cb300r",
  "honda cbr300r",

  "honda cb500f",
  "honda cbr500r",

  "honda cb650r",
  "honda cbr650r",

  "honda cb750 hornet",
  "honda cb1000r",
  "honda cbr1000rr",

  "honda crf250l",
  "honda crf450l",

  // 🟩 KAWASAKI
  "kawasaki z400",
  "kawasaki ninja 400",

  "kawasaki z650",
  "kawasaki ninja 650",

  "kawasaki z900",
  "kawasaki ninja 1000sx",
  "kawasaki z1000",
  "kawasaki zx6r",
  "kawasaki zx10r",

  "kawasaki klx300",

  // 🟨 SUZUKI
  "suzuki sv650",
  "suzuki gsx-8s",
  "suzuki gsx-s750",
  "suzuki gsx-s1000",
  "suzuki gsx-r600",
  "suzuki gsx-r1000",
  "suzuki drz400sm",

  // 🟪 TRIUMPH
  "triumph trident 660",
  "triumph street triple 765",
  "triumph speed triple 1200",
  "triumph tiger 900",

  // 🟫 BMW
  "bmw g310r",
  "bmw f900r",
  "bmw s1000r",
  "bmw s1000rr",
  "bmw r1250r",
  "bmw r1250gs",

  // ⬛ DUCATI
  "ducati monster 797",
  "ducati monster 821",
  "ducati monster 937",
  "ducati panigale v2",
  "ducati panigale v4",
  "ducati streetfighter v2",
  "ducati streetfighter v4",

  // 🟧 APRILIA
  "aprilia rs 125",
  "aprilia rs 660",
  "aprilia tuono 660",
  "aprilia tuono v4",
  "aprilia rsv4",

  // 🟫 HUSQVARNA
  "husqvarna svartpilen 401",
  "husqvarna vitpilen 401",
  "husqvarna svartpilen 701",
  "husqvarna 701 supermoto",

  // 🟥 HONDA / YAMAHA / SUZUKI CLASSICS (optional extras)
  "yamaha fz6",
  "yamaha fz8",
  "yamaha tmax 560",

  // 🟤 INDIAN / HARLEY (optional non-sport class)
  "harley davidson sportster s",
  "harley davidson iron 883",
  "harley davidson street 750",
  "harley davidson fat bob",
  "indian scout bobber",

  // ⚙️ OTHER / CUSTOM
  "custom",
  "other",
  "unknown"
  ]

  const filteredBikes = BIKES.filter(b =>
    b.toLowerCase().includes(bikeSearch.toLowerCase())
  )

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      let rider = null

      const { data: existingRider, error: fetchError } = await supabase
        .from('riders')
        .select('*')
        .filter('plate', 'eq', form.plate)
        .maybeSingle()

      if (fetchError) {
        console.error('Fetch error:', fetchError)
      }

      if (existingRider) {
        rider = existingRider
      } else {
        const { data: newRider, error: insertError } = await supabase
          .from('riders')
          .insert([{ name: form.name, plate: form.plate, bike: form.bike.trim() }])
          .select()
          .single()

        if (insertError) {
          console.error('Insert error:', insertError)
          alert('Failed to create rider')
          return
        }

        rider = newRider
      }

      const { error: resultError } = await supabase
        .from('results')
        .insert([{
          rider_id: rider.id,
          map_name: form.map,
          lap_time: parseFloat(form.time),
          bike: form.bike.trim(),
          youtube_url: form.youtube,
          approved: false
        }])

      if (resultError) {
        alert('Failed to submit result')
        return
      }

      alert('🏁 Submitted! Waiting for approval.')

      setForm({
        name: '',
          plate: '',
          map: '',
          time: '',
          bike: '',
          youtube: ''
      })

      setBikeSearch('')

    } catch (err) {
      alert('Unexpected error')
    }
  }

  return (
    
    <div style={{
      minHeight: '100vh',
      background: '#0f0f0f',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'Arial',
      color: 'white'
    }}>

      <form
        onSubmit={handleSubmit}
        style={{
          background: '#1a1a1a',
          padding: 30,
          borderRadius: 14,
          width: 380,
          border: '1px solid #333'
        }}
      >
        <div style={{ marginBottom: 20 }}>
          <Link href="/" style={backBtnStyle}>
            ← Back
          </Link>
        </div>
        <h1 style={{ textAlign: 'center', fontSize: 28 }}>
          🏁 Submit Run
        </h1>

        <p style={{
          textAlign: 'center',
          color: '#aaa',
          fontSize: 12,
          marginBottom: 20
        }}>
          Enter your best lap time
        </p>

        <input
          name="name"
          placeholder="Rider name"
          value={form.name}
          onChange={handleNameChange}
          style={inputStyle}
        />
        {riderSuggestions.length > 0 && form.name && (
          <div style={{ background: '#333', color: 'white', padding: 5, borderRadius: 4, marginBottom: 10 }}>
            {riderSuggestions.map(rider => (
              <div key={rider.name} onClick={() => selectRider(rider)} style={{ cursor: 'pointer', padding: 5 }}>
                {rider.name} ({rider.plate})
              </div>
            ))}
          </div>
        )}
          <input
            name="plate"
            placeholder="Number plate"
            value={form.plate}
            onChange={handleChange}
            style={inputStyle}
          />

        <div style={{ position: 'relative' }}>
          <input
            name="map"
            placeholder="Select Track / Map"
            value={form.map}
            onFocus={() => setShowMapDropdown(true)}
            onBlur={() => setTimeout(() => setShowMapDropdown(false), 200)}
            onChange={(e) => {
                const value = e.target.value
                if (!/^[A-Za-z0-9\s]*$/.test(value)) {
                    alert("Please use English characters only.")
                    return
                }
                setForm(prev => ({ ...prev, map: value }))
                setMapSearch(value)
            }}
            style={inputStyle}
          />
          {showMapDropdown && (
            <div style={{ background: '#333', color: 'white', padding: 5, borderRadius: 4, marginBottom: 10, position: 'absolute', width: '100%', zIndex: 9999 }}>
              {MAPS.filter(m => m.toLowerCase().includes(mapSearch.toLowerCase())).map(map => (
                <div key={map} onClick={() => { setForm(prev => ({ ...prev, map })); setShowMapDropdown(false) }} style={{ cursor: 'pointer', padding: 5 }}>
                  {map}
                </div>
              ))}
            </div>
          )}
        </div>

        <input
          name="time"
          placeholder="Lap time (e.g. 68.43)"
          value={form.time}
          onChange={handleChange}
          style={inputStyle}
        />

      {/* 🏍️ BIKE AUTOCOMPLETE */}
      <div style={{
        position: 'relative',
        marginBottom: 50,   // ✅ IMPORTANT: creates space below dropdown
        zIndex: 10
      }}>

        <input
          placeholder="Start typing bike (e.g. xsr, mt07...)"
          value={bikeSearch}
          onChange={(e) => setBikeSearch(e.target.value)}
          style={inputStyle}
        />

        {/* dropdown */}
        {bikeSearch && filteredBikes.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: 8,
            maxHeight: 180,
            overflowY: 'auto',
            zIndex: 9999,   // ✅ always above everything
          }}>
            {filteredBikes.map((bike) => (
              <div
                key={bike}
                onClick={() => {
                  setForm(prev => ({ ...prev, bike }))
                  setBikeSearch(bike)
                }}
                style={{
                  padding: 10,
                  cursor: 'pointer',
                  borderBottom: '1px solid #222',
                  color: 'white'
                }}
              >
                {bike}
              </div>
            ))}
          </div>
        )}

      </div>

      {/* 📺 YOUTUBE (now safely below with spacing guaranteed) */}
      <input
        name="youtube"
        placeholder="YouTube URL"
        value={form.youtube}
        onChange={handleChange}
        style={inputStyle}
      />

        <button
          type="submit"
          style={{
            width: '100%',
            marginTop: 15,
            padding: 12,
            background: '#00ff99',
            color: '#000',
            border: 'none',
            borderRadius: 8,
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Submit Result
        </button>

      </form>
    </div>
  )
}

const inputStyle = {
  width: '100%',
  padding: 10,
  marginBottom: 10,
  borderRadius: 6,
  border: '1px solid #333',
  background: '#111',
  color: 'white',
  outline: 'none'
}

const backBtnStyle = {
  display: 'inline-block',
  padding: '8px 14px',
  background: '#1a1a1a',
  color: '#fff',
  borderRadius: 8,
  textDecoration: 'none',
  border: '1px solid #333',
  fontSize: 13
}