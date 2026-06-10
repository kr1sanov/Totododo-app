"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { supabase } from "@/lib/supabase"
import type { User, Session } from "@supabase/supabase-js"

interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const SUPABASE_FUNCTIONS_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1`
    : "https://iohyczenmqoyrjxdcykz.supabase.co/functions/v1"

function getTelegramWebApp() {
  if (typeof window === "undefined") return null
  return (window as any).Telegram?.WebApp ?? null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      // 1. Проверяем существующую сессию
      const { data: { session: existingSession } } = await supabase.auth.getSession()
      if (existingSession) {
        setSession(existingSession)
        setUser(existingSession.user)
        setIsLoading(false)
        return
      }

      // 2. Telegram WebApp авторизация
      const twa = getTelegramWebApp()
      if (twa?.initData) {
        twa.ready()
        twa.expand()
        try {
          const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/telegram-auth`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ initData: twa.initData }),
          })
          const data = await res.json()
          if (data.access_token) {
            const { data: sessionData } = await supabase.auth.setSession({
              access_token: data.access_token,
              refresh_token: data.refresh_token,
            })
            setSession(sessionData.session)
            setUser(sessionData.session?.user ?? null)
          }
        } catch (err) {
          console.error("Telegram auth error:", err)
        }
      }

      setIsLoading(false)
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}
