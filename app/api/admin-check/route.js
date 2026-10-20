import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function adminEmails() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
}

async function verifyAdminJwt(request) {
  const auth = request.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null
  const token = auth.slice(7)
  const { data: { user }, error } = await createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  ).auth.getUser(token)
  if (error || !user?.email) return null
  return adminEmails().includes(user.email.toLowerCase()) ? user : null
}

export async function GET(request) {
  const user = await verifyAdminJwt(request)
  return NextResponse.json({ isAdmin: user !== null })
}
