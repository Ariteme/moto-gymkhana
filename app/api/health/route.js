import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const t0 = Date.now()
  try {
    const { error } = await supabase.from('maps').select('id').limit(1)
    const dbMs = Date.now() - t0
    return NextResponse.json({ ok: !error, db: !error, dbMs, ts: new Date().toISOString() })
  } catch (e) {
    return NextResponse.json({ ok: false, db: false, dbMs: Date.now() - t0, error: e.message, ts: new Date().toISOString() }, { status: 500 })
  }
}
