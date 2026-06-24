import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request) {
  const { password, mergeFrom, mergeTo } = await request.json()

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!mergeFrom || !mergeTo || mergeFrom === mergeTo) {
    return NextResponse.json({ error: 'Invalid rider IDs' }, { status: 400 })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { error: updateErr } = await admin
    .from('results')
    .update({ rider_id: mergeTo })
    .eq('rider_id', mergeFrom)

  if (updateErr) {
    return NextResponse.json({ error: 'Failed to reassign results: ' + updateErr.message }, { status: 500 })
  }

  const { error: deleteErr } = await admin
    .from('riders')
    .delete()
    .eq('id', mergeFrom)

  if (deleteErr) {
    return NextResponse.json({ error: 'Failed to delete rider: ' + deleteErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
