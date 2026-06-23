'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function Admin() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState(false)
  const [data, setData] = useState([])

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
    const { data } = await supabase
      .from('results')
      .select(`id, map_name, lap_time, bike, youtube_url, approved, created_at, riders ( name )`)
      .order('created_at', { ascending: false })
    setData(data || [])
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

  if (!authed) return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'Arial' }}>
      <form onSubmit={handleLogin} style={{ background: '#1a1a1a', padding: 30, borderRadius: 14, width: 300, border: '1px solid #333', textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>🔒</div>
        <h2 style={{ color: 'white', marginBottom: 20, fontSize: 20 }}>Admin Access</h2>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setAuthError(false) }}
          autoFocus
          style={{ width: '100%', padding: 10, marginBottom: 10, borderRadius: 6, border: authError ? '1px solid #ff4444' : '1px solid #333', background: '#111', color: 'white', outline: 'none', boxSizing: 'border-box' }}
        />
        {authError && <p style={{ color: '#ff4444', fontSize: 12, marginBottom: 10 }}>Wrong password</p>}
        <button type="submit" style={{ width: '100%', padding: 12, background: '#00ff99', color: '#000', border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' }}>
          Enter
        </button>
      </form>
    </div>
  )

  return (
    <div style={{ padding: 30, fontFamily: 'Arial', background: '#0f0f0f', minHeight: '100vh', color: 'white' }}>

      <div style={{ textAlign: 'center', marginBottom: 30 }}>
        <h1 style={{ fontSize: 40, margin: 0 }}>🛠 Admin Panel</h1>
        <p style={{ color: '#aaa' }}>Manage Moto Gymkhana results</p>
      </div>

      <div style={{ marginBottom: 20, display: 'flex', gap: 10 }}>
        <Link href="/" style={backBtnStyle}>← Back</Link>
        <button
          onClick={() => { sessionStorage.removeItem('admin_auth'); setAuthed(false) }}
          style={{ ...backBtnStyle, background: 'none', cursor: 'pointer', border: '1px solid #444', color: '#aaa' }}
        >
          🔒 Lock
        </button>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {data.map((r) => (
          <div key={r.id} style={{
            background: '#1a1a1a',
            padding: 15,
            marginBottom: 12,
            borderRadius: 10,
            border: r.approved ? '1px solid #00ff99' : '1px solid orange',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: 18 }}><b>{r.riders?.name}</b></div>
              <div style={{ color: '#aaa', fontSize: 13 }}>{r.map_name} • {r.bike}</div>
              <div style={{ fontSize: 12, marginTop: 5 }}>{r.approved ? '🟢 Approved' : '🟠 Pending'}</div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 20, fontWeight: 'bold', color: '#00ff99' }}>{Number(r.lap_time).toFixed(2)}s</div>
              <div style={{ marginTop: 8, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                {!r.approved && (
                  <button onClick={() => approve(r.id)} style={{ background: 'green', color: 'white', border: 'none', padding: '5px 10px', borderRadius: 5, cursor: 'pointer' }}>
                    Approve
                  </button>
                )}
                <button onClick={() => remove(r.id)} style={{ background: 'red', color: 'white', border: 'none', padding: '5px 10px', borderRadius: 5, cursor: 'pointer' }}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
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
