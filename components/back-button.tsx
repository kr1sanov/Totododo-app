"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export function BackButton() {
  const router = useRouter()

  return (
    <Button variant="ghost" size="lg" onClick={() => router.back()} className="h-12 w-12 p-0">
      <ChevronLeft className="h-6 w-6 font-bold" />
      <span className="sr-only">Назад</span>
    </Button>
  )
}
