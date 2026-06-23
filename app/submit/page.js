'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const BIKES = [
  "yamaha xsr125", "yamaha mt125", "yamaha yzf-r125", "yamaha wr125",
  "yamaha mt03", "yamaha yzf-r3", "yamaha r3",
  "yamaha xsr700", "yamaha mt07", "yamaha yzf-r7", "yamaha tracer 7",
  "yamaha xsr900", "yamaha mt09", "yamaha tracer 9", "yamaha yzf-r1", "yamaha mt10",
  "yamaha wr250r", "yamaha wr450f",
  "ktm duke125", "ktm rc125", "ktm duke390", "ktm rc390",
  "ktm duke690", "ktm 690 smc r", "ktm duke790", "ktm duke890",
  "ktm 890 smt", "ktm 890 adventure", "ktm duke990",
  "ktm exc 250", "ktm exc 300", "ktm exc 500",
  "honda cb125r", "honda cbr125r", "honda cb300r", "honda cbr300r",
  "honda cb500f", "honda cbr500r", "honda cb650r", "honda cbr650r",
  "honda cb750 hornet", "honda cb1000r", "honda cbr1000rr",
  "honda crf250l", "honda crf450l",
  "kawasaki z400", "kawasaki ninja 400", "kawasaki z650", "kawasaki ninja 650",
  "kawasaki z900", "kawasaki ninja 1000sx", "kawasaki z1000",
  "kawasaki zx6r", "kawasaki zx10r", "kawasaki klx300",
  "suzuki sv650", "suzuki gsx-8s", "suzuki gsx-s750", "suzuki gsx-s1000",
  "suzuki gsx-r600", "suzuki gsx-r1000", "suzuki drz400sm",
  "triumph trident 660", "triumph street triple 765", "triumph speed triple 1200", "triumph tiger 900",
  "bmw g310r", "bmw f900r", "bmw s1000r", "bmw s1000rr", "bmw r1250r", "bmw r1250gs",
  "ducati monster 797", "ducati monster 821", "ducati monster 937",
  "ducati panigale v2", "ducati panigale v4",
  "ducati streetfighter v2", "ducati streetfighter v4",
  "aprilia rs 125", "aprilia rs 660", "aprilia tuono 660", "aprilia tuono v4", "aprilia rsv4",
  "husqvarna svartpilen 401", "husqvarna vitpilen 401",
  "husqvarna svartpilen 701", "husqvarna 701 supermoto",
  "yamaha fz6", "yamaha fz8", "yamaha tmax 560",
  "harley davidson sportster s", "harley davidson iron 883",
  "harley davidson street 750", "harley davidson fat bob", "indian scout bobber",
  "custom", "other", "unknown"
]

export default function Submit() {
  const [form, setForm] = useState({ name: '', plate: '', bikeModel: '', map: '', time: '', youtube: '' })

  // Rider autocomplete
  const [allRiders, setAllRiders] = useState([])
  const [riderSuggestions, setRiderSuggestions] = useState([])

  // Plate / bike lookup
  const [plateStatus, setPlateStatus] = useState('idle') // idle | loading | found | new | invalid
  const [bikeSearch, setBikeSearch] = useState('')
  const [plateDisplay, setPlateDisplay] = useState('')

  // Map
  const [maps, setMaps] = useState([])
  const [mapSearch, setMapSearch] = useState('')
  const [showMapDropdown, setShowMapDropdown] = useState(false)

  useEffect(() => {
    async function load() {
      const [{ data: riders }, { data: mapsData }] = await Promise.all([
        supabase.from('riders').select('name'),
        supabase.from('maps').select('name').order('name')
      ])
      if (riders) setAllRiders(riders)
      if (mapsData) setMaps(mapsData.map(m => m.name))
    }
    load()
  }, [])

  const handleNameChange = (e) => {
    const value = e.target.value
    if (!/^[A-Za-z0-9\s]*$/.test(value)) { alert('Please use English characters only.'); return }
    setForm(prev => ({ ...prev, name: value }))
    setRiderSuggestions(value ? allRiders.filter(r => r.name.toLowerCase().includes(value.toLowerCase())) : [])
  }

  const selectRider = (rider) => {
    setForm(prev => ({ ...prev, name: rider.name }))
    setRiderSuggestions([])
  }

  const handlePlateChange = async (e) => {
    const raw = e.target.value
    if (!/^[\d\s-]*$/.test(raw)) return  // only digits, spaces, dashes
    setPlateDisplay(raw)

    const digits = raw.replace(/[\s-]/g, '')
    setForm(prev => ({ ...prev, plate: digits, bikeModel: '' }))
    setBikeSearch('')

    if (digits.length < 8) {
      setPlateStatus(digits.length > 0 ? 'invalid' : 'idle')
      return
    }
    if (digits.length > 8) {
      setPlateStatus('invalid')
      return
    }

    // exactly 8 digits — auto lookup
    setPlateStatus('loading')
    const { data } = await supabase.from('bikes').select('model').eq('plate', digits).maybeSingle()
    if (data) {
      setForm(prev => ({ ...prev, bikeModel: data.model }))
      setBikeSearch(data.model)
      setPlateStatus('found')
    } else {
      setPlateStatus('new')
    }
  }

  const filteredMaps = maps.filter(m => m.toLowerCase().includes(mapSearch.toLowerCase()))
  const filteredBikes = BIKES.filter(b => b.toLowerCase().includes(bikeSearch.toLowerCase()))

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.name.trim()) return alert('Please enter your name.')
    if (form.plate.length !== 8) return alert('Please enter a valid 8-digit plate number.')
    if (plateStatus === 'loading') return alert('Still looking up plate, please wait.')
    if (plateStatus === 'invalid') return alert('Please enter a valid 8-digit plate number.')
    if (plateStatus === 'new' && !form.bikeModel.trim()) return alert('Please select your bike model.')
    if (!form.map.trim()) return alert('Please select or enter a map.')
    if (!form.time) return alert('Please enter a lap time.')

    try {
      // Register new bike if plate was not found
      if (plateStatus === 'new') {
        const { error } = await supabase.from('bikes').insert([{ plate: form.plate.trim(), model: form.bikeModel.trim() }])
        if (error) { alert('Failed to register bike: ' + error.message); return }
      }

      // Add map if it's new
      if (!maps.includes(form.map.trim())) {
        const { error } = await supabase.from('maps').insert([{ name: form.map.trim() }])
        if (error && error.code !== '23505') { alert('Failed to add map: ' + error.message); return }
      }

      // Find or create rider by name
      let rider
      const { data: existing } = await supabase.from('riders').select('*').eq('name', form.name.trim()).maybeSingle()
      if (existing) {
        rider = existing
      } else {
        const { data: newRider, error } = await supabase
          .from('riders')
          .insert([{ name: form.name.trim(), plate: form.plate.trim(), bike: form.bikeModel.trim() }])
          .select().single()
        if (error) { alert('Failed to create rider: ' + error.message); return }
        rider = newRider
      }

      // Submit result
      const { error } = await supabase.from('results').insert([{
        rider_id: rider.id,
        map_name: form.map.trim(),
        lap_time: parseFloat(form.time),
        bike: form.bikeModel.trim(),
        youtube_url: form.youtube,
        approved: false
      }])
      if (error) { alert('Failed to submit result: ' + error.message); return }

      alert('🏁 Submitted! Waiting for approval.')
      setForm({ name: '', plate: '', bikeModel: '', map: '', time: '', youtube: '' })
      setBikeSearch('')
      setMapSearch('')
      setPlateStatus('idle')

    } catch (err) {
      alert('Unexpected error: ' + err.message)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'Arial', color: 'white', padding: 20 }}>
      <form onSubmit={handleSubmit} style={{ background: '#1a1a1a', padding: 30, borderRadius: 14, width: 380, border: '1px solid #333' }}>

        <div style={{ marginBottom: 20 }}>
          <Link href="/" style={backBtnStyle}>← Back</Link>
        </div>

        <h1 style={{ textAlign: 'center', fontSize: 28, marginBottom: 6 }}>🏁 Submit Run</h1>
        <p style={{ textAlign: 'center', color: '#aaa', fontSize: 12, marginBottom: 20 }}>Enter your best lap time</p>

        {/* RIDER NAME */}
        <div style={{ position: 'relative' }}>
          <input
            placeholder="Rider name"
            value={form.name}
            onChange={handleNameChange}
            style={inputStyle}
            required
          />
          {riderSuggestions.length > 0 && form.name && (
            <div style={dropdownStyle}>
              {riderSuggestions.map(r => (
                <div key={r.name} onClick={() => selectRider(r)} style={dropdownItemStyle}>
                  {r.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PLATE — auto-lookup on 8 digits */}
        <input
          placeholder="Plate number (e.g. 9999-9999)"
          value={plateDisplay}
          onChange={handlePlateChange}
          style={{
            ...inputStyle,
            borderColor: plateStatus === 'invalid' ? '#ff4444'
              : plateStatus === 'found' ? '#00ff99'
              : plateStatus === 'new' ? 'orange'
              : '#333'
          }}
          required
        />
        {plateStatus === 'loading' && <p style={{ color: '#aaa', fontSize: 12, marginBottom: 8 }}>Looking up plate...</p>}
        {plateStatus === 'invalid' && <p style={{ color: '#ff4444', fontSize: 12, marginBottom: 8 }}>Israeli plates are 8 digits</p>}
        {plateStatus === 'found' && <p style={{ color: '#00ff99', fontSize: 12, marginBottom: 8 }}>✅ Bike found: {form.bikeModel}</p>}
        {plateStatus === 'new' && <p style={{ color: 'orange', fontSize: 12, marginBottom: 8 }}>⚠️ New plate — select your bike model below</p>}

        {/* BIKE MODEL — only shown after plate check */}
        {(plateStatus === 'found' || plateStatus === 'new') && (
          <div style={{ position: 'relative', marginBottom: plateStatus === 'new' ? 50 : 10 }}>
            <input
              placeholder={plateStatus === 'new' ? 'Search bike (e.g. mt07, xsr...)' : 'Bike model'}
              value={bikeSearch}
              onChange={(e) => { setBikeSearch(e.target.value); setForm(prev => ({ ...prev, bikeModel: e.target.value })) }}
              readOnly={plateStatus === 'found'}
              style={{ ...inputStyle, marginBottom: 0, background: plateStatus === 'found' ? '#222' : '#111', color: plateStatus === 'found' ? '#888' : 'white' }}
            />
            {plateStatus === 'new' && bikeSearch && filteredBikes.length > 0 && (
              <div style={{ ...dropdownStyle, maxHeight: 180, overflowY: 'auto' }}>
                {filteredBikes.map(bike => (
                  <div key={bike} onClick={() => { setBikeSearch(bike); setForm(prev => ({ ...prev, bikeModel: bike })) }} style={dropdownItemStyle}>
                    {bike}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MAP */}
        <div style={{ position: 'relative' }}>
          <input
            placeholder="Select or add map / track"
            value={form.map}
            onFocus={() => setShowMapDropdown(true)}
            onBlur={() => setTimeout(() => setShowMapDropdown(false), 200)}
            onChange={(e) => {
              const v = e.target.value
              if (!/^[A-Za-z0-9\s]*$/.test(v)) { alert('Please use English characters only.'); return }
              setForm(prev => ({ ...prev, map: v }))
              setMapSearch(v)
              setShowMapDropdown(true)
            }}
            style={inputStyle}
            required
          />
          {showMapDropdown && (
            <div style={{ ...dropdownStyle, zIndex: 9999 }}>
              {filteredMaps.map(m => (
                <div key={m} onClick={() => { setForm(prev => ({ ...prev, map: m })); setMapSearch(m); setShowMapDropdown(false) }} style={dropdownItemStyle}>
                  {m}
                </div>
              ))}
              {form.map && !maps.includes(form.map.trim()) && form.map.trim() && (
                <div onClick={() => setShowMapDropdown(false)} style={{ ...dropdownItemStyle, color: '#00ff99' }}>
                  ➕ Add new: "{form.map}"
                </div>
              )}
            </div>
          )}
        </div>

        {/* LAP TIME */}
        <input
          placeholder="Lap time in seconds (e.g. 68.43)"
          value={form.time}
          onChange={(e) => setForm(prev => ({ ...prev, time: e.target.value }))}
          style={inputStyle}
          required
        />

        {/* YOUTUBE */}
        <input
          placeholder="YouTube URL (optional)"
          value={form.youtube}
          onChange={(e) => setForm(prev => ({ ...prev, youtube: e.target.value }))}
          style={inputStyle}
        />

        <button type="submit" style={{ width: '100%', marginTop: 15, padding: 12, background: '#00ff99', color: '#000', border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer', fontSize: 15 }}>
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
  outline: 'none',
  boxSizing: 'border-box'
}

const dropdownStyle = {
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  background: '#1a1a1a',
  border: '1px solid #333',
  borderRadius: 8,
  zIndex: 9999,
}

const dropdownItemStyle = {
  padding: '10px 12px',
  cursor: 'pointer',
  borderBottom: '1px solid #222',
  color: 'white',
  fontSize: 13
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
