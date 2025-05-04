"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { type Tag, TaskTag } from "@/components/task-tag"
import { Plus, TagIcon } from "lucide-react"
import { nanoid } from "nanoid"

interface TagSelectorProps {
  selectedTags: Tag[]
  onTagsChange: (tags: Tag[]) => void
  availableTags?: Tag[]
}

const DEFAULT_COLORS = ["blue", "green", "red", "yellow", "purple", "pink", "orange", "gray"]

export function TagSelector({ selectedTags, onTagsChange, availableTags = [] }: TagSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [newTagName, setNewTagName] = useState("")
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLORS[0])

  const allTags = [...availableTags]

  const handleAddTag = () => {
    if (newTagName.trim()) {
      const newTag: Tag = {
        id: nanoid(),
        name: newTagName.trim(),
        color: selectedColor,
      }

      onTagsChange([...selectedTags, newTag])
      setNewTagName("")
      setSelectedColor(DEFAULT_COLORS[0])
    }
  }

  const handleSelectTag = (tag: Tag) => {
    if (!selectedTags.some((t) => t.id === tag.id)) {
      onTagsChange([...selectedTags, tag])
    }
  }

  const handleRemoveTag = (id: string) => {
    onTagsChange(selectedTags.filter((tag) => tag.id !== id))
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap">
        {selectedTags.map((tag) => (
          <TaskTag key={tag.id} tag={tag} onRemove={handleRemoveTag} />
        ))}
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 px-2 rounded-full">
              <TagIcon className="h-3.5 w-3.5 mr-1" />
              <span>Tags</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3">
            <div className="space-y-2">
              <div className="font-medium">Add new tag</div>
              <div className="flex gap-2">
                <Input
                  placeholder="Tag name"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  className="h-8"
                />
                <div className="flex gap-1">
                  {DEFAULT_COLORS.slice(0, 4).map((color) => (
                    <button
                      key={color}
                      className={`w-6 h-6 rounded-full bg-${color}-500 ${selectedColor === color ? "ring-2 ring-offset-2 ring-black" : ""}`}
                      onClick={() => setSelectedColor(color)}
                      aria-label={`Select ${color} color`}
                    />
                  ))}
                </div>
              </div>
              <Button size="sm" className="w-full" onClick={handleAddTag} disabled={!newTagName.trim()}>
                <Plus className="h-4 w-4 mr-1" />
                Add Tag
              </Button>

              {availableTags.length > 0 && (
                <>
                  <div className="font-medium mt-3">Available tags</div>
                  <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                    {availableTags.map((tag) => (
                      <button key={tag.id} onClick={() => handleSelectTag(tag)} className="focus:outline-none">
                        <TaskTag tag={tag} interactive={false} />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
