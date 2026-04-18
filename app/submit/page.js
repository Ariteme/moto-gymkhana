'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Submit() {
  const [form, setForm] = useState({
    name: '',
    map: '',
    time: '',
    bike: '',
    youtube: ''
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      let rider = null

      // 1. try to find existing rider
      const { data: existingRider } = await supabase
        .from('riders')
        .select('*')
        .eq('name', form.name)
        .single()

      if (existingRider) {
        rider = existingRider
      } else {
        // 2. create only if not exists
        const { data: newRider, error } = await supabase
          .from('riders')
          .insert([{ name: form.name }])
          .select()
          .single()

        if (error) {
          console.log(error)
          alert('Failed to create rider')
          return
        }

        rider = newRider
      }

      // insert result
      const { error: resultError } = await supabase
        .from('results')
        .insert([{
          rider_id: rider.id,
          map_name: form.map,
          lap_time: parseFloat(form.time),
          bike: form.bike,
          youtube_url: form.youtube,
          approved: false
        }])

      if (resultError) {
        console.log(resultError)
        alert('Failed to submit result')
        return
      }

      alert('🏁 Submitted! Waiting for approval.')

      setForm({
        name: '',
        map: '',
        time: '',
        bike: '',
        youtube: ''
      })

    } catch (err) {
      console.log(err)
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
          border: '1px solid #333',
          boxShadow: '0 0 20px rgba(0,0,0,0.6)'
        }}
      >

        {/* HEADER */}
        <h1 style={{
          textAlign: 'center',
          fontSize: 28,
          marginBottom: 5
        }}>
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

        {/* INPUTS */}
        <input
          name="name"
          placeholder="Rider name"
          value={form.name}
          onChange={handleChange}
          style={inputStyle}
        />

        <input
          name="map"
          placeholder="Track / Map"
          value={form.map}
          onChange={handleChange}
          style={inputStyle}
        />

        <input
          name="time"
          placeholder="Lap time (e.g. 68.43)"
          value={form.time}
          onChange={handleChange}
          style={inputStyle}
        />

        <input
          name="bike"
          placeholder="Bike (e.g. XSR700)"
          value={form.bike}
          onChange={handleChange}
          style={inputStyle}
        />

        <input
          name="youtube"
          placeholder="YouTube URL"
          value={form.youtube}
          onChange={handleChange}
          style={inputStyle}
        />

        {/* BUTTON */}
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
            cursor: 'pointer',
            fontSize: 14
          }}
        >
          Submit Result
        </button>

      </form>
    </div>
  )
}

// INPUT STYLE
const inputStyle = {
  width: '100%',
  padding: 10,
  marginBottom: 10,
  borderRadius: 6,
  border: '1px solid #333',
  background: '#111',
  color: 'white',
  outline: 'none',
  fontSize: 13
}