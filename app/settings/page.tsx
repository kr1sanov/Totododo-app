import { Settings } from "@/components/settings"
import { BottomNavigation } from "@/components/bottom-navigation"
import { BackButton } from "@/components/back-button"

export default function SettingsPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <div className="border-b border-white/5 bg-background/70 px-4 py-4 backdrop-blur-xl">
        <BackButton />
        <div className="mt-4">
          <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Workspace</div>
          <h1 className="mt-2 text-2xl font-semibold">Настройки</h1>
          <p className="mt-1 text-sm text-muted-foreground">Аккаунт, синхронизация, архив и аналитика в одном месте.</p>
        </div>
      </div>
      <div className="flex-1 overflow-auto pb-24">
        <Settings />
      </div>
      <BottomNavigation activeTab="settings" />
    </main>
  )
}
