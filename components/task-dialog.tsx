"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import type { Task, TaskStatus, Tag } from "@/types"
import { nanoid } from "nanoid"
import { SubtaskItem } from "@/components/subtask-item"
import { TagSelector } from "@/components/tag-selector"

interface TaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (task: Task) => void
  task?: Task
  projectId: string
  availableTags?: Tag[]
  isSubmitting?: boolean
}

export function TaskDialog({
  open,
  onOpenChange,
  onSubmit,
  task,
  projectId,
  availableTags = [],
  isSubmitting = false,
}: TaskDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState<TaskStatus>("todo")
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium")
  const [subtasks, setSubtasks] = useState<{ id: string; title: string; completed: boolean }[]>([])
  const [newSubtask, setNewSubtask] = useState("")
  const [tags, setTags] = useState<Tag[]>([])
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || "")
      setStatus(task.status)
      setDueDate(task.dueDate ? new Date(task.dueDate) : undefined)
      setPriority(task.priority || "medium")
      setSubtasks(task.subtasks || [])
      setTags(task.tags || [])
    } else {
      setTitle("")
      setDescription("")
      setStatus("todo")
      setDueDate(undefined)
      setPriority("medium")
      setSubtasks([])
      setTags([])
    }
  }, [task, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) return

    const updatedTask: Task = {
      id: task?.id || nanoid(),
      title,
      description: description || undefined,
      status,
      projectId,
      createdAt: task?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueDate: dueDate ? dueDate.toISOString() : undefined,
      priority,
      subtasks: subtasks.length > 0 ? subtasks : undefined,
      tags: tags.length > 0 ? tags : undefined,
    }

    // Submit the task for optimistic update
    onSubmit(updatedTask)
  }

  const handleAddSubtask = () => {
    if (newSubtask.trim()) {
      // Optimistic update for adding subtask
      const updatedSubtasks = [
        ...subtasks,
        {
          id: nanoid(),
          title: newSubtask.trim(),
          completed: false,
        },
      ]

      setSubtasks(updatedSubtasks)
      setNewSubtask("")
    }
  }

  const handleUpdateSubtask = (id: string, completed: boolean) => {
    // Optimistic update for updating subtask
    const updatedSubtasks = subtasks.map((subtask) => (subtask.id === id ? { ...subtask, completed } : subtask))

    setSubtasks(updatedSubtasks)
  }

  const handleRemoveSubtask = (id: string) => {
    // Optimistic update for removing subtask
    const updatedSubtasks = subtasks.filter((subtask) => subtask.id !== id)
    setSubtasks(updatedSubtasks)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "Create Task"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Title
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              required
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Task description"
              className="min-h-24"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="status" className="text-sm font-medium">
                Status
              </label>
              <Select value={status} onValueChange={(value) => setStatus(value as TaskStatus)}>
                <SelectTrigger id="status" className="h-10">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="priority" className="text-sm font-medium">
                Priority
              </label>
              <Select value={priority} onValueChange={(value) => setPriority(value as "low" | "medium" | "high")}>
                <SelectTrigger id="priority" className="h-10">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="dueDate" className="text-sm font-medium">
              Due Date
            </label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left h-10" id="dueDate">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={(date) => {
                    setDueDate(date)
                    setIsCalendarOpen(false)
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tags</label>
            <TagSelector selectedTags={tags} onTagsChange={setTags} availableTags={availableTags} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Subtasks</label>
            <div className="space-y-2">
              {subtasks.map((subtask) => (
                <SubtaskItem
                  key={subtask.id}
                  subtask={subtask}
                  onUpdate={(updatedSubtask) => {
                    const updatedSubtasks = subtasks.map((st) => (st.id === updatedSubtask.id ? updatedSubtask : st))
                    setSubtasks(updatedSubtasks)
                  }}
                  onDelete={handleRemoveSubtask}
                />
              ))}
              <div className="flex gap-2">
                <Input
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  placeholder="Add subtask"
                  className="h-10"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddSubtask()
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddSubtask}
                  disabled={!newSubtask.trim()}
                  className="h-10"
                >
                  Add
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-10"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || isSubmitting} className="h-10">
              {isSubmitting ? "Saving..." : task ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
