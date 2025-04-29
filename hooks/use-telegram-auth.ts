"use client"

import { useState, useEffect } from "react"

interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
  hash: string
}

export function useTelegramAuth() {
  const [user, setUser] = useState<TelegramUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Проверяем, есть ли сохраненные данные пользователя
    const savedUser = localStorage.getItem("totododo-telegram-user")
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (error) {
        console.error("Ошибка при загрузке данных пользователя:", error)
      }
    }
    setIsLoading(false)
  }, [])

  // Функция для инициализации Telegram Login Widget
  const login = () => {
    // Проверяем, загружен ли скрипт Telegram
    if (!window.Telegram) {
      // Загружаем скрипт Telegram Login Widget
      const script = document.createElement("script")
      script.src = "https://telegram.org/js/telegram-widget.js?22"
      script.setAttribute("data-telegram-login", "TotododoBot") // Замените на имя вашего бота
      script.setAttribute("data-size", "large")
      script.setAttribute("data-auth-url", window.location.origin + "/auth/telegram")
      script.setAttribute("data-request-access", "write")
      script.async = true

      // Обработчик для получения данных пользователя
      window.onTelegramAuth = (user: TelegramUser) => {
        // Сохраняем данные пользователя
        localStorage.setItem("totododo-telegram-user", JSON.stringify(user))
        setUser(user)

        // Здесь можно отправить данные на сервер для проверки
        // validateTelegramLogin(user)
      }

      // Добавляем скрипт на страницу
      const container = document.createElement("div")
      container.id = "telegram-login"
      container.style.position = "fixed"
      container.style.top = "50%"
      container.style.left = "50%"
      container.style.transform = "translate(-50%, -50%)"
      container.style.zIndex = "1000"
      container.style.backgroundColor = "white"
      container.style.padding = "20px"
      container.style.borderRadius = "8px"
      container.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.1)"

      document.body.appendChild(container)
      container.appendChild(script)

      // Добавляем кнопку закрытия
      const closeButton = document.createElement("button")
      closeButton.textContent = "✕"
      closeButton.style.position = "absolute"
      closeButton.style.top = "10px"
      closeButton.style.right = "10px"
      closeButton.style.background = "none"
      closeButton.style.border = "none"
      closeButton.style.fontSize = "16px"
      closeButton.style.cursor = "pointer"
      closeButton.onclick = () => {
        document.body.removeChild(container)
      }

      container.appendChild(closeButton)
    }
  }

  const logout = () => {
    localStorage.removeItem("totododo-telegram-user")
    setUser(null)
  }

  // Функция для синхронизации данных
  const syncData = async () => {
    if (!user) return Promise.reject(new Error("Пользователь не авторизован"))

    // Здесь должна быть логика синхронизации с сервером
    // Пример:
    return new Promise<void>((resolve) => {
      // Имитация задержки сетевого запроса
      setTimeout(() => {
        // Получаем все данные из localStorage
        const projects = localStorage.getItem("totododo-projects") || "[]"
        const events = localStorage.getItem("totododo-events") || "[]"
        const archive = localStorage.getItem("totododo-archive") || "[]"
        const trash = localStorage.getItem("totododo-trash") || "[]"

        // В реальном приложении здесь был бы запрос к API
        console.log("Синхронизация данных для пользователя:", user.id)
        console.log("Проекты:", projects)
        console.log("События:", events)

        // Сохраняем время последней синхронизации
        localStorage.setItem("totododo-last-sync", new Date().toISOString())

        resolve()
      }, 1500)
    })
  }

  return { user, isLoading, login, logout, syncData }
}

// Добавляем типы для Telegram SDK
declare global {
  interface Window {
    Telegram?: any
    onTelegramAuth?: (user: TelegramUser) => void
  }
}
