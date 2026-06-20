"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Calendar, CheckSquare } from "lucide-react"

interface ItemTypeDialogProps {
  isOpen: boolean
  onClose: () => void
  onSelectType: (type: "event" | "task") => void
}

export function ItemTypeDialog({ isOpen, onClose, onSelectType }: ItemTypeDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[340px] rounded-2xl border-white/10 p-0 sm:max-w-[340px]">
        <DialogHeader>
          <DialogTitle className="px-5 pt-5 text-left text-base">Создать</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 px-5 pb-5 pt-2">
          <Button
            variant="outline"
            className="flex h-auto min-h-[152px] w-full min-w-0 flex-col items-start justify-start gap-3 overflow-hidden rounded-xl border-white/10 p-4 text-left"
            onClick={() => onSelectType("event")}
          >
            <Calendar className="h-5 w-5 text-primary" />
            <div className="min-w-0 space-y-1">
              <div className="text-sm font-medium">Событие</div>
              <div className="text-xs leading-5 text-muted-foreground break-words">
                Встреча, звонок или тайм-блок
              </div>
            </div>
          </Button>
          <Button
            variant="outline"
            className="flex h-auto min-h-[152px] w-full min-w-0 flex-col items-start justify-start gap-3 overflow-hidden rounded-xl border-white/10 p-4 text-left"
            onClick={() => onSelectType("task")}
          >
            <CheckSquare className="h-5 w-5 text-primary" />
            <div className="min-w-0 space-y-1">
              <div className="text-sm font-medium">Задача</div>
              <div className="text-xs leading-5 text-muted-foreground break-words">
                Дело с дедлайном и приоритетом
              </div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
