import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

function hashText(text, lang) {
  return createHash('md5').update(`${lang}:${text}`).digest('hex').slice(0, 24)
}

function isCyrillic(text) {
  return /[а-яёА-ЯЁ]/.test(text)
}

async function azureTranslate(texts, targetLang) {
  const res = await fetch(
    `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=${targetLang}`,
    {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': process.env.AZURE_TRANSLATOR_KEY,
        'Ocp-Apim-Subscription-Region': process.env.AZURE_TRANSLATOR_REGION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(texts.map(text => ({ text }))),
    }
  )
  const data = await res.json()
  if (!Array.isArray(data)) throw new Error('Azure translation failed: ' + JSON.stringify(data))
  return data.map(item => item.translations[0].text)
}

export async function POST(request) {
  const { texts, targetLang } = await request.json()
  if (!texts?.length || !targetLang) return NextResponse.json({ translations: [] })

  const admin = adminClient()
  const results = new Array(texts.length).fill(null)
  const toTranslate = []
  const toTranslateIndices = []

  // Skip translating if text is already in target language
  for (let i = 0; i < texts.length; i++) {
    if (!texts[i]) { results[i] = texts[i]; continue }
    if (targetLang === 'ru' && isCyrillic(texts[i])) { results[i] = texts[i]; continue }
    if (targetLang === 'en' && !isCyrillic(texts[i])) { results[i] = texts[i]; continue }
  }

  // Batch cache lookup
  const uncachedIndices = results.map((r, i) => r === null ? i : -1).filter(i => i >= 0)
  if (uncachedIndices.length > 0) {
    const cacheKeys = uncachedIndices.map(i => hashText(texts[i], targetLang))
    const { data: cached } = await admin
      .from('translations_cache')
      .select('id, translated_text')
      .in('id', cacheKeys)

    const cacheMap = Object.fromEntries((cached || []).map(r => [r.id, r.translated_text]))

    for (const i of uncachedIndices) {
      const key = hashText(texts[i], targetLang)
      if (cacheMap[key]) {
        results[i] = cacheMap[key]
      } else {
        toTranslate.push(texts[i])
        toTranslateIndices.push(i)
      }
    }
  }

  // Translate uncached texts via Azure
  if (toTranslate.length > 0) {
    let translated
    try {
      translated = await azureTranslate(toTranslate, targetLang)
    } catch (err) {
      console.error('[translate] Azure failed:', err.message)
      return NextResponse.json({ translations: results.map((r, i) => r ?? texts[i]) })
    }

    const inserts = []
    for (let j = 0; j < toTranslate.length; j++) {
      const i = toTranslateIndices[j]
      results[i] = translated[j]
      inserts.push({
        id: hashText(texts[i], targetLang),
        source_text: texts[i],
        target_lang: targetLang,
        translated_text: translated[j],
      })
    }
    await admin.from('translations_cache').upsert(inserts)
  }

  return NextResponse.json({ translations: results })
}
