'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function OlcRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/?map=__OLC__') }, [router])
  return null
}
