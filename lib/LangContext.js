'use client'

import { createContext, useContext, useState, useEffect } from 'react'

const LangContext = createContext({ lang: 'en', setLang: () => {} })

export const useLang = () => useContext(LangContext)

export function LangProvider({ children }) {
  const [lang, setLangState] = useState('en')

  useEffect(() => {
    const saved = localStorage.getItem('lang')
    if (saved === 'ru') setLangState('ru')
  }, [])

  const setLang = (l) => {
    setLangState(l)
    localStorage.setItem('lang', l)
  }

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {children}
    </LangContext.Provider>
  )
}

export function LangSwitcher() {
  const { lang, setLang } = useLang()
  return (
    <div style={{ display: 'flex', border: '1px solid #1a2840', borderRadius: 8, overflow: 'hidden', height: 30, flexShrink: 0 }}>
      {['en', 'ru'].map((l, i) => (
        <button key={l} onClick={() => setLang(l)} style={{
          padding: '0 10px',
          background: lang === l ? '#1a5cff' : 'transparent',
          color: lang === l ? '#fff' : '#7a90a8',
          border: 'none',
          borderRight: i === 0 ? '1px solid #1a2840' : 'none',
          cursor: 'pointer', fontSize: 12, fontWeight: 700,
        }}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
