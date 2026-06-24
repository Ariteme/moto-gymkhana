import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

export async function POST(request) {
  const { password, youtube_url, title, description, tags } = await request.json()
  if (!password || password !== process.env.ADMIN_PASSWORD)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await adminClient()
    .from('training_videos')
    .insert([{ youtube_url, title, description: description || '', tags: tags || [] }])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, data })
}

export async function PATCH(request) {
  const { password, id, youtube_url, title, description, tags } = await request.json()
  if (!password || password !== process.env.ADMIN_PASSWORD)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await adminClient()
    .from('training_videos')
    .update({ youtube_url, title, description: description || '', tags: tags || [] })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request) {
  const { password, id } = await request.json()
  if (!password || password !== process.env.ADMIN_PASSWORD)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await adminClient()
    .from('training_videos')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
