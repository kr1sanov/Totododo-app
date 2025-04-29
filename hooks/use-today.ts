"use client"

import { useState, useCallback } from "react"

export function useToday() {
  const [today, setToday] = useState(new Date())

  const goToToday = useCallback(() => {
    setToday(new Date())
  }, [])

  return { today, goToToday }
}
