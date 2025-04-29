"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase"

export default function TelegramAuthPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Получаем данные пользователя из URL
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

        // Создаем объект пользователя Telegram
        const telegramUser = {
          id: Number(id),
          first_name,
          last_name: last_name || undefined,
          username: username || undefined,
          photo_url: photo_url || undefined,
          auth_date: Number(auth_date),
          hash,
        }

        // Сохраняем данные пользователя Telegram
        localStorage.setItem("totododo-telegram-user", JSON.stringify(telegramUser))

        // Авторизуемся в Supabase
        const supabase = getSupabaseClient()

        // Создаем уникальный email на основе Telegram ID
        const email = `telegram_${id}@totododo.app`
        const password = `telegram_${id}_${auth_date}_${hash.substring(0, 10)}`

        // Пытаемся войти
        let { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        // Если пользователь не существует, регистрируем его
        if (signInError && signInError.message.includes("Invalid login credentials")) {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                telegram_id: Number(id),
                telegram_username: username || null,
                telegram_first_name: first_name,
                telegram_last_name: last_name || null,
                telegram_photo_url: photo_url || null,
              },
            },
          })

          if (signUpError) {
            throw signUpError
          }

          signInData = signUpData

          // Создаем запись в таблице users
          if (signUpData.user) {
            const { error: userError } = await supabase.from("users").insert({
              id: signUpData.user.id,
              telegram_id: Number(id),
              telegram_username: username || null,
              telegram_first_name: first_name,
              telegram_last_name: last_name || null,
              telegram_photo_url: photo_url || null,
            })

            if (userError) {
              console.error("Ошибка при создании пользователя:", userError)
            }
          }
        } else if (signInError) {
          throw signInError
        }

        // Перенаправляем на главную страницу
        router.push("/settings")
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Авторизация через Telegram</h1>
          <p>Пожалуйста, подождите, идет обработка данных...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Ошибка авторизации</h1>
          <p className="text-red-500">{error}</p>
          <button className="mt-4 px-4 py-2 bg-primary text-white rounded" onClick={() => router.push("/settings")}>
            Вернуться в настройки
          </button>
        </div>
      </div>
    )
  }

  return null
}
