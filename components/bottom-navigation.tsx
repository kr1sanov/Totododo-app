"use client"

import { Calendar, SettingsIcon } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface BottomNavigationProps {
  activeTab: "calendar" | "settings"
}

export function BottomNavigation({ activeTab }: BottomNavigationProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 border-t bg-background z-10">
      <div className="flex justify-center items-center">
        <Link
          href="/"
          className={cn(
            "flex flex-col items-center justify-center py-4 px-4 flex-1",
            activeTab === "calendar" ? "text-primary" : "text-muted-foreground",
          )}
        >
          <Calendar className="h-6 w-6" />
          <span className="text-sm mt-1">Календарь</span>
        </Link>
        <Link
          href="/settings"
          className={cn(
            "flex flex-col items-center justify-center py-4 px-4 flex-1",
            activeTab === "settings" ? "text-primary" : "text-muted-foreground",
          )}
        >
          <SettingsIcon className="h-6 w-6" />
          <span className="text-sm mt-1">Настройки</span>
        </Link>
      </div>
    </div>
  )
}
