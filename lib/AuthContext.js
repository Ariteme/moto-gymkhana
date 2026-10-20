'use client'
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminToken, setAdminToken] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  const resolveAdmin = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
      setIsAdmin(false)
      setAdminToken(null)
      return
    }
    const headers = { Authorization: `Bearer ${session.access_token}` }
    const [checkRes, sessionRes] = await Promise.all([
      fetch('/api/admin-check', { headers }),
      fetch('/api/admin-session', { headers }),
    ])
    const check = await checkRes.json().catch(() => ({}))
    const sess = await sessionRes.json().catch(() => ({}))
    setIsAdmin(check.isAdmin === true)
    setAdminToken(sess.token ?? null)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        resolveAdmin().finally(() => setAuthLoading(false))
      } else {
        setAuthLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        resolveAdmin()
      } else {
        setIsAdmin(false)
        setAdminToken(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [resolveAdmin])

  const signIn = () => supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  })

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setIsAdmin(false)
    setAdminToken(null)
  }

  return (
    <AuthContext.Provider value={{ user, isAdmin, adminToken, authLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
