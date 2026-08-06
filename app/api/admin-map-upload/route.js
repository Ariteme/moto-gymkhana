import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request) {
  const formData = await request.formData()
  const password = formData.get('password')
  const mapId = formData.get('mapId')
  const mapName = formData.get('mapName')
  const file = formData.get('file')

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!mapId || !mapName || !file) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const ext = file.name.split('.').pop()
  const filename = `${mapName.toLowerCase().replace(/\s+/g, '_')}.${ext}`
  const buffer = new Uint8Array(await file.arrayBuffer())

  const { error: uploadError } = await admin.storage
    .from('map-images')
    .upload(filename, buffer, { upsert: true, contentType: file.type })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: { publicUrl } } = admin.storage.from('map-images').getPublicUrl(filename)

  const { error: updateError } = await admin
    .from('maps')
    .update({ image_url: publicUrl })
    .eq('id', mapId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ publicUrl })
}
