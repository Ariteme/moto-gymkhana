import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

async function verifyAdminJwt(request) {
  const auth = request.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return false
  const token = auth.slice(7)
  const { data: { user }, error } = await createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  ).auth.getUser(token)
  if (error || !user?.email) return false
  const emails = (process.env.ADMIN_EMAILS || '')
    .split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  return emails.includes(user.email.toLowerCase())
}

export async function GET(request) {
  const isAdmin = await verifyAdminJwt(request)
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ token: process.env.ADMIN_PASSWORD })
}
