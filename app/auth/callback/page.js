'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()
  useEffect(() => {
    const code = new URL(window.location.href).searchParams.get('code')
    const exchange = code
      ? supabase.auth.exchangeCodeForSession(code)
      : Promise.resolve()
    exchange.finally(() => router.replace('/'))
  }, [router])

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: '#07090f',
      color: '#7a90a8', fontFamily: 'sans-serif', fontSize: 15,
    }}>
      Signing in…
    </div>
  )
}
