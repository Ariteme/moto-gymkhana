'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Admin() {
  const [data, setData] = useState([])

  const fetchData = async () => {
    const { data } = await supabase
      .from('results')
      .select(`
        id,
        map_name,
        lap_time,
        bike,
        youtube_url,
        approved,
        created_at,
        riders ( name )
      `)
      .order('created_at', { ascending: false })

    setData(data)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const approve = async (id) => {
    await supabase
      .from('results')
      .update({ approved: true })
      .eq('id', id)

    fetchData()
  }

  const remove = async (id) => {
    if (!confirm('Delete this run?')) return

    await supabase
      .from('results')
      .delete()
      .eq('id', id)

    fetchData()
  }

  return (
    <div style={{
      padding: 30,
      fontFamily: 'Arial',
      background: '#0f0f0f',
      minHeight: '100vh',
      color: 'white'
    }}>
      
      {/* HEADER */}
      <div style={{ textAlign: 'center', marginBottom: 30 }}>
        <h1 style={{ fontSize: 40, margin: 0 }}>🛠 Admin Panel</h1>
        <p style={{ color: '#aaa' }}>Manage Moto Gymkhana results</p>
      </div>

      {/* CARDS */}
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {data?.map((r) => (
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

            {/* LEFT */}
            <div>
              <div style={{ fontSize: 18 }}>
                <b>{r.riders?.name}</b>
              </div>

              <div style={{ color: '#aaa', fontSize: 13 }}>
                {r.map_name} • {r.bike}
              </div>

              <div style={{ fontSize: 12, marginTop: 5 }}>
                {r.approved ? '🟢 Approved' : '🟠 Pending'}
              </div>
            </div>

            {/* RIGHT */}
            <div style={{ textAlign: 'right' }}>

              <div style={{ fontSize: 20, fontWeight: 'bold', color: '#00ff99' }}>
                {Number(r.lap_time).toFixed(2)}s
              </div>

              {/* ACTIONS */}
              <div style={{ marginTop: 8, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>

                {!r.approved && (
                  <button
                    onClick={() => approve(r.id)}
                    style={{
                      background: 'green',
                      color: 'white',
                      border: 'none',
                      padding: '5px 10px',
                      borderRadius: 5,
                      cursor: 'pointer'
                    }}
                  >
                    Approve
                  </button>
                )}

                <button
                  onClick={() => remove(r.id)}
                  style={{
                    background: 'red',
                    color: 'white',
                    border: 'none',
                    padding: '5px 10px',
                    borderRadius: 5,
                    cursor: 'pointer'
                  }}
                >
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