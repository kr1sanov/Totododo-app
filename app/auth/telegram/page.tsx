"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"

const SUPABASE_FUNCTIONS_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1`
    : "https://iohyczenmqoyrjxdcykz.supabase.co/functions/v1"

export default function TelegramAuthPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const id = searchParams.get("id")
        const first_name = searchParams.get("first_name")
        const last_name = searchParams.get("last_name")
        const username = searchParams.get("username")
        const photo_url = searchParams.get("photo_url")
        const auth_date = searchParams.get("auth_date")
        const hash = searchParams.get("hash")

        if (!id || !first_name || !auth_date || !hash) {
          throw new Error("Неполные данные авторизации")
        }

        const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/telegram-auth`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: Number(id), first_name, last_name, username, photo_url, auth_date, hash }),
        })

        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Ошибка авторизации")

        await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        })

        localStorage.setItem("totododo-telegram-user", JSON.stringify(data.user))
        router.push("/")
      } catch (err) {
        console.error("Ошибка авторизации:", err)
        setError((err as Error).message)
      } finally {
        setIsLoading(false)
      }
    }

    handleAuth()
  }, [router, searchParams])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-foreground border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Авторизация через Telegram...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-xl font-semibold">Ошибка авторизации</h1>
          <p className="text-destructive text-sm">{error}</p>
          <button
            className="px-4 py-2 border border-foreground rounded-md text-sm hover:bg-foreground hover:text-background transition-colors"
            onClick={() => router.push("/")}
          >
            На главную
          </button>
        </div>
      </div>
    )
  }

  return null
}
