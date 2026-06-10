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

const SUPABASE_FUNCTIONS_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1`
  : "https://iohyczenmqoyrjxdcykz.supabase.co/functions/v1"

function getTelegramWebApp() {
  if (typeof window === "undefined") return null
  return (window as any).Telegram?.WebApp ?? null
}

function isTelegramEnvironment() {
  if (typeof window === "undefined") return false
  const twa = (window as any).Telegram?.WebApp
  return !!(twa?.initData && twa.initData.length > 0)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [authFailed, setAuthFailed] = useState(false)

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
            setIsLoading(false)
            return
          }
        } catch (err) {
          console.error("Telegram auth error:", err)
        }
      }

      // 3. Нет сессии и не в Telegram — показать заглушку
      if (!isTelegramEnvironment()) {
        setAuthFailed(true)
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

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
          <p className="text-sm text-muted-foreground font-mono">Загрузка...</p>
        </div>
      </div>
    )
  }

  if (authFailed || (!isLoading && !session && !isTelegramEnvironment())) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="flex flex-col items-center gap-6 text-center max-w-xs">
          <div className="text-5xl">✈️</div>
          <div>
            <h1 className="text-xl font-bold font-mono mb-2">Откройте в Telegram</h1>
            <p className="text-sm text-muted-foreground font-mono leading-relaxed">
              Totododo — это Telegram Mini App.<br />
              Откройте приложение через бота в Telegram.
            </p>
          </div>
          <a
            href="https://t.me/totododoapp_bot"
            className="inline-flex items-center gap-2 bg-foreground text-background px-5 py-3 rounded-lg text-sm font-mono font-medium"
            target="_blank"
            rel="noopener noreferrer"
          >
            Открыть в Telegram →
          </a>
        </div>
      </div>
    )
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
