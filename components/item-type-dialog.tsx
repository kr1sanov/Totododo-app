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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center">Выберите тип</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-6 py-6">
          <Button
            variant="outline"
            className="flex flex-col items-center justify-center h-40 p-6"
            onClick={() => onSelectType("event")}
          >
            <Calendar className="h-16 w-16 mb-4 text-primary" />
            <span className="text-xl">Событие</span>
          </Button>
          <Button
            variant="outline"
            className="flex flex-col items-center justify-center h-40 p-6"
            onClick={() => onSelectType("task")}
          >
            <CheckSquare className="h-16 w-16 mb-4 text-primary" />
            <span className="text-xl">Задача</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
