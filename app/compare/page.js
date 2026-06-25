'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import CompareModal from '@/app/components/CompareModal'

const BG   = '#07090f'
const TEXT = '#dce8f4'
const MUTED = '#7a90a8'

function CompareView() {
  const params = useSearchParams()
  const router = useRouter()

  const r1 = params.get('r1')
  const r2 = params.get('r2')
  const initialT1 = Math.max(0, Number(params.get('t1') || 0))
  const initialT2 = Math.max(0, Number(params.get('t2') || 0))

  const [runs, setRuns] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!r1 || !r2) { setError(true); return }
    Promise.all([
      supabase.from('results').select('id, map_name, lap_time, bike, youtube_url, created_at, riders(name)').eq('id', r1).single(),
      supabase.from('results').select('id, map_name, lap_time, bike, youtube_url, created_at, riders(name)').eq('id', r2).single(),
    ]).then(([res1, res2]) => {
      if (res1.data && res2.data) {
        setRuns([res1.data, res2.data])
      } else {
        setError(true)
      }
    })
  }, [r1, r2])

  if (error) {
    return (
      <div style={{ background: BG, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, fontFamily: 'var(--font-geist-sans, Arial, sans-serif)' }}>
        <div style={{ fontSize: 40 }}>🏍</div>
        <div style={{ color: TEXT, fontSize: 16 }}>Comparison not found</div>
        <button
          onClick={() => router.push('/')}
          style={{ background: 'none', border: '1px solid #1a2840', borderRadius: 8, padding: '8px 16px', color: MUTED, cursor: 'pointer', fontSize: 14 }}
        >
          ← Back to leaderboard
        </button>
      </div>
    )
  }

  if (!runs) {
    return (
      <div style={{ background: BG, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-geist-sans, Arial, sans-serif)' }}>
        <div style={{ color: MUTED, fontSize: 14 }}>Loading comparison…</div>
      </div>
    )
  }

  return (
    <div style={{ background: BG, minHeight: '100vh' }}>
      <CompareModal
        runs={runs}
        onClose={() => router.push('/')}
        initialT1={initialT1}
        initialT2={initialT2}
      />
    </div>
  )
}

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div style={{ background: '#07090f', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial, sans-serif' }}>
          <div style={{ color: '#7a90a8', fontSize: 14 }}>Loading…</div>
        </div>
      }
    >
      <CompareView />
    </Suspense>
  )
}
