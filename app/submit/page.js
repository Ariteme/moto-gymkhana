'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
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

const BG = '#07090f'
const SURFACE = '#0c1118'
const CARD = '#101821'
const BORDER = '#1a2840'
const GREEN = '#00ff99'
const BLUE = '#1a5cff'
const TEXT = '#dce8f4'
const MUTED = '#7a90a8'
const RED = '#ff4757'
const ORANGE = '#ffa502'

function levenshtein(a, b) {
  const m = a.length, n = b.length
  const dp = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0))
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j-1], dp[i-1][j], dp[i][j-1])
  return dp[m][n]
}

export default function Submit() {
  const [form, setForm] = useState({ name: '', plate: '', bikeModel: '', map: '', time: '', youtube: '' })

  const [allRiders, setAllRiders] = useState([])
  const [riderSuggestions, setRiderSuggestions] = useState([])
  const [fuzzySuggestions, setFuzzySuggestions] = useState([])

  const [plateStatus, setPlateStatus] = useState('idle')
  const [bikeSearch, setBikeSearch] = useState('')
  const [plateDisplay, setPlateDisplay] = useState('')

  const [maps, setMaps] = useState([])           // [{ name, image_url }]
  const [mapSearch, setMapSearch] = useState('')
  const [showMapDropdown, setShowMapDropdown] = useState(false)

  useEffect(() => {
    async function load() {
      const [{ data: riders }, { data: mapsData }] = await Promise.all([
        supabase.from('riders').select('name'),
        supabase.from('maps').select('name, image_url').order('name')
      ])
      if (riders) setAllRiders(riders)
      if (mapsData) setMaps(mapsData)
    }
    load()
  }, [])

  const handleNameChange = (e) => {
    const value = e.target.value
    if (!/^[A-Za-z0-9\s]*$/.test(value)) { alert('Please use English characters only.'); return }
    setForm(prev => ({ ...prev, name: value }))
    if (!value) { setRiderSuggestions([]); setFuzzySuggestions([]); return }
    const v = value.toLowerCase().trim()
    const exact = allRiders.filter(r => r.name.toLowerCase().includes(v))
    setRiderSuggestions(exact)
    if (v.length >= 4) {
      const fuzzy = allRiders.filter(r => {
        const rn = r.name.toLowerCase()
        if (rn.includes(v) || v.includes(rn)) return false
        return levenshtein(v, rn) / Math.max(v.length, rn.length) < 0.45
      })
      setFuzzySuggestions(fuzzy)
    } else {
      setFuzzySuggestions([])
    }
  }

  const selectRider = (rider) => {
    setForm(prev => ({ ...prev, name: rider.name }))
    setRiderSuggestions([])
    setFuzzySuggestions([])
  }

  const handlePlateChange = async (e) => {
    const raw = e.target.value
    if (!/^[\d\s-]*$/.test(raw)) return
    setPlateDisplay(raw)
    const digits = raw.replace(/[\s-]/g, '')
    setForm(prev => ({ ...prev, plate: digits, bikeModel: '' }))
    setBikeSearch('')
    if (digits.length < 7) { setPlateStatus('idle'); return }
    if (digits.length > 8) { setPlateStatus('invalid'); return }
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

  const mapNames = maps.map(m => m.name)
  const filteredMaps = maps.filter(m => m.name.toLowerCase().includes(mapSearch.toLowerCase()))
  const selectedMapImage = maps.find(m => m.name === form.map)?.image_url
  const filteredBikes = BIKES.filter(b => b.toLowerCase().includes(bikeSearch.toLowerCase()))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return alert('Please enter your name.')
    if (form.plate.length !== 7 && form.plate.length !== 8) return alert('Please enter a valid plate number (7 or 8 digits).')
    if (plateStatus === 'loading') return alert('Still looking up plate, please wait.')
    if (plateStatus === 'invalid') return alert('Please enter a valid plate number.')
    if (plateStatus === 'new' && !form.bikeModel.trim()) return alert('Please select your bike model.')
    if (!form.map.trim()) return alert('Please select or enter a map.')
    if (!form.time) return alert('Please enter a lap time.')

    try {
      if (plateStatus === 'new') {
        const { error } = await supabase.from('bikes').insert([{ plate: form.plate.trim(), model: form.bikeModel.trim() }])
        if (error) { alert('Failed to register bike: ' + error.message); return }
      }
      if (!mapNames.includes(form.map.trim())) {
        const { error } = await supabase.from('maps').insert([{ name: form.map.trim() }])
        if (error && error.code !== '23505') { alert('Failed to add map: ' + error.message); return }
      }
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
      setPlateDisplay('')
    } catch (err) {
      alert('Unexpected error: ' + err.message)
    }
  }

  return (
    <div style={{ background: '#030508', minHeight: '100vh', fontFamily: 'var(--font-geist-sans, Arial, sans-serif)' }}>
    <div style={{ maxWidth: 700, margin: '0 auto', background: BG, minHeight: '100vh', color: TEXT, boxShadow: '0 0 80px rgba(0,0,0,0.7)' }}>

      {/* HEADER */}
      <div style={{ background: `linear-gradient(180deg, #0a1020 0%, ${SURFACE} 100%)`, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ height: 4, background: `linear-gradient(90deg, ${BLUE}, ${GREEN}, ${BLUE})` }} />
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px 16px', gap: 12 }}>
          <Link href="/" style={{ color: MUTED, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', border: `1px solid ${BORDER}`, borderRadius: 8 }}>
            ← Back
          </Link>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: TEXT }}>Submit Your Run</div>
            <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>🏁 Israeli Moto Gymkhana</div>
          </div>
          <div style={{ width: 64 }} />
        </div>
      </div>

      {/* FORM */}
      <form onSubmit={handleSubmit} style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px 80px' }}>

        {/* RIDER NAME */}
        <div style={{ marginBottom: 20, position: 'relative' }}>
          <FieldLabel>Rider name</FieldLabel>
          <input
            placeholder="Your name in English"
            value={form.name}
            onChange={handleNameChange}
            autoComplete="name"
            style={inputStyle}
            required
          />
          {riderSuggestions.length > 0 && form.name && (
            <DropList>
              {riderSuggestions.map(r => (
                <DropItem key={r.name} onClick={() => selectRider(r)}>{r.name}</DropItem>
              ))}
            </DropList>
          )}
          {fuzzySuggestions.length > 0 && riderSuggestions.length === 0 && (
            <div style={{ marginTop: 8, padding: '10px 12px', background: `${ORANGE}12`, border: `1px solid ${ORANGE}40`, borderRadius: 10 }}>
              <div style={{ fontSize: 12, color: ORANGE, fontWeight: 600, marginBottom: 6 }}>⚠️ Did you mean?</div>
              {fuzzySuggestions.map(r => (
                <button key={r.name} onClick={() => selectRider(r)} style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  background: `${ORANGE}18`, border: `1px solid ${ORANGE}50`, borderRadius: 8,
                  color: TEXT, fontSize: 14, padding: '8px 12px', cursor: 'pointer', marginBottom: 4,
                }}>
                  {r.name} <span style={{ color: ORANGE, fontSize: 12 }}>— tap to use</span>
                </button>
              ))}
              <div style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>Only continue typing if this is truly a new person.</div>
            </div>
          )}
        </div>

        {/* PLATE */}
        <div style={{ marginBottom: plateStatus !== 'idle' ? 6 : 20 }}>
          <FieldLabel extra="7 or 8 digits">Plate number</FieldLabel>
          <input
            placeholder="e.g. 123-45-678 or 12-345-67"
            value={plateDisplay}
            onChange={handlePlateChange}
            inputMode="numeric"
            style={{
              ...inputStyle,
              marginBottom: 0,
              borderColor: plateStatus === 'invalid' ? RED
                : plateStatus === 'found' ? GREEN
                : plateStatus === 'new' ? ORANGE
                : BORDER
            }}
          />
        </div>
        {plateStatus !== 'idle' && (
          <div style={{ marginBottom: 16 }}>
            {plateStatus === 'loading' && <StatusBadge color={MUTED}>⏳ Looking up plate...</StatusBadge>}
            {plateStatus === 'found' && <StatusBadge color={GREEN}>✅ Bike found: {form.bikeModel}</StatusBadge>}
            {plateStatus === 'new' && <StatusBadge color={ORANGE}>⚠️ New plate — select your bike model below</StatusBadge>}
            {plateStatus === 'invalid' && <StatusBadge color={RED}>✗ Israeli plates are 7 digits (older) or 8 digits (new)</StatusBadge>}
          </div>
        )}

        {/* BIKE MODEL */}
        {(plateStatus === 'found' || plateStatus === 'new') && (
          <div style={{ marginBottom: 20, position: 'relative' }}>
            <FieldLabel>Bike model</FieldLabel>
            <input
              placeholder={plateStatus === 'new' ? 'Search bike model (e.g. mt07, xsr...)' : ''}
              value={bikeSearch}
              onChange={(e) => {
                setBikeSearch(e.target.value)
                setForm(prev => ({ ...prev, bikeModel: e.target.value }))
              }}
              readOnly={plateStatus === 'found'}
              style={{
                ...inputStyle,
                background: plateStatus === 'found' ? '#0a1020' : CARD,
                color: plateStatus === 'found' ? MUTED : TEXT,
                cursor: plateStatus === 'found' ? 'default' : 'text',
              }}
            />
            {plateStatus === 'new' && bikeSearch && filteredBikes.length > 0 && (
              <DropList maxHeight={200}>
                {filteredBikes.map(bike => (
                  <DropItem key={bike} onClick={() => {
                    setBikeSearch(bike)
                    setForm(prev => ({ ...prev, bikeModel: bike }))
                  }}>
                    {bike}
                  </DropItem>
                ))}
              </DropList>
            )}
          </div>
        )}

        {/* MAP */}
        <div style={{ marginBottom: selectedMapImage ? 12 : 20, position: 'relative' }}>
          <FieldLabel>Map / Track</FieldLabel>
          <input
            placeholder="Select or type a map name"
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
            <DropList>
              {filteredMaps.map(m => (
                <DropItem key={m.name} onClick={() => {
                  setForm(prev => ({ ...prev, map: m.name }))
                  setMapSearch(m.name)
                  setShowMapDropdown(false)
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {m.image_url && (
                      <div style={{ width: 44, height: 33, borderRadius: 5, overflow: 'hidden', flexShrink: 0, background: CARD }}>
                        <Image src={m.image_url} alt={m.name} width={88} height={66} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      </div>
                    )}
                    <span>{m.name}</span>
                  </div>
                </DropItem>
              ))}
              {form.map && !mapNames.includes(form.map.trim()) && form.map.trim() && (
                <DropItem color={GREEN} onClick={() => setShowMapDropdown(false)}>
                  ➕ Add new: "{form.map}"
                </DropItem>
              )}
            </DropList>
          )}
        </div>

        {/* MAP PREVIEW IMAGE */}
        {selectedMapImage && (
          <div style={{ marginBottom: 20, borderRadius: 12, overflow: 'hidden', border: `1px solid ${BORDER}` }}>
            <Image
              src={selectedMapImage}
              alt={`${form.map} course map`}
              width={800}
              height={600}
              style={{ width: '100%', height: 'auto', display: 'block' }}
              sizes="(max-width: 600px) 100vw, 480px"
              priority
            />
            <div style={{ padding: '8px 12px', fontSize: 12, color: MUTED, background: CARD, borderTop: `1px solid ${BORDER}` }}>
              🏁 {form.map} — course layout
            </div>
          </div>
        )}

        {/* LAP TIME */}
        <div style={{ marginBottom: 20 }}>
          <FieldLabel>Lap time</FieldLabel>
          <input
            placeholder="Seconds  (e.g. 68.43)"
            value={form.time}
            onChange={(e) => setForm(prev => ({ ...prev, time: e.target.value }))}
            inputMode="decimal"
            style={inputStyle}
            required
          />
        </div>

        {/* YOUTUBE */}
        <div style={{ marginBottom: 32 }}>
          <FieldLabel extra="optional">YouTube URL</FieldLabel>
          <input
            placeholder="https://youtube.com/watch?v=..."
            value={form.youtube}
            onChange={(e) => setForm(prev => ({ ...prev, youtube: e.target.value }))}
            type="url"
            inputMode="url"
            style={inputStyle}
          />
        </div>

        <button type="submit" style={{
          width: '100%', padding: '15px 20px',
          background: GREEN, color: '#000',
          border: 'none', borderRadius: 12,
          fontWeight: 800, fontSize: 16, cursor: 'pointer',
          boxShadow: '0 4px 24px rgba(0,255,153,0.3)',
          letterSpacing: 0.3,
        }}>
          🏁 Submit Run
        </button>

      </form>
    </div>
    </div>
  )
}

function FieldLabel({ children, extra }) {
  return (
    <label style={{ display: 'block', marginBottom: 7, fontSize: 12, fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.8 }}>
      {children}
      {extra && <span style={{ marginLeft: 6, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>{extra}</span>}
    </label>
  )
}

function StatusBadge({ color, children }) {
  return (
    <div style={{ fontSize: 13, color, padding: '7px 12px', background: `${color}12`, borderRadius: 8, border: `1px solid ${color}30` }}>
      {children}
    </div>
  )
}

function DropList({ children, maxHeight }) {
  return (
    <div style={{
      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
      background: '#141e2e', border: `1px solid ${BORDER}`,
      borderRadius: 10, marginTop: 4,
      maxHeight: maxHeight || 220, overflowY: 'auto',
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
    }}>
      {children}
    </div>
  )
}

function DropItem({ children, onClick, color }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '11px 14px', cursor: 'pointer',
        borderBottom: `1px solid ${BORDER}`,
        color: color || TEXT, fontSize: 14,
      }}
    >
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  marginBottom: 0,
  borderRadius: 10,
  border: `1px solid ${BORDER}`,
  background: CARD,
  color: TEXT,
  outline: 'none',
  boxSizing: 'border-box',
  fontSize: 16,
}
