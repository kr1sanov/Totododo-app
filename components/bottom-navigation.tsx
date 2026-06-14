"use client"

import { Calendar, SettingsIcon } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface BottomNavigationProps {
  activeTab: "calendar" | "projects" | "settings"
}

export function BottomNavigation({ activeTab }: BottomNavigationProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-background/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-xl items-center justify-center px-2">
        <Link
          href="/"
          className={cn(
            "flex flex-1 flex-col items-center justify-center gap-1 py-3 text-xs transition-colors",
            activeTab === "calendar" ? "text-foreground" : "text-muted-foreground",
          )}
        >
          <Calendar className="h-6 w-6" />
          <span className="font-medium">Календарь</span>
        </Link>
        <Link
          href="/projects"
          className={cn(
            "flex flex-1 flex-col items-center justify-center gap-1 py-3 text-xs transition-colors",
            activeTab === "projects" ? "text-foreground" : "text-muted-foreground",
          )}
        >
          <span className="text-lg leading-none">#</span>
          <span className="font-medium">Проекты</span>
        </Link>
        <Link
          href="/settings"
          className={cn(
            "flex flex-1 flex-col items-center justify-center gap-1 py-3 text-xs transition-colors",
            activeTab === "settings" ? "text-foreground" : "text-muted-foreground",
          )}
        >
          <SettingsIcon className="h-6 w-6" />
          <span className="font-medium">Настройки</span>
        </Link>
      </div>
    </div>
  )
}
