'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useAuth } from '@/lib/AuthContext'

const BG = '#07090f'
const SURFACE = '#0c1118'
const CARD = '#101821'
const BORDER = '#1a2840'
const GREEN = '#00ff99'
const BLUE = '#1a5cff'
const TEXT = '#dce8f4'
const MUTED = '#7a90a8'
const ORANGE = '#ffa502'
const RED = '#ff4757'
const GOLD = '#ffc947'

const PREDEFINED_TAGS = {
  'Difficulty': ['Easy', 'Medium', 'Hard'],
  'Technique': ['Countersteering', 'Trail Braking (Front)', 'Rear Brake Drag (Rear)', 'Throttle Control', 'Clutch Control', 'Body Position', 'Counterweighting', 'Vision', 'Gear Selection', 'Slow Speed Balance'],
  'Maneuver': ['Slalom', 'Figure Eight', 'Full-Lock Turn', 'Pivot Turn'],
}

export default function Admin() {
  const { user, isAdmin, adminToken, authLoading, signIn, signOut } = useAuth()
  const adminPassword = adminToken  // alias — existing code references adminPassword
  const [tab, setTab] = useState('results')

  // Results tab
  const [data, setData] = useState([])

  // Training tab
  const [trainingVideos, setTrainingVideos] = useState([])
  const [tvForm, setTvForm] = useState({ youtube_url: '', title: '', description: '', title_ru: '', description_ru: '', tags: [] })
  const [tvSaving, setTvSaving] = useState(false)
  const [customTag, setCustomTag] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(null)
  const [editCustomTag, setEditCustomTag] = useState('')

  // Tools tab
  const [riders, setRiders] = useState([])
  const [mergeFrom, setMergeFrom] = useState('')
  const [mergeTo, setMergeTo] = useState('')
  const [merging, setMerging] = useState(false)

  // Map images
  const [maps, setMaps] = useState([])
  const [uploadingMapId, setUploadingMapId] = useState(null)
  const [mapForm, setMapForm] = useState({ name: '' })
  const [mapSaving, setMapSaving] = useState(false)


  const fetchAll = async () => {
    const [{ data: results }, { data: riderRows }, { data: tvRows }, { data: mapRows }] = await Promise.all([
      supabase.from('results').select('id, map_name, lap_time, bike, youtube_url, approved, created_at, riders(name, id)').order('created_at', { ascending: false }),
      supabase.from('riders').select('id, name').order('name'),
      supabase.from('training_videos').select('*').order('created_at', { ascending: false }),
      supabase.from('maps').select('id, name, image_url').order('name'),
    ])
    setData(results || [])
    setRiders(riderRows || [])
    setTrainingVideos(tvRows || [])
    setMaps(mapRows || [])
  }

  const uploadMapImage = async (map, file) => {
    setUploadingMapId(map.id)
    const formData = new FormData()
    formData.append('password', adminPassword)
    formData.append('mapId', map.id)
    formData.append('mapName', map.name)
    formData.append('file', file)
    const res = await fetch('/api/admin-map-upload', { method: 'POST', body: formData })
    const json = await res.json()
    if (!res.ok) {
      alert('Upload failed: ' + json.error)
    } else {
      await fetchAll()
    }
    setUploadingMapId(null)
  }

  useEffect(() => {
    if (isAdmin) fetchAll()
  }, [isAdmin])

  const approve = async (id) => {
    const { error } = await supabase.from('results').update({ approved: true }).eq('id', id)
    if (error) { alert('Approve failed: ' + error.message); return }
    fetchAll()
  }

  const removeResult = async (id) => {
    if (!confirm('Delete this run?')) return
    const { error } = await supabase.from('results').delete().eq('id', id)
    if (error) { alert('Delete failed: ' + error.message); return }
    fetchAll()
  }

  const addMap = async (e) => {
    e.preventDefault()
    const name = mapForm.name.trim()
    if (!name) return
    if (maps.some(m => m.name.toLowerCase() === name.toLowerCase())) {
      alert('A map with that name already exists.')
      return
    }
    setMapSaving(true)
    const res = await fetch('/api/admin-maps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: adminPassword, name }),
    })
    const json = await res.json()
    if (!res.ok) { alert('Failed: ' + json.error); setMapSaving(false); return }
    setMapForm({ name: '' })
    setMapSaving(false)
    await fetchAll()
  }

  const deleteMap = async (map) => {
    if (!confirm(`Delete map "${map.name}"?\n\nThis will NOT delete results logged against it.`)) return
    const res = await fetch('/api/admin-maps', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: adminPassword, id: map.id }),
    })
    const json = await res.json()
    if (!res.ok) { alert('Delete failed: ' + json.error); return }
    await fetchAll()
  }

  const mergeRiders = async () => {
    if (!mergeFrom || !mergeTo || mergeFrom === mergeTo) return
    const fromRider = riders.find(r => r.id === mergeFrom)
    const toRider = riders.find(r => r.id === mergeTo)
    if (!confirm(`Merge "${fromRider?.name}" → "${toRider?.name}"?\n\nAll runs will move to "${toRider?.name}", then "${fromRider?.name}" will be deleted. This cannot be undone.`)) return
    setMerging(true)
    const res = await fetch('/api/admin-merge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: adminPassword, mergeFrom, mergeTo }),
    })
    const json = await res.json()
    if (!res.ok) { alert('Merge failed: ' + json.error); setMerging(false); return }
    setMergeFrom(''); setMergeTo(''); setMerging(false)
    await fetchAll()
    alert(`✓ Merged! "${fromRider?.name}" absorbed into "${toRider?.name}".`)
  }

  const addTrainingVideo = async (e) => {
    e.preventDefault()
    if (!tvForm.youtube_url.trim() || !tvForm.title.trim()) return alert('URL and title are required.')
    setTvSaving(true)
    const res = await fetch('/api/admin-training', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: adminPassword, ...tvForm }),
    })
    const json = await res.json()
    if (!res.ok) { alert('Failed: ' + json.error); setTvSaving(false); return }
    setTvForm({ youtube_url: '', title: '', description: '', title_ru: '', description_ru: '', tags: [] })
    setCustomTag('')
    setTvSaving(false)
    await fetchAll()
  }

  const saveEditVideo = async () => {
    if (!editForm.youtube_url.trim() || !editForm.title.trim()) return alert('URL and title are required.')
    const res = await fetch('/api/admin-training', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: adminPassword, id: editingId, ...editForm }),
    })
    const json = await res.json()
    if (!res.ok) { alert('Failed: ' + json.error); return }
    setEditingId(null); setEditForm(null); setEditCustomTag('')
    await fetchAll()
  }

  const deleteTrainingVideo = async (id) => {
    if (!confirm('Delete this training video?')) return
    const res = await fetch('/api/admin-training', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: adminPassword, id }),
    })
    const json = await res.json()
    if (!res.ok) { alert('Failed: ' + json.error); return }
    if (editingId === id) { setEditingId(null); setEditForm(null) }
    await fetchAll()
  }

  const addCustomTag = (tag, form, setForm, setInput) => {
    const t = tag.trim()
    if (!t || form.tags.includes(t)) { setInput(''); return }
    setForm(p => ({ ...p, tags: [...p.tags, t] }))
    setInput('')
  }

  function ytId(url) {
    if (!url) return null
    if (url.includes('watch?v=')) return url.split('v=')[1].split('&')[0]
    if (url.includes('youtu.be/')) return url.split('youtu.be/')[1].split('?')[0]
    if (url.includes('/shorts/')) return url.split('/shorts/')[1].split('?')[0]
    return null
  }

  /* ── AUTH GATE ── */
  const gate = (content) => (
    <div style={{ background: '#030508', minHeight: '100vh', fontFamily: 'var(--font-geist-sans, Arial, sans-serif)' }}>
    <div style={{ maxWidth: 700, margin: '0 auto', background: BG, minHeight: '100vh', boxShadow: '0 0 80px rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 360, textAlign: 'center' }}>{content}</div>
    </div>
    </div>
  )

  if (authLoading) return gate(
    <div style={{ color: MUTED, fontSize: 15 }}>Loading…</div>
  )

  if (!user) return gate(<>
    <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
    <div style={{ fontSize: 22, fontWeight: 800, color: TEXT, marginBottom: 4 }}>Admin Access</div>
    <div style={{ fontSize: 13, color: MUTED, marginBottom: 28 }}>Israeli Moto Gymkhana</div>
    <button onClick={signIn} style={{
      width: '100%', padding: '13px 20px', background: '#fff', color: '#1a1a1a',
      border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      boxShadow: '0 4px 20px rgba(255,255,255,0.12)',
    }}>
      <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></svg>
      Sign in with Google
    </button>
  </>)

  if (!isAdmin) return gate(<>
    <div style={{ fontSize: 48, marginBottom: 12 }}>⛔</div>
    <div style={{ fontSize: 18, fontWeight: 700, color: TEXT, marginBottom: 6 }}>Access denied</div>
    <div style={{ fontSize: 13, color: MUTED, marginBottom: 24 }}>{user.email}</div>
    <button onClick={signOut} style={{ padding: '10px 22px', background: 'transparent', border: `1px solid ${BORDER}`, color: MUTED, borderRadius: 9, fontSize: 14, cursor: 'pointer' }}>
      Sign out
    </button>
  </>)

  /* ── ADMIN PANEL ── */
  const pending = data.filter(r => !r.approved)
  const approved = data.filter(r => r.approved)

  return (
    <div style={{ background: '#030508', minHeight: '100vh', fontFamily: 'var(--font-geist-sans, Arial, sans-serif)' }}>
    <div style={{ maxWidth: 700, margin: '0 auto', background: BG, minHeight: '100vh', color: TEXT, boxShadow: '0 0 80px rgba(0,0,0,0.7)' }}>

      {/* HEADER */}
      <div style={{ background: `linear-gradient(180deg, #0a1020 0%, ${SURFACE} 100%)`, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ height: 4, background: `linear-gradient(90deg, ${BLUE}, ${GREEN}, ${BLUE})` }} />
        <div style={{ padding: '14px 16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <Link href="/" style={{ color: MUTED, fontSize: 13, padding: '6px 10px', border: `1px solid ${BORDER}`, borderRadius: 8 }}>← Back</Link>
            <div style={{ flex: 1, fontSize: 12, color: MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
            <button onClick={signOut}
              style={{ background: 'none', border: `1px solid ${BORDER}`, color: MUTED, borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13, flexShrink: 0 }}>
              Sign out
            </button>
          </div>
          <h1 style={{ margin: '0 0 16px', fontSize: 24, fontWeight: 900, color: TEXT }}>🛠 Admin Panel</h1>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4 }}>
            {[
              { key: 'results', label: `Results${pending.length ? ` (${pending.length}⚠)` : ''}` },
              { key: 'training', label: `Training (${trainingVideos.length})` },
              { key: 'tools', label: 'Tools' },
              { key: 'stats', label: 'Stats' },
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                padding: '9px 16px', background: 'none', border: 'none',
                borderBottom: tab === t.key ? `2px solid ${GREEN}` : '2px solid transparent',
                color: tab === t.key ? GREEN : MUTED,
                fontWeight: tab === t.key ? 700 : 400, fontSize: 13, cursor: 'pointer',
              }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 12px 80px', maxWidth: 640, margin: '0 auto' }}>

        {/* ── RESULTS TAB ── */}
        {tab === 'results' && (
          <>
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              <Stat value={pending.length} label="Pending" color={ORANGE} />
              <Stat value={approved.length} label="Approved" color={GREEN} />
              <Stat value={data.length} label="Total" color={MUTED} />
            </div>
            {pending.length > 0 && (
              <>
                <SectionTitle>Pending approval ({pending.length})</SectionTitle>
                {pending.map(r => <ResultCard key={r.id} r={r} onApprove={() => approve(r.id)} onDelete={() => removeResult(r.id)} />)}
              </>
            )}
            {approved.length > 0 && (
              <>
                <SectionTitle style={{ marginTop: pending.length > 0 ? 28 : 0 }}>Approved ({approved.length})</SectionTitle>
                {approved.map(r => <ResultCard key={r.id} r={r} onDelete={() => removeResult(r.id)} />)}
              </>
            )}
            {data.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: MUTED }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                <div>No submissions yet</div>
              </div>
            )}
          </>
        )}

        {/* ── TRAINING TAB ── */}
        {tab === 'training' && (
          <>
            {/* Add form */}
            <SectionTitle>Add training video</SectionTitle>
            <form onSubmit={addTrainingVideo} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 16, marginBottom: 28 }}>
              <Field label="YouTube URL">
                <input value={tvForm.youtube_url} onChange={e => setTvForm(p => ({ ...p, youtube_url: e.target.value }))}
                  placeholder="https://youtube.com/watch?v=..." style={inputSt} required />
              </Field>
              <Field label="Title">
                <input value={tvForm.title} onChange={e => setTvForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Gymkhana Basic Patterns" style={inputSt} required />
              </Field>
              <Field label="Description (optional)">
                <textarea value={tvForm.description} onChange={e => setTvForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Short description" rows={3} style={{ ...inputSt, resize: 'vertical', lineHeight: 1.5 }} />
              </Field>
              <Field label="Title (Russian)">
                <input value={tvForm.title_ru} onChange={e => setTvForm(p => ({ ...p, title_ru: e.target.value }))}
                  placeholder="Название на русском" style={inputSt} />
              </Field>
              <Field label="Description (Russian)">
                <textarea value={tvForm.description_ru} onChange={e => setTvForm(p => ({ ...p, description_ru: e.target.value }))}
                  placeholder="Описание на русском" rows={3} style={{ ...inputSt, resize: 'vertical', lineHeight: 1.5 }} />
              </Field>
              <TagPicker
                form={tvForm} setForm={setTvForm}
                customTag={customTag} setCustomTag={setCustomTag}
                addCustomTag={addCustomTag}
              />
              <button type="submit" disabled={tvSaving} style={{
                width: '100%', padding: '12px 16px', background: GREEN, color: '#000',
                border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: 'pointer',
                opacity: tvSaving ? 0.6 : 1,
              }}>
                {tvSaving ? 'Saving...' : '➕ Add Video'}
              </button>
            </form>

            {/* Existing videos */}
            {trainingVideos.length > 0 && (
              <>
                <SectionTitle>Existing videos ({trainingVideos.length})</SectionTitle>
                {trainingVideos.map(v => {
                  const vid = ytId(v.youtube_url)
                  const isEditing = editingId === v.id

                  if (isEditing) return (
                    <div key={v.id} style={{ background: CARD, borderRadius: 12, marginBottom: 10, border: `1px solid ${BLUE}`, padding: 16 }}>
                      <div style={{ fontSize: 12, color: BLUE, fontWeight: 700, marginBottom: 12 }}>✏️ Editing</div>
                      <Field label="YouTube URL">
                        <input value={editForm.youtube_url} onChange={e => setEditForm(p => ({ ...p, youtube_url: e.target.value }))} style={inputSt} />
                      </Field>
                      <Field label="Title">
                        <input value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} style={inputSt} />
                      </Field>
                      <Field label="Description">
                        <textarea value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                          rows={3} style={{ ...inputSt, resize: 'vertical', lineHeight: 1.5 }} />
                      </Field>
                      <Field label="Title (Russian)">
                        <input value={editForm.title_ru || ''} onChange={e => setEditForm(p => ({ ...p, title_ru: e.target.value }))}
                          placeholder="Название на русском" style={inputSt} />
                      </Field>
                      <Field label="Description (Russian)">
                        <textarea value={editForm.description_ru || ''} onChange={e => setEditForm(p => ({ ...p, description_ru: e.target.value }))}
                          placeholder="Описание на русском" rows={3} style={{ ...inputSt, resize: 'vertical', lineHeight: 1.5 }} />
                      </Field>
                      <TagPicker
                        form={editForm} setForm={setEditForm}
                        customTag={editCustomTag} setCustomTag={setEditCustomTag}
                        addCustomTag={addCustomTag}
                      />
                      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                        <button onClick={saveEditVideo} style={{ flex: 1, padding: '11px 14px', background: GREEN, color: '#000', border: 'none', borderRadius: 9, fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
                          ✓ Save
                        </button>
                        <button onClick={() => { setEditingId(null); setEditForm(null); setEditCustomTag('') }}
                          style={{ padding: '11px 14px', background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 9, color: MUTED, fontSize: 14, cursor: 'pointer' }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )

                  return (
                    <div key={v.id} style={{ background: CARD, borderRadius: 12, marginBottom: 10, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', gap: 12, padding: '12px 14px' }}>
                        {vid && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={`https://img.youtube.com/vi/${vid}/default.jpg`}
                            style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} alt="" />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: TEXT, marginBottom: 4 }}>{v.title}</div>
                          {v.description && <div style={{ fontSize: 12, color: MUTED, marginBottom: 6 }}>{v.description}</div>}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {(v.tags || []).map(tag => (
                              <span key={tag} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'rgba(0,255,153,0.08)', border: `1px solid ${GREEN}30`, color: GREEN }}>{tag}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div style={{ borderTop: `1px solid ${BORDER}`, display: 'flex' }}>
                        <a href={v.youtube_url} target="_blank" rel="noopener noreferrer"
                          style={{ flex: 1, padding: '10px 14px', color: MUTED, fontSize: 13, textAlign: 'center', borderRight: `1px solid ${BORDER}` }}>
                          ▶ Watch
                        </a>
                        <button onClick={() => { setEditingId(v.id); setEditForm({ youtube_url: v.youtube_url, title: v.title, description: v.description || '', title_ru: v.title_ru || '', description_ru: v.description_ru || '', tags: [...(v.tags || [])] }) }}
                          style={{ flex: 1, padding: '10px 14px', background: 'transparent', border: 'none', borderRight: `1px solid ${BORDER}`, color: BLUE, fontSize: 13, cursor: 'pointer' }}>
                          ✏️ Edit
                        </button>
                        <button onClick={() => deleteTrainingVideo(v.id)}
                          style={{ flex: 1, padding: '10px 14px', background: 'transparent', border: 'none', color: RED, fontSize: 13, cursor: 'pointer' }}>
                          Delete
                        </button>
                      </div>
                    </div>
                  )
                })}
              </>
            )}
          </>
        )}

        {/* ── TOOLS TAB ── */}
        {tab === 'tools' && (
          <>
            {/* Add map */}
            <SectionTitle>Add map</SectionTitle>
            <form onSubmit={addMap} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 16, marginBottom: 28 }}>
              <Field label="Map name">
                <input
                  value={mapForm.name}
                  onChange={e => setMapForm({ name: e.target.value })}
                  placeholder="e.g. Pita GP"
                  style={inputSt}
                  required
                />
              </Field>
              <button type="submit" disabled={mapSaving || !mapForm.name.trim()} style={{
                width: '100%', padding: '12px 16px', background: GREEN, color: '#000',
                border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: 'pointer',
                opacity: mapSaving || !mapForm.name.trim() ? 0.5 : 1,
              }}>
                {mapSaving ? 'Saving…' : '➕ Add Map'}
              </button>
            </form>

            {/* Map images */}
            <SectionTitle>Map images</SectionTitle>
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 18, marginBottom: 28 }}>
              <div style={{ fontSize: 13, color: MUTED, marginBottom: 16 }}>
                Upload a course layout image for each map. Shown on the submit form and maps page.
              </div>
              {maps.map(map => (
                <div key={map.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, padding: '10px 0', borderBottom: `1px solid ${BORDER}` }}>
                  {/* Thumbnail */}
                  <div style={{ width: 64, height: 48, borderRadius: 8, overflow: 'hidden', background: '#0a1020', flexShrink: 0, border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {map.image_url
                      ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={map.image_url} alt={map.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )
                      : <span style={{ fontSize: 20 }}>🗺</span>
                    }
                  </div>
                  {/* Name */}
                  <div style={{ flex: 1, fontSize: 14, color: TEXT, fontWeight: 600 }}>{map.name}</div>
                  {/* Upload button */}
                  <label style={{
                    padding: '7px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer', flexShrink: 0,
                    background: uploadingMapId === map.id ? '#ffffff08' : `${BLUE}20`,
                    border: `1px solid ${uploadingMapId === map.id ? BORDER : BLUE}`,
                    color: uploadingMapId === map.id ? MUTED : BLUE,
                    fontWeight: 600,
                  }}>
                    {uploadingMapId === map.id ? 'Uploading…' : map.image_url ? '↑ Replace' : '↑ Upload'}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      disabled={uploadingMapId !== null}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) uploadMapImage(map, file)
                        e.target.value = ''
                      }}
                    />
                  </label>
                  <button
                    onClick={() => deleteMap(map)}
                    style={{ padding: '7px 10px', background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 8, color: RED, fontSize: 13, cursor: 'pointer', flexShrink: 0 }}
                    title="Delete map"
                  >
                    🗑
                  </button>
                </div>
              ))}
              {maps.length === 0 && <div style={{ fontSize: 13, color: MUTED }}>No maps yet.</div>}
            </div>

            {/* Merge riders */}
            {riders.length >= 2 && (
              <>
                <SectionTitle>Merge duplicate riders</SectionTitle>
                <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 18 }}>
                  <div style={{ fontSize: 13, color: MUTED, marginBottom: 16 }}>
                    Moves all runs from the duplicate to the correct rider, then deletes the duplicate.
                  </div>
                  <Field label="Duplicate (delete after)">
                    <select value={mergeFrom} onChange={e => setMergeFrom(e.target.value)} style={{ ...inputSt, appearance: 'none' }}>
                      <option value="">— select rider to remove —</option>
                      {riders.filter(r => r.id !== mergeTo).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Keep (correct name)">
                    <select value={mergeTo} onChange={e => setMergeTo(e.target.value)} style={{ ...inputSt, appearance: 'none' }}>
                      <option value="">— select rider to keep —</option>
                      {riders.filter(r => r.id !== mergeFrom).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </Field>
                  <button onClick={mergeRiders} disabled={!mergeFrom || !mergeTo || mergeFrom === mergeTo || merging} style={{
                    width: '100%', padding: '12px 16px',
                    background: mergeFrom && mergeTo && mergeFrom !== mergeTo ? `${ORANGE}20` : '#ffffff08',
                    border: `1px solid ${mergeFrom && mergeTo ? ORANGE : BORDER}`,
                    borderRadius: 10, color: mergeFrom && mergeTo ? ORANGE : MUTED,
                    fontWeight: 700, fontSize: 14, cursor: mergeFrom && mergeTo ? 'pointer' : 'default',
                    opacity: merging ? 0.5 : 1,
                  }}>
                    {merging ? 'Merging...' : '🔀 Merge riders'}
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {/* ── STATS TAB ── */}
        {tab === 'stats' && (
          <>
            {/* Overview tiles */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
              <Stat value={data.length} label="Total runs" color={TEXT} />
              <Stat value={approved.length} label="Approved" color={GREEN} />
              <Stat value={pending.length} label="Pending" color={pending.length > 0 ? ORANGE : MUTED} />
              <Stat value={riders.length} label="Riders" color={BLUE} />
              <Stat value={maps.length} label="Maps" color={MUTED} />
              <Stat value={trainingVideos.length} label="Videos" color={MUTED} />
            </div>

            {/* Weekly activity */}
            <SectionTitle>Submissions — last 8 weeks</SectionTitle>
            <WeeklyActivity results={data} />

            {/* Per-map */}
            <SectionTitle style={{ marginTop: 24 }}>Runs per map</SectionTitle>
            <MapStats results={data} />

            {/* Top riders */}
            <SectionTitle style={{ marginTop: 24 }}>Top riders (approved runs)</SectionTitle>
            <TopRiders results={data} />

            {/* Site health */}
            <SectionTitle style={{ marginTop: 24 }}>Site health</SectionTitle>
            <SitePing />

            {/* Uptime log link */}
            <div style={{ marginTop: 12, fontSize: 12, color: MUTED }}>
              Uptime history →{' '}
              <a href="https://github.com/Ariteme/moto-gymkhana/blob/master/monitoring/uptime.log"
                target="_blank" rel="noopener noreferrer" style={{ color: BLUE }}>
                monitoring/uptime.log
              </a>
            </div>
          </>
        )}

      </div>
    </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  )
}

const inputSt = {
  width: '100%', padding: '11px 13px', borderRadius: 9,
  border: `1px solid ${BORDER}`, background: BG, color: TEXT,
  outline: 'none', boxSizing: 'border-box', fontSize: 15,
}

function ResultCard({ r, onApprove, onDelete }) {
  const date = new Date(r.created_at).toLocaleDateString('en-IL', { day: 'numeric', month: 'short', year: 'numeric' })
  return (
    <div style={{ background: CARD, borderRadius: 12, marginBottom: 10, border: `1px solid ${BORDER}`, borderLeft: `3px solid ${r.approved ? GREEN : ORANGE}`, overflow: 'hidden' }}>
      <div style={{ padding: '14px 14px 12px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ fontWeight: 700, fontSize: 16, color: TEXT }}>{r.riders?.name}</span>
            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: r.approved ? `${GREEN}18` : `${ORANGE}18`, color: r.approved ? GREEN : ORANGE, border: `1px solid ${r.approved ? GREEN + '40' : ORANGE + '40'}` }}>
              {r.approved ? '✓ Approved' : '● Pending'}
            </span>
          </div>
          <div style={{ fontSize: 13, color: MUTED, marginBottom: 2 }}>🏁 {r.map_name}{r.bike ? ` · 🏍 ${r.bike}` : ''}</div>
          <div style={{ fontSize: 12, color: MUTED }}>{date}</div>
        </div>
        <div style={{ color: GREEN, fontWeight: 800, fontSize: 22, flexShrink: 0 }}>{Number(r.lap_time).toFixed(2)}s</div>
      </div>
      <div style={{ display: 'flex', borderTop: `1px solid ${BORDER}` }}>
        {!r.approved && (
          <button onClick={onApprove} style={{ flex: 1, padding: '11px 16px', background: `${GREEN}15`, border: 'none', borderRight: `1px solid ${BORDER}`, color: GREEN, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            ✓ Approve
          </button>
        )}
        {r.youtube_url && (
          <a href={r.youtube_url} target="_blank" rel="noopener noreferrer"
            style={{ flex: 1, padding: '11px 16px', background: 'transparent', borderRight: `1px solid ${BORDER}`, color: MUTED, fontWeight: 600, fontSize: 14, textAlign: 'center', display: 'block' }}>
            ▶ Video
          </a>
        )}
        <button onClick={onDelete} style={{ flex: r.approved && !r.youtube_url ? 1 : 'unset', padding: '11px 16px', background: 'transparent', border: 'none', color: RED, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
          Delete
        </button>
      </div>
    </div>
  )
}

function Stat({ value, label, color }) {
  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '10px 16px', textAlign: 'center', minWidth: 72 }}>
      <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{label}</div>
    </div>
  )
}

function SectionTitle({ children, style }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10, ...style }}>
      {children}
    </div>
  )
}

function WeeklyActivity({ results }) {
  const now = Date.now()
  const MS_WEEK = 7 * 24 * 3600 * 1000
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const start = now - (7 - i) * MS_WEEK
    const end = start + MS_WEEK
    const count = results.filter(r => {
      const t = new Date(r.created_at).getTime()
      return t >= start && t < end
    }).length
    return { label: new Date(start).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }), count }
  })
  const max = Math.max(...weeks.map(w => w.count), 1)
  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 90 }}>
        {weeks.map((w, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 2, height: '100%' }}>
            {w.count > 0 && <div style={{ fontSize: 9, color: MUTED, lineHeight: 1 }}>{w.count}</div>}
            <div style={{
              width: '100%',
              height: w.count > 0 ? `${Math.max(w.count / max * 54, 4)}px` : '2px',
              background: w.count > 0 ? GREEN : BORDER,
              borderRadius: '3px 3px 0 0',
              opacity: w.count > 0 ? 0.45 + 0.55 * (w.count / max) : 1,
            }} />
            <div style={{ fontSize: 8, color: MUTED, textAlign: 'center', lineHeight: 1.3, marginTop: 4 }}>
              {w.label.split(' ').map((p, j) => <div key={j}>{p}</div>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MapStats({ results }) {
  const counts = {}
  for (const r of results) {
    if (!counts[r.map_name]) counts[r.map_name] = { total: 0, approved: 0 }
    counts[r.map_name].total++
    if (r.approved) counts[r.map_name].approved++
  }
  const rows = Object.entries(counts).sort((a, b) => b[1].approved - a[1].approved)
  const maxApproved = rows[0]?.[1]?.approved || 1
  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden' }}>
      {rows.length === 0 && <div style={{ padding: '16px 14px', color: MUTED, fontSize: 13 }}>No data yet.</div>}
      {rows.map(([name, s], i) => (
        <div key={name} style={{ padding: '10px 14px', borderBottom: i < rows.length - 1 ? `1px solid ${BORDER}` : 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 11, color: MUTED, width: 16, textAlign: 'right', flexShrink: 0 }}>{i + 1}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, color: TEXT, fontWeight: 600, marginBottom: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
            <div style={{ height: 3, borderRadius: 2, background: BORDER }}>
              <div style={{ width: `${s.approved / maxApproved * 100}%`, height: '100%', background: GREEN, borderRadius: 2 }} />
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: GREEN }}>{s.approved}</div>
            {s.total !== s.approved && <div style={{ fontSize: 10, color: ORANGE }}>+{s.total - s.approved} pending</div>}
          </div>
        </div>
      ))}
    </div>
  )
}

function TopRiders({ results }) {
  const counts = {}
  for (const r of results) {
    if (!r.approved || !r.riders?.name) continue
    counts[r.riders.name] = (counts[r.riders.name] || 0) + 1
  }
  const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10)
  const medals = ['🥇', '🥈', '🥉']
  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden' }}>
      {rows.length === 0 && <div style={{ padding: '16px 14px', color: MUTED, fontSize: 13 }}>No approved runs yet.</div>}
      {rows.map(([name, count], i) => (
        <div key={name} style={{ padding: '10px 14px', borderBottom: i < rows.length - 1 ? `1px solid ${BORDER}` : 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: i < 3 ? 15 : 11, width: 20, textAlign: 'center', flexShrink: 0, color: MUTED }}>
            {medals[i] ?? i + 1}
          </div>
          <div style={{ flex: 1, fontSize: 13, color: TEXT, fontWeight: 600 }}>{name}</div>
          <div style={{ fontSize: 13, color: MUTED, flexShrink: 0 }}>{count} run{count !== 1 ? 's' : ''}</div>
        </div>
      ))}
    </div>
  )
}

function SitePing() {
  const [pinging, setPinging] = useState(false)
  const [result, setResult] = useState(null)

  const ping = async () => {
    setPinging(true)
    setResult(null)
    try {
      const t0 = performance.now()
      const res = await fetch('/api/health', { cache: 'no-store' })
      const ms = Math.round(performance.now() - t0)
      const json = await res.json()
      setResult({ ok: res.ok && json.ok, ms, db: json.db, dbMs: json.dbMs })
    } catch (e) {
      setResult({ ok: false, error: e.message })
    }
    setPinging(false)
  }

  const msColor = (ms) => ms < 300 ? GREEN : ms < 1000 ? ORANGE : RED

  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <button onClick={ping} disabled={pinging} style={{
          padding: '9px 18px', background: `${BLUE}20`, border: `1px solid ${BLUE}50`,
          borderRadius: 9, color: BLUE, fontWeight: 700, fontSize: 13, cursor: 'pointer',
          opacity: pinging ? 0.6 : 1,
        }}>
          {pinging ? 'Pinging…' : '🏓 Ping site'}
        </button>
        {result && (
          <>
            <span style={{ fontSize: 13, fontWeight: 700, color: result.ok ? GREEN : RED }}>
              {result.ok ? '✓ Online' : '✗ Error'}
            </span>
            {result.ms != null && (
              <span style={{ fontSize: 13, color: msColor(result.ms) }}>HTTP {result.ms}ms</span>
            )}
            {result.dbMs != null && (
              <span style={{ fontSize: 13, color: msColor(result.dbMs) }}>DB {result.dbMs}ms</span>
            )}
            {result.error && <span style={{ fontSize: 12, color: RED }}>{result.error}</span>}
          </>
        )}
      </div>
      <div style={{ fontSize: 12, color: MUTED, marginTop: 10 }}>Checks homepage response time + Supabase connectivity.</div>
    </div>
  )
}

function TagPicker({ form, setForm, customTag, setCustomTag, addCustomTag }) {
  const toggleTag = (tag) => setForm(p => ({
    ...p,
    tags: p.tags.includes(tag) ? p.tags.filter(t => t !== tag) : [...p.tags, tag]
  }))

  const allPredefined = Object.values(PREDEFINED_TAGS).flat()
  const customTags = (form.tags || []).filter(t => !allPredefined.includes(t))

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>Tags</div>
      {Object.entries(PREDEFINED_TAGS).map(([cat, tags]) => (
        <div key={cat} style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, color: MUTED, marginBottom: 6 }}>{cat}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {tags.map(tag => {
              const on = (form.tags || []).includes(tag)
              return (
                <button key={tag} type="button" onClick={() => toggleTag(tag)} style={{
                  padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                  border: `1px solid ${on ? GREEN : BORDER}`,
                  background: on ? 'rgba(0,255,153,0.12)' : 'transparent',
                  color: on ? GREEN : MUTED, fontWeight: on ? 600 : 400,
                }}>
                  {tag}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {/* Custom tags already added */}
      {customTags.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, color: MUTED, marginBottom: 6 }}>Custom</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {customTags.map(tag => (
              <button key={tag} type="button" onClick={() => toggleTag(tag)} style={{
                padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                border: `1px solid ${GREEN}`, background: 'rgba(0,255,153,0.12)',
                color: GREEN, fontWeight: 600,
              }}>
                {tag} ✕
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add custom tag */}
      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
        <input
          type="text"
          value={customTag}
          onChange={e => setCustomTag(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomTag(customTag, form, setForm, setCustomTag) } }}
          placeholder="Custom tag..."
          style={{ ...inputSt, flex: 1, fontSize: 13, padding: '8px 12px' }}
        />
        <button type="button" onClick={() => addCustomTag(customTag, form, setForm, setCustomTag)}
          style={{ padding: '8px 14px', background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 9, color: MUTED, fontSize: 13, cursor: 'pointer' }}>
          + Add
        </button>
      </div>
    </div>
  )
}
