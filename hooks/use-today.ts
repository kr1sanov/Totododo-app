"use client"

import { useState, useCallback } from "react"

export function useToday() {
  const [today, setToday] = useState(() => {
    // Получаем текущую дату устройства пользователя
    return new Date()
  })

  const goToToday = useCallback(() => {
    // Обновляем до текущего дня при вызове
    setToday(new Date())
  }, [])

  return { today, goToToday }
}
