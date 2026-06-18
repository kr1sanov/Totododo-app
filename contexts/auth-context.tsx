"use client"
import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { supabase } from "@/lib/supabase"
import type { User, Session } from "@supabase/supabase-js"

interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  authStatus: "loading" | "authenticated" | "auth_failed"
  authError: string | null
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function getTelegramWebApp() {
  if (typeof window === "undefined") return null
  return (window as any).Telegram?.WebApp ?? null
}

async function waitForTelegramWebApp() {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const twa = getTelegramWebApp()
    if (twa?.initData) {
      return twa
    }

    await new Promise((resolve) => setTimeout(resolve, 150))
  }

  return getTelegramWebApp()
}

function isTelegramEnvironment() {
  if (typeof window === "undefined") return false
  const twa = (window as any).Telegram?.WebApp
  return Boolean(twa)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [authFailed, setAuthFailed] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  const failAuth = (message: string) => {
    setAuthError(message)
    setAuthFailed(true)
    setSession(null)
    setUser(null)
  }

  useEffect(() => {
    const init = async () => {
      try {
        // 1. Проверяем существующую сессию
        const { data: { session: existingSession } } = await supabase.auth.getSession()
        if (existingSession?.user) {
          setSession(existingSession)
          setUser(existingSession.user)
          setAuthFailed(false)
          setAuthError(null)
          setIsLoading(false)
          return
        }

        // 2. Telegram WebApp авторизация
        const twa = await waitForTelegramWebApp()
        if (twa?.initData) {
          twa.ready()
          twa.expand()
          const res = await fetch("/api/telegram-auth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ initData: twa.initData }),
          })

          if (!res.ok) {
            const errorText = await res.text().catch(() => "")
            throw new Error(`Telegram auth failed with status ${res.status}${errorText ? `: ${errorText}` : ""}`)
          }

          const data = await res.json()

          if (!data.access_token || !data.refresh_token) {
            throw new Error("Telegram auth did not return Supabase tokens")
          }

          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: data.access_token,
            refresh_token: data.refresh_token,
          })

          if (sessionError || !sessionData.session?.user) {
            throw sessionError ?? new Error("Supabase session was not created")
          }

          setSession(sessionData.session)
          setUser(sessionData.session.user)
          setAuthFailed(false)
          setAuthError(null)
          setIsLoading(false)
          return
        }

        // 3. Нет сессии и не в Telegram — показать заглушку
        if (!isTelegramEnvironment()) {
          failAuth("Откройте приложение через Telegram Mini App.")
          return
        }

        failAuth("Telegram открыл Mini App, но не передал initData. Закройте и откройте приложение через бота заново.")
      } catch (err) {
        console.error("Telegram auth error:", err)
        failAuth((err as Error).message || "Не удалось авторизоваться через Telegram. Откройте Mini App заново.")
      } finally {
        setIsLoading(false)
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        setAuthFailed(false)
        setAuthError(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setAuthFailed(true)
    setAuthError("Вы вышли из аккаунта.")
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

  if (authFailed || (!isLoading && !session)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="flex flex-col items-center gap-6 text-center max-w-xs">
          <div className="text-5xl">!</div>
          <div>
            <h1 className="text-xl font-bold font-mono mb-2">Нужна авторизация</h1>
            <p className="text-sm text-muted-foreground font-mono leading-relaxed">
              {authError || "Totododo должен получить Telegram-сессию, чтобы сохранять данные в облаке."}
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
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        authStatus: session?.user ? "authenticated" : authFailed ? "auth_failed" : "loading",
        authError,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}
