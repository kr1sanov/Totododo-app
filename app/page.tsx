import { CalendarView } from "@/components/calendar-view"
import { BottomNavigation } from "@/components/bottom-navigation"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <div className="flex-1 overflow-auto pb-24">
        <CalendarView />
      </div>
      <BottomNavigation activeTab="calendar" />
    </main>
  )
}
