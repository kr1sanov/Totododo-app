"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

const SUPABASE_FUNCTIONS_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1`
  : "https://iohyczenmqoyrjxdcykz.supabase.co/functions/v1"

export default function TelegramAuthPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const twa = (window as any).Telegram?.WebApp
        if (!twa?.initData) {
          throw new Error("Нет данных Telegram. Откройте приложение через бота.")
        }

        twa.ready()
        twa.expand()

        const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/telegram-auth`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData: twa.initData }),
        })

        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Ошибка авторизации")

        await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        })

        router.push("/")
      } catch (err) {
        console.error("Auth error:", err)
        setError((err as Error).message)
      } finally {
        setIsLoading(false)
      }
    }

    handleAuth()
  }, [router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
          <p className="text-sm text-muted-foreground font-mono">Авторизация...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="text-4xl">⚠️</div>
          <h2 className="text-lg font-bold font-mono">Ошибка авторизации</h2>
          <p className="text-sm text-muted-foreground font-mono">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="bg-foreground text-background px-4 py-2 rounded-lg text-sm font-mono"
          >
            На главную
          </button>
        </div>
      </div>
    )
  }

  return null
}
