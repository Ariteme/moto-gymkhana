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

export default function Admin() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState(false)
  const [data, setData] = useState([])
  const [riders, setRiders] = useState([])
  const [mergeFrom, setMergeFrom] = useState('')
  const [mergeTo, setMergeTo] = useState('')
  const [merging, setMerging] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem('admin_auth') === '1') setAuthed(true)
  }, [])

  useEffect(() => {
    if (authed) fetchData()
  }, [authed])

  const handleLogin = async (e) => {
    e.preventDefault()
    const res = await fetch('/api/admin-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    })
    if (res.ok) {
      sessionStorage.setItem('admin_auth', '1')
      setAuthed(true)
    } else {
      setAuthError(true)
      setPassword('')
    }
  }

  const fetchData = async () => {
    const [{ data: results }, { data: riderRows }] = await Promise.all([
      supabase.from('results').select('id, map_name, lap_time, bike, youtube_url, approved, created_at, riders(name, id)').order('created_at', { ascending: false }),
      supabase.from('riders').select('id, name').order('name'),
    ])
    setData(results || [])
    setRiders(riderRows || [])
  }

  const mergeRiders = async () => {
    if (!mergeFrom || !mergeTo || mergeFrom === mergeTo) return
    const fromRider = riders.find(r => r.id === mergeFrom)
    const toRider = riders.find(r => r.id === mergeTo)
    if (!confirm(`Merge "${fromRider?.name}" → "${toRider?.name}"?\n\nAll runs from "${fromRider?.name}" will move to "${toRider?.name}", then "${fromRider?.name}" will be deleted. This cannot be undone.`)) return
    setMerging(true)
    const { error: updateErr } = await supabase.from('results').update({ rider_id: mergeTo }).eq('rider_id', mergeFrom)
    if (updateErr) { alert('Failed to reassign results: ' + updateErr.message); setMerging(false); return }
    const { error: deleteErr } = await supabase.from('riders').delete().eq('id', mergeFrom)
    if (deleteErr) { alert('Failed to delete duplicate rider: ' + deleteErr.message); setMerging(false); return }
    setMergeFrom('')
    setMergeTo('')
    setMerging(false)
    await fetchData()
    alert(`✓ Merged! "${fromRider?.name}" absorbed into "${toRider?.name}".`)
  }

  const approve = async (id) => {
    const { error } = await supabase.from('results').update({ approved: true }).eq('id', id)
    if (error) { alert('Approve failed: ' + error.message); return }
    fetchData()
  }

  const remove = async (id) => {
    if (!confirm('Delete this run?')) return
    const { error } = await supabase.from('results').delete().eq('id', id)
    if (error) { alert('Delete failed: ' + error.message); return }
    fetchData()
  }

  /* ── LOGIN SCREEN ── */
  if (!authed) return (
    <div style={{ background: '#030508', minHeight: '100vh', fontFamily: 'var(--font-geist-sans, Arial, sans-serif)' }}>
    <div style={{
      maxWidth: 700, margin: '0 auto', background: BG, minHeight: '100vh', boxShadow: '0 0 80px rgba(0,0,0,0.7)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      <div style={{ width: '100%', maxWidth: 360 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: TEXT }}>Admin Access</div>
          <div style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>Israeli Moto Gymkhana</div>
        </div>

        <form onSubmit={handleLogin} style={{
          background: CARD, border: `1px solid ${BORDER}`,
          borderRadius: 16, padding: 24,
        }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 7 }}>
            Password
          </label>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setAuthError(false) }}
            autoFocus
            style={{
              width: '100%', padding: '12px 14px', borderRadius: 10,
              border: `1px solid ${authError ? RED : BORDER}`,
              background: BG, color: TEXT, outline: 'none',
              boxSizing: 'border-box', fontSize: 16, marginBottom: 8,
            }}
          />
          {authError && (
            <div style={{ color: RED, fontSize: 13, marginBottom: 12, padding: '7px 12px', background: `${RED}12`, borderRadius: 8, border: `1px solid ${RED}30` }}>
              ✗ Wrong password
            </div>
          )}
          <button type="submit" style={{
            width: '100%', marginTop: 8, padding: '13px 20px',
            background: GREEN, color: '#000',
            border: 'none', borderRadius: 10,
            fontWeight: 800, fontSize: 16, cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(0,255,153,0.25)',
          }}>
            Enter
          </button>
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
        <div style={{ padding: '16px 16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <Link href="/" style={{ color: MUTED, fontSize: 13, padding: '6px 10px', border: `1px solid ${BORDER}`, borderRadius: 8 }}>
              ← Back
            </Link>
            <button
              onClick={() => { sessionStorage.removeItem('admin_auth'); setAuthed(false) }}
              style={{ background: 'none', border: `1px solid ${BORDER}`, color: MUTED, borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13 }}
            >
              🔒 Lock
            </button>
          </div>
          <h1 style={{ margin: '0 0 4px', fontSize: 28, fontWeight: 900, color: TEXT }}>🛠 Admin Panel</h1>
          <p style={{ margin: 0, color: MUTED, fontSize: 14 }}>Manage Israeli Moto Gymkhana results</p>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <Stat value={pending.length} label="Pending" color={ORANGE} />
            <Stat value={approved.length} label="Approved" color={GREEN} />
            <Stat value={data.length} label="Total" color={MUTED} />
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 12px 80px', maxWidth: 640, margin: '0 auto' }}>

        {/* PENDING */}
        {pending.length > 0 && (
          <>
            <SectionTitle>Pending approval ({pending.length})</SectionTitle>
            {pending.map(r => (
              <ResultCard key={r.id} r={r} onApprove={() => approve(r.id)} onDelete={() => remove(r.id)} />
            ))}
          </>
        )}

        {/* APPROVED */}
        {approved.length > 0 && (
          <>
            <SectionTitle style={{ marginTop: pending.length > 0 ? 28 : 0 }}>Approved ({approved.length})</SectionTitle>
            {approved.map(r => (
              <ResultCard key={r.id} r={r} onDelete={() => remove(r.id)} />
            ))}
          </>
        )}

        {data.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: MUTED }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
            <div>No submissions yet</div>
          </div>
        )}

        {/* MERGE RIDERS */}
        {riders.length >= 2 && (
          <div style={{ marginTop: 36 }}>
            <SectionTitle>Merge duplicate riders</SectionTitle>
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 18 }}>
              <div style={{ fontSize: 13, color: MUTED, marginBottom: 16 }}>
                Moves all runs from the duplicate to the correct rider, then deletes the duplicate.
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>Duplicate (delete after)</label>
                <select
                  value={mergeFrom}
                  onChange={e => setMergeFrom(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', background: BG, color: TEXT, border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 15, outline: 'none' }}
                >
                  <option value="">— select rider to remove —</option>
                  {riders.filter(r => r.id !== mergeTo).map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>Keep (correct name)</label>
                <select
                  value={mergeTo}
                  onChange={e => setMergeTo(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', background: BG, color: TEXT, border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 15, outline: 'none' }}
                >
                  <option value="">— select rider to keep —</option>
                  {riders.filter(r => r.id !== mergeFrom).map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={mergeRiders}
                disabled={!mergeFrom || !mergeTo || mergeFrom === mergeTo || merging}
                style={{
                  width: '100%', padding: '12px 16px',
                  background: mergeFrom && mergeTo && mergeFrom !== mergeTo ? `${ORANGE}20` : '#ffffff08',
                  border: `1px solid ${mergeFrom && mergeTo ? ORANGE : BORDER}`,
                  borderRadius: 10, color: mergeFrom && mergeTo ? ORANGE : MUTED,
                  fontWeight: 700, fontSize: 14, cursor: mergeFrom && mergeTo ? 'pointer' : 'default',
                  opacity: merging ? 0.5 : 1,
                }}
              >
                {merging ? 'Merging...' : '🔀 Merge riders'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    </div>
  )
}

function ResultCard({ r, onApprove, onDelete }) {
  const date = new Date(r.created_at).toLocaleDateString('en-IL', { day: 'numeric', month: 'short', year: 'numeric' })
  return (
    <div style={{
      background: CARD,
      borderRadius: 12,
      marginBottom: 10,
      border: `1px solid ${BORDER}`,
      borderLeft: `3px solid ${r.approved ? GREEN : ORANGE}`,
      overflow: 'hidden',
    }}>
      <div style={{ padding: '14px 14px 12px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ fontWeight: 700, fontSize: 16, color: TEXT }}>{r.riders?.name}</span>
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
              background: r.approved ? `${GREEN}18` : `${ORANGE}18`,
              color: r.approved ? GREEN : ORANGE,
              border: `1px solid ${r.approved ? GREEN + '40' : ORANGE + '40'}`,
            }}>
              {r.approved ? '✓ Approved' : '● Pending'}
            </span>
          </div>
          <div style={{ fontSize: 13, color: MUTED, marginBottom: 2 }}>
            🏁 {r.map_name}{r.bike ? ` · 🏍 ${r.bike}` : ''}
          </div>
          <div style={{ fontSize: 12, color: MUTED }}>
            {date}
          </div>
        </div>

        {/* Time */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ color: GREEN, fontWeight: 800, fontSize: 22 }}>
            {Number(r.lap_time).toFixed(2)}s
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', borderTop: `1px solid ${BORDER}` }}>
        {!r.approved && (
          <button
            onClick={onApprove}
            style={{
              flex: 1, padding: '11px 16px', background: `${GREEN}15`,
              border: 'none', borderRight: `1px solid ${BORDER}`,
              color: GREEN, fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}
          >
            ✓ Approve
          </button>
        )}
        {r.youtube_url && (
          <a
            href={r.youtube_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1, padding: '11px 16px', background: 'transparent',
              borderRight: `1px solid ${BORDER}`,
              color: MUTED, fontWeight: 600, fontSize: 14, textAlign: 'center', display: 'block',
            }}
          >
            ▶ Video
          </a>
        )}
        <button
          onClick={onDelete}
          style={{
            flex: r.approved && !r.youtube_url ? 1 : 'unset',
            padding: '11px 16px', background: 'transparent',
            border: 'none', color: RED, fontWeight: 600, fontSize: 14, cursor: 'pointer',
          }}
        >
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
