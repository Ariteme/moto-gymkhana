'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

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

const PREDEFINED_TAGS = {
  'Difficulty': ['Easy', 'Medium', 'Hard'],
  'Technique': ['Counter Steering', 'Body Work', 'Brake Application', 'Gaze Focus', 'Throttle Control', 'Slow Speed Balance'],
  'Type': ['Pattern', 'Exercise', 'Full Run Analysis'],
}

export default function Admin() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [tab, setTab] = useState('results')

  // Results tab
  const [data, setData] = useState([])

  // Training tab
  const [trainingVideos, setTrainingVideos] = useState([])
  const [tvForm, setTvForm] = useState({ youtube_url: '', title: '', description: '', tags: [] })
  const [tvSaving, setTvSaving] = useState(false)

  // Tools tab
  const [riders, setRiders] = useState([])
  const [mergeFrom, setMergeFrom] = useState('')
  const [mergeTo, setMergeTo] = useState('')
  const [merging, setMerging] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem('admin_auth') === '1') {
      setAuthed(true)
      setAdminPassword(sessionStorage.getItem('admin_pw') || '')
    }
  }, [])

  useEffect(() => {
    if (authed) fetchAll()
  }, [authed])

  const fetchAll = async () => {
    const [{ data: results }, { data: riderRows }, { data: tvRows }] = await Promise.all([
      supabase.from('results').select('id, map_name, lap_time, bike, youtube_url, approved, created_at, riders(name, id)').order('created_at', { ascending: false }),
      supabase.from('riders').select('id, name').order('name'),
      supabase.from('training_videos').select('*').order('created_at', { ascending: false }),
    ])
    setData(results || [])
    setRiders(riderRows || [])
    setTrainingVideos(tvRows || [])
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    const res = await fetch('/api/admin-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    })
    if (res.ok) {
      sessionStorage.setItem('admin_auth', '1')
      sessionStorage.setItem('admin_pw', password)
      setAdminPassword(password)
      setAuthed(true)
    } else {
      setAuthError(true)
      setPassword('')
    }
  }

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

  const toggleTag = (tag) => {
    setTvForm(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag]
    }))
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
    setTvForm({ youtube_url: '', title: '', description: '', tags: [] })
    setTvSaving(false)
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
    await fetchAll()
  }

  function ytId(url) {
    if (!url) return null
    if (url.includes('watch?v=')) return url.split('v=')[1].split('&')[0]
    if (url.includes('youtu.be/')) return url.split('youtu.be/')[1].split('?')[0]
    if (url.includes('/shorts/')) return url.split('/shorts/')[1].split('?')[0]
    return null
  }

  /* ── LOGIN ── */
  if (!authed) return (
    <div style={{ background: '#030508', minHeight: '100vh', fontFamily: 'var(--font-geist-sans, Arial, sans-serif)' }}>
    <div style={{ maxWidth: 700, margin: '0 auto', background: BG, minHeight: '100vh', boxShadow: '0 0 80px rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 360 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: TEXT }}>Admin Access</div>
          <div style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>Israeli Moto Gymkhana</div>
        </div>
        <form onSubmit={handleLogin} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 7 }}>Password</label>
          <input type="password" placeholder="Enter password" value={password}
            onChange={(e) => { setPassword(e.target.value); setAuthError(false) }} autoFocus
            style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: `1px solid ${authError ? RED : BORDER}`, background: BG, color: TEXT, outline: 'none', boxSizing: 'border-box', fontSize: 16, marginBottom: 8 }}
          />
          {authError && <div style={{ color: RED, fontSize: 13, marginBottom: 12, padding: '7px 12px', background: `${RED}12`, borderRadius: 8, border: `1px solid ${RED}30` }}>✗ Wrong password</div>}
          <button type="submit" style={{ width: '100%', marginTop: 8, padding: '13px 20px', background: GREEN, color: '#000', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 16, cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,255,153,0.25)' }}>Enter</button>
        </form>
      </div>
    </div>
    </div>
  )

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
            <button onClick={() => { sessionStorage.removeItem('admin_auth'); sessionStorage.removeItem('admin_pw'); setAuthed(false) }}
              style={{ background: 'none', border: `1px solid ${BORDER}`, color: MUTED, borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13 }}>
              🔒 Lock
            </button>
          </div>
          <h1 style={{ margin: '0 0 16px', fontSize: 24, fontWeight: 900, color: TEXT }}>🛠 Admin Panel</h1>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4 }}>
            {[
              { key: 'results', label: `Results${pending.length ? ` (${pending.length}⚠)` : ''}` },
              { key: 'training', label: `Training (${trainingVideos.length})` },
              { key: 'tools', label: 'Tools' },
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
                <input value={tvForm.description} onChange={e => setTvForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Short description" style={inputSt} />
              </Field>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>Tags</div>
                {Object.entries(PREDEFINED_TAGS).map(([cat, tags]) => (
                  <div key={cat} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, color: MUTED, marginBottom: 6 }}>{cat}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {tags.map(tag => {
                        const on = tvForm.tags.includes(tag)
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
              </div>
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
                  return (
                    <div key={v.id} style={{ background: CARD, borderRadius: 12, marginBottom: 10, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', gap: 12, padding: '12px 14px' }}>
                        {vid && (
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
        {tab === 'tools' && riders.length >= 2 && (
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
