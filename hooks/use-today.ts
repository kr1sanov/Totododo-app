"use client"

import { useState, useCallback } from "react"

export function useToday() {
  const [today, setToday] = useState(new Date())

  const goToToday = useCallback(() => {
    setToday(new Date())
  }, [])

  // Always return a valid object
  return { today, goToToday }
}
