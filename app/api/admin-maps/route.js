import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

function checkAuth(body) {
  return body?.password === process.env.ADMIN_PASSWORD
}

// POST  { password, name }  → create map
export async function POST(request) {
  const body = await request.json()
  if (!checkAuth(body)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const name = body.name?.trim()
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const { error } = await adminClient().from('maps').insert({ name })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// DELETE  { password, id }  → delete map
export async function DELETE(request) {
  const body = await request.json()
  if (!checkAuth(body)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = body.id
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  const { error } = await adminClient().from('maps').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
