import { Settings } from "@/components/settings"
import { BottomNavigation } from "@/components/bottom-navigation"
import { BackButton } from "@/components/back-button"

export default function SettingsPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <div className="p-4 border-b">
        <BackButton />
      </div>
      <div className="flex-1 overflow-auto pb-20">
        <Settings />
      </div>
      <BottomNavigation activeTab="settings" />
    </main>
  )
}
